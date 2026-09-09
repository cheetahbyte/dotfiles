---
name: writing-plans
description: Use when you have an approved design/spec for a multi-step task, before touching code. Follows on from `brainstorming` once its design doc is approved.
---

# Writing Plans

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for the codebase and questionable taste. Document everything they need: which files to touch per task, code, tests, docs to check, how to verify it. Break the plan into bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Assume a skilled developer who knows almost nothing about this toolset or problem domain, and doesn't know good test design well.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Save plans to:** `brainstorming/plans/YYYY-MM-DD-<feature-name>.md` (or the project's convention) — alongside the design doc it implements.

## Scope Check

If the spec covers multiple independent subsystems, it should already have been broken into sub-project specs during brainstorming. If it wasn't, suggest breaking this into separate plans — one per subsystem. Each plan should produce working, testable software on its own.

## File Structure

Before defining tasks, map out which files will be created or modified and what each one is responsible for. This is where decomposition decisions get locked in.

- Design units with clear boundaries and well-defined interfaces. Each file should have one clear responsibility.
- You reason best about code you can hold in context at once, and your edits are more reliable when files are focused. Prefer smaller, focused files over large ones that do too much.
- Files that change together should live together. Split by responsibility, not by technical layer.
- In existing codebases, follow established patterns. If the codebase uses large files, don't unilaterally restructure - but if a file you're modifying has grown unwieldy, including a split in the plan is reasonable.

This structure informs the task decomposition. Each task should produce self-contained changes that make sense independently.

## Task Right-Sizing

A task is the smallest unit that carries its own test cycle and is worth a
fresh reviewer's gate. When drawing task boundaries: fold setup,
configuration, scaffolding, and documentation steps into the task whose
deliverable needs them; split only where a reviewer could meaningfully
reject one task while approving its neighbor. Each task ends with an
independently testable deliverable.

## Bite-Sized Task Granularity

**Each step is one action (2-5 minutes):**
- "Write the failing test" - step
- "Run it to make sure it fails" - step
- "Implement the minimal code to make the test pass" - step
- "Run the tests and make sure they pass" - step
- "Commit" - step

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** Implement this plan one task at a time. Review each task's deliverable before starting the next. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

## Global Constraints

[The spec's project-wide requirements — version floors, dependency limits,
naming and copy rules, platform requirements — one line each, with exact
values copied verbatim from the spec. Every task's requirements implicitly
include this section.]

---
```

## Task Structure

````markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.ts`
- Modify: `exact/path/to/existing.ts:123-145`
- Test: `exact/path/to/file.test.ts`

**Interfaces:**
- Consumes: [what this task uses from earlier tasks — exact signatures]
- Produces: [what later tasks rely on — exact function names, parameter
  and return types. A task's implementer sees only their own task; this
  block is how they learn the names and types neighboring tasks use.]

- [ ] **Step 1: Write the failing test**

```ts
import { expect, test } from "vitest";
import { slugify } from "./slugify";

test("lowercases and hyphenates a title", () => {
  expect(slugify("Hello World")).toBe("hello-world");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run vitest run src/path/slugify.test.ts -t "lowercases and hyphenates a title"`
Expected: FAIL with "slugify is not exported"

- [ ] **Step 3: Write minimal implementation**

```ts
export function slugify(title: string): string {
  return title.toLowerCase().replaceAll(" ", "-");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run vitest run src/path/slugify.test.ts -t "lowercases and hyphenates a title"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/path/slugify.ts src/path/slugify.test.ts
git commit -m "feat: add slugify"
```
````

## No Placeholders

Every step must contain the actual content an engineer needs. These are **plan failures** — never write them:
- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases"
- "Write tests for the above" (without actual test code)
- "Similar to Task N" (repeat the code — the engineer may be reading tasks out of order)
- Steps that describe what to do without showing how (code blocks required for code steps)
- References to types, functions, or methods not defined in any task

## Self-Review

After writing the complete plan, look at the spec with fresh eyes and check the plan against it. This is a checklist you run yourself — not a subagent dispatch.

**1. Spec coverage:** Skim each section/requirement in the spec. Can you point to a task that implements it? List any gaps.

**2. Placeholder scan:** Search your plan for red flags — any of the patterns from the "No Placeholders" section above. Fix them.

**3. Type consistency:** Do the types, method signatures, and property names you used in later tasks match what you defined in earlier tasks? A function called `clearLayers()` in Task 3 but `clearFullLayers()` in Task 7 is a bug.

If you find issues, fix them inline. No need to re-review — just fix and move on. If you find a spec requirement with no task, add the task.

## Execution

After saving the plan, work through it one task at a time: produce the task's deliverable, run its test cycle, confirm it's independently testable, then move to the next task. Review each task's result before starting the next rather than batching multiple tasks unreviewed — mistakes are cheaper to catch while the context is still fresh.
