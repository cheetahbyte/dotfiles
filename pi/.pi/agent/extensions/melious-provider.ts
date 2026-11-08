/**
 * Melious provider extension for Pi.
 *
 * Registers https://melious.ai as a provider and adds every Melious model that
 * Pi can represent:
 *
 *  - **chat** models     -> OpenAI-compatible `/v1/chat/completions`
 *                           (reasoning via `reasoning_content`, vision via
 *                           `image_url` content blocks, tool calling)
 *  - **decision** models -> System One API (`/v1/systemone`) as Pi classifier
 *                           models (custom implementation, same wire protocol
 *                           as TypeSafe System One)
 *  - **image** models    -> OpenAI-compatible `/v1/images/generations` through
 *                           a small custom image API
 *
 * Melious types that have no Pi model type are skipped: `embeddings`, `audio`,
 * `reranker`, and `guardrail` (Pi's model registry only knows chat, image, and
 * classifier models). Model IDs with routing suffixes (`:speed`, `:price`,
 * `:eco`) are not listed separately — append the suffix to any chat or image
 * model ID yourself.
 *
 * The catalog is fetched live from `GET /v1/models?include_meta=true`, so new
 * Melious models appear automatically. A snapshot is persisted by Pi and
 * restored for offline startup. When an API key is present, the catalog is
 * additionally seeded at startup so `pi --list-models` and the picker show
 * models immediately.
 *
 * Auth: stored `melious` credential in auth.json, the `MELIOUS_API_KEY`
 * environment variable, or `/login melious` (prompts for the key).
 *
 * Load: place this file in the Pi extensions directory (e.g.
 * `~/.pi/agent/extensions/melious-provider.ts`) — Pi discovers it on start.
 * For a one-off run: `pi -e ./melious-provider.ts`.
 *
 * Note: all imports come from `@earendil-works/pi-ai/compat`. Pi maps both it
 * and the root specifier to the compat entrypoint at runtime, but only the
 * compat types export `openAICompletionsApi`; subpath imports such as
 * `.../api/...` are not mapped and fail to resolve inside extensions.
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
	calculateCost,
	createProvider,
	envApiKeyAuth,
	openAICompletionsApi,
	type AssistantImages,
	type ClassifierContext,
	type ClassifierModel,
	type ClassifierResult,
	type ImageModel,
	type ImagesContext,
	type ImagesOptions,
	type Model,
	type ModelInputModality,
	type ProviderClassifier,
	type ProviderImages,
	type RefreshModelsContext,
	type Usage,
} from "@earendil-works/pi-ai/compat";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// =============================================================================
// Constants
// =============================================================================

const BASE_URL = "https://api.melious.ai/v1";
export const MELIOUS_API_KEY_ENV = "MELIOUS_API_KEY";
export const PROVIDER_ID = "melious";

/** Fallback output cap when Melious omits `_meta.max_output_tokens`. */
const DEFAULT_MAX_TOKENS = 16384;
/** DeepSeek V4 advertises a 384K output limit and Melious accepts it. */
const DEEPSEEK_V4_MAX_TOKENS = 393216;
/** Fallback context window when Melious omits `_meta.context_length`. */
const DEFAULT_CONTEXT_WINDOW = 128000;

function defaultMaxTokens(modelId: string): number {
	return modelId.toLowerCase().startsWith("deepseek-v4") ? DEEPSEEK_V4_MAX_TOKENS : DEFAULT_MAX_TOKENS;
}

// =============================================================================
// Live catalog types (subset of GET /v1/models?include_meta=true)
// =============================================================================

interface MeliousMeta {
	type?: "chat" | "embeddings" | "audio" | "image" | "reranker" | "guardrail" | "decision";
	display_name?: string;
	input_modalities?: string[];
	capabilities?: {
		reasoning?: boolean;
		vision?: boolean;
		text_to_image?: boolean;
		image_to_image?: boolean;
	};
	reasoning_type?: "reasoning" | "non_reasoning" | "hybrid";
	pricing?: {
		input_cost_per_million_eur?: number;
		output_cost_per_million_eur?: number;
		cache_read_cost_per_million_eur?: number;
	};
	context_length?: number | null;
	max_output_tokens?: number | null;
}

interface MeliousCatalogModel {
	id: string;
	_meta?: MeliousMeta;
}

/** Every model type Pi can represent, mapped from the Melious catalog. */
type MappedChatModel = Model<"openai-completions">;
type MappedClassifierModel = ClassifierModel<"melious-system-one">;
type MappedImageModel = ImageModel<"melious-images">;
type MappedModel = MappedChatModel | MappedClassifierModel | MappedImageModel;

