# Toolguide: Regnology MCP

**Interface:** Cursor MCP tools (read-only)
**Covers:** Jira · Confluence · Bitbucket · rCloud
**Directive:** `doctrine/directives/004_documentation_context_files.md`

---

## Purpose

Query Regnology's internal systems directly from Cursor without leaving the editor. All tools are **read-only** — no writes, comments, or mutations are supported.

## When to Use

| Need | Tool Group |
|------|-----------|
| Investigate a bug or task | Jira |
| Look up internal documentation | Confluence |
| Review code changes or PRs | Bitbucket |
| Check instance/tenant status | rCloud |

---

## Jira

### Tools

| Tool | Use for |
|------|---------|
| `jira_my_issues` | Issues assigned to the current user |
| `jira_my_projects` | Projects the current user is active in |
| `jira_project_issues` | All issues in a project (filter by status) |
| `jira_get_issue` | Full details of one issue, including linked PRs |
| `jira_search` | JQL queries |
| `jira_list_projects` | All visible projects (60+ at Regnology) |

### Common Queries

```
# My open issues
jira_my_issues()

# Open issues in DEV project
jira_project_issues(project: "DEV", excludeDone: true, maxResults: 20)

# JQL search
jira_search(jql: "project = DEV AND status = 'In Progress' AND assignee = currentUser()")

# Full issue with linked PRs
jira_get_issue(issueKey: "DEV-2877")
```

### Limitations

- Read-only: cannot create issues, post comments, or change status.

---

## Confluence

### Tools

| Tool | Use for |
|------|---------|
| `confluence_get_page` | Fetch a page by numeric ID |
| `confluence_get_page_children` | List child pages under a page |
| `confluence_search` | CQL queries across spaces |
| `confluence_get_space` | Space details and homepage |
| `confluence_list_spaces` | All spaces |

### Extracting the Page ID from a URL

```
https://confluence.regnology.net/spaces/MIGRATIONS/pages/279809163/HowTo+Guide+-+Template
                                                           ^^^^^^^^^
                                                           Page ID: 279809163
```

```
confluence_get_page(pageId: "279809163")
```

### Common Queries

```
# Search in a space
confluence_search(cql: "space = MIGRATIONS AND title ~ \"HowTo\"")

# Navigate page tree
confluence_get_page_children(pageId: "279809163")
```

### Limitations

- Read-only: cannot post comments, create pages, or edit content.

---

## Bitbucket

### Tools

| Tool | Use for |
|------|---------|
| `bb_list_repos` | List repos, filter by project key or name |
| `bb_list_branches` | Branches for a repo |
| `bb_list_prs` | PRs for a repo |
| `bb_get_pr` | Full PR details; set `includeDiff: true` for code diff |
| `bb_get_pr_comments` | Comments and discussions on a PR |
| `bb_get_file` | File content from a repo at a branch/commit |
| `bb_my_prs` | PRs authored by or reviewing current user |
| `bb_project_prs` | All open PRs across repos in a project |

### Common Queries

```
# All open PRs in a project
bb_project_prs(projectKey: "PROJ")

# PR with diff
bb_get_pr(projectKey: "PROJ", repoSlug: "my-repo", prId: 42, includeDiff: true)

# Read a file
bb_get_file(projectKey: "PROJ", repoSlug: "my-repo", filePath: "src/main.ts", ref: "main")
```

### Jira → PR workflow

```
1. jira_get_issue(issueKey: "DEV-2877")   # linked PRs are returned in output
2. bb_get_pr(..., includeDiff: true)       # review code changes
3. bb_get_pr_comments(...)                 # read review discussion
```

### Limitations

- Read-only: cannot create PRs, push code, post reviews, or approve PRs.

---

## rCloud

### Tools

| Tool | Use for |
|------|---------|
| `rcloud_list_tenants` | All tenants |
| `rcloud_get_tenant` | Tenant details |
| `rcloud_list_spaces` | Spaces for a tenant |
| `rcloud_get_space` | Space details (region, encryption, VPN, limits) |
| `rcloud_list_instances` | App instances for a tenant |
| `rcloud_get_instance` | Instance details (URL, version, state, schedules) |
| `rcloud_list_backups` | Backups for an instance |
| `rcloud_get_backup` | Single backup details |
| `rcloud_list_apps` | Available app types |
| `rcloud_list_app_versions` | Versions for a specific app |
| `rcloud_get_upgrade_versions` | Eligible upgrade versions for an instance |
| `rcloud_list_notifications` | Last 10 platform notifications |
| `rcloud_get_release_notes` | Release notes per environment |
| `rcloud_whoami` | Currently authenticated user |

### Environments

| Alias | Resolves to |
|-------|------------|
| `local` | local |
| `dev` or `eldia` | dev |
| `staging` or `marley` | staging |
| `prod` | prod |

### Common Queries

```
# Find a tenant and inspect its instances
rcloud_list_tenants(environment: "prod")
rcloud_list_instances(environment: "prod", tenantId: "<id>")
rcloud_get_instance(environment: "prod", tenantId: "<id>", instanceId: "<id>")

# Check backups
rcloud_list_backups(environment: "prod", tenantId: "<id>", instanceId: "<id>")

# Verify who you're authenticated as
rcloud_whoami(environment: "prod")

# Flat overview across all tenants/spaces/instances
rcloud_list_tenant_details(environment: "staging")
```

---

## Installation (Cursor)

1. Open **Cursor → Settings → MCP**
2. Add the Regnology MCP server config (obtain from your team)
3. Restart Cursor
4. Verify: run `rcloud_whoami` or `jira_my_issues` — both should return your identity

---

## Pitfalls

- **All tools are read-only.** Do not expect to post comments, create issues, push code, or trigger rCloud actions.
- **Confluence page IDs** are numeric — extract them from the URL, not the page title.
- **rCloud environment aliases:** `eldia` = dev, `marley` = staging. All four environments are accessible simultaneously.
- **Jira `jira_my_issues`** only returns issues assigned to the authenticated user. Use `jira_project_issues` to browse a project broadly.
