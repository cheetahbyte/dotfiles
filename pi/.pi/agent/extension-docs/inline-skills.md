# Inline skills

`~/.pi/agent/extensions/inline-skills.ts` adds inline skill autocomplete and attaches multiple skills without changing Pi's core.

## Use inline skills

Run `/reload` to load the extension.

Type `/` and a skill name anywhere after whitespace in your prompt. Select a completion or press Tab. Pi inserts `/skill:NAME`.

For example:

```text
Review this module /skill:straight-answer /skill:tech-debt
```

Submission prepends both skills' instructions, in reference order, and preserves your prompt and images. Repeated references attach each skill once.

Manually entered references must use `/skill:NAME`. Bare `/NAME` text isn't expanded without selecting autocomplete.

Expansion ignores unknown skills, escaped references, file paths, inline backtick code, and triple-backtick or triple-tilde code blocks. An unreadable referenced skill cancels submission and reports an error.

## Limitations

The extension replaces the editor through `setEditorComponent`. Don't combine it with another custom-editor extension.

Automatic slash triggers require instance-local patches to two private editor methods. Pi updates might require adapting these patches. No shared prototypes or core files are modified.

The input handler also expands references in RPC and extension-submitted prompts. Those modes don't receive the custom editor.

## Verify the behavior

The local regression harness uses installed Pi modules and requires no model calls:

```sh
CHECK_EXTENSION="$HOME/.pi/agent/extensions/inline-skills.ts" node "$HOME/.pi/agent/extension-docs/inline-skills-check.mjs"
```

Without `CHECK_EXTENSION`, the harness reproduces the missing inline completion. Set `CHECK_EXPANSION_ONLY=1` to reproduce the missing second attachment.

The harness exercises automatic typing, Tab completion, cursor placement, multiline prompts, multiple skills, deduplication, and literal protection. It doesn't launch a terminal session.
