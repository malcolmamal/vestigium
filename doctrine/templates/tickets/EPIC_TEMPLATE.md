# Epic / Deliverable Description Template

**Version:** 1.1.0
**Last Updated:** 2026-03-30
**Governed by:** [Approach: Structured Issue Tracking with Jira](../../approaches/regnology-jira-approach.md)

---

## Usage

Copy the content between `--- BEGIN ---` and `--- END ---` into the Jira Epic's **Description** field. Replace all `{placeholder}` tokens. Delete sections that do not apply, but preserve the **minimum set** marked **(required)**.

### Minimum Viable Epic

Every Epic MUST contain:
- **Context** — why this exists, traceable to a goal or strategy
- **Scope** — what is in and out
- **Acceptance Criteria** — how we know it is done

### Link Convention

All links must be **absolute URLs** using Jira wiki link syntax: `[display text|https://...]`

---

## Markdown Version

Use this for local documentation, review, and version control.

```markdown
## Context

**Strategic Goal:** {goal this Epic serves}
**Principle:** {guiding principle — e.g. Efficiency | Quality | Scale}
**Business Capability:** {capability domain this Epic belongs to}
**Lifecycle Phases:** {phases of the delivery lifecycle this Epic touches}
**Owner:** {person or team accountable for delivery}
**Work Item Type:** {Net New Feature | Regulatory Update / Service | Keep Lights On — Implementation | Keep Lights On — Testing | Keep Lights On — Documentation | Defect | Invest to Improve}

{2–3 sentences explaining WHY this initiative exists. What pain does it address?
What gap does it close? Trace the reasoning back to a goal or delivery bottleneck —
not just "we want to build X".}

**Delivery Gap:** {One sentence: what do people currently do manually or poorly that
this Epic automates or improves?}

---

## Scope

### In Scope

- {Capability or feature 1}
- {Capability or feature 2}
- {Capability or feature 3}

### Out of Scope

- {Explicit exclusion 1 — and why, or where it lives instead}
- {Explicit exclusion 2}

### Dependencies

| Depends On | Relationship |
|---|---|
| {System, team, or other Epic} | {Consumes output / Requires API / Shared data model} |

---

## Acceptance Criteria

This Epic is complete when **all** of the following are satisfied:

1. {Criterion 1 — observable, measurable, binary (pass/fail)}
2. {Criterion 2}
3. {Criterion 3}
4. Documentation: relevant documentation is current and accurate. A linked Release Note Document issue exists and is at "In PO Review" status (or "No Documentation Required" is explicitly set).
5. Tests: a linked Test Execution with status "PASS" exists (or "No Test Required" is explicitly set).
6. Handover: at least one person outside the build team can operate the result independently.

---

## Solution Approach

{Brief description of the technical approach. 3–5 sentences.}

**Tech Stack:** {e.g. Python 3.12, FastAPI, React, PostgreSQL}
**Repository:** {link to repository}

### Key Decisions

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| {Decision 1} | {Why this was chosen} | {What was rejected and why} |

---

## Success Metrics

| Metric | Baseline (Before) | Target (After) | How Measured |
|---|---|---|---|
| {e.g. Time to complete phase X} | {e.g. 40 hours/engagement} | {e.g. 15 hours/engagement} | {e.g. Tracked in timesheets} |

---

## Delivery Plan

| Phase | Description | Target Date |
|---|---|---|
| Phase 1 — {name} | {what is delivered} | {date} |
| Phase 2 — {name} | {what is delivered} | {date} |
| GA | {general availability criteria} | {date} |

---

## Traceability

| Artifact | Location |
|---|---|
| Strategy document | {link} |
| Repository | {link} |
| Specification / OVERVIEW | {link} |

---

## Risks & Open Questions

| Risk / Question | Severity | Mitigation / Answer |
|---|---|---|
| {Risk 1} | High / Medium / Low | {Mitigation or "TBD"} |
| {Open question 1} | — | {Who will answer, by when} |
```

