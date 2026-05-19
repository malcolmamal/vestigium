# Story / Work Item Description Template

**Version:** 1.1.0
**Last Updated:** 2026-03-30
**Governed by:** [Approach: Structured Issue Tracking with Jira](../../approaches/regnology-jira-approach.md)

---

## Usage

Copy the content between `--- BEGIN ---` and `--- END ---` into the Jira Story's **Description** field. Replace all `{placeholder}` tokens. Stories live under an Epic and represent a user-visible capability or workflow.

### When to Use a Story vs. a Sub-task

| Use a **Story** when... | Use a **Sub-task** when... |
|---|---|
| The work delivers user-visible value | The work is internal or technical and not user-facing |
| A user, operator, or stakeholder can observe the result | It is a step within a Story (dev task, config, review) |
| It can be independently demonstrated or tested | It cannot be demonstrated without the parent Story |
| It maps to a step in the delivery lifecycle | It maps to an implementation detail |

### Minimum Viable Story

Every Story MUST contain:
- **User Story statement** — who, what, why
- **Acceptance Criteria** — testable conditions
- **Scope** — what this Story covers within the Epic

### Link Convention

All links must be **absolute URLs** using Jira wiki link syntax: `[display text|https://...]`

---

## Markdown Version

Use this for local documentation, review, and version control.

```markdown
## User Story

**As a** {role},
**I want to** {action — what the user does or what the system enables},
**so that** {outcome — the business value or pain removed}.

---

## Context

**Parent Epic:** {Epic key and name}
**Lifecycle Phase:** {which phase of the delivery lifecycle this touches}
**Work Item Type:** {Net New Feature | Regulatory Update / Service | Keep Lights On — Implementation | Keep Lights On — Testing | Keep Lights On — Documentation | Defect | Invest to Improve}

{1–2 sentences explaining how this Story fits within the Epic's scope. What slice of
the Epic does it deliver? What becomes possible once this is done?}

### Current State (Before)

{Describe what the user does today — the manual process, the pain, the workaround.
Be specific. Not "it is manual" but "the user opens X, manually does Y across Z items..."}

### Target State (After)

{Describe what the user will do after this Story is complete. Same level of specificity.}

---

## Acceptance Criteria

### Functional Criteria

1. Given {precondition}, when {action}, then {observable result}.
2. Given {precondition}, when {action}, then {observable result}.
3. {Plain-language criterion if Gherkin is awkward.}

### Non-Functional Criteria

1. Performance: {e.g. Response time < 2 seconds for datasets up to N rows.}
2. Error handling: {e.g. Invalid input produces a user-readable error message, not a stack trace.}
3. Documentation: A Release Note Document issue is linked and at "In PO Review" status before this Story can move to "In PO Review" (or "No Documentation Required" is explicitly set).
4. Tests: A linked Test Execution with status "PASS" exists before PO Review (or "No Test Required" is explicitly set).

---

## Scope

### This Story Covers

- {Specific capability 1}
- {Specific capability 2}

### This Story Does NOT Cover

- {Explicit exclusion — handled by another Story or deferred}

---

## Design Notes

{Optional. Technical or UX notes for the implementer. Keep brief — if detailed design
is needed, link to a separate document.}

**Wireframe / Mockup:** {link or "N/A"}
**API contract:** {link or "N/A"}
**Key decision:** {any non-obvious implementation choice, with rationale}

---

## Traceability

| Artifact | Location |
|---|---|
| Epic | {Epic key} |
| Specification / OVERVIEW | {link} |
| Related Story / Task | {key, if dependent} |
```

---

## Jira Wiki Markup Version

Use this for direct paste into the Jira Description field.

```
--- BEGIN ---

h2. User Story

*As a* {role},
*I want to* {action — what the user does or what the system enables},
*so that* {outcome — the business value or pain removed}.

----

h2. Context

*Parent Epic:* {Epic key — Epic Name}
*Lifecycle Phase:* {which phase of the delivery lifecycle this touches}
*Work Item Type:* {Net New Feature | Regulatory Update / Service | Keep Lights On — Implementation | Keep Lights On — Testing | Keep Lights On — Documentation | Defect | Invest to Improve}

{1-2 sentences explaining how this Story fits within the Epic's scope.}

h3. Current State (Before)

{Describe what the user does today — the manual process, the pain, the workaround.
Be specific: not "it is manual" but "the user opens X, manually does Y across Z items..."}

h3. Target State (After)

{Describe what the user will do after this Story is complete. Same level of specificity.}

----

h2. Acceptance Criteria

h3. Functional Criteria

# *Given* {precondition}, *when* {action}, *then* {observable result}.
# *Given* {precondition}, *when* {action}, *then* {observable result}.
# {Plain-language criterion if Gherkin is awkward.}

h3. Non-Functional Criteria

# Performance: {e.g. Response time < 2 seconds for datasets up to N rows.}
# Error handling: {e.g. Invalid input produces a user-readable error message, not a stack trace.}
# Documentation: Linked Release Note Document issue exists at "In PO Review" status before this Story can move to "In PO Review" (or "No Documentation Required" is set).
# Tests: Linked Test Execution with status "PASS" exists (or "No Test Required" is set).

----

h2. Scope

h3. This Story Covers

* {Specific capability 1}
* {Specific capability 2}

h3. This Story Does NOT Cover

* {Explicit exclusion — handled by another Story or deferred}

----

h2. Design Notes

{Optional. Technical or UX notes for the implementer.}

*Wireframe / Mockup:* {link or "N/A"}
*API contract:* {link or "N/A"}
*Key decision:* {any non-obvious implementation choice, with rationale}

----

h2. Traceability

||Artifact||Location||
|Epic|{Epic key}|
|Specification / OVERVIEW|[OVERVIEW.md|https://...]|
|Related Story / Task|{key, if dependent}|

--- END ---
```

---

## Section Rationale

| Section | Why It Exists |
|---|---|
| **User Story** | Forces the author to name a real user, a real action, and a real outcome. Prevents "build feature X" tickets with no stated value. |
| **Context** | Before/after framing makes the value concrete and testable. Links the Story to its parent Epic. |
| **Acceptance Criteria** | Gherkin-style criteria are directly translatable to test cases. Separating functional and non-functional avoids NFC being appended as afterthoughts. |
| **Scope** | Prevents a Story from ballooning. Makes it clear what this ticket is and is not responsible for. |
| **Design Notes** | Lightweight guidance for implementers without over-specifying. Links to external design artefacts when they exist. |
| **Traceability** | Backward links to Epic and docs. Forward links to related tickets. |
