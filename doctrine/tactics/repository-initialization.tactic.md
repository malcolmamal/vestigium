# Tactic: Repository Initialization

**Invoked by:**
- [Directive 003 (Repository Quick Reference)](../directives/003_repository_quick_reference.md)
- Shorthand: [`/bootstrap-repo`](../shorthands/bootstrap-repo.md)

---

## Intent

Bootstrap a new repository with standard directory structure, configuration files, and initial documentation per Regnology Professional Services Agent Framework.

**Apply when:**
- Creating new repository from template or scratch
- Migrating existing project to Regnology Professional Services Agent Framework
- Setting up derivative repository from parent

---

## Execution Steps

### 1. Create Directory Structure
```
├── doctrine/             # Portable framework (git subtree)
├── docs/                 # Canonical documentation
├── specifications/       # Optional functional specs
├── src/                  # Production code
├── tests/                # All test code
├── tools/                # Development utilities
├── fixtures/             # Test data
└── work/                 # Operational artifacts
    ├── collaboration/    # Task orchestration
    ├── reports/          # Work logs, reflections
    └── notes/            # Exploratory scratch
```

### 2. Generate Configuration Files
- [ ] `.doctrine-config/config.yaml` (repository settings)
- [ ] `.gitignore` (standard exclusions)
- [ ] `README.md` (project overview)
- [ ] `.github/workflows/` (CI/CD if applicable)

### 2a. Configure Code Ownership (Bitbucket)
When the repository is hosted on **Bitbucket Cloud**, set up CODEOWNERS to automate reviewer assignment on pull requests.

- [ ] Create `.bitbucket/` directory in repository root
- [ ] Copy `doctrine/templates/structure/CODEOWNERS` → `.bitbucket/CODEOWNERS`
- [ ] Copy `doctrine/templates/structure/teams.yaml` → `.bitbucket/teams.yaml`
- [ ] Replace all `{{placeholder}}` values with actual email addresses / workspace slugs:
  - Global fallback owner
  - Per-technology and per-path owners
  - Team contributor lists and review strategies
- [ ] Confirm ownership coverage with the team lead or repository administrator
- [ ] Add `.bitbucket/CODEOWNERS` ownership rule for the VCS config itself (meta-owner)

**Key rules to verify before commit:**
- Last matching pattern wins — more specific rules must appear lower in the file
- `@teams/` references must resolve to entries in `teams.yaml`
- `@workspace-slug/group-slug` references must resolve to real Bitbucket workspace groups
- Selection strategies (`least_busy`, `random`, `all`) are set appropriately per path risk

> Reference: [Bitbucket CODEOWNERS documentation](https://support.atlassian.com/bitbucket-cloud/docs/set-up-and-use-code-owners/)  
> Templates: `doctrine/templates/structure/CODEOWNERS`, `doctrine/templates/structure/teams.yaml`

### 3. Initialize Documentation
- [ ] `docs/README.md` (documentation index)
- [ ] `docs/architecture/adrs/README.md` (ADR index)
- [ ] `CHANGELOG.md` (version history)

### 4. Configure Tooling
- [ ] Package manager files (package.json, requirements.txt, etc.)
- [ ] Linter/formatter config
- [ ] Test runner config

### 4a. Configure Regnology MCP Server

When the repository uses the Regnology MCP server for Jira, Bitbucket, Confluence, and rcloud integration:

- [ ] Ensure the `regnology-mcp` repository is cloned and built locally (`pnpm install && pnpm build`)
- [ ] Set the `REGNOLOGY_MCP_PATH` environment variable in your shell profile (e.g. `~/.zshrc`, `~/.bashrc`) to the absolute path of the `regnology-mcp` checkout:
  ```bash
  export REGNOLOGY_MCP_PATH="/path/to/regnology-mcp"
  ```
- [ ] Copy `.env.example` from the `regnology-mcp` repo to `.env.regnology-mcp` in the repository root
- [ ] Ensure `.env.regnology-mcp` is listed in `.gitignore` (must never be committed)
- [ ] Prompt the user to fill in their Personal Access Tokens:
  - `JIRA_PAT` — Jira Server PAT (from https://jira.regnology.net)
  - `BITBUCKET_PAT` — Bitbucket Server PAT (from https://bitbucket.regnology.net)
  - `CONFLUENCE_PAT` — Confluence Server PAT (from https://confluence.regnology.net)
  - rcloud uses Okta device authorization (no PAT needed)
- [ ] Optionally configure `ACCESS_MODE`, `JIRA_PROJECTS`, `BITBUCKET_REPOS`, `CONFLUENCE_SPACES`

**Verification:** Restart Cursor and check that `regnology-mcp` appears as a connected MCP server in Settings > MCP.

> Reference: `regnology-mcp` repository README for full environment variable documentation

### 5. First Commit
- [ ] Stage all files
- [ ] Commit with message: "Initial repository structure"
- [ ] Tag as `v0.1.0` if appropriate

---

## Outputs
- Complete directory structure
- Configuration files
- Initial documentation
- First commit

---

**Status:** ✅ Active
