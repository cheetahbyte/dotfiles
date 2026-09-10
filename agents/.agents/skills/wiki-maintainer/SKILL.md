---
name: wiki-maintainer
description: Maintain an Obsidian vault as a clean, searchable, LLM-friendly wiki — searching before writing, updating canonical notes instead of duplicating, wikilinking, and preserving superseded facts rather than overwriting them. Use whenever the user wants to save, file, note down, log, look up, correct, or reorganize anything in their vault, wiki, or notes, or mentions Obsidian, wikilinks, or a note by title — even if they don't say "wiki".
---

# Wiki Maintainer

Vault root: `$WIKI_ROOT`. If unset, check `~/.config/wiki/root`, then ask. Never guess a path.

## Note format

Every note gets this frontmatter. `aliases` is what makes future searches hit — fill it with the other names the subject actually goes by, not synonyms you invented.

```yaml
---
aliases: []
tags: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: []
---
```

The first line of the body is one sentence answering "what is this" — no lead-in, no "This note covers". It is the snippet that shows up in search, so it carries the weight.

```markdown
Mnemo is the shared memory store backing [[Hermes]] and the laptop coding agents.

## Design
...
```

## Naming

Titles are resolved vault-wide, not per folder, so two notes named `Release procedure.md` in different project folders collide — Obsidian falls back to path-qualified links, which break on move and hide from a title search.

The test: **the title must stand alone inside a wikilink.** If `[[X]]` appeared in an unrelated note, would you know what it is? `[[Release procedure]]` fails; `[[Kepler release procedure]]` passes. Qualify generic nouns (release procedure, architecture, roadmap, notes) with their project or subject. Leave already-unique names bare — `Mnemo.md`, not `Mnemo overview.md`.

- Spaces, not kebab or snake — titles are typed inline as prose.
- Sentence case, unless the existing vault says otherwise. Match what's there; check a few files before creating the first note.
- Never use `#`, `^`, `|`, `[`, `]` in a filename. They are wikilink syntax and will break the link.
- Dates only for genuinely dated notes, ISO and suffixed so they sort: `Kepler standup 2026-03-14`.

## Before writing anything

Run all four. The last one matters most and is the one that gets skipped:

```bash
rg -il "<term>" "$WIKI_ROOT"                      # content
fd -i "<term>" "$WIKI_ROOT"                       # filenames
rg -i "^aliases:.*<term>" -A0 "$WIKI_ROOT"        # aliases
rg -o '\[\[[^]]*<term>[^]]*\]\]' "$WIKI_ROOT"     # existing links
```

If a `[[wikilink]]` points at a note that doesn't exist yet, the vault has already chosen the title. Create it under that exact title instead of inventing your own.

## Update or create

A note answers one question. Apply that test rather than judging topic similarity:

- New material answers the **same question** as an existing note's title → add a section to that note.
- New material answers a **different question** the existing note only mentions in passing → new note, wikilinked from the old one.
- A section outgrows roughly a screen **and** is referenced from two or more notes → split it out, leave a wikilink behind.

Single mentions with nowhere to go are the only legitimate use of `Inbox/`. Re-file them the next time the subject comes up; a permanent Inbox is a failure mode.

## Where it goes

| Folder | Holds | Test |
|---|---|---|
| `Knowledge/` | Impersonal, durable facts | Would still be true for someone else |
| `Sources/` | One note per external artifact | The paper/article/video itself, with a citation |
| `Projects/` | One note per project | Has a goal and a state that changes |
| `People/` | One note per person | Relationship and shared context — not a dossier |
| `Personal/` | The user's own life and context | About them, not about a subject |
| `Inbox/` | Genuinely unroutable | Only after trying the five above |

`Sources/` holds the artifact; `Knowledge/` holds what you learned from it, linking back with `[[source note]]`. Never put extracted claims in `Sources/`.

Keep every folder flat except `Projects/`. Wikilinks resolve by title, not path, so nesting adds a routing decision at write time without improving retrieval — and a note filed under two plausible paths defeats the duplicate search above. If a flat folder feels crowded, add tags, not depth.

A project may have its own folder when it owns artifacts that get archived with it. The canonical note takes the folder's name:

```text
Projects/
  Mnemo/
    Mnemo.md          # canonical note
    Meetings/
    schema-v2.md
```

## When a fact changes

Do not overwrite. Supersede inline so the old value stays readable:

```markdown
- Storage: Postgres (since 2026-03; previously SQLite)
```

For contradictions between sources, keep both and mark them:

```markdown
- Latency: ~40ms per [[Source A]], ~120ms per [[Source B]] — unresolved.
```

Bump `updated` in frontmatter on every edit. Prefer targeted edits over rewriting a note; a full rewrite loses history that the diff won't recover in a vault that isn't version-controlled.

## Links and sources

Wikilink concepts that have or deserve their own note. Do not link every noun — a note where half the words are links is unreadable and the links stop carrying signal. Dangling links are fine and useful: they mark work to do.

Add a source for any externally derived claim. Never invent a citation, a date, or a personal fact. If you don't know where something came from, write that instead of guessing.

## Closing out

Report what changed as a short list of paths with a phrase each — created, updated, or superseded. No prose summary of the content itself; the user can open the note.
