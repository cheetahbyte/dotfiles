// trs plugin: route commands through trs for token-optimized output
import { createBashTool } from "@earendil-works/pi-coding-agent";

export default function (pi) {
  const bash = createBashTool(process.cwd(), {
    spawnHook: ({ command, cwd, env }) => {
      // Idempotent: skip anything already routed through trs (or a cd).
      const skip =
        typeof command !== "string" ||
        command.startsWith("trs ") ||
        command.startsWith("cd ") ||
        command.startsWith("TRS_AGENT=");
      return {
        command: skip ? command : `trs ${command}`,
        cwd,
        env: { ...env, TRS_AGENT: "pi" },
      };
    },
  });
  pi.registerTool({ ...bash });
}
