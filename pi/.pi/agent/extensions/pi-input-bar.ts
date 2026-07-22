import type {
	ExtensionAPI,
	ExtensionContext,
	Theme,
} from "@earendil-works/pi-coding-agent";

// Structural shape of a pi-tui Component (the type isn't re-exported).
interface BarComponent {
	render(width: number): string[];
	invalidate(): void;
	dispose?(): void;
}

// Minimal slice of the TUI we use to force a redraw on state changes.
interface TuiLike {
	requestRender(force?: boolean): void;
}

// A thinking level maps to a themed color so the label glows like Claude's.
type ThinkingColor =
	| "thinkingOff"
	| "thinkingMinimal"
	| "thinkingLow"
	| "thinkingMedium"
	| "thinkingHigh"
	| "thinkingXhigh"
	| "thinkingMax";

// ── ANSI-aware string helpers ─────────────────────────────────────────────────

const ANSI = /\x1b\[[0-9;]*m/g;

function vwidth(s: string): number {
	return [...s.replace(ANSI, "")].length;
}

function truncate(s: string, w: number): string {
	if (vwidth(s) <= w) return s;
	const plain = s.replace(ANSI, "");
	return `${[...plain].slice(0, Math.max(0, w - 1)).join("")}…`;
}

function padRight(s: string, w: number): string {
	const t = truncate(s, w);
	return t + " ".repeat(Math.max(0, w - vwidth(t)));
}

// ── Formatting ─────────────────────────────────────────────────────────────────

function fmtCost(n: number): string {
	return `$${n.toFixed(3)}`;
}

function fmtWindow(cw: number): string {
	return cw >= 1000 ? `${Math.round(cw / 1000)}k` : String(cw);
}

function fmtPercent(p: number | null | undefined): string {
	return `${(p ?? 0).toFixed(1)}%`;
}

const THINKING_COLOR: Record<string, ThinkingColor> = {
	off: "thinkingOff",
	minimal: "thinkingMinimal",
	low: "thinkingLow",
	medium: "thinkingMedium",
	high: "thinkingHigh",
	xhigh: "thinkingXhigh",
	max: "thinkingMax",
};

// ── Shared, mutable bar state ──────────────────────────────────────────────────

interface BarState {
	model: string;
	thinking: string;
	cost: number;
	contextWindow: number;
	getContextUsage: () => { percent: number | null } | undefined;
	tui?: TuiLike;
}

function refresh(state: BarState): void {
	state.tui?.requestRender();
}

// ── Top row: model (left) · thinking (right), above the editor ─────────────────

function renderTopRow(theme: Theme, state: BarState, width: number): string[] {
	// Left: model, then a disabled hint for the model-cycle shortcut.
	const model = theme.fg("accent", theme.bold(state.model));
	const cycleHint = theme.fg("dim", "CTRL P to cycle");
	const left = `${model}  ${cycleHint}`;

	// Right: disabled shift-tab hint, then the (colored) thinking level. No ⏵.
	const tColor = THINKING_COLOR[state.thinking] ?? "muted";
	const thinking = state.thinking
		? theme.fg("dim", "SHIFT TAB ") +
			theme.fg(tColor, `thinking: ${state.thinking}`)
		: "";

	const gap = Math.max(1, width - vwidth(left) - vwidth(thinking));
	return [left + " ".repeat(gap) + thinking];
}

// ── Bottom row: mcp · $cost (sub) · pct/window (auto), below the editor ────────

function renderBottomRow(
	theme: Theme,
	state: BarState,
	width: number,
): string[] {
	const usage = state.getContextUsage();
	const dim = (s: string) => theme.fg("dim", s);
	const muted = (s: string) => theme.fg("muted", s);
	const sep = dim("  ·  ");

	const mcp = muted("⚉ mcp");
	const cost = dim(`${fmtCost(state.cost)} `) + muted("(sub)");
	const ctx =
		dim(`${fmtPercent(usage?.percent)}/${fmtWindow(state.contextWindow)} `) +
		muted("(auto)");

	const line = [mcp, cost, ctx].join(sep);
	return [padRight(line, width)];
}

// ── Component factories ─────────────────────────────────────────────────────────

function makeComponent(render: (width: number) => string[]): BarComponent {
	return {
		render,
		invalidate: () => {},
	};
}

// ── Extension entry ──────────────────────────────────────────────────────────────

export default function piInputBarExtension(pi: ExtensionAPI): void {
	let wired = false; // guard: register widgets/listeners once, not on every reload

	pi.on("session_start", (_event, ctx: ExtensionContext) => {
		if (ctx.mode !== "tui" || wired) return;
		wired = true;

		const model = ctx.model;
		const state: BarState = {
			model: model?.name ?? model?.id ?? "no model",
			thinking: pi.getThinkingLevel() ?? "",
			cost: 0,
			contextWindow: model?.contextWindow ?? 0,
			getContextUsage: () => ctx.getContextUsage(),
		};

		// Model + thinking, on one line above the input bar.
		ctx.ui.setWidget(
			"input-bar-top",
			(tui, theme) => {
				state.tui = tui as unknown as TuiLike;
				return makeComponent((w) => renderTopRow(theme, state, w));
			},
			{ placement: "aboveEditor" },
		);

		// mcp · cost · context, on one line below the input bar.
		ctx.ui.setFooter((tui, theme) => {
			state.tui = tui as unknown as TuiLike;
			return makeComponent((w) => renderBottomRow(theme, state, w));
		});

		// ── keep state live ──────────────────────────────────────────────────────
		pi.on("model_select", (e) => {
			state.model = e.model.name ?? e.model.id;
			state.contextWindow = e.model.contextWindow ?? state.contextWindow;
			refresh(state);
		});

		pi.on("thinking_level_select", (e) => {
			state.thinking = e.level ?? "";
			refresh(state);
		});

		pi.on("message_end", (e) => {
			const usage = (e.message as { usage?: { cost?: { total?: number } } })
				.usage;
			if (typeof usage?.cost?.total === "number") {
				state.cost += usage.cost.total;
			}
			refresh(state);
		});

		pi.on("turn_end", () => refresh(state));
	});
}
