---
name: obsidian-markdown
description: Writes Obsidian-flavoured Markdown with wikilinks, embeds, callouts, properties, tags, block links, query blocks, and other Obsidian-specific syntax. Use when creating or editing note content in an Obsidian vault, adding internal links, embedding vault files, writing callouts, formatting YAML frontmatter, or using any Obsidian Markdown syntax. Do NOT use for Obsidian CLI operations (use use-obsidian) or personal wiki ingest/query/lint workflows (use obsidian-wiki).
---

# obsidian-markdown

## Essential Principles

- **Wikilinks for vault content** - use `[[Note Name]]` for internal notes and vault files because Obsidian tracks renames and resolves aliases. Use `[text](url)` only for external URLs.
- **Properties stay in frontmatter** - put YAML properties at the very top, fenced by `---`, because Obsidian only treats that block as note properties.
- **Tags are metadata, not prose decoration** - use `#tag` inline only when the tag is meaningful in reading context; otherwise prefer the `tags:` frontmatter list.
- **Embeds use wikilink syntax** - use `![[Note]]` or `![[image.png]]` for vault embeds because standard Markdown image syntax does not resolve Obsidian note targets.
- **Prefer readable notes over syntax density** - Obsidian syntax should improve navigation or rendering; avoid links, tags, callouts, and embeds that do not add retrieval value.

## Quick Start

```markdown
---
tags:
  - project
  - status/active
aliases:
  - Alt Name
cssclasses:
  - wide-page
---

# Note Title

Link to [[Another Note]] or [[Another Note|custom display text]].
Link to a heading: [[Note#Section Heading]].
Link to a block: [[Note#^block-id]].

![[Embedded Note]]
![[image.png|300]]

> [!info] Title here
> Callout content.

> [!warning]- Collapsed by default
> Hidden until expanded.

This has a ==highlighted phrase== and a %%hidden comment%%.

Tasks:
- [ ] Incomplete task
- [x] Completed task
- [/] In progress
```

## References

- **Links & Embeds** (wikilinks, headings, blocks, embeds, query blocks): `references/links-and-embeds.md`
- **Callouts** (types, aliases, collapsible and nested callouts): `references/callouts.md`
- **Properties & Tags** (frontmatter, property types, tag rules): `references/properties-and-tags.md`
- **Additional Syntax** (highlights, comments, math, footnotes, diagrams, tasks): `references/additional-syntax.md`

## Success Criteria

- `[[wikilinks]]` used for all internal vault links, never `[text](relative-path.md)`
- YAML properties placed only in top-of-file frontmatter
- Embed syntax (`![[...]]`) used for vault files and notes
- Callout syntax matches Obsidian format (`> [!type]`)
- Tags are valid and useful for retrieval
