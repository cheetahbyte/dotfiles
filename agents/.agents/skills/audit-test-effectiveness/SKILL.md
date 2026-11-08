---
name: audit-test-effectiveness
description: Audit a test suite for tests that give false confidence (tautological, mock-only, weak or missing assertions), prove it with controlled mutations, repair them and report evidence. Use when asked to review test quality, find useless tests, or check whether tests would catch real bugs. Not for writing new tests or fixing failing ones.
---

# Audit Test Effectiveness

Audit the project's test suite and identify, fix, or propose removal of tests that provide false confidence.

Treat this as a goal, not a checklist to complete mechanically.

**The fundamental question: If the implementation were wrong, would this test catch it?**

A passing test is not evidence of correctness unless it can distinguish correct behavior from plausible incorrect behavior.

**The objective is not more tests. It is fewer undetected bugs.**

## 0. Scope and safety (before anything else)

**Scope.** Audit the scope the user named (a path, module, or diff). Default to the whole project only if no scope was given.

**Budget.** If the in-scope suite has more than ~200 test files or a full run takes more than ~10 minutes, do not audit exhaustively. Rank by risk — core domain logic, recently changed code, heavily mocked tests, tests with no assertions — audit the top tier, and list everything else under "Not audited". Cap mutation experiments at ~30 unless the user asks for more. Never extrapolate findings to unaudited tests.

**Git hygiene.**
- Require a clean working tree (`git status --porcelain` empty). If it is dirty, stop and ask.
- Work on a new branch or a separate worktree. Never mutate the user's working tree directly while dev servers, watchers, or hot-reload are running.
- Restore mutations with `git checkout -- <file>` and prove it with `git diff --exit-code <file>`. Never reconstruct the original by hand.
- Never run `git reset --hard`, `git clean`, or `git checkout .` in the user's tree. Do not commit or push unless asked.

**Exclusions.** Skip vendored, generated, third-party, and build-output code (`node_modules`, `vendor`, `dist`, generated clients, migrations). Do not edit CI configuration, coverage thresholds, runner excludes, snapshot or golden files without asking.

**Side effects.** Only mutate code exercised by hermetic unit tests. Do not run or mutate against tests that touch real databases, networks, filesystems outside a temp dir, payment, email, or other external providers unless the user confirms. Do not install mutation-testing tools or add dependencies to the project without asking.

**Permission gates.** Do not delete tests, change production behavior, or add dependencies without explicit user approval. Propose instead (see §5).

## 1. Discover the test surface

- Identify test suites, runners, fixtures, mocks, helpers, and test configuration.
- Map tests to the production behaviors they claim to verify.
- Identify untested behavior, skipped tests, excluded files, and tests that never execute.
- Establish the baseline: run the in-scope tests **at least twice**. Record failures, skips, and configuration. Tests with inconsistent outcomes are **flaky**: record them, exclude them from mutation evidence, and report them separately.
- If the runner is missing, the baseline is red for environmental reasons, or tests need unavailable services: perform a static-only audit, classify every finding **Unverified**, and say so prominently.

Start a running ledger (`test-audit.md`, git-ignored or outside the repo) and update it as you go, so a run cut short still produces a usable report.

Do not assume a test is meaningful because it passes, has assertions, or contributes to coverage.

## 2. Audit each test in scope

For each test, identify the observable contract, the expected result, and the plausible regression it should detect.

Look specifically for:

- **Tautological assertions:** Guaranteed by setup, language semantics, or the test itself.
- **Implementation mirroring:** Expected values computed with the same logic as the implementation.
- **Mock self-verification:** The test only shows that a configured mock returns its configured response.
- **Excessive mocking:** The meaningful implementation is replaced rather than exercised.
- **Missing assertions:** Code executes without verifying relevant outcomes.
- **Weak assertions:** Existence, truthiness, snapshots, or call counts substitute for behavioral verification.
- **Silent passes:** The test passes when the operation silently fails, returns wrong data, or skips required work.
- **Unreachable assertions:** Early returns, swallowed errors, conditional assertions, or async work never awaited.
- **Brittleness:** Fails after behavior-preserving refactoring.
- **Happy-path-only coverage:** Missing boundaries, failure modes, invalid inputs, state transitions.
- **Duplicate coverage:** Multiple tests protect the same behavior with no added fault detection.
- **Test-only implementations:** A fake, reimplementation, or disconnected code path is exercised instead of the real system.

