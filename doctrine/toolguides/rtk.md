# Toolguide: RTK (Rust Token Killer)

**Version:** 0.30.0 (as installed)
**Binary:** `rtk`
**Directive:** `doctrine/directives/001_cli_shell_tooling.md`

---

## Purpose

High-performance CLI proxy that filters and summarises command output before it reaches the LLM context window. Achieves 60–90% token savings on routine development operations by stripping boilerplate, compressing tables, truncating verbose output, and grouping results.

## Critical: Output Obfuscation

**RTK obfuscates terminal output by default.** It is designed to reduce tokens, not to show you everything. This means:

- Successful operations are often collapsed to `ok ✓`
- Verbose output (progress bars, banners, informational lines) is stripped
- Long diffs are condensed to changed-line summaries
- Dependency lists show counts instead of individual packages

**When you need full output** (debugging, verifying exact content, investigating failures), use the verbosity flags:

| Flag | Level | Behaviour |
|---|---|---|
| _(none)_ | Default | Maximum compression — token-optimised |
| `-v` | Verbose | Filtered sections shown as summaries |
| `-vv` | Very verbose | Most output with light compression |
| `-vvv` | Raw | Unfiltered — equivalent to running the native command directly |

```bash
rtk git status                # Default: compact, may hide clean files
rtk -v git status             # Summaries of filtered sections
rtk -vv git status            # Near-full output
rtk -vvv git status           # Identical to raw `git status`
```

**Rule of thumb:** Start without flags. If the output looks incomplete or you're debugging, escalate to `-v`, then `-vv`, then `-vvv`.

## Subcommands

RTK wraps common CLI tools with specialised filters. Each subcommand understands the tool's output format and compresses accordingly.

### Git

```bash
rtk git status                # Compact status (staged/unstaged/untracked counts)
rtk git diff                  # Ultra-condensed diff (changed lines only)
rtk git log                   # One-line commit history
rtk git show                  # Commit summary + stat + compacted diff
rtk git add .                 # → "ok ✓"
rtk git commit -m "msg"       # → "ok ✓ <hash>"
rtk git push                  # → "ok ✓ <branch>"
rtk git branch                # Compact branch listing
```

### Search

```bash
rtk grep 'pattern'            # Compact ripgrep (strips whitespace, truncates, groups)
rtk grep -m 20 'pattern'     # Max 20 results (default 50)
rtk grep -t py 'pattern'     # Filter by file type
rtk grep -l 80 'pattern'     # Max line length 80 chars
rtk find -name '*.md'        # Compact find output (tree format)
```

### File Operations

```bash
rtk ls -la                    # Compact directory listing
rtk tree                      # Token-optimised tree output
rtk read file.py              # Intelligent file reading with filtering
rtk read -l aggressive file   # Aggressive filtering (strip comments, blanks)
rtk wc -l *.py                # Compact word/line count
rtk diff file1 file2          # Ultra-condensed diff
```

### Testing

```bash
rtk test pytest               # Show only failures (suppress passing tests)
rtk test npm                  # Show only failures
rtk pytest                    # Direct pytest filter
rtk vitest                    # Vitest compact output
```

### Build Tools

```bash
rtk npm run build             # Filtered npm output (strip boilerplate)
rtk pnpm install              # Ultra-compact pnpm
rtk tsc                       # Grouped TypeScript errors
rtk lint                      # Grouped ESLint violations
rtk format                    # Universal format checker
rtk cargo build               # Compact cargo output
rtk dotnet build              # Compact .NET output
```

### Infrastructure

```bash
rtk docker ps                 # Compact container listing
rtk kubectl get pods          # Compact pod listing
rtk aws s3 ls                 # Compact AWS output (force JSON, compress)
rtk psql -c 'SELECT ...'     # Strip table borders
```

### Analysis

```bash
rtk json file.json            # Show JSON structure without values
rtk deps                      # Summarise project dependencies
rtk env                       # Environment variables (sensitive values masked)
rtk smart file.py             # 2-line heuristic summary of any file
rtk summary <cmd>             # Run command and show heuristic summary
rtk err <cmd>                 # Run command and show only errors/warnings
rtk log <cmd>                 # Filter and deduplicate log output
```

## Meta Commands

These are RTK-specific (not proxying another tool):

```bash
rtk gain                      # Token savings analytics
rtk gain --history            # Command usage history with savings
rtk discover                  # Analyse Claude Code history for missed opportunities
rtk session                   # RTK adoption across sessions
rtk cc-economics              # Spending vs savings analysis
rtk proxy <cmd>               # Run command without filtering (for debugging)
rtk config                    # Show or create configuration
rtk verify                    # Verify hook integrity
```

## Hook-Based Usage

When RTK hooks are installed (via `rtk init`), common commands are automatically rewritten:

```
git status  →  rtk git status     (transparent, zero overhead)
rg pattern  →  rtk grep pattern   (token-optimised search)
```

The hook rewrites are transparent — you type the native command and RTK intercepts it. Use `rtk proxy <cmd>` to bypass hooks when needed.

## Installation

```bash
cargo install rtk              # From crates.io
rtk --version                  # Verify: should show rtk X.Y.Z
rtk init                       # Set up hooks in CLAUDE.md
```

⚠️ **Name collision:** If `rtk gain` fails with "unknown command", you may have `reachingforthejack/rtk` (Rust Type Kit) installed instead. Check `which rtk` and ensure it points to the token-killer binary.

## When to Use RTK vs Native Commands

| Context | Use | Rationale |
|---|---|---|
| Agent workflow (Cursor, Claude, Copilot) | `rtk` | Token savings compound across a session |
| Debugging unexpected output | `rtk -vvv` or native | Need to see full unfiltered output |
| Interactive human terminal | Native (`git`, `rg`, etc.) | No token budget to optimise for |
| CI/CD pipelines | Native | Output is for logs, not LLM context |

## Related

- `doctrine/toolguides/ripgrep.md` — Full ripgrep toolguide (`rg` is what `rtk grep` wraps)
- `doctrine/directives/001_cli_shell_tooling.md` — CLI rubric
- `doctrine/directives/042_model_discipline.md` — Cost-aware execution (RTK complements model discipline by reducing token waste)
