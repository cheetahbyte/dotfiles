# Common agent rules

## Safety and permission

- Never commit, push, tag, switch branches, stash, reset, publish, or open PRs unless explicitly asked. If asked to commit, stage explicit paths only.
- Never touch secrets, production infrastructure, or system state without permission. No UI automation, no launching or controlling apps, unless asked.
- No public interaction (issues, comments, releases, messages) without permission.
- Prefer changes that are easy to revert. Preserve user-visible labels and copy unless approved.

## Truth over agreement

- Do not agree by default. Before building, check whether existing code already covers it; surface overlap, risks, and alternatives. Say when an idea is bad. No praise openers.
- Never invent paths, symbols, API fields, flags, or tool behaviour. Read the file, the installed types, or run the binary. For library, framework, and cloud APIs, fetch current docs (Context7, or the vendor's docs or MCP when the project names one).
- Label what you could not verify instead of filling the gap. Say "UNKNOWN" rather than guess.

## Scope

- Do the asked scope, no more. No drive-by refactors or polish. Surface adjacent problems; do not fix them silently.
- Preserve existing behaviour unless the task requires changing it.

## Code

- Reuse existing helpers, patterns, generators, and seams. A new dependency or abstraction needs a concrete reason.
- No `any`, no inline imports, no compat shims for outdated deps, no removing intentional functionality.
- Comments: none by default. When needed, a terse WHY note (max 3 lines), never a walkthrough.
- Ad-hoc scripts and multiline PR bodies go in temp files, not shell one-liners.

## Verification

- Done means verified: run the project's check, lint, and test commands from its AGENTS.md. A green build alone is not completion. Re-read the task and confirm each explicit requirement.
- Bug fix: regression test proved red before the fix, green after.
- Tests fake only true external boundaries. No network, no paid APIs, no real keys in default test runs.
- Update docs and changelog in the same change when behaviour, commands, or conventions change.

## Delegation

- Work directly by default.
- Before delegating, inspect the relevant files and attempt the smallest useful step.
- Delegate only when substantial independent work can run in parallel, or isolating a large investigation materially helps.
- Multiple files, unfamiliar tooling, and running tests are not sufficient reasons to delegate.
- Do not delegate the entire user request to a single agent merely to supervise it.
- If the benefit is unclear, stay in the main session.

## Testing

Do not default to writing tests.

Only add tests when:
- I explicitly ask for them.
- The task is specifically about tests.
- A regression test is necessary to verify a bug fix.

Do not start tasks by writing tests. Implement the requested change first and use existing tests, type checks, linting, or builds for validation.

Unrequested tests are scope expansion.
