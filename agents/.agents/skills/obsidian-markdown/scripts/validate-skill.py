#!/usr/bin/env python3
"""Validate obsidian-markdown skill structure and examples."""

from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
SKILL = ROOT / "SKILL.md"

REQUIRED_SNIPPETS = [
    "[[Another Note]]",
    "![[image.png|300]]",
    "> [!info]",
    "tags:",
    "==highlighted phrase==",
]


def fenced_blocks_balanced(text: str) -> bool:
    fence_count = sum(1 for line in text.splitlines() if line.startswith("```"))
    quad_fence_count = sum(1 for line in text.splitlines() if line.startswith("````"))
    # Quad fences are also counted by the triple-fence check, so subtract them from the triple count.
    triple_only = fence_count - quad_fence_count
    return triple_only % 2 == 0 and quad_fence_count % 2 == 0


def referenced_files() -> list[tuple[pathlib.Path, str]]:
    refs: list[tuple[pathlib.Path, str]] = []
    for path in ROOT.rglob("*.md"):
        for match in re.finditer(r"`(references/[^`]+)`", path.read_text()):
            refs.append((path, match.group(1)))
    return refs


def main() -> int:
    failures: list[str] = []
    all_text = "\n".join(path.read_text() for path in ROOT.rglob("*.md"))
    skill_text = SKILL.read_text()

    if "name: obsidian-markdown" not in skill_text:
        failures.append("SKILL.md frontmatter name is missing or incorrect")
    if "description:" not in skill_text or "Use when" not in skill_text:
        failures.append("SKILL.md description must include trigger conditions")
    if "\u2014" in all_text:
        failures.append("Use spaced hyphens instead of em dash characters")

    for snippet in REQUIRED_SNIPPETS:
        if snippet not in skill_text:
            failures.append(f"Quick Start missing expected syntax: {snippet}")

    for path in ROOT.rglob("*.md"):
        if not fenced_blocks_balanced(path.read_text()):
            failures.append(f"Unbalanced fenced code blocks: {path}")

    for path, ref in referenced_files():
        if not (ROOT / ref).exists():
            failures.append(f"Broken reference in {path}: {ref}")

    if failures:
        print("Validation failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("Validated obsidian-markdown skill: references, fences, and core syntax examples")
    return 0


if __name__ == "__main__":
    sys.exit(main())
