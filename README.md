# cogitlog

Semantic session memory for AI agents working in codebases.

cogitlog records what an AI agent did, decided, and why — stored alongside git history so future agents (and humans) can understand not just *what* changed but *why*.

## Install

```sh
npm install -g cogitlog
```

## Quick start

```sh
# In your project
cogitlog init

# At the start of every AI task
cogitlog begin "add dark mode toggle"

# During the task
cogitlog note "using CSS custom properties, not a theme provider"
cogitlog decision "store preference in localStorage, not a cookie" \
  -a "cookie:overkill for a UI-only setting"
cogitlog attempt "toggling class on <html>" --outcome failed \
  --reason "SSR mismatch on first render"
cogitlog uncertainty "not sure if prefers-color-scheme should override manual toggle"

# At the end
cogitlog close --outcome completed
```

## Commands

| Command | Description |
|---|---|
| `init` | Initialize `.cogitlog/` in the current directory |
| `remindme` | Append cogitlog reminder to agent instruction files (CLAUDE.md, etc.) |
| `begin "<intent>"` | Open a new session |
| `note "<text>"` | Add a free-form note |
| `decision "<text>"` | Record a decision (supports `--alternative "option:reason"`) |
| `attempt "<text>" --outcome <succeeded\|failed\|partial>` | Record an attempt and its outcome |
| `uncertainty "<text>"` | Flag something you are not sure about |
| `close --outcome <completed\|partial\|abandoned\|interrupted>` | Close the current session |
| `log` | List recent sessions |
| `show [session-id]` | Show full detail of a session |
| `why <file>` | Show decisions that touched a file |
| `query "<text>"` | Search sessions by intent / outcome note |
| `status` | Show the current session status |
| `onboard` | Print usage instructions (useful to paste into agent context) |
| `hook install` | Install a post-commit hook that auto-closes sessions on `git commit` |
| `repair` | Rebuild `index.jsonl` from session files |

## How it works

`cogitlog init` creates a `.cogitlog/` directory with:

- `index.jsonl` — lightweight index of all sessions (intent, outcome, files touched)
- `sessions/<id>.jsonl` — full event log per session
- `AGENTS.md` — instructions for agents that discover the directory

It also appends a usage reminder to any existing agent instruction files it finds (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.cursorrules`, etc.).

Sessions are plain JSONL files — no server, no database.

## Integrating with your agent workflow

After `cogitlog init`, agents that read `CLAUDE.md` (or equivalent) will see the reminder automatically. For projects where cogitlog was initialized without an instruction file, run:

```sh
cogitlog remindme
```

This appends the reminder to any existing instruction files, or creates `CLAUDE.md` if none are found.

## License

MIT