/** Shared fields for every mapped model. */
interface MappedModelBase {
	id: string;
	name: string;
	provider: string;
	baseUrl: string;
	input: ModelInputModality[];
	cost: MappedChatModel["cost"];
}

// =============================================================================
// Catalog fetch and mapping
// =============================================================================

function displayName(id: string, meta?: MeliousMeta): string {
	if (meta?.display_name) return meta.display_name;
	return id
		.split("-")
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

/** Pi only knows text and image inputs; Melious may also list video. */
function piInputModalities(meta?: MeliousMeta): ModelInputModality[] {
	const raw = meta?.input_modalities;
	if (raw?.length) {
		return raw.filter((m): m is "text" | "image" => m === "text" || m === "image");
	}
	return meta?.capabilities?.vision ? ["text", "image"] : ["text"];
}

/** Reasoning capability: hybrid models can toggle reasoning via reasoning_effort. */
function supportsReasoning(meta?: MeliousMeta): boolean {
	if (meta?.reasoning_type) return meta.reasoning_type !== "non_reasoning";
	return meta?.capabilities?.reasoning ?? false;
}

function mapModel(m: MeliousCatalogModel): MappedModel | undefined {
	const meta = m._meta;
	const type = meta?.type ?? "chat";

	const input = piInputModalities(meta);

	const cost = {
		input: meta?.pricing?.input_cost_per_million_eur ?? 0,
		output: meta?.pricing?.output_cost_per_million_eur ?? 0,
		cacheRead: meta?.pricing?.cache_read_cost_per_million_eur ?? 0,
		cacheWrite: 0,
	};

	const base: MappedModelBase = {
		id: m.id,
		name: displayName(m.id, meta),
		provider: PROVIDER_ID,
		baseUrl: BASE_URL,
		input,
		cost,
	};

	switch (type) {
		case "chat":
			return {
				...base,
				api: "openai-completions" as const,
				reasoning: supportsReasoning(meta),
				contextWindow: meta?.context_length ?? DEFAULT_CONTEXT_WINDOW,
				maxTokens: meta?.max_output_tokens ?? defaultMaxTokens(m.id),
				// Melious speaks the OpenAI shape: max_tokens (not
				// max_completion_tokens) and reasoning via reasoning_content.
				compat: { maxTokensField: "max_tokens" },
			};
		case "decision":
			// System One endpoint (/v1/systemone). Decision models take no images
			// today; pi sends no images for text-only classifier models anyway.
			return {
				...base,
				type: "classifier" as const,
				api: "melious-system-one" as const,
				contextWindow: meta?.context_length ?? 64000,
			};
		case "image":
			// OpenAI-compatible /v1/images/generations. Per-image pricing is not
			// expressible in Pi's token-based ModelCost, so cost is zeroed.
			return {
				...base,
				type: "image" as const,
				api: "melious-images" as const,
				output: ["image"],
			};
		default:
			// embeddings, audio, reranker, guardrail: no Pi model type.
			return undefined;
	}
}

async function fetchMeliousModels(
	apiKey: string,
	signal?: AbortSignal,
): Promise<MappedModel[]> {
	const res = await fetch(`${BASE_URL}/models?include_meta=true`, {
		headers: { Authorization: `Bearer ${apiKey}` },
		signal,
	});
	if (!res.ok) {
		throw new Error(`Melious model catalog request failed: ${res.status} ${await res.text()}`);
	}
	const { data } = (await res.json()) as { data: MeliousCatalogModel[] };
	return data
		.map(mapModel)
		.filter((model): model is MappedModel => model !== undefined);
}

// =============================================================================
// Eager startup seed
// =============================================================================

/**
 * Read the API key from MELIOUS_API_KEY or the stored `melious` credential in
 * auth.json (the same place `/login melious` writes). Only used to seed the
 * baseline catalog at startup; runtime auth still goes through Pi's auth layer.
 */
function readStoredKey(): string | undefined {
	if (process.env[MELIOUS_API_KEY_ENV]) return process.env[MELIOUS_API_KEY_ENV];
	try {
		const agentDir = process.env.PI_CODING_AGENT_DIR ?? join(homedir(), ".pi", "agent");
		const data = JSON.parse(readFileSync(join(agentDir, "auth.json"), "utf8"));
		const cred = data?.[PROVIDER_ID];
		return cred?.type === "api_key" ? cred.key : undefined;
	} catch {
		return undefined;
	}
}

// =============================================================================
// System One classifier (custom "melious-system-one" API)
//
// Melious's /v1/systemone speaks the TypeSafe System One wire protocol:
//   POST { model, state, questions }  ->  { answers, usage }
// pi's public `bool` questions map to the wire-level `noul` type, exactly like
// pi-ai's built-in typesafe-system-one implementation.
// =============================================================================

function requiredNumber(label: string, value: unknown, field: string): number {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		throw new Error(`${label} returned an invalid ${field}`);
	}
	return value;
}

