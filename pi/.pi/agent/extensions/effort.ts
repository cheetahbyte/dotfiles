import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const THINKING_LEVELS = [
	"off",
	"minimal",
	"low",
	"medium",
	"high",
	"xhigh",
	"max",
] as const;

type ThinkingLevel = (typeof THINKING_LEVELS)[number];

export default function effortExtension(pi: ExtensionAPI) {
	pi.registerCommand("effort", {
		description: "Set the current model's thinking level",
		handler: async (_args, ctx) => {
			if (!ctx.hasUI) {
				ctx.ui.notify("/effort requires an interactive Pi UI", "error");
				return;
			}

			const current = pi.getThinkingLevel();
			const selected = await ctx.ui.select(
				`Set effort (current: ${current})`,
				[...THINKING_LEVELS],
			);

			if (!selected) {
				return;
			}

			pi.setThinkingLevel(selected as ThinkingLevel);
			const applied = pi.getThinkingLevel();
			ctx.ui.notify(`Effort set to ${applied}`, "info");
		},
	});
}
