# dotfiles

Personal dotfiles managed with [GNU Stow](https://www.gnu.org/software/stow/).

Each top-level directory is a Stow "package" that mirrors the layout of `$HOME`:

```
.
├── agents/                      # stow package
│   └── .agents/                 # → ~/.agents/
│       └── skills/…
└── opencode/                    # stow package
    └── .config/opencode/        # → ~/.config/opencode/
        └── …
```

## Requirements

- [GNU Stow](https://www.gnu.org/software/stow/) — `brew install stow` on macOS.
- Git (with submodule support).

## Install

1. Clone into a stable location (Stow symlinks point back here, so don't delete the clone after installing):

   ```sh
   git clone --recurse-submodules git@github.com:cheetahbyte/dotfiles.git ~/Developer/dotfiles
   cd ~/Developer/dotfiles
   ```

   If you already cloned without submodules:

   ```sh
   git submodule update --init --recursive
   ```

2. Stow every package into `$HOME` (default target is the parent of the stow dir, which would be `~/Developer/` — `-t ~` forces `$HOME`):

   ```sh
   stow -t ~ agents opencode
   ```

   That's it. Stow creates symlinks in `$HOME` pointing back into this repo:

   - `~/.agents` → `~/Developer/dotfiles/agents/.agents`
   - `~/.config/opencode` → `~/Developer/dotfiles/opencode/.config/opencode`

   Stow is idempotent — re-running it won't clobber existing symlinks it already manages.

## Installing a single package

```sh
stow -t ~ agents      # only the agents package
stow -t ~ opencode    # only the opencode package
```

## Uninstall

From the repo root:

```sh
stow -t ~ -D agents opencode
```

`-D` deletes only the symlinks Stow created. Your real files in the repo stay intact.

## Notes

- **Existing directories:** if `~/.config` already exists as a real directory (not a symlink), Stow is smart enough to recurse into it and symlink only the child (`~/.config/opencode`), leaving `~/.config` untouched.
- **Conflicts:** if a non-symlink file already exists at a target path (e.g. a previous `~/.config/opencode/opencode.json` you hand-created), Stow will refuse to overwrite it. Back up the existing file, remove it, then re-run `stow -t ~`.
- **Adopting existing files:** to let Stow take over an existing file instead of erroring, use `stow --adopt` — it moves the existing file into the package directory and creates the symlink in its place.
- **Don't move the repo after installing.** Symlinks are absolute to this path. If you relocate it, unstow first (`stow -D …`), move, then re-stow from the new location.
- **Editing config:** edit files in place here in the repo — the symlinks mean changes are live immediately. Commit when happy.

## Restow after pulling updates

```sh
git pull --recurse-submodules
stow -t ~ -R agents opencode   # -R = restow: remove + recreate symlinks
```

`-R` is useful if package layouts changed and old symlinks need cleaning up.
