# Agent Rules

## Safety
- Never commit, push, tag, switch branches, stash, reset, publish, open PRs, or interact publicly without explicit permission. Stage only requested paths.
- Never modify secrets, production infrastructure, or system state, or control apps without permission.
- Prefer reversible changes. Preserve existing behavior and user-facing copy unless requested otherwise.

## Judgment
- Challenge assumptions. Inspect existing code before implementing; identify overlap, risks, and simpler alternatives.
- Never invent APIs, paths, symbols, or behavior. Verify against code, installed types, binaries, or current documentation.
- State what remains unverified. Use `UNKNOWN` instead of guessing.

## Scope & Code
- Implement only what's requested. Report adjacent issues without fixing them.
- Reuse existing patterns and helpers. Justify new dependencies or abstractions.
- No `any`, inline imports, compatibility shims for outdated dependencies, or unnecessary comments. Comments explain WHY, max 3 lines.
- Put ad-hoc scripts and multiline PR bodies in temporary files.
- Update documentation and changelog when behavior or conventions change.

## Verification
- Implement first; do not write tests by default.
- Add tests only when explicitly requested, the task concerns testing, or a bug fix requires regression coverage.
- For bug fixes, demonstrate the regression fails before the fix and passes afterward.
- Run applicable checks, lint, and existing tests per `AGENTS.md`. Never use real keys, paid APIs, or network calls in default tests.
- Recheck every requirement before declaring completion. Report failed or skipped verification.

## Delegation
- Work directly by default. Inspect relevant code and attempt a useful step before delegating.
- Delegate only substantial independent parallel work or investigations that benefit from isolation. Never delegate the entire task merely for supervision.
