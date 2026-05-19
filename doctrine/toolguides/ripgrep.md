# Toolguide: ripgrep (`rg`)

**Version:** 15.1.0 (as installed)
**Binary:** `rg`
**Project:** [github.com/BurntSushi/ripgrep](https://github.com/BurntSushi/ripgrep)
**Directive:** `doctrine/directives/001_cli_shell_tooling.md`

---

## Purpose

Recursively search directories for regex patterns. Respects `.gitignore` by default, skips hidden files and binary files, and is significantly faster than `grep` on large codebases.

**Always prefer `rg` over `grep` in agent workflows.**

## When to Use

| Scenario | Use `rg` | Use `ast-grep` instead |
|---|---|---|
| Plain-text pattern search | ✅ | |
| Regex across file types | ✅ | |
| Structural code queries (functions, classes) | | ✅ |
| Finding files by content | ✅ | |
| Listing files without searching content | ✅ (`rg --files`) | |

## Quick Reference

```bash
rg 'pattern'                            # Recursive search from cwd
rg 'pattern' path/to/dir/              # Search specific directory
rg -l 'pattern'                         # List file paths only (no content)
rg -c 'pattern'                         # Count matches per file
rg -i 'pattern'                         # Case-insensitive
rg -w 'word'                            # Whole-word match
rg -e 'pat1' -e 'pat2'                  # Multiple patterns (OR)
```

### File Filtering

```bash
rg -t py 'def '                         # Search only Python files
rg -t md -t yaml 'pattern'             # Search Markdown and YAML
rg -T js 'pattern'                      # Exclude JavaScript files
rg --glob '*.md' 'pattern'             # Filter by glob pattern
rg --glob '!work/**' 'pattern'         # Exclude directories by glob
rg --type-list                           # List all recognized file types
```

### Context and Output

```bash
rg -A 3 'pattern'                       # 3 lines after each match
rg -B 2 'pattern'                       # 2 lines before each match
rg -C 5 'pattern'                       # 5 lines before and after
rg -n 'pattern'                         # Show line numbers (default on)
rg --no-line-number 'pattern'           # Hide line numbers
rg --json 'pattern'                     # JSON output (for piping to jq)
```

### Advanced

```bash
rg -U 'start.*\nend'                    # Multiline search (-U flag)
rg --files                               # List all searchable files
rg --files | rg '\.test\.'              # Find test files
rg -o '\b\w+Error\b'                    # Show only matching text
rg --stats 'pattern'                    # Show match statistics
rg -F 'literal.string'                  # Fixed-string (no regex)
```

## Common Patterns in This Repo

```bash
rg -t md 'docs/templates' doctrine/     # Find stale references
rg -l 'TODO\|FIXME' src/                # Find files with TODOs
rg --glob '!work/**' 'pattern'          # Search excluding scratch space
rg -t py 'def test_' tests/             # List test functions
rg --files --glob '*.agent.md' doctrine/ # List agent profiles
```

## Integration with Other Tools

```bash
rg -l 'pattern' | xargs wc -l          # Line count of matching files
rg -l 'pattern' | fzf                   # Interactive file selection
rg --json 'pattern' | jq '.data.lines'  # Structured output processing
fd -e md | xargs rg 'pattern'           # Combine with fd for complex filters
```

## Token-Optimized Alternative

When running in an agent context where token cost matters, use `rtk grep` instead of `rg` directly. It wraps ripgrep with output compression (truncation, grouping, whitespace stripping):

```bash
rtk grep 'pattern' src/                 # Compact output, max 50 results
rtk grep -m 20 'pattern'               # Limit to 20 results
rtk grep -t py 'pattern'               # Filter by file type
```

See `doctrine/toolguides/rtk.md` for the full RTK toolguide.

## Pitfalls

- **`.gitignore` is respected by default.** To search ignored files, use `rg --no-ignore`.
- **Hidden directories are skipped by default.** To include them, use `rg --hidden`.
- **Binary files are skipped.** To include them, use `rg --binary`.
- **Regex is Rust-flavour**, not PCRE. Lookaheads/lookbehinds are not supported. Use `-P` for PCRE2 if compiled with that feature.
- **Multiline requires `-U`** — without it, patterns match within single lines only.
