import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import type {
	ExtensionAPI,
	ExtensionContext,
	Theme,
} from "@earendil-works/pi-coding-agent";

// Structural shape of a pi-tui Component (avoids importing the non-re-exported type).
interface HeaderComponent {
	render(width: number): string[];
	invalidate(): void;
}

// ── Config ──────────────────────────────────────────────────────────────────

const APP_NAME = "pi";
const LEFT_WIDTH = 34; // inner width of the left (identity) column
const MAX_WIDTH = 160; // don't stretch the header across ultra-wide terminals

// 3-line accent-colored mascot, mirrors Claude Code's little creature.
const MASCOT = ["▟█████▙", "█ π π █", "▜██▀██▛"];

const TIPS: { title: string; lines: string[] } = {
	title: "Tips for getting started",
	lines: [
		"Run /help to see commands and keybindings",
		"Ask Pi how to use or extend itself — it can read its own docs",
	],
};

const WHATS_NEW: { title: string; lines: string[] } = {
	title: "What's new",
	lines: [
		"Custom pi-branded startup header via ctx.ui.setHeader",
		"Extensions can register tools, commands, and providers",
		"/release-notes for more",
	],
};

// ── ANSI-aware string helpers ─────────────────────────────────────────────────

const ANSI = /\x1b\[[0-9;]*m/g;

function vwidth(s: string): number {
	return [...s.replace(ANSI, "")].length;
}

function truncate(s: string, w: number): string {
	if (vwidth(s) <= w) return s;
	// naive: strip ansi, cut, keep it simple (right column is plain-colored)
	const plain = s.replace(ANSI, "");
	return `${[...plain].slice(0, Math.max(0, w - 1)).join("")}…`;
}

function padRight(s: string, w: number): string {
	const t = truncate(s, w);
	return t + " ".repeat(Math.max(0, w - vwidth(t)));
}

function center(s: string, w: number): string {
	const t = truncate(s, w);
	const total = Math.max(0, w - vwidth(t));
	const left = Math.floor(total / 2);
	return " ".repeat(left) + t + " ".repeat(total - left);
}

// ── Data gathering ────────────────────────────────────────────────────────────

function piVersion(): string {
	try {
		const require = createRequire(import.meta.url);
		const pkg = require("@earendil-works/pi-coding-agent/package.json");
		return typeof pkg?.version === "string" ? `v${pkg.version}` : "";
	} catch {
		return "";
	}
}

function greetingName(): string {
	const raw =
		process.env.USER ||
		process.env.LOGNAME ||
		(() => {
			try {
				return os.userInfo().username;
			} catch {
				return "";
			}
		})();
	if (!raw) return "there";
	return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function prettyCwd(cwd: string): string {
	const home = os.homedir();
	return cwd === home
		? "~"
		: cwd.startsWith(home + path.sep)
			? `~${cwd.slice(home.length)}`
			: cwd;
}

interface HeaderData {
	version: string;
	name: string;
	model: string;
	effort: string;
	provider: string;
	cwd: string;
}

function gather(pi: ExtensionAPI, ctx: ExtensionContext): HeaderData {
	const model = ctx.model;
	const effort = pi.getThinkingLevel();
	// provider is embedded in the model id as "provider/model" in pi's registry
	const rawId = model?.id ?? "";
	const provider = rawId.includes("/") ? rawId.split("/")[0] : "";
	return {
		version: piVersion(),
		name: greetingName(),
		model: model?.name ?? rawId ?? "no model",
		effort: effort ?? "",
		provider,
		cwd: prettyCwd(ctx.cwd),
	};
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function leftColumn(theme: Theme, d: HeaderData, w: number): string[] {
	const line = (s: string) => center(s, w);
	const subtitle = d.effort
		? `${d.model} with ${d.effort} effort`
		: d.model;
	const meta: string[] = [subtitle];
	if (d.provider) meta.push(d.provider);
	meta.push(d.cwd);

	return [
		"",
		line(theme.bold(`Welcome back ${d.name}!`)),
		"",
		...MASCOT.map((m) => line(theme.fg("accent", m))),
		"",
		...meta.map((m) => line(theme.fg("dim", m))),
	];
}

function rightColumn(theme: Theme, w: number): string[] {
	const section = (s: { title: string; lines: string[] }) => [
		theme.bold(theme.fg("accent", s.title)),
		...s.lines.map((l) => theme.fg("dim", l)),
	];
	return [...section(TIPS), "", ...section(WHATS_NEW)];
}

function renderHeader(theme: Theme, d: HeaderData, viewport: number): string[] {
	const width = Math.min(viewport, MAX_WIDTH);
	// │ <L> │ <R> │  →  2 + L + 3 + R + 2 = width
	const L = Math.min(LEFT_WIDTH, Math.max(10, width - 20));
	const R = Math.max(1, width - 7 - L);

	const border = (s: string) => theme.fg("border", s);
	const div = border("│");

	const left = leftColumn(theme, d, L);
	const right = rightColumn(theme, R);
	const rows = Math.max(left.length, right.length);

	// Top border with the title tucked into the corner
	const title = ` ${theme.bold(theme.fg("accent", APP_NAME))}${
		d.version ? theme.fg("dim", ` ${d.version}`) : ""
	} `;
	const titleFill = Math.max(0, width - 2 - 1 - vwidth(title) - 1);
	const top =
		border("╭─") + title + border("─".repeat(titleFill)) + border("╮");
	const bottom = border("╰" + "─".repeat(width - 2) + "╯");

	const body: string[] = [];
	for (let i = 0; i < rows; i++) {
		const l = padRight(left[i] ?? "", L);
		const r = padRight(right[i] ?? "", R);
		body.push(`${div} ${l} ${div} ${r} ${div}`);
	}

	return [top, ...body, bottom];
}

// A minimal Component that redraws the header on each render.
function makeHeaderComponent(theme: Theme, d: HeaderData): HeaderComponent {
	return {
		render: (width: number) => renderHeader(theme, d, width),
		invalidate: () => {},
	};
}

// ── Extension entry ────────────────────────────────────────────────────────────

export default function piHeaderExtension(pi: ExtensionAPI): void {
	pi.on("session_start", (event, ctx) => {
		if (ctx.mode !== "tui") return;
		// Redraw on real startup and /clear (reason "new"); skip reload/resume/fork.
		if (event.reason !== "startup" && event.reason !== "new") return;

		const data = gather(pi, ctx);
		ctx.ui.setHeader((_tui, theme) => makeHeaderComponent(theme, data));
	});
}
