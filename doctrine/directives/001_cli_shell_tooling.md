<!-- The following information is to be interpreted literally -->

# 001 CLI and Shell Tooling Directive

**BYPASS CHECK:** FIRST, check whether a [
`work/notes/LOCAL_ENV.md`](/work/notes/LOCAL_ENV.md) file exists in the repository root. If it does, read its contents and follow any specific instructions or constraints outlined there regarding CLI and shell tooling usage. If no such file exists, or it is empty, proceed with the standard directives below.

---

## Python Virtual Environment

If a Python virtual environment (`.venv`) is available at the repository root, activate it **once per session** before running Python commands:

```bash
source .venv/bin/activate
```

After activation, the virtual environment remains active for all subsequent commands in the same shell session. Do not re-activate on every command.

### Windows (cmd and PowerShell)

If the virtual environment was created on Windows, use the Windows activation entry points instead of `source`:

```bat
.\.venv\Scripts\activate.bat
```

```powershell
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks script execution, use `cmd` with `activate.bat`, or for the current process only: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`.

**Symlinks and junctions:** Creating symbolic links may require elevated privileges or Developer Mode. For a **directory link** from a consumer repository to a sibling checkout (for example `.cursor` pointing at `../regnology-agent-doctrine/.cursor` for Cursor rules and skills), a **directory junction** often works when a symlink does not: from the consumer repository root, run `mklink /J ".cursor" "..\regnology-agent-doctrine\.cursor"` in **cmd** (elevated or Developer Mode as required by policy). Exact wording may also appear in that repository's `AGENTS.md`.

**HTTP checks:** Prefer `curl.exe` (Windows 10+), Git Bash `curl`, or PowerShell `Invoke-WebRequest -Uri <url> -UseBasicParsing` when a POSIX `curl` is not on `PATH`.

---

Use this rubric for shell operations:

- Find files: `fd`
- Find text: `rg` (ripgrep) — see `doctrine/toolguides/ripgrep.md`
- Token-optimized CLI proxy: `rtk` — see `doctrine/toolguides/rtk.md`
- AST/code structure (TS/TSX): `ast-grep`
    - `.ts`: `ast-grep --lang ts -p '<pattern>'`
    - `.tsx`: `ast-grep --lang tsx -p '<pattern>'`
    - Other languages: set `--lang` (e.g., `--lang rust`)
- Interactive selection: pipe matches to `fzf`
- JSON: `jq`
- YAML/XML: `yq`

Preference: If `ast-grep` is available, use it for structural queries; otherwise fall back to `rg` for plain‑text scanning.

### ripgrep (`rg`)

The default tool for recursive text search. Respects `.gitignore`, skips binary files, and supports full regex. Always prefer `rg` over `grep`.

Common patterns:

```bash
rg 'pattern'                          # Search current directory recursively
rg 'pattern' src/                     # Search specific directory
rg -t py 'def '                       # Filter by file type
rg -l 'pattern'                       # List matching file paths only
rg -c 'pattern'                       # Count matches per file
rg --files                            # List all files rg would search
rg -i 'pattern'                       # Case-insensitive
rg -w 'word'                          # Whole-word match
rg -A 3 -B 1 'pattern'               # Context lines (after/before)
rg --glob '*.md' 'pattern'           # Filter by glob
rg -U 'start.*\nend'                  # Multiline search
```

Full toolguide: `doctrine/toolguides/ripgrep.md`

### RTK (Rust Token Killer)

Token-optimized CLI proxy that filters and compresses command output before it reaches the LLM context. Saves 60–90% of tokens on routine shell operations.

**Key behaviour:** RTK **obfuscates terminal output by default** — it strips verbose information to save tokens. When you need to see full output for debugging, use verbosity flags:

- `-v` — show filtered sections as summaries
- `-vv` — show most output with light compression
- `-vvv` — show raw, unfiltered output (equivalent to running the native command)

Common patterns:

```bash
rtk git status                        # Compact git status
rtk git diff                          # Ultra-condensed diff
rtk grep 'pattern' src/               # Token-optimized ripgrep wrapper
rtk test pytest                       # Show only test failures
rtk ls -la                            # Compact directory listing
rtk git log                           # One-line commit history
rtk gain                              # Show token savings analytics
rtk gain --history                    # Show command usage history
rtk discover                          # Find missed optimization opportunities
```

When debugging unexpected output, always try `-v` first:

```bash
rtk -v git status                     # Slightly more detail
rtk -vvv git diff                     # Full unfiltered output
```

Full toolguide: `doctrine/toolguides/rtk.md`

## Dealing with Unreliable Tooling

**IMPORTANT:**
Terminal interaction can be unreliable in agent-based workflows. When you suspect flaky terminal behavior:

**Confirmation steps:**

1. create a new file in the repository's [`work/notes/tmp`](/work/notes/tmp) directory
2. attempt to interact with that file via the terminal
3. if interaction fails or is inconsistent, proceed with the remediation technique below and attempt to interact with the file again
4. if interaction is successful, continue with your task using the remediation technique
5. when the current micro task is complete, make note of the issue in the [
   `work/notes/LOCAL_ENV.md`](/work/notes/LOCAL_ENV.md) file for future reference. If the file does not exist, create it as per [/templates/automation/TEMPLATE-LOCAL_ENV.md](/templates/automation/TEMPLATE-LOCAL_ENV.md) and document the observed behavior

**Remediation Technique:**

1. Create a shell script in `tmp/remediation/` at the repository root
2. Pipe terminal output to files in the same directory
3. Execute the script and capture results from the output files
4. Clean up created files after completion
5. **Document the remediation** in your report/answer: "Applied remediation technique for flaky terminal interaction"

**Example:**

```bash
mkdir -p tmp/remediation
cat > tmp/remediation/fix_interaction.sh << 'EOF'
#!/bin/bash
command_output > tmp/remediation/output.txt 2>&1
EOF
chmod +x tmp/remediation/fix_interaction.sh
./tmp/remediation/fix_interaction.sh
cat tmp/remediation/output.txt
rm -rf tmp/remediation
```

**Windows:** If the environment has no POSIX shell, use equivalent `cmd` or PowerShell steps: create `tmp\remediation`, redirect command output to a file in that directory, read it back, then remove the directory when done.

Return Path: See AGENTS.md core for integration guidance.