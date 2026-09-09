# Properties & Tags

> Format YAML frontmatter and tags so Obsidian can index them as note metadata.

## Frontmatter

Properties must be the first content in the file:

```yaml
---
tags:
  - status/draft
  - topic/design
aliases:
  - Alternative Name
cssclasses:
  - wide-page
publish: false
related: "[[Other Note]]"
---
```

| Property | Type | Purpose |
|----------|------|---------|
| `tags` | list | Categorisation, equivalent to inline tags |
| `aliases` | list | Alternative names for wikilink resolution |
| `cssclasses` | list | CSS classes applied to the note |
| `publish` | checkbox | Include or exclude from Obsidian Publish |
| `related` | links | Link-valued property |

Supported property types include `text`, `list`, `number`, `checkbox`, `date`, `datetime`, and `links`.

## YAML Rules

- Quote values containing wikilinks, colons, or special characters: `related: "[[Other Note]]"`.
- Use lists for multi-value properties; avoid comma-separated strings unless a plugin explicitly expects them.
- Keep frontmatter machine-readable. Put explanation in the note body.

## Tags

```markdown
#tag
#nested/tag
#status/draft
```

Tags in frontmatter and inline `#tags` are merged by Obsidian.

| Rule | Example |
|------|---------|
| No spaces | `#project-alpha`, not `#project alpha` |
| Nested tags use `/` | `#status/active` |
| Avoid all-numeric tags | `#week-42`, not `#42` |
| Prefer lowercase kebab case | `#data-pipeline` |

Use inline tags when they are meaningful in reading context. Use frontmatter tags for categorisation that should not interrupt prose.
