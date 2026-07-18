import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function clearSessionExtension(pi: ExtensionAPI) {
	pi.registerCommand("clear", {
		description: "Clear context and start a new session",
		handler: async (_args, ctx) => {
			await ctx.waitForIdle();

			if (!ctx.hasUI) {
				ctx.ui.notify("/clear requires interactive confirmation", "error");
				return;
			}

			const confirmed = await ctx.ui.confirm(
				"Clear context?",
				"Start a new session? The current session will remain available through /resume.",
			);

			if (!confirmed) {
				return;
			}

			const result = await ctx.newSession();
			if (result.cancelled) {
				ctx.ui.notify("Clear cancelled by a session-switch guard", "info");
			}
		},
	});
}