function parseMeliousAnswers(
	answers: Record<string, unknown>,
	context: ClassifierContext,
): ClassifierResult["answers"] {
	const parsed: ClassifierResult["answers"] = {};
	for (const [id, question] of Object.entries(context.questions)) {
		const answer = answers[id];
		if (typeof answer !== "object" || answer === null || Array.isArray(answer)) {
			throw new Error(`Melious System One did not return an answer for ${id}`);
		}
		const record = answer as Record<string, unknown>;
		if (question.type === "choice") {
			if (record.type !== "choice" || typeof record.choice !== "string") {
				throw new Error(`Melious System One did not return a choice answer for ${id}`);
			}
			const probabilities = record.probabilities;
			if (typeof probabilities !== "object" || probabilities === null) {
				throw new Error(`Melious System One returned invalid probabilities for ${id}`);
			}
			parsed[id] = {
				type: "choice",
				choice: record.choice,
				probabilities: Object.fromEntries(
					Object.entries(probabilities as Record<string, unknown>).map(([key, probability]) => [
						key,
						requiredNumber("Melious System One", probability, `probability for ${id}.${key}`),
					]),
				),
				confidence: requiredNumber("Melious System One", record.confidence, `confidence for ${id}`),
			};
		} else if (question.type === "score") {
			if (record.type !== "score") {
				throw new Error(`Melious System One did not return a score answer for ${id}`);
			}
			parsed[id] = {
				type: "score",
				score: requiredNumber("Melious System One", record.score, `score for ${id}`),
				confidence: requiredNumber("Melious System One", record.confidence, `confidence for ${id}`),
			};
		} else {
			if (record.type !== "noul") {
				throw new Error(`Melious System One did not return a bool answer for ${id}`);
			}
			parsed[id] = {
				type: "bool",
				probability: requiredNumber("Melious System One", record.noul, `probability for ${id}`),
			};
		}
	}
	return parsed;
}

