---
name: product-copy-editor
description: Rewrite existing changelog entries, release notes, feature descriptions,
  and product copy into concise, polished, user-facing language.
---

# Product Copy Editor

Do not invent features or benefits. Preserve the factual meaning of the input.
Write from the user's perspective rather than the implementation perspective.

If the source only describes an implementation detail with no stated user-facing
effect (e.g. "refactored auth token refresh logic"), do not infer or invent the
user impact. Rewrite it as plainly as the input allows and flag it back to the
author as needing a user-facing framing, rather than guessing at one.

## Voice

Prefer:
- concrete outcomes
- active voice
- short sentences
- natural product language
- feature names where useful

Avoid:
- "now allows users to"
- "improved experience"
- "enhanced"
- "seamlessly"
- unnecessary implementation details
- exaggerated marketing language

The banned phrases above are symptoms, not the target — passing the checklist
while still hedging or padding a sentence is still a failure. If a rewrite needs
a banned phrase to stay honest, the underlying sentence is probably still
implementation-framed; restructure it around the outcome instead of swapping in
a synonym.

## Changelog entries

Structure by category:
- **New:** explain what can now be done.
- **Improved:** describe the noticeable improvement.
- **Fixed:** describe the problem the user experienced.
- **Changed:** describe the visible behavior change.
- **Removed:** clearly state what is no longer available.

Keep each entry to one or two sentences. If a change is multi-part or breaking
and won't fit in two sentences without dropping something the user needs to
know (e.g. a required migration step), split it into multiple entries or add a
short second paragraph rather than compressing it into an incomplete sentence.

**Examples:**

| Input | Output |
|---|---|
| "Refactored the export pipeline to use streaming instead of buffering the full file in memory." | **Improved:** Exporting large files is faster and no longer times out. |
| "Added a new `--dry-run` flag to the CLI deploy command." | **New:** Preview a deploy before running it with `deploy --dry-run`. |
| "Fixed a bug where the search index wasn't being updated after bulk delete operations, causing deleted items to still appear in results." | **Fixed:** Deleted items no longer show up in search results. |
| "Removed the legacy v1 webhook format; all webhooks now use v2 payload structure." | **Removed:** Support for v1 webhook payloads. Use v2, which all webhooks now send. |

## Release notes and feature descriptions

Unlike changelog entries, these can run to a short paragraph. Lead with the
outcome in the first sentence, then add context (why it matters, how to use
it) in one or two follow-on sentences. Don't reconstruct the internal doc's
structure (no mirrored section headers, no step-by-step walkthrough of how it
was built) — describe what changed for the user and stop.

**Example:**

Input: "We migrated the notifications service to a new queueing system to
reduce delivery latency and added support for batching digest emails."

Output: "Notifications now arrive faster, especially during high-traffic
periods. You can also opt into digest emails that batch multiple
notifications into one, instead of getting a separate email for each."

## General product copy (UI strings, tooltips, marketing snippets)

Same voice rules apply. Additionally:
- Match the length constraint of the context (a tooltip is not a paragraph).
- Don't add a call-to-action or persuasive framing unless the input already
  implies one — this skill polishes given copy, it doesn't add marketing intent.
