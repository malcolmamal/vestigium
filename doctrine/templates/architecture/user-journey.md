# User Journey: [Journey Title]

<!--
  Template: User Journey
  
  Purpose: Capture a structured, end-to-end user journey spanning actors,
  system boundaries, and coordination concerns. Unlike a User Story (single
  slice of value), a User Journey maps the full flow across phases, actors,
  and responsibilities.

  When to use:
  - Multi-actor workflows (humans + AI agents + services)
  - Flows that cross system boundaries (CLI <-> SaaS, local <-> remote)
  - Collaborative or concurrent scenarios requiring coordination rules
  - Features where observability, presence, or governance matter

  When NOT to use (use a User Story in a spec instead):
  - Single-actor, single-system interactions
  - Simple CRUD operations
  - Features fully captured by a BDD acceptance scenario

  Doctrine alignment: Traceable Decisions (decision capture), Human-in-Charge
  (actor attribution), Locality of Change (scope boundaries)
-->

**Status**: DRAFT | REVIEW | ACCEPTED
**Date**: YYYY-MM-DD
**Primary Contexts**: [Domain contexts this journey lives in]
**Supporting Contexts**: [Domain contexts this journey touches]
**Related Spec**: [Link to specification file, if applicable]

---

## Scenario

<!--
  One paragraph framing what this journey accomplishes and why it matters.
  Include the initial product slice or MVP scope if applicable.
-->

[Describe the end-to-end scenario in 2-4 sentences. What are participants
trying to achieve? What is the initial scope boundary?]

---

## Actors

<!--
  List every participant type. Annotate with role classification:
  - human  - a person (developer, reviewer, admin, end user)
  - llm    - an AI/LLM execution context
  - system - an automated service, daemon, or infrastructure component

  Each actor maps to a full stakeholder persona. If the persona doesn't exist
  yet, create one using doctrine/templates/documentation/audience-persona-template.md.
-->

| # | Actor | Type | Persona | Role in Journey |
|---|-------|------|---------|-----------------|
| 1 | [Actor Name] | `human` | [Persona ID or link] | [What they do] |
| 2 | [Actor Name] | `llm` | [Persona ID or link] | [What they do] |
| 3 | [Actor Name] | `system` | [Persona ID or link] | [What they do] |

---

## Preconditions

1. [Precondition 1]
2. [Precondition 2]
3. [Precondition 3]

---

## Journey Map

<!--
  Each row is a phase. Adapt column headers to your domain.
  Key Events use PascalCase domain event names.
-->

| Phase | Actor(s) | System | Key Events |
|-------|----------|--------|------------|
| 1. [Phase Name] | [Who acts] | [What system does] | `EventName1`, `EventName2` |
| 2. [Phase Name] | [Who acts] | [What system does] | `EventName3` |
| 3. [Phase Name] | [Who acts] | [What system does] | `EventName4`, `EventName5` |

---

## Coordination Rules

<!--
  How do actors coordinate when their actions overlap or conflict?
  Default postures:
  - Advisory (soft): Warnings emitted, no blocking.
  - Gated (medium): Progression paused until acknowledgement.
  - Locked (hard): Exclusive access enforced via leases.
-->

**Default posture**: [Advisory | Gated | Locked]

1. [Rule 1]
2. [Rule 2]
3. [Rule 3]

---

## Responsibilities

### [Boundary A] (e.g., CLI / Local Runtime)

1. [Responsibility 1]
2. [Responsibility 2]

### [Boundary B] (e.g., SaaS / Cloud Service)

1. [Responsibility 1]
2. [Responsibility 2]

---

## Scope: [Milestone Name]

### In Scope

1. **Observe**: [What participants can see/monitor]
2. **Decide**: [What actions participants can take]

### Out of Scope (Deferred)

- [Capability deferred to future milestone]

---

## Required Event Set

| # | Event | Emitted By | Phase |
|---|-------|-----------|-------|
| 1 | `EventName` | [Actor/System] | [Phase #] |
| 2 | `EventName` | [Actor/System] | [Phase #] |

---

## Acceptance Scenarios

1. **[Scenario Title]**
   Given [precondition],
   when [action],
   then [expected outcome].

2. **[Scenario Title]**
   Given [precondition],
   when [action],
   then [expected outcome].

---

## Design Decisions

| Decision | Rationale | ADR |
|----------|-----------|-----|
| [What was decided] | [Why] | [Link or "pending"] |

---

## Product Alignment

1. [Alignment statement 1]
2. [Alignment statement 2]
3. [Alignment statement 3]
