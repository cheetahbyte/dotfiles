# Callouts

> Use Obsidian callouts for scannable notes, warnings, examples, and collapsible detail.

## Basic Syntax

```markdown
> [!type] Optional title
> Content inside the callout.
```

Use a callout when the content has a clear role. Do not wrap ordinary paragraphs in callouts just for visual styling.

## Collapsible Callouts

```markdown
> [!faq]- Click to expand
> Hidden content.

> [!example]+ Expanded by default
> Visible content.
```

`-` starts collapsed. `+` starts expanded.

## Types

| Type | Aliases |
|------|---------|
| `note` |  |
| `abstract` | `summary`, `tldr` |
| `info` |  |
| `todo` |  |
| `tip` | `hint`, `important` |
| `success` | `check`, `done` |
| `question` | `help`, `faq` |
| `warning` | `caution`, `attention` |
| `failure` | `fail`, `missing` |
| `danger` | `error` |
| `bug` |  |
| `example` |  |
| `quote` | `cite` |

## Nesting

Nest callouts by adding another `>` level:

```markdown
> [!note] Parent
> Parent content.
> > [!tip] Child
> > Child content.
```

Keep nested callouts shallow. Deep nesting is hard to edit and scan in source mode.