const meliousSystemOneApi: ProviderClassifier = {
	async classify(
		model: ClassifierModel<"melious-system-one">,
		context: ClassifierContext,
		options,
	): Promise<ClassifierResult> {
		const output: ClassifierResult = {
			api: model.api,
			provider: model.provider,
			model: model.id,
			answers: {},
			stopReason: "stop",
			timestamp: Date.now(),
		};
		try {
			const apiKey = options?.apiKey;
			if (!apiKey) throw new Error(`No API key for provider: ${model.provider}`);
			if (context.images?.length) {
				throw new Error(`Melious decision model ${model.id} does not accept image input`);
			}

			// bool -> noul on the wire.
			const questions = Object.fromEntries(
				Object.entries(context.questions).map(([id, question]) => [
					id,
					question.type === "bool" ? { ...question, type: "noul" } : question,
				]),
			);
			const body = { model: model.id, state: context.state, questions };
			const nextBody = await options?.onPayload?.(body, model);
			const finalBody = nextBody ?? body;

			const fetchFn = options?.fetch ?? globalThis.fetch;
			const res = await fetchFn(`${model.baseUrl}/systemone`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${apiKey}`,
					"Content-Type": "application/json",
					...(options?.headers ?? {}),
				},
				body: JSON.stringify(finalBody),
				signal: options?.signal,
			});
			await options?.onResponse?.({ status: res.status, headers: {} }, model);

			if (!res.ok) {
				throw new Error(`Melious System One request failed: ${res.status} ${await res.text()}`);
			}
			const json = (await res.json()) as {
				answers?: Record<string, unknown>;
				usage?: { input_tokens?: number; output_tokens?: number };
			};

			// Usage is priced from the model catalog like chat usage.
			const input = typeof json.usage?.input_tokens === "number" ? json.usage.input_tokens : 0;
			const out = typeof json.usage?.output_tokens === "number" ? json.usage.output_tokens : 0;
			if (input > 0 || out > 0) {
				const usage: Usage = {
					input,
					output: out,
					cacheRead: 0,
					cacheWrite: 0,
					totalTokens: input + out,
					cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
				};
				calculateCost(model, usage);
				output.usage = usage;
			}

			output.answers = parseMeliousAnswers(json.answers ?? {}, context);
			return output;
		} catch (error) {
			output.stopReason = options?.signal?.aborted ? "aborted" : "error";
			output.errorMessage = error instanceof Error ? error.message : String(error);
			return output;
		}
	},
};

// =============================================================================
// Image generation (custom "melious-images" API)
//
// OpenAI-compatible POST /v1/images/generations, base64 responses only.
// =============================================================================

/** Sniff the mime type from base64 image bytes; Melious returns no format field. */
function sniffMime(b64: string): string {
	const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).subarray(0, 12);
	if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
	if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
	if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return "image/webp";
	return "image/png";
}

const meliousImagesApi: ProviderImages = {
	async generateImages(
		model: ImageModel<"melious-images">,
		context: ImagesContext,
		options?: ImagesOptions,
	): Promise<AssistantImages> {
		const output: AssistantImages = {
			api: model.api,
			provider: model.provider,
			model: model.id,
			output: [],
			stopReason: "stop",
			timestamp: Date.now(),
		};
		try {
			const apiKey = options?.apiKey;
			if (!apiKey) throw new Error(`No API key for provider: ${model.provider}`);

			const prompt = context.input
				.filter((part): part is { type: "text"; text: string } => part.type === "text")
				.map((part) => part.text)
				.join("\n\n");

			const body: { model: string; prompt: string; n: number; response_format: string; input_images?: string[] } = {
				model: model.id,
				prompt,
				n: 1,
				response_format: "b64_json",
			};

			// Melious image models are text-to-image, with img2img on the FLUX
			// variants that declare image input (via the `input_images` param).
			const imageParts = context.input.filter((part) => part.type === "image");
			if (imageParts.length > 0) {
				if (!model.input.includes("image")) {
					throw new Error(`Melious image model ${model.id} does not accept image input`);
				}
				body.input_images = imageParts.map((part) => part.data);
			}
			const nextBody = await options?.onPayload?.(body, model);
			const finalBody = nextBody ?? body;

			const fetchFn = options?.fetch ?? globalThis.fetch;
			const res = await fetchFn(`${model.baseUrl}/images/generations`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${apiKey}`,
					"Content-Type": "application/json",
					...(options?.headers ?? {}),
				},
				body: JSON.stringify(finalBody),
				signal: options?.signal,
			});
			await options?.onResponse?.({ status: res.status, headers: {} }, model);

			if (!res.ok) {
				throw new Error(`Melious image request failed: ${res.status} ${await res.text()}`);
			}
			const json = (await res.json()) as { data?: { b64_json?: string }[] };
			for (const item of json.data ?? []) {
				if (typeof item.b64_json === "string" && item.b64_json.length > 0) {
					output.output.push({
						type: "image",
						mimeType: sniffMime(item.b64_json),
						data: item.b64_json,
					});
				}
			}
			return output;
		} catch (error) {
			output.stopReason = options?.signal?.aborted ? "aborted" : "error";
			output.errorMessage = error instanceof Error ? error.message : String(error);
			return output;
		}
	},
};

// =============================================================================
// Extension entry point
// =============================================================================

/** Last successfully fetched catalog, used to survive transient refresh failures. */
let lastGoodModels: MappedModel[] = [];

export default async function (pi: ExtensionAPI) {
	// Seed eagerly at startup so models are available immediately when a key
	// exists. fetchModels replaces this with the live catalog after auth
	// resolves; Pi also persists the fetched snapshot for offline restarts.
	let seed: MappedModel[] = [];
	const seedKey = readStoredKey();
	if (seedKey) {
		try {
			seed = await fetchMeliousModels(seedKey);
		} catch (error) {
			console.error(`[melious] startup catalog seed failed:`, error instanceof Error ? error.message : error);
		}
	}

	pi.registerProvider(
		createProvider({
			id: PROVIDER_ID,
			name: "Melious",
			baseUrl: BASE_URL,
			auth: { apiKey: envApiKeyAuth("Melious API key", [MELIOUS_API_KEY_ENV]) },
			// Seeded at startup when a key exists; empty otherwise until refresh.
			models: seed,
			api: openAICompletionsApi(),
			images: { "melious-images": meliousImagesApi },
			classifiers: { "melious-system-one": meliousSystemOneApi },
			fetchModels: async (context: RefreshModelsContext) => {
				const key =
					context.credential?.type === "oauth"
						? context.credential.access
						: context.credential?.key;
				if (!key) return [];
				try {
					const models = await fetchMeliousModels(key, context.signal);
					lastGoodModels = models;
					return models;
				} catch (error) {
					// Keep the previous catalog instead of wiping it (an empty
					// result would be persisted and hide every model).
					console.error(`[melious] catalog refresh failed:`, error instanceof Error ? error.message : error);
					return lastGoodModels;
				}
			},
		}),
	);
}