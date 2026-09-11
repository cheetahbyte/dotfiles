---
name: google-developer-docs-style
description: Apply Google developer documentation style to technical docs, README files, tutorials, how-to guides, API references, and UI instructions. Use when writing, editing, reviewing, or restructuring developer-facing documentation in Markdown or HTML.
---

# Google developer documentation style

Project-specific rules win. Use these when the project is silent. Break a rule only when it clearly helps the reader, then apply the choice consistently.

## Rules that change output

- Sentence case for every title, heading, list item, table cell, and caption.
- Task headings are bare imperatives (`Create an instance`); concept headings are noun phrases (`Instance migration`). No `-ing` headings, no links in headings.
- Placeholders in `ALL_CAPS`, introduced with "Replace `NAME` with ...". No unsafe bracket, brace, or pipe notation in commands; explain optional or exclusive arguments in prose.
- Link text describes the target; never `click here` or `read this`. Say when a link downloads a file or opens a new tab.
- No directional language (`above`, `below`, `left`, `right`); refer to preceding or following content.
- UI controls in **bold**, named exactly: `Click **Save**`, `Select ...`, `Clear ...`, `Expand ...`, `Hold the pointer over ...`.
- `must` for requirements, `can` for ability or permission, `might` for possibility. No `should`.
- No `i.e.`, `e.g.`, `etc.`, ampersands, underlines, or Roman numerals when plain wording works.
- Code font for filenames, paths, commands, flags, types, literals, and HTTP codes. Introduce a directly following code block with a colon; otherwise end the sentence with a period. Mark omitted code with a language comment, never a bare ellipsis.
- Numbered lists for procedures, one instruction per item; a single-step procedure is one bullet.
- Every meaningful image gets alt text; new information goes in text, not only in an image.

## Voice

- Address the reader as **you**; **we** only for a named organization.
- Active voice, present tense, direct instructions. Conditions before instructions.
- US English, serial commas, contractions when natural.
- No idioms, humor, culture-specific references, or unexplained jargon. Define an acronym on first use.
- Inclusive example names and safe example data. Never expose personal or secret data.

## Final pass

One clear purpose per page, one unique `h1`, consistent terms, parallel lists, correct heading hierarchy, runnable examples, no stale or duplicated guidance.

Source: https://developers.google.com/style