Do not classify a test as useless based solely on simplicity, mocking, or implementation details. Demonstrate why it cannot detect a meaningful regression. Treat regression tests tied to bug IDs, incidents, or security as "keep unless proven redundant".

## 3. Challenge suspicious tests with controlled mutations

For each suspicious test, formulate one concrete, plausible defect that violates its claimed contract (wrong return value, reversed or removed condition, skipped validation, swallowed error, omitted side effect, empty result, ignored input, broken boundary).

Prefer targeted manual mutations. Use a mutation-testing tool (Stryker, mutmut, PIT, cargo-mutants, …) only if it is already configured in the project.

For every experiment:

1. Record the original state (`git diff --exit-code` clean).
2. Introduce exactly one isolated defect.
3. Run only the relevant tests.
4. Record which tests fail and why. Confirm a "kill" by rerunning once; a kill from a flaky test is not evidence.
5. Restore with `git checkout -- <file>`.
6. Verify with `git diff --exit-code` before proceeding.

A test that passes despite a relevant defect is ineffective against that defect. Distinguish surviving mutations from **equivalent mutations** that do not change observable behavior; never call a test ineffective solely because an equivalent mutation survives.

Never leave experimental mutations in the codebase. If you must stop for any reason, restore first.

## 4. Classify findings

- **Effective:** Protects an identifiable behavioral contract, with evidence.
- **Weak:** Detects some defects but misses important plausible regressions.
- **Tautological:** Assertions do not meaningfully depend on production behavior.
- **Misleading:** Passes despite failure of the behavior it claims to verify.
- **Brittle:** Fails on behavior-preserving changes.
- **Redundant:** Adds no detection beyond existing tests.
- **Flaky:** Nondeterministic in the baseline.
- **Unverified:** Insufficient evidence.

Every finding records: test file and location; behavior supposedly protected; the specific problem; evidence (preferably a mutation); recommended correction; and confidence — **High** (mutation-verified), **Medium** (reasoned, not executed), **Low** (suspected).

Do not invent findings to satisfy the audit.

## 5. Repair the suite

Fix confirmed problems, prioritizing tests that create the greatest false confidence. Prefer observable behavior over implementation details, independent expectations over duplicated logic, real implementations over mocks when practical, meaningful negative and boundary cases, deterministic execution, minimal fixtures.

Rewrite weak or misleading tests so they detect the relevant regression. Preserve useful tests, even simple ones. Do not weaken assertions to make tests pass.

**Deletions:** do not delete tests. List proposed removals in the report with evidence. Remove only when the user has authorized deletions for this run, and keep removals in a separate commit if committing is allowed.

**Production defects:** if a strengthened test fails because of a real production bug, keep the test, report the bug as a finding with reproduction steps, and do not fix production code in this pass. Such a failure is a documented, expected failure, not a broken suite.

## 6. Verify

- Run affected tests, then the in-scope suite (twice if time allows).
- Re-run the relevant mutations; confirm repaired tests now reject the defects they previously missed and still pass on correct code.
- Check for newly introduced flakiness.
- Confirm `git diff` shows only intended test changes — no stray mutations, no config edits.

Report actual evidence, not merely that the suite passes.

## 7. Stopping and completion

Stop when the prioritized scope is done **or the budget is spent**. Always restore mutations first, then deliver the report for what was covered.

The audit is complete when every in-scope test is either classified with evidence or explicitly marked Unverified / Not audited; confirmed tautological and misleading tests are repaired or proposed for removal; repaired tests demonstrably detect their regressions where verification was feasible; the suite passes apart from documented pre-existing failures and documented production-defect failures; and no mutations remain.

Do not claim complete correctness or exhaustive defect detection.

## Final report

Write to `test-audit.md` (and summarize in chat):

1. **Scope and inventory:** what was audited, what was sampled and why, what was not audited.
2. **Findings:** by classification, with file references, evidence, and confidence.
3. **Changes:** tests rewritten, added, or proposed for removal, with reasons.
4. **Mutation evidence:** mutations introduced — killed, survived, equivalent.
5. **Production defects and flaky tests** found.
6. **Remaining risks:** untested behavior, unverified cases, limitations.
