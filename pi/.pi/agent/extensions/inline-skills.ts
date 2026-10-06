import { readFile } from "node:fs/promises";
import { dirname } from "node:path";
import {
	CustomEditor,
	type ExtensionAPI,
	getMarkdownTheme,
	type ParsedSkillBlock,
	SkillInvocationMessageComponent,
	type SlashCommandInfo,
	stripFrontmatter,
} from "@earendil-works/pi-coding-agent";
import { type AutocompleteProvider, CombinedAutocompleteProvider } from "@earendil-works/pi-tui";

const customType = "inline-skill";
const codePattern = /```[\s\S]*?(?:```|$)|~~~[\s\S]*?(?:~~~|$)|`[^`\n]*`/g;
const skillPattern = /(?:^|[\s(])\/skill:([a-z0-9-]+)(?=$|[\s.,!?;:)\]])/g;
const completionPattern = /(?:^|\s)(\/(?:skill:)?[a-z0-9-]*)$/i;

function escapeAttribute(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default function (pi: ExtensionAPI) {
	const getSkills = (): SlashCommandInfo[] => pi.getCommands().filter((command) => command.source === "skill");

	// Only treat a mid-line "/token" as a skill reference when some skill name starts with it,
	// so absolute paths like "/tmp" keep the stock behavior.
	const skillToken = (before: string): string | undefined => {
		const token = completionPattern.exec(before)?.[1];
		if (token === undefined) return undefined;
		const query = token.slice(1).toLowerCase();
		const matches = getSkills().some((skill) => skill.name.startsWith(query) || skill.name.slice(6).startsWith(query));
		return matches ? token : undefined;
	};

	class InlineSkillEditor extends CustomEditor {
		private inlineTriggersInstalled = false;

		override setAutocompleteProvider(provider: AutocompleteProvider): void {
			if (!this.inlineTriggersInstalled) {
				const hooks = this as unknown as {
					isAtStartOfMessage(): boolean;
					isInSlashCommandContext(text: string): boolean;
				};
				if (typeof hooks.isAtStartOfMessage !== "function" || typeof hooks.isInSlashCommandContext !== "function") {
					throw new Error("Inline skills: this Pi editor version has incompatible autocomplete hooks.");
				}
				const atStart = hooks.isAtStartOfMessage.bind(this);
				const inCommand = hooks.isInSlashCommandContext.bind(this);
				hooks.isAtStartOfMessage = () => {
					const cursor = this.getCursor();
					const before = (this.getLines()[cursor.line] ?? "").slice(0, cursor.col);
					return atStart() || skillToken(before) !== undefined;
				};
				hooks.isInSlashCommandContext = (text) => inCommand(text) || skillToken(text) !== undefined;
				this.inlineTriggersInstalled = true;
			}
			const inlinePrefix = (lines: string[], line: number, col: number): string | undefined => {
				const before = (lines[line] ?? "").slice(0, col);
				const token = skillToken(before);
				if (token === undefined || (line === 0 && before.trimStart() === token)) return undefined;
				return token;
			};
			const wrapped: AutocompleteProvider = {
				triggerCharacters: provider.triggerCharacters,
				getSuggestions: async (lines, line, col, options) => {
					const prefix = inlinePrefix(lines, line, col);
					if (prefix) {
						const skillProvider = new CombinedAutocompleteProvider(getSkills(), ".");
						const suggestions = await skillProvider.getSuggestions([prefix], 0, prefix.length, {
							...options,
							force: false,
						});
						if (suggestions) return suggestions;
					}
					// A mid-line "/token" that stopped matching skills closes the menu instead of
					// falling into path completion that stock pi would not show (Tab still forces it).
					const before = (lines[line] ?? "").slice(0, col);
					const slashToken = completionPattern.exec(before)?.[1];
					const atLineStart = line === 0 && before.trimStart() === slashToken;
					if (slashToken !== undefined && !atLineStart && !options.force) return null;
					return provider.getSuggestions(lines, line, col, options);
				},
				applyCompletion: (lines, line, col, item, prefix) => {
					if (inlinePrefix(lines, line, col) === prefix && item.value.startsWith("skill:")) {
						const current = lines[line] ?? "";
						const before = current.slice(0, col - prefix.length);
						const inserted = `/${item.value} `;
						const result = [...lines];
						result[line] = before + inserted + current.slice(col);
						return { lines: result, cursorLine: line, cursorCol: before.length + inserted.length };
					}
					return provider.applyCompletion(lines, line, col, item, prefix);
				},
				shouldTriggerFileCompletion: (lines, line, col) =>
					inlinePrefix(lines, line, col) !== undefined ||
					(provider.shouldTriggerFileCompletion?.(lines, line, col) ?? true),
			};
			super.setAutocompleteProvider(wrapped);
		}
	}

	pi.registerMessageRenderer<ParsedSkillBlock>(customType, (message, options) => {
		if (!message.details) return undefined;
		const component = new SkillInvocationMessageComponent(message.details, getMarkdownTheme());
		component.setExpanded(options.expanded);
		return component;
	});

	pi.on("session_start", (_event, ctx) => {
		if (ctx.mode === "tui") {
			ctx.ui.setEditorComponent((tui, theme, keybindings) => new InlineSkillEditor(tui, theme, keybindings));
		}
	});

	pi.on("input", async (event, ctx) => {
		const skills = getSkills();
		// Core expands a leading "/skill:name" itself (name ends at the first space); leave that one to it.
		const spaceIndex = event.text.indexOf(" ");
		const leading = event.text.startsWith("/skill:")
			? event.text.slice(7, spaceIndex === -1 ? undefined : spaceIndex)
			: undefined;
		const searchable = event.text.replace(codePattern, (code) => " ".repeat(code.length));
		const names = new Set([...searchable.matchAll(skillPattern)].map((match) => match[1]));
		if (leading && skills.some((skill) => skill.name === `skill:${leading}`)) names.delete(leading);

		const blocks: ParsedSkillBlock[] = [];
		for (const name of names) {
			const skill = skills.find((command) => command.name === `skill:${name}`);
			if (!skill) continue;
			const location = skill.sourceInfo.path;
			try {
				const body = stripFrontmatter(await readFile(location, "utf8")).trim();
				blocks.push({ name, location, content: `References are relative to ${dirname(location)}.\n\n${body}`, userMessage: undefined });
			} catch (error) {
				ctx.ui.notify(`Cannot attach skill ${name}: ${error instanceof Error ? error.message : String(error)}`, "error");
				if (event.source !== "interactive") continue;
				ctx.ui.setEditorText(event.text);
				return { action: "handled" };
			}
		}

		// Idle: attach to the prompt's turn. Streaming: queue next to the steer/follow-up text.
		const deliverAs = event.streamingBehavior ?? "nextTurn";
		for (const block of blocks) {
			pi.sendMessage<ParsedSkillBlock>(
				{
					customType,
					content: `<skill name="${escapeAttribute(block.name)}" location="${escapeAttribute(block.location)}">\n${block.content}\n</skill>`,
					display: true,
					details: block,
				},
				{ deliverAs },
			);
		}
		return { action: "continue" };
	});
}
