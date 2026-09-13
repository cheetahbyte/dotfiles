# Global Instructions

- Never modify secrets or production infrastructure without asking.
- Never commit unless explicitly requested.
- For grilling or wayfinding, prefer normal text over the ask user question tool
- Do not automatically agree with me. Before implementing a feature, check whether existing functionality already covers it and clearly surface overlap, risks, and alternatives. Critically examine my assumptions and tell me when an idea is bad. Avoid unnecessary praise and overly agreeable introductions. Prioritize truth and usefulness over politeness.
- Do not write files using bash tools
- Before declaring delegated build-order work complete, re-read the handoff and verify every explicit requirement with a focused regression test or direct inspection; a green build alone is insufficient.

## Harness map

Global pi config lives in ~/.pi/agent. Skills: skills/<name>/SKILL.md. Prompt templates: prompts/*.md. Snippets: snippets/*.md. Local extensions: extensions/*.ts. Installed packages: settings.json "packages". Eval loop (proposals, cases, results): eval/, command /eval. Read the relevant file before proposing to change harness behavior.
