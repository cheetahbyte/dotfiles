---
name: herdr-delegation
description: >
  Delegate work to worker agents in Herdr panes (pi, agy) and collect the
  result, so the user only talks to this session. Use when a task is
  self-contained with a checkable done criterion and would take more than a
  few minutes of tool calls, when two workstreams can run in parallel, when a
  plan or design needs a peer review before implementation, or when the user
  says "delegate", "in the background", "have pi do", "get agy to review the
  plan". Requires HERDR_ENV=1; otherwise use the built-in Agent tool.
---

# Herdr delegation

You are the lead. Workers run in Herdr panes; the user sees only your replies
and can peek at a pane by name if curious. Report outcomes, not the mechanics
of delegation, unless asked.

Mechanics (tabs, start, prompt, wait, read, IDs) live in `herdr --skill`.
Run it once per session before the first delegation and follow it for every
command. This skill decides *whether*, *to whom*, and *with what brief*.

## Preconditions

1. `test "${HERDR_ENV:-}" = 1`. If it fails, delegate with the Agent tool
   instead and skip the rest of this skill.
2. One Herdr session per project. Run `herdr agent list` and check
   `.result.agents[].cwd` for every worker is inside this repository. A worker
   from another project means the session is shared and names can collide:
   tell the user to relaunch with `herdr --session <project>` before you
   delegate.

## Pre-started workers

`herdr-lead` (in `~/.local/bin`) opens the standard topology: one tab per
worker plus a focused `planner` tab running Claude with `planner-role.md`
from this directory. Default workers: `impl` (pi). `-w impl,review` adds a
review worker, `--agy` adds `plan-review`. When these names show up in
`herdr agent list`, reuse them before starting new ones.

## Keep or delegate

Keep it yourself when the user is iterating with you turn by turn, when the
task needs the conversation's context or the user's judgement, when it is
under roughly ten tool calls, or when it touches files a live worker owns.

Delegate when the task is self-contained, has a done criterion you can check
without reading the worker's transcript, and one of: it is long, it can run
beside other work, or it is a plan that deserves a second opinion.

Small lookups (find where X lives, read one API, summarise one file) go to the
Agent tool, never a pane. A pane costs a process and a screen; spend it on
work that runs for minutes.

## Who does what

| Work | Kind | Rule |
| --- | --- | --- |
| peer review of a plan or design | `agy` | before implementation starts; follow the `agy` skill for the prompt shape and the spar loop |
| everything else: implementation, tests, refactors, code review, research that runs long | `pi` | one worker per module |

Agy reviews plans, Pi does the work. Reviewing code after Pi wrote it is also
Pi, in a fresh worker with a review brief; Agy is reserved for plans.

Pi runs one of these models, passed after `--` at start:

```bash
herdr agent start impl-auth --kind pi --pane <id> -- --model openai-codex/gpt-5.6-sol
```

| Model | Use |
| --- | --- |
| `openai-codex/gpt-5.6-sol` | default |
| `openai-codex/gpt-6-astra` | the hardest task in the batch, or a retry after Sol failed twice |
| `openai-codex/gpt-5.6-luna` | when the user asks for it |

No other model for Pi workers.

Name workers `<role>-<module>`: `impl-auth`, `review-auth`, `plan-review`.
Names are unique per session and must match `[a-z][a-z0-9_-]{0,31}`.

## Placement

Never split the user's pane. Every worker gets its own tab in the current
workspace, unfocused, so the user's screen stays whole and workers line up
in the tab bar:

```bash
herdr tab create --workspace "$HERDR_WORKSPACE_ID" --cwd "$PWD" --label <name> --no-focus
```

Start the worker in `.result.root_pane.pane_id`. This overrides the
sibling-pane default in `herdr --skill`.

## Isolation

One implementer at a time in the repo: its tab uses the repo cwd.

Two or more implementers, or an implementer while you keep editing: each
implementer gets its own worktree:

```bash
herdr worktree create --branch <role-module> --base HEAD --no-focus
```

The response opens a worktree workspace with a root pane; start the worker
there. Reviewers work in the implementer's worktree or on the branch, never
in a fresh one. Agy plan reviews need no worktree; they read, they do not
write.

## The brief

Every prompt to a Pi worker has these parts, in this order, and nothing else:

1. **Goal**: one sentence, the observable outcome.
2. **Scope**: the directories or files it may change. Everything else is
   read-only.
3. **Contracts**: interfaces it must keep or provide, verbatim signatures.
4. **Done when**: the command that proves completion (`just test`,
   `pnpm typecheck`) and any behaviour to demonstrate.
5. **Report**: end your final message with a block headed `SUMMARY` listing
   status (done, partial, blocked), files changed, commit hash if committed,
   test command and result, open questions. Nothing after the block.

Leave out your own reasoning, the user's wording, and anything the worker can
read from the repo. A brief over forty lines is carrying context the worker
should fetch itself.

Code-review briefs replace parts 2 to 4 with: the diff or branch to review,
and "report only findings that change behaviour or correctness, each with
file, line, problem, fix."

Plan-review briefs to Agy: the plan file path, your current position, what
you are unsure of, and "challenge the weakest point, concede only to better
arguments". The `agy` skill has the full shape.

## Run and collect

```bash
herdr agent prompt <name> "<brief>"
```

Never pass `--wait`: it blocks this session for the worker's whole run. Send
the prompt, then wait in the background so you stay free for the user:

```bash
# Bash tool with run_in_background: true
herdr agent wait <name> --timeout 900000
```

Or keep working and poll `herdr agent get <name>` before collecting.

On `blocked`: `herdr agent read <name> --source recent-unwrapped --lines 60`,
show the user what the worker is asking, act on their answer. Never answer an
approval dialog on the user's behalf.

On `idle` or `done`: read the pane, take the `SUMMARY` block. If there is no
block, prompt once: "Reply with only the SUMMARY block." Then read again.

Trust nothing in the summary until you have run the **Done when** command
yourself in the worker's cwd. A summary that says done with failing tests is
a partial. Send the failure output back as the next prompt; after two rounds,
surface it to the user.

Report to the user in the shape of your normal reply: what changed, what is
verified, what is open. Mention the worker name once so they can peek.

## Worker lifetime

Reuse a worker whose name exists, whose cwd matches, and whose next task
continues the same module. Otherwise start a fresh one; a fresh worker with a
good brief beats a stale one with history.

When a workstream is finished and merged, release the pane you created.
Never close panes, worktrees, or sessions you did not create.
