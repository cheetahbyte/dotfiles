---
name: writing-plans
description: Write an implementation plan that a fresh agent or a later session can execute without the current context, or execute a task from one. Use when the user explicitly asks for a plan, a handoff, or tasks for subagents and a spec or agreed design already exists, or points you at a plan file to implement. Not when the user says to skip planning.
metadata:
  category: engineering
---

# Writing Plans

The reader is a capable engineer with zero context: no chat history, no spec in their head, questionable taste. They write idiomatic code once they know the interface and the test. What they cannot know is what was decided. A plan is the set of decisions the implementer cannot make alone, and nothing more.

When you are handed a plan to implement, skip to [Executing a plan](#executing-a-plan).

## 1. Draft first

Write the whole plan now, from what you already know, before any further research. Mark every fact you have not verified as `UNKNOWN: <question>` (a file path, a signature, a command, a library API). A draft with markers beats a perfect plan that never arrives.

Save it where the project keeps plans (look for an existing `docs/plans/` or similar); otherwise `docs/plans/YYYY-MM-DD-<feature>.md`. Get the date from `date +%F`. Tell the user the draft exists and how many markers it has.

Done when: the file exists with every section below filled or marked.

## 2. Resolve the markers

Take the markers one at a time. For each, run one targeted lookup (one `rg`, one file read, one `--help`), replace the marker with the verified fact and its source (`path:line`), and move on. Read a file whole when you need most of it; don't page through it in slices.

A marker that one lookup cannot settle is a question for the user, not a research project. Collect those and ask them together.

Done when: no `UNKNOWN` remains, and every name the plan uses either exists in the codebase (with its location) or is created by a task.

## 3. Self-review

Run this yourself, fix inline, and don't re-review:

1. **Coverage:** every requirement and every decision maps to a task.
2. **Step scan:** each step lets the implementer write exactly one reasonable thing. A line that decides nothing is a gap; a function body that the signature and tests already determine is a transcript. Fix both.
3. **Consistency:** names and signatures in later tasks match the Interfaces blocks of earlier ones exactly.
4. **Proportion:** a plan longer than the code it describes has written the code instead. Replace bodies with signatures, test names, and assertions.

## 4. Hand off

Link the plan and ask the user to review it. If tasks depend heavily on each other's interfaces, recommend one implementer for the whole plan; if they are independent, recommend one fresh agent per task with a review between tasks. Give the reason in one sentence.

## Plan template

````markdown
# <Feature> implementation plan

> Implement one task at a time. Review each deliverable before starting the next. Steps use `- [ ]`.

**Goal:** one sentence.
**Architecture:** two or three sentences.
**Source:** the spec, issue, or design doc this plan implements, if one exists.

## Decisions

Every choice settled in conversation, one line each, with the reason. The implementer never saw the conversation; this section is their only copy of it.

## Constraints

Project-wide rules every task inherits: version floors, dependency limits, naming and copy rules, the check command. Exact values, copied verbatim.

## Out of scope

What a reasonable implementer might add but must not.

## Review focus

Up to five inputs or failure modes the requirements imply but no test exercises yet, most likely first, each with the behavior a user would expect. Add a test for each to the task that owns the code. Write "None found" when you checked and found none.

## Files

Every file created or modified, with its single responsibility. Follow the existing structure; don't restructure unasked.

### Task N: <deliverable>

**Files:** create `path`, modify `path:lines`, test `path`.
**Interfaces:**
- Consumes: exact signatures from earlier tasks or existing code (`path:line`).
- Produces: exact signatures later tasks rely on.

- [ ] Write the failing test `<name>`: its assertions as code, with the exact values.
- [ ] Run `<command>`. Expected: fails with `<message>`.
- [ ] Implement `<signature>` in `<path>`. One line on the approach when the signature and test leave a choice; a code block only for an algorithm they don't determine or exact copy the requirements fix.
- [ ] Run `<command>`. Expected: passes.
- [ ] Checkpoint: the files to stage and the commit message. Commit only if the user has approved commits.
````

## Tasks and steps

A task is the smallest unit with its own test cycle that a reviewer could reject on its own. Fold setup, configuration, migrations, and docs into the task whose deliverable needs them. If the project's instructions limit when tests are written, follow them and end the task on a verification command with its expected output instead.

A step is one action with a checkable result. A reference to another task points at its Interfaces block; never "similar to Task N".

Lines that decide nothing don't belong in a plan: "TBD", "handle edge cases", "add appropriate validation", "write tests for the above", or a name no task defines and the codebase doesn't contain.

## Executing a plan

1. Read the whole plan, then the Decisions, Constraints, and Out of scope sections again before touching code. They bind every task.
2. Implement only the task you were given (or the next unchecked one). Follow its steps in order and tick each `- [ ]` as its result is checked.
3. When the plan is wrong (a path, signature, or command does not match the codebase), stop and report the mismatch instead of improvising a new decision.
4. Run the task's verification command and the project's check command. Report what passed, what failed, and what was not run.

Done when: every step of the task is ticked or reported as blocked, and nothing outside the task's Files list changed.
