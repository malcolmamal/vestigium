<!--
████          R E G N O L O G Y
    ██        Professional Services
████
    ██        professional_services@regnology.net

Agent:    Curator Claire (doctrine/agents/curator.agent.md)
Tactic:   documentation-curation-audit (doctrine/tactics/documentation-curation-audit.tactic.md)
Persona:  Software Engineer / Platform Engineer (doctrine/docs/audience/software_engineer.md — UUID-SE-001)
Directives: 004 (Documentation & Context Files), 022 (Audience Oriented Writing)
-->

# HowTo Guide: Setting Up the Regnology MCP Server in Cursor

## Outline

This guide shows you how to connect Cursor's AI assistant to internal Regnology systems — Jira, Confluence, Bitbucket, and rCloud — using the Regnology MCP server.

The approach is **prompt-driven**: you give your Cursor agent a single prompt and it handles installation, configuration, and file creation for you. You only need to supply your credentials.

**Who is this for?**
Regnology developers and consultants using Cursor who want their AI assistant to query internal systems without leaving the editor.

---

## Prerequisites

| Requirement | Reference / Description |
|---|---|
| Cursor installed | [cursor.com](https://cursor.com) — any recent version with MCP support |
| Node.js v20+ | Run `node --version` to check. Use [nvm](https://github.com/nvm-sh/nvm) to install if needed. |
| pnpm | Run `npm install -g pnpm` if not present |
| `regnology-mcp` repo cloned locally | Request Bitbucket access (project: CONS, repo: `regnology-mcp`), then `git clone` it |
| Personal Access Tokens for Jira, Confluence, Bitbucket | See Step 1 — generate these before running the setup prompt |

---

## Step-By-Step Walkthrough

### Step 1: Generate your Personal Access Tokens

The agent cannot do this for you — PAT generation requires browser login to each system. Do this first and keep the tokens ready to paste.

| System | Where to generate |
|---|---|
| **Jira** | `https://jira.regnology.net/secure/ViewProfile.action` → Personal Access Tokens |
| **Bitbucket** | `https://bitbucket.regnology.net/plugins/servlet/access-tokens/manage` |
| **Confluence** | `https://confluence.regnology.net` → Profile (top right) → Personal Access Tokens |

> Each token is shown only once. Copy it to a safe place before closing the page.

### Step 2: Run the setup prompt in Cursor

| Description | Example |
|---|---|
| Open a new Cursor chat. Paste the prompt below — replacing `<PATH_TO_MCP_REPO>` with your local clone path — and press Enter. The agent will read the repo, build the server, and create all required config files. | See prompt below |

```
I want to set up a connection to the regnology MCP server. The code of the server
as well as its installation instructions are located at <PATH_TO_MCP_REPO>.
Create a .cursor/mcp.json file and a gitignored .env.regnology-mcp file
(to contain PAT and configs).

Tell me how to configure and test it.

Adhere to directives 014 and 015 at the end of the session!
```

**What the agent will do automatically:**
- Read the repo README and `.env.example`
- Run `pnpm install && pnpm build`
- Create `~/.cursor/mcp.json` pointing to the built server
- Create `.env.regnology-mcp` with placeholder values

### Step 3: Fill in your PATs

| Description | Example |
|---|---|
| Open `.env.regnology-mcp` inside the repo. Replace each placeholder with the tokens you generated in Step 1. The file is gitignored and must never be committed. | See template below |

```
ACCESS_MODE=read

JIRA_BASE_URL=https://jira.regnology.net
JIRA_PAT=<your-jira-pat>

BITBUCKET_BASE_URL=https://bitbucket.regnology.net
BITBUCKET_PAT=<your-bitbucket-pat>

CONFLUENCE_BASE_URL=https://confluence.regnology.net
CONFLUENCE_PAT=<your-confluence-pat>

# rCloud uses Okta Device Flow — no PAT needed
```

> `ACCESS_MODE=read` is the safe default. It disables all write tools (commenting, creating issues, approving PRs). Only change to `readwrite` if you know what you're doing.

### Step 3b: Verify the mcp.json location

| Description | Example |
|---|---|
| By default the agent creates `~/.cursor/mcp.json` as a **global** Cursor config, applying the MCP server to all your projects. This is the recommended approach for most users. If you prefer per-project configuration, move `mcp.json` to `.cursor/mcp.json` inside your project repo instead. | Max uses the global location: `/home/max/.cursor/mcp.json` |

> After any changes to `mcp.json` or `.env.regnology-mcp`, restart Cursor fully for them to take effect.

### Step 4: Restart Cursor

| Description | Example |
|---|---|
| Fully quit and reopen Cursor so the MCP server loads with your credentials. | Linux/Mac: `Ctrl+Q` then relaunch. Windows: close from taskbar, relaunch. |

### Step 5: Verify the connection

| Description | Example |
|---|---|
| Open a new Cursor chat and try one of the prompts below. A real response (not an error) confirms the setup is working. | |

```
List my Jira issues
```
```
Who am I in rCloud?
```
```
Fetch this Confluence page: https://confluence.regnology.net/spaces/MIGRATIONS/pages/279809163/HowTo+Guide+-+Template
```

> **rCloud — first use only:** A browser window will open for Okta Device Flow login. Sign in with your Regnology SSO credentials. Tokens are cached in `~/.regnology-mcp/` and auto-refreshed.

---

## What You Can Do After Setup

| System | Example prompts |
|---|---|
| **Jira** | "List my open Jira issues" · "Show all In Progress issues in project DEV" · "Get details on DEV-2877 including linked PRs" |
| **Confluence** | "Fetch this Confluence page: [URL]" · "Search for deployment guides in the MIGRATIONS space" |
| **Bitbucket** | "List open PRs in project CONS" · "Show me the diff for PR #42 in repo regnology-mcp" |
| **rCloud** | "List all tenants in prod" · "What version is this instance running?" · "Show me backups for tenant X" |

---

## Known Limitations

- All tools run in `ACCESS_MODE=read` by default — no writes, comments, issue creation, or rCloud mutations.
- Confluence requires the **numeric page ID** from the URL (e.g. `279809163`), not the page title or slug.
- `jira_my_issues` returns only issues assigned to you. Use a prompt like "Show issues in project DEV" to browse a project.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "MCP server failed to start" | Verify `dist/index.js` exists — re-run `pnpm build` in the repo. Check the node path in `~/.cursor/mcp.json` matches `which node`. |
| Jira/Confluence/Bitbucket returns 401 | PAT expired or incorrect — regenerate and update `.env.regnology-mcp`, then restart Cursor. |
| rCloud prompts for login every time | Check `~/.regnology-mcp/` is writable — token cache lives there. |
| Changes to `.env.regnology-mcp` not picked up | Restart Cursor fully after any change to the env file or `mcp.json`. |

---

## Metadata

**Persona served:** Software Engineer / Platform Engineer (`UUID-SE-001`)
**Agent:** Curator Claire (`doctrine/agents/curator.agent.md`)
**Tactic:** Documentation Curation Audit (`doctrine/tactics/documentation-curation-audit.tactic.md`)
**Directives:** 004 (Documentation & Context Files), 022 (Audience Oriented Writing)
**Date:** 2026-04-01
**Version:** 1.2.0
**Status:** Current
