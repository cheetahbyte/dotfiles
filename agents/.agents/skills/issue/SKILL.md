---
name: issue
description: "Use when drafting, filing, or editing an issue: bug reports, feature requests, and proposals."
metadata:
  category: collaboration
---

# Issue

Draft an issue, and file it only when the user asks. "Write an issue" is not permission to create it.

## Before writing

1. Find the repository's issue templates: `.github/ISSUE_TEMPLATE/` (Markdown or issue forms in YAML), `.github/ISSUE_TEMPLATE.md`, or `ISSUE_TEMPLATE.md` in the root or `docs/`. When one matches the issue type, use it: keep its headings, fields, and front matter labels, and use the templates below only to decide what goes in each field. Use the templates below when no repository template matches.
2. When editing an existing issue, read it with `gh issue view <number>` and keep its structure. When creating one, search for duplicates: `gh issue list --state all --search "<keywords>"`. When one exists, show it to the user instead of drafting a new issue.
3. Collect evidence from the session and the code: error output, versions, commits, file paths, and code references. Ask the user only for what you can't find.
4. Redact the evidence: replace tokens, keys, passwords, cookies, personal data, and private hostnames or paths with placeholders such as `<redacted-token>`. Keep the rest of the error text verbatim.

The draft is done when every section holds verified, redacted content or reads `UNKNOWN`.

## Title

State the problem or the capability in plain words, under 72 characters. Add a type prefix only when the repository's existing issues use one.

## Bug

~~~markdown
## Expected

<What should happen.>

## Actual

<What happens instead. Quote the exact error output.>

## Reproduction

1. <Smallest set of steps that triggers the bug.>

## Environment

<Version or commit, OS, runtime, and relevant configuration.>
~~~

Mark a bug you couldn't reproduce as `Not reproduced` in Reproduction, and list what you tried.

## Feature

~~~markdown
## Problem

<Who is blocked or slowed down, and in which situation.>

## Proposal

<The change in behavior, as seen by the user.>

## Acceptance criteria

- [ ] <A checkable condition that means the feature is done.>
~~~

Describe the behavior, not an implementation, unless the user specified one.

## Proposal

For decisions that need discussion before work starts: whether to do something and which way. Implementation detail belongs in a plan, written with `writing-plans` once the proposal is accepted.

~~~markdown
## Context

<The current situation and why a decision is needed now.>

## Options

### <Option A>

<What it is, and its costs and benefits.>

### <Option B>

<What it is, and its costs and benefits.>

## Recommendation

<The preferred option and the reason.>

## Open questions

- <Questions that need an answer before a decision.>
~~~

## Filing

- Show the draft to the user before you create or update the issue.
- Put the body in a temporary file. Create with `gh issue create --title "<title>" --body-file <file>`; update with `gh issue edit <number> --title "<title>" --body-file <file>`, which replaces the whole body.
- Add labels with `--label` only when they exist in the repository (`gh label list`).
