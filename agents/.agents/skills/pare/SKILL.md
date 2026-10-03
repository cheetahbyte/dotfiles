---
name: pare
description: "Simplify existing code without changing behavior. Remove unnecessary complexity, indirection, dead weight, and noise while preserving architecture and intent."
disable-model-invocation: true
---

# Pare

Make code simpler without making it different.

Preserve behavior, architecture, and intent. Remove the parts that make the reader work harder than necessary. Simplicity means fewer concepts and clearer flow—not fewer lines.

## Inspect

Understand the target before touching it. Read every file you may change and follow the important dependencies far enough to know what the code relies on.

Look for:

* abstractions that add indirection without value
* unnecessary nesting or branching
* helpers that obscure simple operations
* overly generic solutions to concrete problems
* duplicated or redundant logic
* vague names
* comments that only repeat the code
* unused code, imports, TODOs, and debug leftovers
* clever expressions that would be clearer written plainly

A construct is not unnecessary just because it is small or used once. Keep it when it provides a useful boundary, communicates intent, or isolates real complexity.

If something looks unusual and you cannot explain why it exists, don't remove it. Investigate or ask.

## Diagnose

Before changing anything, summarize only worthwhile findings:

```text id="8jxg1u"
Found N opportunities across M files.

**Indirection** — `file:area`
This wrapper only forwards the operation and provides no additional semantics.

**Control flow** — `file:function`
The main path is buried beneath nested conditions. Guard clauses can express the same behavior more directly.
```

Every proposed change must have a reason. Finding nothing is acceptable.

Ask:

> Want me to apply these changes?

Skip this only when the user has already authorized implementation.

## Simplify

Once approved:

* preserve observable behavior exactly
* prefer straightforward code over clever code
* flatten control flow when it improves readability
* remove abstractions that provide no meaningful boundary
* keep abstractions that explain the domain or contain complexity
* remove noise and genuinely dead code
* choose names appropriate to their context
* keep comments that explain *why*, constraints, or non-obvious behavior

Do not redesign, add features, fix unrelated bugs, or optimize for line count.

When behavior preservation is uncertain, stop rather than guess.

## Flag Problems

If you discover a security, correctness, concurrency, or reliability issue, report it separately.

Pare is not permission to quietly change behavior under the label of cleanup.

## Verify

Run the project's relevant existing checks.

Confirm that the changes did not alter public APIs, errors, side effects, ordering, serialization, defaults, or concurrency behavior.

If something could not be verified, say so.

## Follow Through

Afterward, inspect directly connected callers, consumers, types, and tests.

Do not change them without permission. If they would benefit from the same treatment, identify them and ask whether to continue.

Skip this for explicitly targeted work.

## Report

Summarize the meaningful changes per file:

```text id="hd77i1"
## path/to/file
- Removed unnecessary forwarding layer.
- Flattened control flow while preserving behavior.
- Removed comments that duplicated the implementation.
```

Include verification results.

## Depth

**Deep** — Fresh or rapidly produced code. Challenge unnecessary structure aggressively.

**Light** — Mature code. Touch only clear wins.

**Targeted** — Stay within the requested area and do not expand scope.

## Rule

If a piece of code does not make the program work, make the design clearer, or protect an important constraint, it should have a very good reason to exist.
