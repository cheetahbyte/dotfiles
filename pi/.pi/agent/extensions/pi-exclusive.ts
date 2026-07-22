import type {
	ExtensionAPI,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";

// Runs pi in the terminal's alternate screen buffer, like Claude Code.
//
// By default pi draws into the normal scrollback, so the shell prompt and the
// `pi` command you typed stay visible above the UI. Switching to the alternate
// screen (DECSET 1049) gives pi an exclusive, full-screen surface: the prior
// terminal contents are hidden while pi runs and restored verbatim on exit.
//
// pi has already called tui.start() and drawn into the normal buffer by the
// time extensions load, so after switching buffers we must invalidate the
// renderer's cached lines and force a full redraw onto the fresh alt buffer —
// otherwise differential rendering thinks everything is already on screen and
// leaves it blank.

const ALT_ON = "\x1b[?1049h\x1b[H\x1b[2J"; // enter alt buffer, home, clear
const ALT_OFF = "\x1b[?1049l"; // leave alt buffer, restore prior contents

// The bits of TUI we use to repaint after switching buffers.
interface TuiLike {
	invalidate(): void;
	requestRender(force?: boolean): void;
}

export default function piExclusiveExtension(pi: ExtensionAPI): void {
	let entered = false;

	const restore = (): void => {
		if (!entered) return;
		entered = false;
		process.stdout.write(ALT_OFF);
	};

	const enter = (tui: TuiLike): void => {
		if (entered) return;
		entered = true;
		process.stdout.write(ALT_ON);
		// Ensure we drop back to the normal buffer even on a hard exit/crash.
		process.once("exit", restore);
		// Repaint the whole UI onto the now-blank alternate buffer.
		tui.invalidate();
		tui.requestRender(true);
	};

	pi.on("session_start", (_event, ctx: ExtensionContext) => {
		if (ctx.mode !== "tui" || entered) return;
		// The only handle to the live TUI is via a widget factory; register a
		// zero-line anchor purely to capture it, then switch buffers.
		ctx.ui.setWidget(
			"exclusive-anchor",
			(tui) => {
				enter(tui as unknown as TuiLike);
				return { render: () => [], invalidate: () => {} };
			},
			{ placement: "aboveEditor" },
		);
	});

	// Leave the alt buffer only on a real quit. On reload/new/resume/fork the
	// runtime re-inits and re-enters, so staying in alt avoids a flicker.
	pi.on("session_shutdown", (event) => {
		if (event.reason === "quit") restore();
	});
}
