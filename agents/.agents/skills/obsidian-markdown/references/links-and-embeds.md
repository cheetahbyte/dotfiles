# Links & Embeds

> Use wikilinks for vault navigation, block references, file embeds, and query blocks.

## Internal Links

| Syntax | Result |
|--------|--------|
| `[[Note Name]]` | Link to note |
| `[[Note Name\|Display Text]]` | Link with custom display text |
| `[[Note Name#Heading]]` | Link to heading |
| `[[Note Name#^block-id]]` | Link to block |
| `[[#Heading]]` | Link to heading in current note |
| `[[#^block-id]]` | Link to block in current note |

Use the note title or alias, not a relative Markdown path. Obsidian updates wikilinks on rename when link updating is enabled.

## Block IDs

Add a block ID at the end of a paragraph or list item:

```markdown
This paragraph can be linked directly. ^my-block-id
```

Use short, stable IDs. Avoid semantic IDs that will become wrong when the paragraph changes.

## External Links

Use standard Markdown links for URLs:

```markdown
[Obsidian documentation](https://help.obsidian.md/)
```

Do not use wikilinks for external URLs.

## Embeds

| Syntax | Result |
|--------|--------|
| `![[Note Name]]` | Embed full note |
| `![[Note Name#Heading]]` | Embed specific section |
| `![[image.png]]` | Embed image |
| `![[image.png\|300]]` | Embed image with width in px |
| `![[image.png\|300x200]]` | Embed image with width and height |
| `![[audio.mp3]]` | Embed audio player |
| `![[video.mp4]]` | Embed video player |
| `![[document.pdf]]` | Embed PDF |
| `![[document.pdf#page=3]]` | Embed PDF at a page |
| `![[document.pdf#height=400]]` | Embed PDF with custom height |

Use standard Markdown image syntax only for external image URLs.

## Query Blocks

Embed Obsidian search results with a query code block:

````markdown
```query
tag:#project status:done
```
````

Query blocks are useful for dynamic indexes. Prefer explicit wikilinks when a stable curated list is more valuable than live search results.
