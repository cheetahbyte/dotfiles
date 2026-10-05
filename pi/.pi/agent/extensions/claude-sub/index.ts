// Claude subscription in pi through the official Claude Code CLI (`claude -p`), ported from
// NousResearch/hermes-plugin-claude-subscription-directsdk. pi owns the agent loop and every tool;
// Claude Code only sends one Messages request per turn, through a loopback relay that admits one.
import { type ChildProcess, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import http from "node:http";
import https from "node:https";
import type { AddressInfo } from "node:net";
import { homedir, tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import {
	type Api,
	type AssistantMessage,
	type AssistantMessageEventStream,
	type ImageContent,
	type Message,
	type Model,
	type SimpleStreamOptions,
	type StopReason,
	type TextContent,
	type ThinkingContent,
	type ToolCall,
	type TranscriptContext,
	collapseSystemMessages,
	createAssistantMessageEventStream,
	getCurrentSystemPrompt,
	getCurrentTools,
	parseStreamingJson,
} from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

type Json = Record<string, any>;
type Frame = { type: "user" | "assistant"; message: { role: "user" | "assistant"; content: Json[] } };

const PREFIX = "mcp__pi__";
const HERE = dirname(fileURLToPath(import.meta.url));
const UPSTREAM_IDLE_MS = 180_000;
// [id, name, window, max output]. 1M routes go to native as `<id>[1m]`; anything else stays 200K.
const MODELS: [string, string, number, number][] = [
	["claude-opus-5-5", "Claude Opus 5.5", 1_000_000, 128_000],
	["claude-sonnet-5-5", "Claude Sonnet 5.5", 1_000_000, 128_000],
	["claude-fable-5-1", "Claude Fable 5.1", 1_000_000, 128_000],
	["claude-opus-5", "Claude Opus 5", 1_000_000, 128_000],
	["claude-sonnet-5", "Claude Sonnet 5", 1_000_000, 128_000],
	["claude-opus-4-8", "Claude Opus 4.8", 1_000_000, 128_000],
	["claude-haiku-4-5-20251001", "Claude Haiku 4.5", 200_000, 64_000],
];
// The API 400s a thinking disable on these; Haiku 4.5 400s adaptive thinking.
const MANDATORY_THINKING = ["claude-fable", "claude-opus-5-5", "claude-sonnet-5-5"];
const NO_ADAPTIVE_THINKING = new Set(["claude-haiku-4-5-20251001"]);
// Never let the child bill an API key or talk to another backend; the relay owns the base URL.
const STRIPPED_ENV = [
	"ANTHROPIC_API_KEY",
	"ANTHROPIC_AUTH_TOKEN",
	"ANTHROPIC_BASE_URL",
	"ANTHROPIC_FOUNDRY_API_KEY",
	"CLAUDE_CODE_USE_BEDROCK",
	"CLAUDE_CODE_USE_VERTEX",
	"CLAUDE_CODE_USE_FOUNDRY",
	"CLAUDE_CODE_EXTRA_BODY",
	"CLAUDE_CODE_EFFORT_LEVEL",
];

const safeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
const isMandatory = (id: string) => MANDATORY_THINKING.some((p) => id.startsWith(p));
const nativeModel = (id: string) => (MODELS.find((m) => m[0] === id)?.[2] === 1_000_000 ? `${id}[1m]` : id);

function findClaude(): string {
	const explicit = process.env.PI_CLAUDE_SUB_COMMAND;
	if (explicit) return explicit;
	const exe = process.platform === "win32" ? ["claude.exe", "claude.cmd"] : ["claude"];
	const dirs = [
		...(process.env.PATH ?? "").split(delimiter),
		...[".local/bin", ".claude/local", "bin", ".npm-global/bin", ".bun/bin", ".volta/bin"].map((d) => join(homedir(), d)),
		"/opt/homebrew/bin",
		"/usr/local/bin",
	];
	for (const dir of dirs) for (const name of exe) if (dir && existsSync(join(dir, name))) return join(dir, name);
	throw new Error("Claude Code not found. Install it (npm install -g @anthropic-ai/claude-code), run `claude auth login`, or set PI_CLAUDE_SUB_COMMAND.");
}

// Native writes its cwd into every request; a stable directory keeps the prompt-cache prefix stable.
function workdir(): string {
	const dir = join(tmpdir(), `pi-claude-sub-${process.getuid?.() ?? "user"}`);
	mkdirSync(dir, { recursive: true, mode: 0o700 });
	return dir;
}

function media(block: TextContent | ImageContent): Json {
	return block.type === "text"
		? { type: "text", text: block.text }
		: { type: "image", source: { type: "base64", media_type: block.mimeType, data: block.data } };
}

function toFrames(messages: Message[], model: Model<Api>, names: Set<string>): Frame[] {
	const frames: Frame[] = [];
	let pending: ToolCall[] = [];
	const answered = new Set<string>();
	const push = (role: Frame["type"], blocks: Json[]) => {
		if (!blocks.length) return;
		const last = frames.at(-1);
		if (role === "user" && last?.type === "user") last.message.content.push(...blocks);
		else frames.push({ type: role, message: { role, content: blocks } });
	};
	// Like pi's own transform: an unanswered call (aborted turn) gets a synthetic error result.
	const close = () => {
		push(
			"user",
			pending
				.filter((c) => !answered.has(c.id))
				.map((c) => ({ type: "tool_result", tool_use_id: safeId(c.id), content: "No result provided", is_error: true })),
		);
		pending = [];
		answered.clear();
	};
	for (const m of messages) {
		if (m.role === "user") {
			close();
			const blocks = typeof m.content === "string" ? [{ type: "text", text: m.content }] : m.content.map(media);
			push("user", blocks.filter((b) => b.type !== "text" || b.text.trim()));
		} else if (m.role === "toolResult") {
			answered.add(m.toolCallId);
			const content = m.content.some((c) => c.type === "image")
				? m.content.map(media)
				: m.content.map((c) => (c as TextContent).text).join("\n");
			push("user", [{ type: "tool_result", tool_use_id: safeId(m.toolCallId), content, is_error: m.isError }]);
		} else if (m.role === "assistant") {
			close();
			if (m.stopReason === "error" || m.stopReason === "aborted") continue;
			// Signatures only replay to the route that made them; elsewhere thinking becomes text.
			const same = m.provider === model.provider && m.model === model.id;
			const blocks: Json[] = [];
			for (const b of m.content) {
				if (b.type === "text") {
					if (b.text.trim()) blocks.push({ type: "text", text: b.text });
				} else if (b.type === "thinking") {
					const t = b as ThinkingContent;
					if (same && t.redacted && t.thinkingSignature) blocks.push({ type: "redacted_thinking", data: t.thinkingSignature });
					else if (same && t.thinkingSignature) blocks.push({ type: "thinking", thinking: t.thinking, signature: t.thinkingSignature });
					else if (!t.redacted && t.thinking.trim()) blocks.push({ type: "text", text: t.thinking });
				} else {
					blocks.push({ type: "tool_use", id: safeId(b.id), name: names.has(b.name) ? PREFIX + b.name : b.name, input: b.arguments ?? {} });
					pending.push(b);
				}
			}
			push("assistant", blocks);
		}
	}
	close();
	if (frames.at(-1)?.type !== "user") throw new Error("Conversation must end with a user message or tool result");
	return frames;
}

// Order-insensitive equality without cache_control, as the relay compares host and native blocks.
function canonical(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
	if (value && typeof value === "object") {
		const entries = Object.entries(value).filter(([k]) => k !== "cache_control").sort(([a], [b]) => (a < b ? -1 : 1));
		return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
	}
	return JSON.stringify(value);
}

// Native puts its message cache breakpoint on per-request context the next request never replays,
// so every tool round would re-write the history. Move later marks onto the last block that recurs:
// everything through the last assistant message plus the leading blocks equal to the queried frame.
function pinBreakpoint(payload: Buffer, queried: Json[]): Buffer {
	try {
		const body = JSON.parse(payload.toString("utf8"));
		const messages: Json[] = body.messages;
		const blocks: [number, number, Json][] = [];
		messages.forEach((m, i) => Array.isArray(m.content) && m.content.forEach((b: Json, j: number) => blocks.push([i, j, b])));
		const marked = blocks.filter(([, , b]) => b && typeof b === "object" && "cache_control" in b);
		if (!marked.length) return payload;
		const last = messages.findLastIndex((m) => m.role === "assistant");
		const stable = blocks.filter(([i]) => i <= last);
		const newest = messages[last + 1];
		if (newest?.role === "user" && Array.isArray(newest.content)) {
			let k = 0;
			while (k < Math.min(newest.content.length, queried.length) && canonical(newest.content[k]) === canonical(queried[k])) k++;
			if (newest.content[k]?.type !== "tool_result") newest.content.slice(0, k).forEach((b: Json, j: number) => stable.push([last + 1, j, b]));
		}
		const target = stable.findLast(([, , b]) => b && typeof b === "object" && b.type !== "thinking" && b.type !== "redacted_thinking");
		if (!target) return payload;
		const after = marked.filter(([i, j]) => i > target[0] || (i === target[0] && j > target[1]));
		if (!after.length) return payload;
		const moved = after.map(([, , b]) => {
			const mark = b.cache_control;
			delete b.cache_control;
			return mark;
		})[0];
		target[2].cache_control ??= moved;
		return Buffer.from(JSON.stringify(body));
	} catch {
		return payload;
	}
}

// Forwards native's first Messages request to Anthropic untouched except for the breakpoint, and
// answers any further attempt (native retries, recovery turns) locally with a 400.
class Relay {
	used = false;
	status?: number;
	failure?: string;
	errorBody = "";
	url = "";
	private readonly prefix = `/${randomBytes(24).toString("base64url")}`;
	private readonly open = new Set<{ destroy(): unknown }>();
	private readonly server = http.createServer((req, res) => this.handle(req, res));

	constructor(
		private readonly queried: Json[],
		private readonly onResponse: (status: number, headers: Record<string, string>) => void,
	) {}

	async listen(): Promise<void> {
		await new Promise<void>((resolve) => this.server.listen(0, "127.0.0.1", resolve));
		this.url = `http://127.0.0.1:${(this.server.address() as AddressInfo).port}${this.prefix}`;
	}

	private handle(req: http.IncomingMessage, res: http.ServerResponse) {
		const url = new URL(req.url ?? "/", "http://relay");
		if (req.method !== "POST" || url.pathname !== `${this.prefix}/v1/messages` || req.headers.origin) {
			res.writeHead(404).end();
			return;
		}
		if (this.used) {
			const error = { type: "error", error: { type: "invalid_request_error", message: "PI_MODEL_ADMISSION_CONSUMED" } };
			res.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify(error));
			return;
		}
		this.used = true;
		this.open.add(res);
		const chunks: Buffer[] = [];
		req.on("data", (c: Buffer) => chunks.push(c));
		req.on("end", () => {
			const payload = pinBreakpoint(Buffer.concat(chunks), this.queried);			const headers: http.OutgoingHttpHeaders = { ...req.headers, "accept-encoding": "identity", "content-length": payload.length };
			for (const h of ["host", "connection", "transfer-encoding"]) delete headers[h];
			const upstream = https.request(
				{ host: "api.anthropic.com", path: `/v1/messages${url.search}`, method: "POST", headers },
				(response) => {
					this.status = response.statusCode ?? 0;
					const out: Record<string, string> = {};
					for (const [k, v] of Object.entries(response.headers)) {
						if (v !== undefined && !["connection", "transfer-encoding", "server", "date"].includes(k)) out[k] = String(v);
					}
					this.onResponse(this.status, out);
					res.writeHead(this.status, { ...out, connection: "close" });
					response.on("data", (c: Buffer) => {
						if (this.status !== 200 && this.errorBody.length < 65_536) this.errorBody += c.toString("utf8");
						res.write(c);
					});
					response.on("end", () => res.end());
					response.on("error", (e) => {
						this.failure = e.message;
						res.destroy();
					});
				},
			);
			upstream.setTimeout(UPSTREAM_IDLE_MS, () => upstream.destroy(new Error(`no upstream bytes for ${UPSTREAM_IDLE_MS / 1000} s`)));
			upstream.on("error", (e) => {
				this.failure = e.message;
				res.destroy();
			});
			this.open.add(upstream);
			upstream.end(payload);
		});
	}

	close() {
		for (const s of this.open) s.destroy();
		this.server.closeAllConnections?.();
		this.server.close();
	}
}

function requestBody(model: Model<Api>, options: SimpleStreamOptions | undefined, tools: Json[]): Json {
	const body: Json = { tools };
	const level = options?.reasoning;
	if (!level) {
		if (!isMandatory(model.id)) body.thinking = { type: "disabled" };
		// Native clear-thinking context edits are invalid with thinking disabled.
		if (body.thinking) body.context_management = { edits: [] };
	} else {
		if (!NO_ADAPTIVE_THINKING.has(model.id)) body.thinking = { type: "adaptive" };
		const mapped = model.thinkingLevelMap?.[level];
		body.output_config = { effort: typeof mapped === "string" ? mapped : level === "minimal" ? "low" : level };
	}
	if (options?.maxTokens) body.max_tokens = options.maxTokens;
	return body;
}

function toolManifest(context: TranscriptContext) {
	const tools = getCurrentTools(context.messages);
	const manifest: Json[] = [];
	const declared: Json[] = [];
	for (const tool of tools) {
		if (!/^[A-Za-z0-9_-]{1,55}$/.test(tool.name)) throw new Error(`Tool name not accepted by Claude Code: ${tool.name}`);
		// Anthropic rejects top-level combinators; handlers re-validate their arguments anyway.
		const { oneOf, anyOf, allOf, ...schema } = tool.parameters as Json;
		const inputSchema = { ...schema, type: "object", properties: schema.properties ?? {} };
		manifest.push({ name: tool.name, description: tool.description, inputSchema });
		declared.push({ name: PREFIX + tool.name, description: tool.description, input_schema: inputSchema });
	}
	return { names: new Set(tools.map((t) => t.name)), manifest, declared };
}

function childEnv(relayUrl: string, body: Json): NodeJS.ProcessEnv {
	const env: NodeJS.ProcessEnv = { ...process.env };
	for (const key of STRIPPED_ENV) delete env[key];
	Object.assign(env, {
		ANTHROPIC_BASE_URL: relayUrl,
		ENABLE_TOOL_SEARCH: "false",
		CLAUDE_CODE_MAX_RETRIES: "0",
		DISABLE_AUTO_COMPACT: "1",
		DISABLE_COMPACT: "1",
		CLAUDE_CODE_TOTAL_TOKENS_REMINDER: "off",
		DISABLE_AUTOUPDATER: "1",
		DISABLE_FEEDBACK_COMMAND: "1",
	});
	if (body.max_tokens) env.CLAUDE_CODE_MAX_OUTPUT_TOKENS = String(body.max_tokens);
	return env;
}

function killTree(child: ChildProcess) {
	if (child.exitCode !== null || child.signalCode !== null || !child.pid) return;
	if (process.platform === "win32") spawn("taskkill", ["/F", "/T", "/PID", String(child.pid)], { stdio: "ignore" });
	else {
		try {
			process.kill(-child.pid, "SIGKILL");
		} catch {}
	}
}

function mapStop(reason: string | undefined): StopReason {
	if (reason === "tool_use") return "toolUse";
	if (reason === "max_tokens" || reason === "model_context_window_exceeded") return "length";
	if (reason === "end_turn" || reason === "stop_sequence" || reason === "pause_turn") return "stop";
	return "error";
}

async function run(model: Model<Api>, context: TranscriptContext, options: SimpleStreamOptions | undefined, stream: AssistantMessageEventStream, output: AssistantMessage) {
	const transcript = collapseSystemMessages(context);
	const { names, manifest, declared } = toolManifest(transcript);
	const frames = toFrames(transcript.messages, model, names);
	let body = requestBody(model, options, declared);
	body = ((await options?.onPayload?.(body, model)) as Json | undefined) ?? body;
	const command = findClaude();
	const dir = mkdtempSync(join(tmpdir(), "pi-claude-sub-req-"));
	const relay = new Relay(frames.at(-1)!.message.content, (status, headers) => void options?.onResponse?.({ status, headers }, model));
	let child: ChildProcess | undefined;
	const abort = () => {
		relay.close();
		if (child) killTree(child);
	};
	options?.signal?.addEventListener("abort", abort, { once: true });
	try {
		if (options?.signal?.aborted) throw new Error("Request was aborted");
		writeFileSync(join(dir, "tools.json"), JSON.stringify(manifest));
		writeFileSync(join(dir, "system.md"), getCurrentSystemPrompt(transcript.messages));
		// Settings carry the extra body: execve limits would truncate full tool schemas in env.
		writeFileSync(join(dir, "settings.json"), JSON.stringify({ env: { CLAUDE_CODE_EXTRA_BODY: JSON.stringify(body) } }));
		await relay.listen();
		const mcp = { mcpServers: { pi: { command: process.execPath, args: [join(HERE, "inert-mcp.mjs"), join(dir, "tools.json")] } } };
		const args = [
			"-p", "--model", nativeModel(model.id),
			"--input-format", "stream-json", "--output-format", "stream-json", "--verbose", "--include-partial-messages",
			"--tools", "", "--system-prompt-file", join(dir, "system.md"), "--settings", join(dir, "settings.json"),
			"--setting-sources", "", "--strict-mcp-config", "--disable-slash-commands", "--max-turns", "1",
			"--permission-mode", "dontAsk", "--no-session-persistence", "--mcp-config", JSON.stringify(mcp),
		];
		// Native appends its own per-turn effort unless told, overriding output_config.effort.
		if (body.output_config?.effort) args.push("--effort", body.output_config.effort);
		child = spawn(command, args, {
			cwd: workdir(),
			env: childEnv(relay.url, body),
			stdio: ["pipe", "pipe", "ignore"],
			detached: process.platform !== "win32",
		});
		const exited = new Promise<number | null>((resolve, reject) => {
			child!.once("error", reject);
			child!.once("close", resolve);
		});
		exited.catch(() => {});
		child.stdin!.on("error", () => {});
		const lines = createInterface({ input: child.stdout! })[Symbol.asyncIterator]();
		const next = async (): Promise<Json | undefined> => {
			const line = await lines.next();
			if (line.done) return undefined;
			try {
				return JSON.parse(line.value);
			} catch {
				throw new Error(`Invalid Claude Code output: ${line.value.slice(0, 300)}`);
			}
		};

		// History replays as zero-turn frames; only the last user frame queries the model.
		for (const [i, frame] of frames.entries()) {
			const replay = frame.type === "user" && i < frames.length - 1;
			child.stdin!.write(`${JSON.stringify(replay ? { ...frame, shouldQuery: false } : frame)}\n`);
			while (replay) {
				const ack = await next();
				if (!ack) throw new Error("Claude Code exited during history replay");
				if (ack.type !== "result") continue;
				if (ack.num_turns !== 0 || ack.is_error) throw new Error("Claude Code rejected the history replay");
				break;
			}
		}
		child.stdin!.end();
		stream.push({ type: "start", partial: output });

		const blocks = new Map<number, number>();
		const partialJson = new Map<number, string>();
		let stopped = false;
		let nativeError: string | undefined;
		let refusal: string | undefined;
		for (let event = await next(); event; event = await next()) {
			if (event.type === "assistant" && event.error) {
				nativeError = (event.message?.content ?? []).map((b: Json) => b.text ?? "").join("\n") || String(event.error);
				continue;
			}
			if (event.type !== "stream_event") continue;
			const e = event.event as Json;
			await options?.onProviderStreamEvent?.(e, model);
			if (e.type === "message_start") {
				output.responseId = e.message.id;
				applyUsage(output, e.message.usage);
			} else if (e.type === "content_block_start") {
				const cb = e.content_block;
				let block: AssistantMessage["content"][number] | undefined;
				if (cb.type === "text") block = { type: "text", text: "" };
				else if (cb.type === "thinking") block = { type: "thinking", thinking: "", thinkingSignature: "" };
				else if (cb.type === "redacted_thinking") block = { type: "thinking", thinking: "", thinkingSignature: cb.data, redacted: true };
				else if (cb.type === "tool_use") {
					block = { type: "toolCall", id: cb.id, name: String(cb.name).startsWith(PREFIX) ? cb.name.slice(PREFIX.length) : cb.name, arguments: {} };
					partialJson.set(e.index, "");
				}
				if (!block) continue;
				output.content.push(block);
				const index = output.content.length - 1;
				blocks.set(e.index, index);
				const kind = block.type === "toolCall" ? "toolcall" : block.type;
				stream.push({ type: `${kind}_start`, contentIndex: index, partial: output } as never);
			} else if (e.type === "content_block_delta") {
				const index = blocks.get(e.index);
				const block = index === undefined ? undefined : output.content[index];
				if (!block || index === undefined) continue;
				const d = e.delta;
				if (d.type === "text_delta" && block.type === "text") {
					block.text += d.text;
					stream.push({ type: "text_delta", contentIndex: index, delta: d.text, partial: output });
				} else if (d.type === "thinking_delta" && block.type === "thinking") {
					block.thinking += d.thinking;
					stream.push({ type: "thinking_delta", contentIndex: index, delta: d.thinking, partial: output });
				} else if (d.type === "signature_delta" && block.type === "thinking") {
					block.thinkingSignature = (block.thinkingSignature ?? "") + d.signature;
				} else if (d.type === "input_json_delta" && block.type === "toolCall") {
					const json = (partialJson.get(e.index) ?? "") + d.partial_json;
					partialJson.set(e.index, json);
					block.arguments = parseStreamingJson(json);
					stream.push({ type: "toolcall_delta", contentIndex: index, delta: d.partial_json, partial: output });
				}
			} else if (e.type === "content_block_stop") {
				const index = blocks.get(e.index);
				const block = index === undefined ? undefined : output.content[index];
				if (!block || index === undefined) continue;
				if (block.type === "text") stream.push({ type: "text_end", contentIndex: index, content: block.text, partial: output });
				else if (block.type === "thinking") stream.push({ type: "thinking_end", contentIndex: index, content: block.thinking, partial: output });
				else {
					const json = partialJson.get(e.index) ?? "";
					block.arguments = json.trim() ? JSON.parse(json) : {};
					stream.push({ type: "toolcall_end", contentIndex: index, toolCall: block, partial: output });
				}
			} else if (e.type === "message_delta") {
				output.rawStopReason = e.delta?.stop_reason ?? output.rawStopReason;
				output.stopReason = mapStop(output.rawStopReason);
				applyUsage(output, e.usage);
				if (output.rawStopReason === "refusal") {
					const details = e.delta?.stop_details ?? {};
					refusal = details.explanation?.trim() || (details.category ? `refusal category: ${details.category}` : "Claude refused this request");
				}
			} else if (e.type === "message_stop") {
				stopped = true;
			}
		}
		const code = await exited;

		if (options?.signal?.aborted) throw new Error("Request was aborted");
		if (relay.status !== undefined && relay.status !== 200) throw new Error(`${relay.status} ${relay.errorBody || "(no body)"}`);
		if (!relay.used) {
			const hint = /log ?in|auth/i.test(nativeError ?? "") ? " Run `claude auth login`." : "";
			throw new Error(`Claude Code: ${nativeError ?? `exited with code ${code} before sending a request`}${hint}`);
		}
		if (!stopped || output.stopReason === "pending") throw new Error(`Incomplete upstream response${relay.failure ? `: ${relay.failure}` : ""}`);
		if (refusal) {
			// A tool call cut off by the classifier must not run.
			output.content = output.content.filter((b) => b.type !== "toolCall");
			throw new Error(refusal);
		}
		stream.push({ type: "done", reason: output.stopReason as "stop" | "length" | "toolUse", message: output });
	} finally {
		options?.signal?.removeEventListener("abort", abort);
		abort();
		rmSync(dir, { recursive: true, force: true });
	}
}

function applyUsage(output: AssistantMessage, usage: Json | undefined) {
	if (!usage) return;
	const u = output.usage;
	u.input = usage.input_tokens ?? u.input;
	u.output = usage.output_tokens ?? u.output;
	u.cacheRead = usage.cache_read_input_tokens ?? u.cacheRead;
	u.cacheWrite = usage.cache_creation_input_tokens ?? u.cacheWrite;
	u.totalTokens = u.input + u.output + u.cacheRead + u.cacheWrite;
}

function streamClaudeSub(model: Model<Api>, context: TranscriptContext, options?: SimpleStreamOptions): AssistantMessageEventStream {
	const stream = createAssistantMessageEventStream();
	const output: AssistantMessage = {
		role: "assistant",
		content: [],
		api: model.api,
		provider: model.provider,
		model: model.id,
		usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
		stopReason: "pending",
		timestamp: Date.now(),
	};
	run(model, context, options, stream, output)
		.catch((error) => {
			output.stopReason = options?.signal?.aborted ? "aborted" : "error";
			output.errorMessage = error instanceof Error ? error.message : String(error);
			stream.push({ type: "error", reason: output.stopReason, error: output });
		})
		.finally(() => stream.end());
	return stream;
}

export default function (pi: ExtensionAPI) {
	pi.registerProvider("claude-sub", {
		name: "Claude Subscription (Claude Code)",
		baseUrl: "process://claude",
		// Not a credential: Claude Code owns the login. pi requires some key to treat the provider as configured.
		apiKey: "claude-code-cli",
		api: "claude-sub-cli",
		models: MODELS.map(([id, name, contextWindow, maxTokens]) => ({
			id,
			name: `${name} (subscription)`,
			reasoning: true,
			input: ["text", "image"],
			cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
			contextWindow,
			maxTokens,
			...(isMandatory(id) ? { thinkingLevelMap: { off: null } } : {}),
		})),
		streamSimple: streamClaudeSub,
	});
}
