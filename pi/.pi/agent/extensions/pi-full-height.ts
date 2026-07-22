import type {
	ExtensionAPI,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";

// Pins the editor + footer to the bottom of the viewport, like Claude Code.
//
// pi renders its root as a top-to-bottom stack of sibling containers:
//   header · resources · chat · pending · status · widgetsAbove · editor ·
//   widgetsBelow · footer
// When the transcript is short the stack is shorter than the terminal, so the
// input floats near the top. We register an `aboveEditor` widget that emits
// exactly enough blank lines to grow the stack to the full terminal height,
// pushing everything below it (editor + footer) down to the bottom edge.
//
// The widget can't be told the height of its siblings, so at render time it
// re-renders the whole tree once to measure them, then returns the padding.
// A re-entrancy guard makes the widget contribute 0 lines to its own
// measurement pass, which both prevents infinite recursion and yields the
// height of *everything except the gap* in one sweep.

// Leave one row of slack so the padded stack never exactly equals the viewport
// (some terminals scroll the last row, which would cause jitter).
const RESERVE = 1;

// Structural shape of a pi-tui Component (the type isn't re-exported).
interface SpacerComponent {
	render(width: number): string[];
	invalidate(): void;
	dispose?(): void;
}

// Minimal slice of the TUI the spacer reaches into: sibling components to
// measure and the terminal row count to fill toward.
interface TuiLike {
	children: { render(width: number): string[] }[];
	terminal: { rows: number };
	requestRender(force?: boolean): void;
}

function makeSpacer(tui: TuiLike): SpacerComponent {
	// True while we re-render the tree to measure siblings — see below.
	let measuring = false;

	return {
		render(width: number): string[] {
			// Re-entrant call from our own measurement pass: contribute nothing
			// so siblings sum to the height of the stack *without* the gap.
			if (measuring) return [];

			const rows = tui.terminal?.rows ?? 0;
			if (rows <= 0) return [];

			let others = 0;
			measuring = true;
			try {
				for (const child of tui.children) {
					others += child.render(width).length;
				}
			} catch {
				// If measuring blows up, fail open: no padding, default layout.
				return [];
			} finally {
				measuring = false;
			}

			const pad = Math.max(0, rows - others - RESERVE);
			return pad > 0 ? Array(pad).fill("") : [];
		},
		invalidate() {},
	};
}

export default function piFullHeightExtension(pi: ExtensionAPI): void {
	let wired = false; // register the widget once, not on every reload

	pi.on("session_start", (_event, ctx: ExtensionContext) => {
		if (ctx.mode !== "tui" || wired) return;
		wired = true;

		ctx.ui.setWidget(
			"full-height-spacer",
			(tui) => makeSpacer(tui as unknown as TuiLike),
			{ placement: "aboveEditor" },
		);
	});
}
