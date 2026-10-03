---
name: using-pogg
description: >
  Use pogg (formerly pgplease) to provision local PostgreSQL databases and owner
  logins, pass connection credentials to development commands, or diagnose and
  repair managed database objects. Use when a task involves pogg or pgplease;
  not for general SQL or production database administration.
---

# Use pogg

## Inspect before provisioning

Use `--json` for `instance list`, `list`, `info`, and `doctor` to get structured output and errors. Keep URL capture in its plain-output form.

1. Run `pogg --help` to confirm availability. If unavailable, ask the user to install it; don't install software or start Docker implicitly. Consult subcommand `--help` for flags instead of guessing.
2. Run `pogg instance list` and `pogg list`. For an existing app, run `pogg info APP`. Replace `APP` with the requested app name throughout these instructions.
3. Confirm the target is the intended development server. Reuse an existing matching app; if the target is ambiguous, ask before changing anything. A registered or default instance is not proof that a server is safe to modify. Production changes require separate explicit authorization.

## Provision only what's missing

- For a new app with one database and login, use `pogg create APP --on INSTANCE`. Replace `INSTANCE` with the confirmed registered instance. Prefer explicit selection over changing the user's default. `pogg app create` creates only an empty logical app.
- If the user selects an existing running Docker container, `pogg create APP --container CONTAINER` can auto-register its instance. Replace `CONTAINER` with its name. Existing-app metadata, credential, and management commands require prior registration with `pogg instance add NAME --container CONTAINER`; replace `NAME` with the chosen instance name. `doctor` and `sync` can still auto-register through container resolution, so prefer `--on INSTANCE` for diagnostics and repairs. Starting, creating, or stopping containers requires separate permission.
- If registration is needed, consult `pogg instance add --help`. Have the user supply admin credentials through the configured password environment variable; never request passwords in chat or put them in command arguments.
- Add databases or users only when the task requires them. Specify database aliases with `--db` when adding users. All supported access is owner access, not read-only access or tenant isolation.

Finish by checking `pogg info APP` against the requested databases, users, and instance.

## Pass credentials without displaying them

Choose `APP/USER` explicitly when the app has multiple users, and `--db DATABASE` when the user has multiple databases. Replace `USER` and `DATABASE` with aliases from the app metadata.

Capture the URL and pass it directly to the authorized consumer. For example, if the project uses `npm run migrate` and the user authorized migrations:

```sh
(
  set +x # Prevent shell tracing from echoing the connection URL.
  DATABASE_URL="$(pogg url APP/USER --db DATABASE)" || exit
  export DATABASE_URL
  npm run migrate
)
```

The assignment must succeed before running the consumer, so a failed lookup cannot fall through to its default database. Use the project's actual command and confirm it doesn't log credentials.

Treat URL, password, JSON, and env credential output as secrets. Keep it out of tool output, chat, logs, and committed files. Don't evaluate `pogg get --format env` output as shell code. Persist credentials only with explicit permission, using an ignored file with restricted permissions. Leave pogg's state and secret files under CLI control. Configuration still lives in `~/.config/pgplease` (or `$XDG_CONFIG_HOME/pgplease`), unless `PGPLEASE_CONFIG_DIR` overrides it.

Finish by checking the consumer's exit status; report the app, database alias, and outcome without the URL or password.

## Diagnose before repairing or deleting

1. Run `pogg doctor APP --on INSTANCE --json` to inspect drift on the confirmed instance before proposing repairs. For a requested global check, `pogg doctor --json` contacts every registered instance; it isn't necessarily cheap. Without an explicit instance or container selector, doctor can rediscover the default container and update configuration, even with `APP` supplied.
2. Explain the affected objects and obtain explicit approval before `sync`, password resets, or deletion. `sync` can recreate empty databases; it does not recover data. Password resets invalidate existing credentials. App deletion removes every managed database and user in that app.
3. Apply only the approved operation. Use `--force` only when the user explicitly approved skipping confirmation; it does not terminate active connections. If connections block deletion, report the blocker instead of killing sessions. Delete referencing users before an individual database.
4. Verify repairs with `pogg doctor APP --on INSTANCE --json`; verify deletions with `pogg list --json` or the surviving app's metadata. Report remaining drift or blockers rather than claiming recovery.
