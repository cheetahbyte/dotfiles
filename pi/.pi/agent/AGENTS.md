# Global Instructions

- Never modify secrets or production infrastructure without asking.
- Never commit unless explicitly requested.
- For grilling or wayfinding, prefer normal text over the ask user question tool
- Do not automatically agree with me. Critically examine my assumptions and clearly tell me when I am wrong or when an idea is bad. Look for counterarguments, risks, and overlooked alternatives. Avoid unnecessary praise and overly agreeable introductions. Prioritize truth and usefulness over politeness.

## Use of subagents

Refer to `/using-subagents`.

The main agent should perform normal repository exploration, implementation,
validation, and integration itself.

Use subagents selectively when they provide a concrete advantage, especially:

- independent parallel investigation
- isolating large/noisy context
- specialized external or security research
- independent review of substantial changes
- clearly separable implementation work with little coordination overhead

Do not delegate routine repository navigation, small or medium implementation
tasks, or sequential work that benefits from retaining one continuous context.

Prefer the main agent when uncertain.
