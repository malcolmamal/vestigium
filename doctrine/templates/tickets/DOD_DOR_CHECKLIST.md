# Definition of Ready / Definition of Done Checklists

**Version:** 1.0.0
**Last Updated:** 2026-03-30
**Governed by:** [Approach: Structured Issue Tracking with Jira](../../approaches/regnology-jira-approach.md), [Directive 043: Use Corporate Tooling](../../directives/043_use_corporate_tooling.md)

---

## Purpose

These checklists are **transition-time tools**, not part of the initial ticket description. Use them at the moment you attempt to move an Epic or Story to a new status:

| Checklist | Use when transitioning… |
|---|---|
| [Definition of Ready (DoR)](#definition-of-ready-dor) | New → Ready |
| [Definition of Done (DoD)](#definition-of-done-dod) | Any status → Ready for Integration |

**Usage options:**
- Paste into a Jira **comment** on the issue before triggering the transition.
- Add as a collapsible **panel** section at the bottom of the ticket description.
- Use locally (work log, review doc) as a pre-flight check before requesting review.

---

## Definition of Ready (DoR)

Applies to: **Epic**, **Story**
Gate: **New → Ready**

An issue may not be pulled for implementation until all DoR conditions are met.

### Markdown Version

```markdown
## Definition of Ready Checklist

Issue: {KEY — Summary}
Checked by: {name}
Date: {YYYY-MM-DD}

### Required Fields

- [ ] Description is not empty (Context + Scope + Acceptance Criteria sections present)
- [ ] Story Points are set (except Expedite items)
- [ ] Affects Version/s is set (Stories: except Defects)
- [ ] Priority is set (Stories: except Defects)

### Content Quality

- [ ] Context section traces this issue to a strategic goal or parent Epic
- [ ] Acceptance Criteria are binary (pass/fail) — no criteria like "works as expected"
- [ ] In Scope and Out of Scope sections are present (Epics only)
- [ ] Work Item Type field is set

### Verdict

- [ ] ✅ Ready — all conditions met, issue may be transitioned to Ready
- [ ] ❌ Not Ready — blocked items listed below

**Blocked by:**
- {item and owner responsible for resolving}
```

### Jira Wiki Markup Version

Paste into a comment on the issue.

```
{panel:title=Definition of Ready Checklist|borderStyle=solid|borderColor=#0052CC|titleBGColor=#DEEBFF}

*Issue:* {KEY — Summary}
*Checked by:* {name}
*Date:* {YYYY-MM-DD}

h4. Required Fields

(/) Description is not empty (Context + Scope + Acceptance Criteria present)
(x) Story Points are set _(except Expedite items)_
(x) Affects Version/s is set _(Stories: except Defects)_
(x) Priority is set _(Stories: except Defects)_

h4. Content Quality

(/) Context section traces this issue to a strategic goal or parent Epic
(/) Acceptance Criteria are binary (pass/fail) — no criteria like "works as expected"
(/) In Scope and Out of Scope sections are present _(Epics only)_
(/) Work Item Type field is set

h4. Verdict

(/) ✅ Ready — all conditions met, issue may be transitioned to Ready
(x) ❌ Not Ready — blocked items listed below

*Blocked by:*
* {item and owner responsible for resolving}

{panel}
```

> **Jira icon note:** Replace `(/)` with the green tick icon macro and `(x)` with the red cross icon macro as appropriate when completing the checklist. In wiki markup, `(/)` renders as ✅ and `(x)` as ❌.

---

## Definition of Done (DoD)

Applies to: **Epic**, **Story**
Gate: **→ Ready for Integration**

An issue may not transition to Ready for Integration until all DoD conditions are met. The transition is a workflow gate — Jira will block it if conditions are not satisfied.

### Markdown Version

```markdown
## Definition of Done Checklist

Issue: {KEY — Summary}
Checked by: {name}
Date: {YYYY-MM-DD}

### Child Work Completion

- [ ] All child Stories / Sub-Tasks are at status "Ready for Integration" or "Done"
  - Exceptions: {list any intentionally deferred items with justification}

### Documentation

- [ ] A linked Release Note Document issue exists **and** is at "In PO Review" status (minimum)
  - OR: "No Documentation Required" is explicitly set on this issue
  - Release Note Document key: {KEY or "No Documentation Required"}

### Testing

- [ ] A linked Test Execution exists **and** has status "PASS"
  - OR: "No Test Required" is explicitly set on this issue
  - Test Execution key: {KEY or "No Test Required"}

### Jira Fields

- [ ] Fix Version/s is set
- [ ] Work Item Type is set

### PO Acceptance

- [ ] Product Owner has reviewed the delivered work
- [ ] PO Acceptance is granted (formal sign-off)
  - PO: {name}
  - Date of acceptance: {YYYY-MM-DD}

### Verdict

- [ ] ✅ Done — all conditions met, issue may be transitioned to Ready for Integration
- [ ] ❌ Not Done — blocked items listed below

**Blocked by:**
- {item and owner responsible for resolving}
```

### Jira Wiki Markup Version

Paste into a comment on the issue.

```
{panel:title=Definition of Done Checklist|borderStyle=solid|borderColor=#006644|titleBGColor=#E3FCEF}

*Issue:* {KEY — Summary}
*Checked by:* {name}
*Date:* {YYYY-MM-DD}

h4. Child Work Completion

(/) All child Stories / Sub-Tasks at "Ready for Integration" or "Done"
_Exceptions: {list any intentionally deferred items with justification}_

h4. Documentation

(/) Linked Release Note Document exists at "In PO Review" status (or "No Documentation Required" set)
*Release Note Document key:* {KEY or "No Documentation Required"}

h4. Testing

(/) Linked Test Execution exists with status "PASS" (or "No Test Required" set)
*Test Execution key:* {KEY or "No Test Required"}

h4. Jira Fields

(/) Fix Version/s is set
(/) Work Item Type is set

h4. PO Acceptance

(/) Product Owner has reviewed the delivered work
(/) PO Acceptance granted
*PO:* {name}
*Date of acceptance:* {YYYY-MM-DD}

h4. Verdict

(/) ✅ Done — all conditions met, issue may be transitioned to Ready for Integration
(x) ❌ Not Done — blocked items listed below

*Blocked by:*
* {item and owner responsible for resolving}

{panel}
```

---

## Combined Pre-Transition Reference

Quick reference for agents and contributors at each transition gate:

| Gate | Issue Type | Key Blockers |
|---|---|---|
| **New → Ready** | Epic, Story | Empty description · Missing Story Points · Missing Affects Version/s · Missing Priority · Non-binary AC |
| **→ Ready for Integration** | Epic, Story | Open child items · No Release Note Document · No Test Execution PASS · No Fix Version/s · No PO Acceptance |
| _(no gate)_ | Sub-Task | Sub-tasks use simpler Done When criteria in [SUBTASK_TEMPLATE.md](SUBTASK_TEMPLATE.md) |

---

## Relationship to Templates

These checklists are the operational complement to the description templates:

| Template | Role |
|---|---|
| [EPIC_TEMPLATE.md](EPIC_TEMPLATE.md) | Structures the ticket content so DoR conditions can be met |
| [STORY_TEMPLATE.md](STORY_TEMPLATE.md) | Structures the ticket content so DoR conditions can be met |
| **DOD_DOR_CHECKLIST.md** (this file) | Used at transition time to verify all conditions are satisfied |
