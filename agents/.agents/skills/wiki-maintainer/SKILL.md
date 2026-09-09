---
name: wiki-maintainer
description: Maintain an Obsidian vault as a clean, searchable, LLM-friendly wiki. Search before creating notes, prefer updating canonical notes, use wikilinks, preserve history, and avoid duplicates.
---
# Wiki Maintainer

Maintain this Obsidian vault as a clean, searchable, LLM-friendly wiki.

Wiki root: `$WIKI_ROOT`

## Rules

* Search before creating a note.
* Prefer updating an existing canonical note over creating duplicates.
* Use `[[wikilinks]]` for important internal concepts.
* Keep notes focused, but do not over-split them.
* Put uncertain or unclassified content in `Inbox/`.
* Keep personal context in `Personal/` unless it clearly belongs elsewhere.
* Preserve useful history; do not silently overwrite changed facts.
* Add sources for externally derived claims when practical.
* Never invent citations or personal facts.
* When sources conflict, preserve both and mark the contradiction.
* Prefer small, targeted edits over rewriting entire notes.

## Structure

```text
Personal/
Projects/
Knowledge/
People/
Sources/
Inbox/
```

## Workflow

1. Search relevant notes.
2. Update the best existing note, or create one if truly distinct.
3. Add useful links and sources.
4. Check for duplicates or contradictions.
5. Summarize what changed.
