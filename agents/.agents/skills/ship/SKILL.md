---
name: ship
description: "Use when committing, pushing, or opening or updating a PR: commit messages, PR titles, and PR bodies."
metadata:
  category: collaboration
---

# Ship

Commit, push, and open or update a PR. Do only the steps the user asked for: "commit" is not permission to push, and "push" is not permission to open a PR.

## Before writing

- Inspect the actual diff: staged changes for a commit, the diff against the target branch for a PR.
- Read surrounding code when necessary.
- Follow repository conventions and `GLOSSARY.md` if available.
- Describe what was implemented, not merely what was requested.
- Never invent implementation details, tests, benchmarks, or results.
- Stage only the paths that belong to the change.

## Commit message

Follow the Conventional Commits specification:

```text
<type>(<scope>): <description>
```

Types:

- `feat`: new functionality
- `fix`: bug fix
- `perf`: performance improvement
- `refactor`: code restructuring without behavior changes
- `docs`: documentation
- `test`: tests
- `build`: build system or dependencies
- `ci`: CI/CD changes
- `chore`: maintenance

Rules:

- Use lowercase types and imperative descriptions.
- Keep the subject concise (preferably under 72 characters).
- Use a scope when it meaningfully identifies the affected subsystem.
- Use `!` for breaking changes and explain them in the commit body.
- Describe what changed, not the development process.
- Match existing repository conventions.
- Never claim a change is complete unless it is implemented.

## PR title

Use the commit message format. For a multi-commit PR, summarize the whole branch.

## PR body

When updating an existing PR, rewrite the title and body so they match the current branch, not only the latest commit.

~~~markdown
## Summary

<What changed? Use a visual if it improves clarity.>

## Why

<What problem motivated this change?>

## Evidence

<Verified before/after behavior, tests, benchmarks, or screenshots.>

## Risk & Rollback

**Reversibility:** <Reversible | Requires migration | Irreversible>

**Blast Radius:** <Affected components or consumers>

<Potential failure modes and rollback constraints.>
~~~

### Summary

Explain the change in 1–3 sentences.

Choose the smallest visual that makes the implementation clear:

- **Pseudocode:** Algorithms and behavior.
- **Call tree:** Execution flow.
- **Component tree:** UI structure and state ownership.
- **File tree:** Refactors and module boundaries.
- **Mermaid:** Component interactions and data flow.
- **Diff sketch:** Structural or behavioral changes.

Use multiple visuals only when they explain distinct aspects. Omit visuals when prose is clearer.

### Why

Explain the problem, limitation, or inefficiency motivating the change.

Focus on why the previous behavior was insufficient, not what the implementation does.

Omit this section when the motivation is already obvious from the summary.

### Evidence

Provide concrete verification, preferably:

1. Before/after screenshots for visual changes.
2. Failing-before/passing-after tests for bug fixes.
3. Benchmarks for performance changes.
4. Actual build, test, or execution results.

For benchmarks, include the workload, environment, baseline, and measured results.

Never fabricate evidence. If tests were not run, state `Not run` and explain why when known.

Do not confuse compilation, tests, benchmarks, and manual inspection.

### Risk & Rollback

**Reversibility:**
- `Reversible`: a code revert safely restores previous behavior.
- `Requires migration`: rollback requires additional steps.
- `Irreversible`: previous state cannot reliably be restored.

**Blast Radius:** Identify affected components, platforms, APIs, persisted data, or users.

Briefly explain plausible failure modes, compatibility concerns, and rollback constraints. Avoid speculative risks unrelated to the diff.

### Rules

- Put a multiline PR body in a temporary file and pass it with `--body-file`.
- Skip preambles and conclusions.
- Be technically precise and concise.
- Prefer concrete behavior over implementation trivia.
- Never present assumptions as verified facts.
- Avoid repeating information across sections.
- Scale detail to the complexity of the PR.
- Follow existing repository conventions.
