# Sub-task / Step Description Template

**Version:** 1.1.0
**Last Updated:** 2026-03-30
**Governed by:** [Approach: Structured Issue Tracking with Jira](../../approaches/regnology-jira-approach.md)

---

## Usage

Copy the content between `--- BEGIN ---` and `--- END ---` into the Jira Sub-task's **Description** field. Sub-tasks are implementation-level work items under a Story or Epic. They are internal — the audience is the team, not the end user.

### Sub-task Type Prefixes

Prefix the **Summary** field with a type tag to signal intent at a glance:

| Prefix | Meaning | Example Summary |
|---|---|---|
| `[DEV]` | Development / coding work | `[DEV] Implement upload endpoint for mapping files` |
| `[TEST]` | Test creation or execution | `[TEST] Write acceptance tests for file validation` |
| `[CONFIG]` | Configuration, infra, environment | `[CONFIG] Set up database schema for metadata` |
| `[DESIGN]` | Design, wireframe, UX | `[DESIGN] Wireframe the review screen` |
| `[REVIEW]` | Code review, QA review, sign-off | `[REVIEW] Security review of file upload endpoint` |
| `[DOC]` | Documentation, runbook, user guide | `[DOC] Update OVERVIEW.md with new API endpoints` |
| `[SPIKE]` | Time-boxed investigation | `[SPIKE] Evaluate PDF parsing libraries (max 4h)` |
| `[ALIGN]` | Alignment, communication, coordination | `[ALIGN] Confirm API contract with downstream team` |

### Sizing Guideline

Per the Regnology Development Framework, a sub-task should take no longer than **half a day (3 hours net)**. If the work is larger, split it into multiple sub-tasks or reconsider whether it should be a Story.

### Minimum Viable Sub-task

Every Sub-task MUST contain:
- **What** — clear description of the work
- **Done When** — how to know it is finished

### Link Convention

All links must be **absolute URLs** using Jira wiki link syntax: `[display text|https://...]`

---

## Markdown Version

Use this for local documentation, review, and version control.

```markdown
## What

{1–3 sentences. What needs to be done, concretely. Name files, endpoints, components,
schemas — be specific enough that another team member could pick this up without a
verbal briefing.}

**Parent Story:** {Story key — Story summary}

---

## Done When

1. {Condition 1 — specific, verifiable. e.g. "Endpoint returns 200 with valid payload and 422 with invalid payload."}
2. {Condition 2 — e.g. "Unit tests pass. Coverage for new code ≥ 80%."}
3. {Condition 3 — e.g. "PR raised, reviewed, and merged to main."}

---

## Approach

{Optional. Brief technical notes — which module to modify, which pattern to follow,
edge cases to watch for. Keep under 5 bullet points.}

- {Note 1}
- {Note 2}

---

## References

- {Link to relevant spec, design doc, or API contract}
- {Link to related sub-task if sequenced: "Depends on {key}"}
```

---

## Jira Wiki Markup Version

Use this for direct paste into the Jira Description field.

```
--- BEGIN ---

h2. What

{1-3 sentences. What needs to be done, concretely. Name files, endpoints, components,
schemas — be specific enough that another team member could pick this up without a
verbal briefing.}

*Parent Story:* {Story key — Story summary}

----

h2. Done When

# {Condition 1 — specific, verifiable.}
# {Condition 2}
# {Condition 3 — e.g. "PR raised, reviewed, and merged to main."}

----

h2. Approach

{Optional. Brief technical notes. Keep under 5 bullet points.}

* {Note 1}
* {Note 2}

----

h2. References

* [{Spec or design doc title}|https://...]
* {Depends on KEY — if sequenced}

--- END ---
```

---

## Spike Sub-task Variant

Spikes are time-boxed investigations. They produce **knowledge**, not code. Use this variant when the prefix is `[SPIKE]`.

### Markdown Version

```markdown
## Question

{The specific question this spike aims to answer. One question only.
If there are multiple questions, create multiple spikes.}

**Time Box:** {maximum hours — e.g. 4h}
**Parent Story:** {Story key — Story summary}

---

## Done When

1. The question is answered (yes, no, or "not answerable within time box — here is what we learned").
2. Findings are documented in a comment on this ticket.
3. A recommendation is made: proceed, pivot, or defer.

---

## Investigation Plan

1. {Step 1 — e.g. "Read library docs for X"}
2. {Step 2 — e.g. "Build minimal PoC with Y"}
3. {Step 3 — e.g. "Benchmark against current approach"}

---

## References

- {Link to relevant docs, prior art, or external resources}
```

### Jira Wiki Markup Version

```
--- BEGIN ---

h2. Question

{The specific question this spike aims to answer. One question only.}

*Time Box:* {maximum hours — e.g. 4h}
*Parent Story:* {Story key — Story summary}

----

h2. Done When

# The question is answered (yes, no, or "not answerable within time box — here is what we learned").
# Findings are documented in a comment on this ticket.
# A recommendation is made: proceed, pivot, or defer.

----

h2. Investigation Plan

# {Step 1}
# {Step 2}
# {Step 3}

----

h2. References

* [{Doc title}|https://...]

--- END ---
```

---

## Section Rationale

| Section | Why It Exists |
|---|---|
| **What** | Forces specificity. "Implement the thing" is not a sub-task. Names, paths, and components make hand-off possible. |
| **Done When** | Binary completion criteria. Prevents "90% done" limbo. Includes the PR/review step to prevent unreviewed merges. |
| **Approach** | Lightweight guidance — just enough to prevent a developer from going down the wrong path. Not a design doc. |
| **References** | Links to context. The sub-task does not repeat the Story's context — it points to it. |
| **Spike variant** | Investigations need different structure: a question, a time box, and a findings format. Without the time box, spikes become open-ended research projects. |
