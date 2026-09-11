---
name: wiki-maintainer
description: Maintain Craft documentation as a clean, searchable knowledge base. Use when the user wants to save, file, note, log, look up, correct, or reorganize documentation or mentions Craft, a document, or a note title.
---

# Craft Documentation Maintainer

Use Craft as the source of truth. Search before writing and update the canonical document rather than creating a duplicate.

## Find the target

1. Search Craft for the subject, alternate names, and distinctive phrases with `craft_craft_read`.
2. Inspect likely documents, their folder, and their blocks before editing.
3. If the user provides a Craft URL, run `documents resolve-link <url>` before block reads or writes.
4. When the same title exists more than once, disambiguate by folder and content; do not assume titles are unique.

Match the space's existing title language and casing. Do not rename a document unless the user asks or the name is clearly wrong.

## File documents by purpose

Use the existing taxonomy:

| Location | Use for |
|---|---|
| `Areas/` | Ongoing personal domains, such as home or health. Use an existing subfolder such as `Hosting/` when it fits. |
| `Projects/` | Active project work, including project-specific notes, issues, screenshots, and collections. |
| `Resources/` | Reusable references, prompts, links, ideas, and general knowledge. |
| `Archive/` | Inactive or completed projects and historical material. |
| `Inbox/` | Material that cannot yet be classified; move it to a fitting location when its subject is known. |

Use an existing relevant document or folder first. Create a folder only when a sustained subject needs multiple documents; otherwise create the document in its parent folder. Do not create documents in `unsorted`.

## Update or create

A document should answer one useful question:

- Same question: add or update the relevant block in the existing document.
- Different question: create a focused document and link it from related material.
- Reused, substantial material: split it into its own document and replace duplication with a link.

Preserve the document's established format. Project documents may intentionally be free-form notes, screenshots, lists, or collections; extend the existing structure instead of imposing a template.

Use Craft links for related documents and external URLs. Add a source for externally derived claims. State uncertainty rather than inventing dates, citations, or personal facts.

## Changing facts

Keep material changes legible inline:

```markdown
- Storage: Postgres (since 2026-03; previously SQLite)
```

For conflicting sources, retain both claims and identify their sources. Prefer targeted block updates to rewrites that erase useful context.

## Craft operations

- Read/search with `craft_craft_read`.
- Create documents with `craft_craft_write` in the destination folder.
- Read a document's blocks before changing them.
- Add, update, move, or delete individual blocks where possible.
- Use real newline characters in Markdown arguments; nested Toggle children must be indented.
- Preserve collections and their schema. Add or update collection items instead of replacing a collection with Markdown.

## Closing out

Report changed Craft documents as a short list: created, updated, moved, or superseded. Include titles or links when available.
