#!/bin/sh
# SessionStart hook (Claude Code / pi-hooks): inject the terse skill body as additionalContext.
awk 'f>=2{print} /^---$/{f++}' "$HOME/.agents/skills/terse/SKILL.md" |
  jq -Rs '{hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:("Apply the terse skill for all replies in this session:\n" + .)}}'
