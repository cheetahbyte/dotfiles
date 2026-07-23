---
name: using-subagents
description: >
  Decision guide for delegating work to this project's custom pi subagents
  (implementer, reviewer, researcher, security-researcher) instead of doing
  it inline. Covers when to spawn which agent, and the frontmatter gotchas
  that silently break a custom agent (tool naming, skill loading, model
  resolution). Trigger: "use a subagent", "delegate", "spawn implementer/
  reviewer/researcher", or when a task clearly matches one agent's role.
---

Delegate to a custom agent when the task matches its role — don't do inline what a subagent does cheaper/cleaner, and don't spawn one for a two-line edit.

## Agent types

| Agent | Role | Tools | Use for | Don't use for |
|---|---|---|---|---|
| `implementer` | Writes + verifies code | read, grep, find, bash, edit, write | Well-scoped coding tasks that need edits and a test/lint pass | Ambiguous asks needing back-and-forth first |
| `reviewer` | Read-only diff/code reviewer | read, grep, find, bash, ls | Reviewing a diff or file for bugs/regressions | Style nits, or anything needing a fix applied |
| `researcher` | Web research | ext:pi-mcp-adapter/duckduckgo_search, ext:pi-mcp-adapter/duckduckgo_fetch_content | Questions needing current web info, docs lookup | Anything answerable from the repo itself |
| `security-researcher` | Security/vuln audit | read, grep, find, bash | Auditing auth, injection surfaces, crypto, supply chain | Routine code review (use `reviewer`) |

Spawn via the `Agent` tool with `subagent_type` set to the agent's filename (case-insensitive). Give each a self-contained prompt — these are `prompt_mode: replace`, so they get **no** AGENTS.md/CLAUDE.md inheritance and no memory of this conversation unless you say so explicitly.

## Frontmatter gotchas (found the hard way in this repo)

These break an agent silently — no error, just quietly-wrong behavior:

- **`tools:` plain names only match the 7 builtins** (`read grep find bash write edit ls`). Anything from an extension or MCP server needs `ext:<extension>/<toolname>` — and the tool name must be the *registered* name, not the MCP server's raw tool name. pi-mcp-adapter prefixes MCP direct tools with the server name by default (`toolPrefix: "server"`), so DuckDuckGo's raw `search`/`fetch_content` register as `duckduckgo_search`/`duckduckgo_fetch_content`. Check `mcp-cache.json` for raw names, then prefix by server name unless `mcp.json` sets `toolPrefix: none`.
- **Mentioning a skill in the prompt body does nothing.** Skills only load via the `skills:` frontmatter field (or `skills: true` to inherit the parent's set). If an agent's prompt says "use the X skill," it needs `skills: X` in frontmatter or it's talking to nobody.
- **`model:` pins fail silently to inherit-parent** if the provider/model isn't in the registry (`models-store.json`) — no error, just quietly runs on whatever model the parent was using. Worth a glance at `models-store.json` when an agent's behavior doesn't match its supposed model.

When authoring or editing a custom agent `.md`, verify tool names against the actual extension/MCP source (or `mcp-cache.json`) rather than trusting what "looks right" — plain names and skill mentions both fail without erroring.