---

## Jira Wiki Markup Version

Use this for direct paste into the Jira Description field.

```
--- BEGIN ---

h2. Context

*Strategic Goal:* {goal this Epic serves}
*Principle:* {guiding principle}
*Business Capability:* {capability domain}
*Lifecycle Phases:* {phases this Epic touches}
*Owner:* {person or team accountable}
*Work Item Type:* {Net New Feature | Regulatory Update / Service | Keep Lights On — Implementation | Keep Lights On — Testing | Keep Lights On — Documentation | Defect | Invest to Improve}

{2-3 sentences explaining WHY this initiative exists. What pain does it address?
What gap does it close? Trace the reasoning back to a goal or delivery bottleneck.}

*Delivery Gap:* {One sentence: what do people currently do manually or poorly that this Epic automates or improves?}

----

h2. Scope

h3. In Scope

* {Capability or feature 1}
* {Capability or feature 2}
* {Capability or feature 3}

h3. Out of Scope

* {Explicit exclusion 1 — and why, or where it lives instead}
* {Explicit exclusion 2}

h3. Dependencies

||Depends On||Relationship||
|{System, team, or other Epic}|{Consumes output / Requires API / Shared data model}|

----

h2. Acceptance Criteria

This Epic is complete when *all* of the following are satisfied:

# {Criterion 1 — observable, measurable, binary (pass/fail)}
# {Criterion 2}
# {Criterion 3}
# Documentation: relevant documentation is current and accurate. Linked Release Note Document issue exists at "In PO Review" status (or "No Documentation Required" is set).
# Tests: linked Test Execution with status "PASS" exists (or "No Test Required" is set).
# Handover: at least one person outside the build team can operate the result independently.

----

h2. Solution Approach

{Brief description of the technical approach. 3-5 sentences.}

*Tech Stack:* {e.g. Python 3.12, FastAPI, React, PostgreSQL}
*Repository:* [{repo-name}|https://...]

h3. Key Decisions

||Decision||Rationale||Alternatives Considered||
|{Decision 1}|{Why this was chosen}|{What was rejected and why}|

----

h2. Success Metrics

||Metric||Baseline (Before)||Target (After)||How Measured||
|{e.g. Time to complete phase X}|{e.g. 40h/engagement}|{e.g. 15h/engagement}|{e.g. Timesheets}|

----

h2. Delivery Plan

||Phase||Description||Target Date||
|Phase 1 — {name}|{what is delivered}|{date}|
|Phase 2 — {name}|{what is delivered}|{date}|
|GA|{general availability criteria}|{date}|

----

h2. Traceability

||Artifact||Location||
|Strategy document|[Strategy Doc|https://...]|
|Repository|[repo-name|https://...]|
|Specification / OVERVIEW|[OVERVIEW.md|https://...]|

----

h2. Risks & Open Questions

||Risk / Question||Severity||Mitigation / Answer||
|{Risk 1}|{High / Medium / Low}|{Mitigation or "TBD"}|
|{Open question 1}|—|{Who will answer, by when}|

--- END ---
```

---

## Section Rationale

| Section | Why It Exists |
|---|---|
| **Context** | Forces every Epic to justify itself against strategy. Prevents "solution looking for a problem" initiatives. |
| **Scope** | Explicit in/out prevents scope creep and makes prioritisation visible. Dependencies enable impact analysis. |
| **Acceptance Criteria** | Binary pass/fail criteria. Includes documentation and handover to prevent siloed knowledge. |
| **Solution Approach** | Records architectural intent and key decisions before implementation begins. |
| **Success Metrics** | Makes "value delivered" measurable. Baseline + target ensures improvement can be proven, not just asserted. |
| **Delivery Plan** | Breaks the Epic into phased delivery, enabling incremental value. |
| **Traceability** | Explicit links back to the knowledge repository. Ensures Jira and docs stay connected. |
| **Risks & Open Questions** | Surfaces unknowns early. Prevents surprises during implementation. |
