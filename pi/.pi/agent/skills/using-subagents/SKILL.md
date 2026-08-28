---
name: using-subagents
description: >
  Guide for selectively delegating work to Explore, Implementer, Reviewer,
  Researcher, SecurityResearcher, and SpecReview when delegation provides
  a concrete advantage.
---

The main agent owns the task and should normally perform exploration,
implementation, validation, and integration itself.

Subagents are an optimization, not the default workflow.

## When to delegate

Delegate when at least one of these applies:

- work can run independently in parallel
- the task would introduce substantial noisy context into the main session
- an independent second opinion is valuable
- the work needs specialized instructions or tools
- a large task has cleanly separable work packages with stable interfaces

Do not delegate merely because an agent role matches the task.

Avoid delegation when:

- the task is small or medium-sized
- exploration directly informs implementation
- work is sequential or tightly coupled
- agents would need overlapping repository context
- coordination costs more than doing the work directly

## Agents

| Agent | Best use |
|---|---|
| `Explore` | Independent or broad repository investigation when isolating discovery is useful |
| `Implementer` | Independent, well-isolated implementation work that can run concurrently or outside the main context |
| `Reviewer` | Independent review of substantial completed changes |
| `Researcher` | External/current information requiring significant research |
| `SecurityResearcher` | Focused security investigation |
| `SpecReview` | Independent review of a specification or plan |

## Default behavior

For normal coding tasks:

    Main agent: explore → implement → validate

Do not automatically use:

    Explore → Implementer → Reviewer

Instead add subagents only where they improve the task.

Examples:

### Good

Main agent implements a feature while Explore independently traces an
unfamiliar subsystem.

Two Implementers work concurrently on independent packages.

Main agent completes a substantial change, then Reviewer performs an
independent regression review.

Researcher investigates external API behavior while the main agent works
against the repository.

### Bad

Spawn Explore to locate two files the main agent could find immediately.

Hand a normal feature to Implementer after the main agent already understands it.

Run Reviewer after every small change.

Split sequential backend/frontend work when each step depends heavily on the
previous one.

## Dispatch

Agents use `prompt_mode: replace`, so prompts must contain the context required
for their isolated task.

Give agents:

- concrete objective
- relevant files/symbols when known
- boundaries
- necessary interfaces or assumptions
- expected validation/output

Do not pass full conversation history or unrelated plans.

## Parallel implementation

Split implementation only when work packages are genuinely independent.

Do not run agents concurrently when they:

- edit overlapping files
- depend on unfinished interfaces
- require frequent coordination

The main agent integrates all results.

## Review

Use Reviewer when independence provides meaningful value, especially for:

- large changes
- risky refactors
- subtle correctness concerns
- changes spanning multiple subsystems

Reviewers should report material correctness, regression, security, and
validation issues rather than style-only feedback.

## Principle

Delegation should reduce latency, context pollution, or reasoning risk.

If it does none of those, keep the work in the main agent.
