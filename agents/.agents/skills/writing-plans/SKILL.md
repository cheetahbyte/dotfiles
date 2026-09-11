---
name: writing-plans
description: Write an implementation plan that a fresh agent or a later session can execute without the current context. Use when the user asks for a plan, a handoff, or tasks for subagents, and a spec or agreed design already exists. Not for work you will implement yourself in this session.
---

# Writing Plans

The reader has zero context and questionable taste. Every task must carry what it needs: exact files, code, the test, the command to run, the expected result.

Save to `brainstorming/plans/YYYY-MM-DD-<feature-name>.md` or the project's convention. Get the date from `date +%F`.

## Plan header

```markdown
# [Feature] Implementation Plan

> Implement one task at a time. Review each deliverable before starting the next. Steps use `- [ ]`.

**Goal:** one sentence.
**Architecture:** two or three sentences.
**Tech stack:** key libraries.

## Global constraints
Version floors, dependency limits, naming rules, copied verbatim from the spec. Every task inherits them.
```

## File map

Before the tasks, list every file created or modified and its single responsibility. Follow the existing codebase's structure; do not restructure unasked.

## Tasks

A task is the smallest unit with its own test cycle that a reviewer could reject on its own. Fold setup, config, and docs into the task that needs them.

Each task lists **Files** (create, modify with line range, test), **Interfaces** (what it consumes from earlier tasks and produces for later ones, with exact signatures), then steps of one action each:

1. Write the failing test (full code).
2. Run it; state the exact command and the expected failure.
3. Write the minimal implementation (full code).
4. Run it; expected pass.
5. Commit, with the command.

## Never write

- "TBD", "TODO", "implement later", "fill in details"
- "add appropriate error handling", "add validation", "handle edge cases"
- "write tests for the above" without the test code
- "similar to Task N": repeat the code, the reader may not have Task N
- prose describing what to do without the code that does it
- a type, function, or method not defined in any task

## Self-review

Run this yourself after the plan is written, then fix inline:

1. Every spec requirement maps to a task. Add tasks for gaps.
2. Search the plan for the patterns in "Never write".
3. Names and signatures in later tasks match earlier tasks exactly.
