---
packaged: true
audiences: [software_engineer, tech_coach]
note: Commit message and markdown formatting standards with tooling configuration.
---

# Commit and Markdown Linting Style Guide

Standards for commit messages and markdown formatting across Regnology Professional Services repositories.

---

## Commit Messages

### Standard: Conventional Commits

All commits follow [Conventional Commits v1.0.0](https://www.conventionalcommits.org/).

```
<type>(scope): <description>

<body>

<footer>
```

### Allowed Types

| Type | Purpose |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, whitespace (no logic change) |
| `refactor` | Code restructuring (no new feature, no fix) |
| `perf` | Performance improvement |
| `test` | Adding or correcting tests |
| `build` | Build system or external dependencies |
| `ci` | CI/CD configuration |
| `chore` | Maintenance, tooling, config |
| `revert` | Revert a previous commit |
| `arch` | Architecture decision record |
| `plan` | Planning artifact |
| `review` | Review artifact |
| `cursor` | Cursor IDE integration |

### Rules

- **Header** max 100 characters
- **Type** lowercase, from the table above
- **Scope** lowercase, optional, parenthesized
- **Subject** no uppercase start, no trailing period
- **Body** separated by blank line, max 120 chars/line
- **Footer** separated by blank line (for `BREAKING CHANGE:`, `Refs:`, etc.)

### Phase Declarations

For spec-driven development (Directive 034), use phase commit messages. See `doctrine/guidelines/commit-message-phase-declarations.md`.

### Tooling

- **Config:** `.commitlintrc.yaml` (repo root)
- **Install:** `npm install --save-dev @commitlint/cli @commitlint/config-conventional`
- **Run:** `echo "feat: add feature" | npx commitlint`
- **Git hook:** `npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'`

---

## Markdown Formatting

### Rules

| Rule | Setting | Rationale |
|------|---------|-----------|
| Line length | 120 chars (code/tables exempt) | Prose-heavy doctrine files need breathing room |
| Heading style | ATX (`# Heading`) | Consistency across all docs |
| List marker | Dash (`-`) | Matches existing doctrine convention |
| Ordered lists | Sequential (`1. 2. 3.`) | Easier to read in diffs |
| Code fences | Backtick (`` ``` ``) | Universal support |
| Inline HTML | Allowed | Used in agent profiles and templates |
| Duplicate headings | Allowed in different sections | Common in multi-section docs |
| First-line heading | Not required | YAML frontmatter is standard |
| Bare URLs | Allowed | Common in reference sections |

### Scope

Lint applies to:
- `doctrine/**/*.md`
- `docs/**/*.md`
- `specifications/**/*.md`
- Root `*.md` files (`AGENTS.md`, `README.md`, etc.)

Lint does NOT apply to:
- `work/**/*.md` (scratch space, lower standards)
- Generated files (`.cursor/skills/`, `.github/instructions/`)

### Tooling

- **Config:** `.markdownlint.yaml` (repo root)
- **Install:** `npm install --save-dev markdownlint-cli2`
- **Run:** `npx markdownlint-cli2 "**/*.md"`
- **Fix:** `npx markdownlint-cli2 --fix "**/*.md"`
- **Cursor hook:** `doctrine/cursor/hooks/check-markdown-lint.sh` (afterFileEdit, non-blocking)

### IDE Integration

- **VS Code / Cursor:** Install `davidanson.vscode-markdownlint` extension. Config auto-detected from `.markdownlint.yaml`.

---

## Cursor Hook

A `check-markdown-lint.sh` afterFileEdit hook runs markdownlint on edited `.md` files (excluding `work/`). It is advisory — issues are reported as `agent_message` but do not block edits.

The hook prefers the project-local `node_modules/.bin/markdownlint-cli2`, falls back to a global install, and silently skips if neither is available.

---

## Related

- `.commitlintrc.yaml` — commitlint configuration
- `.markdownlint.yaml` — markdownlint configuration
- `doctrine/guidelines/commit-message-phase-declarations.md` — phase commit format
- `doctrine/styleguides/version_control_hygiene.md` — branching and VCS practices
