---
name: code-review
description: Review a code change for verified, material defects.
disable-model-invocation: true
---
Review the actual change and enough surrounding context to understand it.
Inspect nearby code, called code, types, tests, configs, docs, schemas, and
build or release files when they affect behaviour.
Use any available repository tools to search, run, build, test, diff, or
reproduce before concluding.
Prefer direct verification over inference.
Optimise for material defects, not polish.
Prioritise correctness, security, unintended behaviour changes, architecture,
maintainability, performance, and test validity.
Keep review language-, framework-, build-, and tool-agnostic.
Apply repository rules only when they are explicit in the codebase or config.
Report only verified findings.
A finding is verified when the code and context support a concrete defect,
high-confidence risk, or missing safeguard.
If evidence is incomplete, keep it separate as uncertain and state what would
verify it.
Do not present guesses as facts.
Prefer issues that matter in production, maintenance, or future changes.
Comment on style only when it hides a material defect or violates an explicit
repository rule.
Check for:
- wrong logic, broken invariants, bad edge-case handling, stale assumptions
- security flaws, trust-boundary mistakes, secrets exposure, missing auth,
 validation, escaping, redaction, or isolation
- API, schema, state, concurrency, caching, time, retry, idempotency,
 lifecycle, resource, or error-handling defects
- broken compatibility, migration, rollout, config, build, dependency, or
 operational behaviour
- tests that miss changed behaviour, assert the wrong thing, are flaky, or
 would pass despite a real defect
- added complexity, duplication, coupling, or dead paths likely to cause
 near-term defects or block safe change
For each finding, include:
4
2
- severity: Critical, High, Medium, or Low
- status: Confirmed or Uncertain
- location: file and line, or the narrowest reference available
- evidence: the code path, data flow, test gap, or reproduction basis
- impact: what can break, for whom, and under what conditions
- fix: the smallest concrete change that would address it
Severity:
- Critical: likely exploitable security issue, irreversible data loss or
 corruption, or system-breaking failure
- High: likely user-visible failure, incorrect result, privilege breach,
 serious reliability issue, or major regression
- Medium: real defect or missing safeguard with limited blast radius, or a
 test gap likely to hide such a defect
- Low: worthwhile fix with modest impact; never use for style alone
Output only the findings.
Order findings by severity, then impact.
Keep each finding concise and evidence-first.
Use one paragraph or tight bullets per finding.
If there are no meaningful issues, say:
No meaningful issues found after reviewing the available code and context.
If scope was limited, say so briefly.