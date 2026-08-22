---
name: using-subagents
description: >
  Guide for delegating work to this project's custom pi subagents:
  explore, implementer, reviewer, researcher, and security-researcher, specreview.
  Trigger when a task clearly matches one of these roles.
---

Delegate when subagents can handle the work more cleanly or cheaply. Do not spawn one for trivial edits.

The parent agent owns planning, decomposition, coordination, and final integration. Do not give an entire multi-part plan to one general-purpose Implementer.

## Agents

| Agent | Use for | Don't use for |
|---|---|---|
| `Explore` | Locating files, symbols, references, configuration, patterns, and data flow | Editing, builds, or broad reviews |
| `Implementer` | One focused, well-scoped change with known target files and targeted verification | Broad repository exploration or executing an entire multi-part plan |
| `Reviewer` | Reviewing completed changes for bugs and regressions | Style-only feedback, applying fixes, or design docs that describe unwritten code |
| `Researcher` | Current public information and external documentation | Questions answerable from the repository |
| `SecurityResearcher` | Auth, injection, crypto, secrets, permissions, and supply-chain risks | Routine code review |

Spawn through the `Agent` tool with `subagent_type` matching the agent filename.

Agents use `prompt_mode: replace`, so every prompt must include all required context.

## Default flow

Use:

- `Implementer` when the target files and required change are already clear
- `Explore → Implementer` when repository discovery is needed
- `Implementer → Reviewer` for meaningful completed changes
- `Explore → focused Implementers → Reviewer` for multi-part work
- `Researcher` for current external information
- `SecurityResearcher` for security-sensitive work

Do not assign discovery, implementation, testing, cleanup, and review to one subagent.

## Split implementation work

When a task contains independent or weakly coupled changes, split it into multiple focused Implementers.

Each Implementer should receive:

- one concrete responsibility
- a small set of target files
- explicit boundaries
- the relevant part of the plan
- one focused validation command

Good split:

- Implementer A: backend API change
- Implementer B: frontend integration
- Implementer C: tests or migration

Bad split:

- one Implementer receives the full backend, frontend, tests, documentation, and cleanup plan

Run Implementers in parallel only when they will not edit overlapping files or depend on unfinished work. Otherwise run them sequentially and pass only the relevant result forward.

Use one final Reviewer for the combined result.

## Explore handoff

Ask Explore for a concise implementation brief containing:

- relevant files and symbols
- current data or control flow
- existing patterns to follow
- concrete implementation steps
- possible work-package boundaries
- likely validation commands
- unresolved uncertainties

Do not pass the full exploration transcript to Implementers.

## Implementer dispatch requirements

Do not dispatch an Implementer until the parent knows all of the following:

- one concrete outcome
- exact target files
- relevant symbols or interfaces
- required changes
- an existing pattern to follow, when applicable
- explicit boundaries and non-goals
- one exact validation command
- dependencies on earlier work packages

If these details are not known, dispatch Explore first.

Use this structure for every Implementer prompt:

```text
Task:
- One concrete outcome.

Target files:
- Exact files expected to change.

Relevant symbols:
- Functions, types, routes, commands, or interfaces involved.

Required changes:
1. ...
2. ...

Existing pattern:
- File and symbol demonstrating the intended approach.

Boundaries:
- Files or components that must not change.
- Work assigned to other Implementers.

Validation:
- One exact command to run.

Dependencies:
- Relevant results or interfaces from earlier tasks.
```

Do not send vague prompts such as “implement this part of the plan” or “explore as needed.”

## Implementer handoff

Give each Implementer only:

* the requirement relevant to its work package
* the relevant part of the Explore brief
* exact target files and symbols
* explicit non-goals
* expected validation
* relevant interfaces from prerequisite tasks

Instruct it to:

* avoid broad repository rediscovery
* begin from the supplied files
* read only direct dependencies when necessary
* make the smallest coherent change
* batch related edits
* run targeted verification
* stop and report if the brief is materially wrong
* not take over unrelated parts of the plan

Do not paste the full plan, previous subagent transcripts, or accumulated task history into later dispatches.

## Reviewer handoff

Give Reviewer the requirement, combined diff, implementation summary, and validation already performed.

Ask it to report only material findings:

* correctness issues
* regressions
* broken edge cases
* security problems
* missing validation

Send findings back as focused fix tasks. Do not ask one Implementer to redo or re-explore the entire change.

## Avoid duplicate work

Do not:

* let Explore and Implementers repeat the same discovery
* pass full subagent transcripts between agents
* give one Implementer the whole project plan
* dispatch an Implementer with missing files, symbols, boundaries, or validation
* spawn multiple agents that edit the same files concurrently
* ask Reviewer to recreate the implementation process
* run broad test suites when targeted checks are sufficient
* delegate work whose coordination overhead exceeds the task itself

Delegation should reduce context and duplicated work, not increase it.
