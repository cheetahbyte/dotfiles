import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  let systemPrompt = "";

  // Capture the final system prompt used for the agent run
  pi.on("before_agent_start", async (event) => {
    systemPrompt = event.systemPrompt;
  });

  pi.registerCommand("context-debug", {
    description: "Show approximate context cost",

    handler: async (_args, ctx) => {
      // ── System prompt ──────────────────────────────────────
      const systemChars = systemPrompt.length;
      const systemTokens = Math.ceil(systemChars / 4);

      // ── Tool schemas ───────────────────────────────────────
      const rows = pi
        .getAllTools()
        .map((tool) => {
          const text = JSON.stringify({
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          });

          return {
            name: tool.name,
            chars: text.length,
            tokens: Math.ceil(text.length / 4),
          };
        })
        .sort((a, b) => b.tokens - a.tokens);

      const toolTokens = rows.reduce((sum, row) => sum + row.tokens, 0);
      const toolChars = rows.reduce((sum, row) => sum + row.chars, 0);

      // ── Total ──────────────────────────────────────────────
      const totalTokens = systemTokens + toolTokens;

      const output = [
        "Context breakdown",
        "=================",
        "",
        `System prompt   ~${systemTokens.toLocaleString()} tok  (${systemChars.toLocaleString()} chars)`,
        `Tool schemas    ~${toolTokens.toLocaleString()} tok  (${toolChars.toLocaleString()} chars)`,
        "                 ─────────",
        `Total           ~${totalTokens.toLocaleString()} tok`,
        "",
        "",
        "Tool schemas",
        "============",
        "",
        ...rows.map(
          (row) =>
            `${row.tokens.toString().padStart(6)} tok  ${row.name}`,
        ),
        "",
        "",
        "System prompt",
        "=============",
        "",
        systemPrompt || "(not captured yet — send a message first)",
      ].join("\n");

      await ctx.ui.editor("Context Debug", output);
    },
  });
}
