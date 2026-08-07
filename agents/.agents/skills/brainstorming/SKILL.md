---
name: brainstorming
description: "Use before substantial creative or feature work that requires design. Explores the existing project, delegates unresolved user-owned decisions to Grill Me, evaluates implementation approaches, and produces an approved technical design before planning."
---

# Brainstorming Ideas Into Designs

Turn feature ideas into implementable technical designs without duplicating requirements elicitation.

**Brainstorming owns:** exploring the existing system, separating facts from decisions, delegating user-owned decisions to Grill Me, evaluating technical approaches, writing and reviewing the design, and handing off to planning.

**Grill Me owns:** interviewing the user, building the decision tree, resolving user-owned product/behavior decisions, and reaching shared understanding with the user.

Do not duplicate Grill Me's work, and never re-ask a question it already resolved.

## Core Principle

Separate three kinds of uncertainty:

1. **Environmental facts** — investigate yourself (e.g. "how are users stored?").
2. **User-owned decisions** — delegate to Grill Me (e.g. "can a user belong to multiple teams?").
3. **Technical design decisions** — resolve during brainstorming (e.g. "should membership use a join table?").

Never ask the user something discoverable from the environment. Never silently decide something that materially changes product behavior.

## Scope Gate

Skip the full workflow for small/local/low-risk changes: clear behavior, no unresolved product decisions, no architecture change, safe within existing patterns (renames, timeout tweaks, obvious bug fixes, straightforward validation). Exit brainstorming and continue with the appropriate implementation workflow.

Use the full workflow when the request touches product behavior, data models, permissions, workflows, public interfaces, multiple components, architectural boundaries, migrations, or externally observable semantics. When uncertain, inspect the project before deciding.

## Workflow

1. **Explore the project** — source, architecture, tests, docs, schemas, APIs, recent commits. Understand existing conventions before proposing changes. Don't propose greenfield architecture for an existing codebase; don't introduce unrelated refactors.
2. **Assess scope** — what's known, discoverable, user-owned, or a technical choice. If the request bundles multiple independent subsystems (e.g. "chat, billing, analytics, file storage"), split into coherent units and design one at a time.
3. **Delegate to Grill Me** if user-owned decisions remain (behavior, workflow semantics, permissions, constraints, UX, compatibility, business rules, scope, success criteria). Hand it the facts already discovered. Once it returns, treat its resolved decisions, constraints, and explicitly excluded alternatives as the requirements input to the technical design — don't re-litigate them, even if a different technical approach would be easier. If later investigation exposes a genuinely new user-owned decision — for example a material constraint, incompatibility, or cost Grill Me couldn't have known about — send only that branch back to Grill Me.
4. **Reconcile requirements with the existing system** — check for conflicts with current behavior, migrations, backwards compatibility, security, affected interfaces/components/tests. Resolve factual conflicts yourself; send newly exposed product decisions back to Grill Me.
5. **Evaluate technical approaches** — only compare alternatives when there's a real trade-off; don't manufacture three options when one is clearly superior. Weigh simplicity, consistency with existing architecture, coupling, maintainability, migration cost, performance, security, testability, reversibility. Lead with a recommendation. Apply YAGNI: no abstractions, services, or extensibility without demonstrated need. Prefer extending existing patterns over parallel systems, but don't preserve a bad abstraction that blocks a sound implementation.
6. **Present the technical design**, sized to the change's complexity — architecture, component boundaries, data model, interfaces, data flow, authorization, migrations, error handling, testing. Explain *how* the agreed behavior will be implemented, not *what* the user wants. Resolve any material objections before writing the design doc — the formal approval gate is step 9.
7. **Write the design doc** to `brainstorming/specs/YYYY-MM-DD-<topic>-design.md` (or the project's convention): context, agreed requirements, discovered facts, chosen approach, architecture/data/interface changes, migrations, error behavior, testing strategy, explicitly excluded scope. Record outcomes, not the interview transcript. Apply `writing-for-agents` while drafting it — the doc is a source of truth an agent consumes in step 10, not just a record for the user.
8. **Self-review** the doc for TBDs/placeholders/missing failure cases, internal consistency (requirements ↔ architecture ↔ APIs ↔ tests), scope creep (split if it no longer fits one implementation cycle), and ambiguity ("could two competent engineers build materially different things from this?"). Fix issues inline; route newly discovered product decisions to Grill Me.
9. **Get user approval** of the finished doc. Update it for technical changes; treat changed product decisions as deliberate requirement changes. Don't restart Grill Me unless new user decisions are exposed.
10. **Hand off to `writing-plans`** once approved — it consumes the design doc as its source of truth. Small/local/low-risk changes excluded by the Scope Gate skip this gate entirely.

See `reference.md` for a full worked example ("add teams to my application").
