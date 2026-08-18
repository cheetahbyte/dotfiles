---
name: google-developer-docs-style
description: Apply Google developer documentation style to technical docs, README files, tutorials, how-to guides, API explanations, UI instructions, code comments, and Markdown or HTML content. Use when writing, editing, reviewing, or restructuring developer-facing documentation for clarity, accessibility, localization, and consistency.
---

# Google developer documentation style

Use project-specific rules first; use these rules when the project is silent. Break a rule when doing so clearly improves reader understanding, then apply the choice consistently.

## Write for the reader

- State the reader's goal and provide needed context; omit pre-announcements and filler.
- Use a conversational, friendly tone; address the reader as **you**. Use **we** only for a clearly identified organization.
- Prefer active voice, present tense, and direct instructions. Use passive voice only when the actor is irrelevant or the object matters more.
- Prefer short, concrete, unambiguous sentences. Put conditions before instructions and qualifiers beside the words they modify.
- Use US English, standard spelling, serial commas, and contractions when natural.
- Write for translation: avoid idioms, slang, humor, culture-specific references, unexplained jargon, and figurative or ableist language.
- Use consistent terms and capitalization. Define an acronym or specialist term on first use; consult the project's word list before inventing alternatives.
- Use inclusive, diverse example names and safe example data. Never expose personal or secret data.

## Structure and navigation

- Give each page one descriptive, unique `h1`; use sentence case for every title, heading, list item, table cell, and caption.
- Use task headings as bare imperatives (`Create an instance`) and concept headings as noun phrases (`Instance migration`). Avoid `-ing` headings, excess punctuation, and links in headings.
- Use numbered lists for ordered procedures and bullets for unordered lists. Make each procedure instruction its own list item; use a bullet for a one-step procedure.
- Break dense prose with headings, lists, and paragraphs. Introduce tables, images, and interactive elements before they appear.
- Prefer prescriptive paths for common tasks. Use `must` for requirements, `can` for ability, permission, optional actions, or possible outcomes, and `might` for possibility; avoid ambiguous `should`.

## Links, UI, and accessibility

- Use descriptive link text that makes sense out of context; never use `click here` or `read this`. Explain downloads, new tabs, anchors, and other unexpected behavior.
- Avoid directional language such as “above,” “below,” “left,” and “right”; refer to preceding or following content, or write the task around the UI.
- Name UI controls exactly and format them in **bold**. Say `Click Save`, `Select ...`, `Clear ...`, `Expand ...`, or `Hold the pointer over ...`; distinguish links from buttons.
- Use semantic HTML and native controls. Preserve DOM reading order, keyboard access, focus behavior, and sufficient color contrast.
- Give every meaningful image concise alt text; use empty alt text for decoration. Put all new information in text, not only in an image. Caption, transcribe, or describe media.
- Test content without images, color, sound, punctuation, and a mouse; use a screen reader when possible.

## Formatting and code

- Use code font for filenames, paths, directories, commands, flags, types, methods, literals, HTTP codes, and placeholders. Use `ALL_CAPS` for placeholders.
- Use sentence case and semantic Markdown or HTML; do not override global fonts, colors, or sizes. Avoid underlines and ampersands except in exact UI or technical syntax.
- Format code as preformatted blocks, follow the language or project style, prefer spaces, and wrap at about 80 characters. Mark omissions with an explanatory language comment, never bare ellipses.
- Introduce a directly following code sample with a colon; otherwise end the introductory sentence with a period.
- In commands, show the common usable path. Explain optional or mutually exclusive arguments instead of making readers edit unsafe bracket, brace, or pipe notation.
- Use unambiguous dates, times, numbers, units, and version ranges; avoid Roman numerals and ambiguous abbreviations such as `i.e.`, `e.g.`, and `etc.` when plain wording works.

## Final pass

Check the document for one clear purpose, accurate terminology, parallel lists, heading hierarchy, meaningful links, accessible media, runnable examples, consistent punctuation, and no stale or duplicated guidance.

Source: https://developers.google.com/style
