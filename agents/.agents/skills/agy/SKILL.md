---
name: agy
description: Delegate research, code review, or collaborative sparring to Agy CLI. Use only when the user explicitly says "/agy", "ask agy", "delegate to agy", "have agy look into", "agy review", "spar with agy", "go back and forth with agy", or "use agy to pressure-test". Never invoke based only on task complexity or the potential value of a second opinion.
---

# Delegate to Agy

Use Agy as a read-only peer. The parent agent owns the final answer and verifies important claims. Never send secrets or credentials.

## Route

- **Research:** One fast lookup or investigation. Use `--effort low`.
- **Review:** Deep review of named files, a diff, or the repository. Use `--effort high`.
- **Spar:** Multi-turn pressure-testing until agreement or a clearly stated disagreement. Use `--effort high`.

Use Agy's configured default model unless the user requests a model.

## Start

Run from the relevant project directory:

```bash
agy --sandbox --dangerously-skip-permissions --effort <low|high> --output-format json --print '<self-contained prompt>'
```

Give Agy the question, relevant context, exact files or diff, constraints, and requested output. Ask it to investigate rather than assume. Read the returned `response`; retain `conversation_id` only for sparring.

Prompt by mode:

- **Research:** Request concise findings, evidence, uncertainty, and source URLs.
- **Review:** Tell Agy not to edit. Request only actionable correctness, security, performance, and regression findings, each with location, impact, and minimal fix.
- **Spar:** State the problem, the parent agent's current position, and uncertainties. Ask Agy to challenge the strongest weak point, resist deference, and concede only to better arguments.

## Spar

Continue the same conversation:

```bash
agy --sandbox --conversation '<conversation_id>' --effort high --output-format json --print '<reply or follow-up>'
```

Each round must address the strongest remaining disagreement. Stop when agreement is genuine, the surviving disagreement is precise, or another round would repeat the same point. If the exchange fails, synthesize the completed rounds rather than discarding them.

Return a joint conclusion, not a transcript. State unresolved disagreement honestly. Verify repository claims against the code and factual claims against primary sources before presenting them.
