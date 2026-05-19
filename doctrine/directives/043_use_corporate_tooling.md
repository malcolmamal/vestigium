# Directive 043: Use Corporate Tooling

**Status:** Active
**Applies To:** All agents
**Priority:** HIGH — Mandatory for all Regnology PS repositories
**Version:** 1.0.0
**Last Updated:** 2026-03-30

---

## Purpose

Ensure agents interact with corporate tools — Jira, Confluence, and related platforms — in a consistent, traceable, and standards-compliant manner. Corporate tooling is the shared communication surface between agents, developers, and stakeholders. Inconsistent or undisciplined use degrades traceability, erodes trust, and creates maintenance overhead.

---

## Scope

This directive applies whenever an agent:

- Creates, updates, or references Jira issues
- Creates, updates, or references Confluence pages
- Generates content intended for paste into a corporate tool
- Automates interactions with corporate tool APIs

---

## Rules

### 1. Follow the Jira Approach

Before creating or modifying any Jira content, agents MUST apply the principles in [Approach: Structured Issue Tracking with Jira](../approaches/regnology-jira-approach.md).

Key obligations:

- Every ticket must answer: **Why does this exist? What is in/out of scope? How do we know it is done?**
- Acceptance criteria must be **binary** (pass/fail). Vague criteria ("works as expected") are not acceptable.
- Every Deliverable-level ticket (Epic) must carry explicit **In Scope** and **Out of Scope** sections.
- The **Context** section must trace the ticket to a strategic goal, principle, or business capability.

### 2. Use the Standard Templates

When generating Jira ticket content, agents MUST use the templates in [`doctrine/templates/tickets/`](../templates/tickets/):

| Issue Level | Template |
|---|---|
| Deliverable (Epic) | [`EPIC_TEMPLATE.md`](../templates/tickets/EPIC_TEMPLATE.md) |
| Work Item (Story) | [`STORY_TEMPLATE.md`](../templates/tickets/STORY_TEMPLATE.md) |
| Step (Sub-task) | [`SUBTASK_TEMPLATE.md`](../templates/tickets/SUBTASK_TEMPLATE.md) |

Agents MUST use the **Jira wiki markup** variant when generating content for direct paste into Jira. Markdown syntax will not render correctly in Jira description fields.

### 3. Use Absolute URLs in Ticket Descriptions

All links in Jira or Confluence content MUST be **absolute URLs**. Relative paths will not resolve when tickets are viewed outside the repository (boards, email, Slack previews).

Use Jira wiki link syntax: `[display text|https://full-url]`

### 4. Maintain Name Consistency

Ticket names (Summary, Epic Name) MUST match the canonical names used in external documentation, repositories, and strategy documents.

- Establish a canonical name for each deliverable before creating tickets.
- Use it consistently across Jira, Confluence, repository names, and documentation.
- When a name must change, update all references simultaneously and note the change in the work log.

Name drift — where the same initiative is called different things in different places — is a traceability failure.

### 5. Apply Correct Jira Markup

Jira uses **Atlassian wiki markup**, not Markdown. Agents generating ticket content MUST use the correct syntax. The markup reference is in [`doctrine/templates/tickets/README.md`](../templates/tickets/README.md).

Common failure modes to avoid:
- `**bold**` → use `*bold*`
- `## Heading` → use `h2. Heading`
- `[text](url)` → use `[text|url]`

### 6. Respect API Constraints

When automating Jira interactions, agents MUST:

- **Verify field accessibility** before attempting to set custom fields via the API. Fields restricted by screen configuration will fail silently or with unhelpful errors.
- **Query available transitions** before executing a status transition. Transition IDs vary by issue type and current status — never hard-code them.
- **Use usernames, not display names**, when setting assignee fields.
- **Produce a human-readable manual action instruction** when automation cannot complete a step (e.g. "Manual action needed: set Parent Link for {key} to {parent} in the Jira UI").

### 7. Confluence Usage

When creating or updating Confluence pages:

- Follow the page structure conventions defined in the project's Confluence page template (if one exists in `work/confluence/` or equivalent).
- Link Confluence pages to their corresponding Jira Epics as remote links.
- Link Jira Epics back to their Confluence pages in the Traceability section.
- All Confluence page links in Jira descriptions must be absolute URLs.

### 8. Load Project-Specific Conventions from `.doctrine-config/`

Generic doctrine does not know a project's Jira URL, project key, label taxonomy, or API field IDs. Before generating ticket content or automating Jira interactions, agents MUST check for a local conventions file and apply it.

**Check in this order:**

1. `.doctrine-config/jira-conventions.md` — project-specific Jira conventions (preferred location)
2. `.doctrine-config/specific_guidelines.md` — general project overrides (fallback)

If neither file exists, agents MUST apply the generic approach principles and note in the work log that no project-specific conventions were found. Agents MUST NOT invent project-specific values (URLs, keys, field IDs) from memory or assumption.

**Conventions that belong in `.doctrine-config/` and nowhere else:**

- Jira instance URL and project key(s)
- Required label set for the programme or project
- Parent Link custom field name or ID
- Canonical base URLs for repositories and Confluence spaces
- Known issue type IDs and transition IDs (documented for reference — always query before use)
- Assignee username format

See the [Jira Approach](../approaches/regnology-jira-approach.md#project-specific-overrides-via-doctrine-config) for a template and worked example of a `.doctrine-config/jira-conventions.md` file.

### 9. Do Not Fabricate Issue Keys

Agents MUST NOT invent or guess Jira issue keys. If a key is unknown:
- State that the key is unknown.
- Provide the information needed for a human to locate or create the issue.
- Use a placeholder like `{KEY — to be confirmed}` in draft content.

---

## When to Load This Directive

Load this directive when:

- Generating Jira ticket content (Epic, Story, Sub-task descriptions)
- Automating Jira API interactions
- Creating or linking Confluence pages
- Reviewing existing ticket content for compliance

---

## Related Resources

| Resource | Purpose |
|---|---|
| [Approach: Structured Issue Tracking with Jira](../approaches/regnology-jira-approach.md) | Mental models, vocabulary, and structural principles for Jira usage |
| [Templates: tickets/](../templates/tickets/) | Ready-to-use Epic, Story, and Sub-task templates |
| [Directive 018: Traceable Decisions](./018_traceable_decisions.md) | Bidirectional linking and decision capture requirements |
| [Directive 041: Use Regnology Branding](./041_use_regnology_branding.md) | Branding requirements for all Regnology PS artefacts |

---

## Metadata

**Version:** 1.0.0
**Status:** Active
**Created:** 2026-03-30
**Last Updated:** 2026-03-30
**Maintainers:** All agents
**Review Cycle:** Annual or when corporate tooling configuration changes
