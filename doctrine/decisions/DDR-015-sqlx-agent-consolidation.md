# DDR-015: SQLX Agent Consolidation

**Status:** Accepted  
**Date:** 2026-03-10  
**Author:** Manager Mike  
**Supersedes:** N/A  
**Related:** DDR-011 (Agent Specialization Hierarchy), DDR-007 (Coordinator Agent Orchestration Pattern)

---

## Context

The SQLX domain in the doctrine stack originally comprised five specialized
agents, each owning a single step in the SQLX development pipeline:

| Agent | Responsibility |
|-------|---------------|
| pseudo-code-pete | Pseudo code → structured FU specification |
| sqlx-generator-gina | Specification → SQLX artifacts (component, CF, BL, DD, .dec) |
| sqlx-validator-victor | SQLX compliance validation (7 rule categories) |
| sqlx-test-engineer-tessa | Test data, expected outputs, test configurations |
| sqlx-explainer-elena | SQLX code → business-language explanation |

**Problems observed:**

- **Fat profiles:** Each agent embedded step-by-step procedures, rule tables,
  coding standards, and MCP usage instructions directly in the agent profile,
  violating the doctrine stack principle that procedures belong in tactics and
  standards belong in styleguides.
- **High maintenance cost:** Five profiles to keep in sync; changes to SQLX
  conventions required updates across all five.
- **Routing overhead:** Manager Mike needed to distinguish between five closely
  related agents for a single domain.
- **Pipeline fragmentation:** Running the full pipeline
  (spec → generate → validate → test) required coordinating four separate agents.

**Constraint:** Agent profiles must stay thin — purpose, specialization
boundaries, handoffs, and mode defaults only. All procedures move to tactics;
standards move to styleguides/approaches; MCP usage moves to a toolguide.

---

## Decision

**Consolidate from five agents to two: SQLX Interpreter + SQLX Author.**

### SQLX Interpreter

Replaces pseudo-code-pete and sqlx-explainer-elena.

- **Interpret:** Pseudo code or informal description → structured FU specification with resolved ABACUS360 data model references.
- **Explain:** SQLX code → business-language explanation for domain experts, auditors, reviewers.
- **Tactics:** `sqlx-pseudo-code-to-spec.tactic.md`, `sqlx-explanation.tactic.md`

### SQLX Author

Replaces sqlx-generator-gina, sqlx-validator-victor, and sqlx-test-engineer-tessa.

- **Generate:** Structured specification → SQLX artifacts.
- **Validate:** SQLX artifacts → compliance report.
- **Test:** FU + spec → test data, expected outputs, test configuration.
- **Tactics:** `sqlx-generation.tactic.md`, `sqlx-validation.tactic.md`, `sqlx-testing.tactic.md`

### Doctrine Layer Placement

All procedural and standards content was extracted from agent profiles into doctrine layers:

| Content | Source (5 agents) | Target Layer | Artifact |
|---------|-------------------|-------------|----------|
| Pseudo code → spec procedure | pseudo-code-pete | Tactic | `tactics/sqlx/sqlx-pseudo-code-to-spec.tactic.md` |
| Spec → SQLX procedure | sqlx-generator-gina | Tactic | `tactics/sqlx/sqlx-generation.tactic.md` |
| Validation rules + procedure | sqlx-validator-victor | Tactic | `tactics/sqlx/sqlx-validation.tactic.md` |
| Test design + procedure | sqlx-test-engineer-tessa | Tactic | `tactics/sqlx/sqlx-testing.tactic.md` |
| Explanation procedure | sqlx-explainer-elena | Tactic | `tactics/sqlx/sqlx-explanation.tactic.md` |
| Workflow routing ("which tactic when?") | Implicit across 5 agents | Approach | `approaches/sqlx-spec-driven-authoring.md` |
| SQLX coding standards | sqlx-generator-gina | Approach | `approaches/sqlx-coding-standards.md` |
| Test data conventions | sqlx-test-engineer-tessa | Styleguide | `styleguides/sqlx-test-data-conventions.md` |
| MCP usage, manual chapters, CLI | All 5 agents | Toolguide | `toolguides/sqlx-mcp-and-manual.md` |
| SQLX language reference (offline) | N/A (new) | Toolguide | `toolguides/sqlx_language/` |

---

## Rationale

### Why two agents instead of one?

The two roles have fundamentally different orientations:

- **Interpreter** faces upstream (domain experts, pseudo code) and downstream
  consumers (auditors, reviewers). Its output is specifications and
  explanations — natural language artifacts.
- **Author** faces downstream (developers, CI) and produces code artifacts —
  SQLX files, validation reports, test suites.

Separating them provides clear routing: "explain this FU" → Interpreter;
"generate from spec" → Author. A single agent would need task-type dispatch
to select the right tactic, blurring the boundary between interpretation
and generation.

### Why two agents instead of five?

Five agents created unnecessary routing complexity and maintenance overhead
for a single domain. The natural grouping is:

- **Consume language** (interpret pseudo code, explain SQLX) → Interpreter
- **Produce/verify code** (generate, validate, test) → Author

### Why not a pipeline tactic (Option C)?

The full pipeline (spec → generate → validate → test) can be orchestrated by
Manager Mike assigning sequential tasks or by the Author running
generation → validation → testing in sequence. A dedicated pipeline tactic was
deemed unnecessary overhead — the approach document
(`sqlx-spec-driven-authoring.md`) already describes the workflow sequencing.

---

## Consequences

### Positive

- **Routing clarity:** Two agents with distinct orientations vs five with overlapping domain.
- **Thin profiles:** Agent profiles contain only purpose, boundaries, handoffs; procedures live in tactics.
- **Single maintenance surface:** Standards and procedures maintained once in doctrine layers, not duplicated across profiles.
- **Doctrine stack compliance:** Content correctly placed by layer (approaches
  for mental models, tactics for procedures, styleguides for standards).

### Negative (Accepted Trade-Offs)

- **Pipeline handoff:** Full pipeline requires Interpreter → Author handoff (or sequential task assignment by coordinator).
- **Migration effort:** Five legacy agents deprecated; consuming repositories must update references.

---

## Alternatives Considered

### Option B: Single SQLX Specialist

One agent handling all five capabilities, selecting tactic by task type.

**Rejected:** Blurs the interpret/explain vs generate/validate/test boundary.
Routing by task type adds dispatcher logic to the profile. Two agents map more
naturally to the two orientations (language-facing vs code-facing).

### Option C: Two Agents + Pipeline Tactic

Same as chosen option, plus `sqlx-full-pipeline.tactic.md` for orchestrated sequencing.

**Deferred:** Not rejected outright. If full-pipeline orchestration becomes a
frequent request, the tactic can be added later. Current workflow routing via
the approach document is sufficient.

---

## Related Decisions

- **DDR-007:** Coordinator Agent Orchestration Pattern (Manager Mike handles sequencing)
- **DDR-010:** Modular Agent Directive System Architecture (thin profiles referencing tactics)
- **DDR-011:** Agent Specialization Hierarchy (routing priority and context matching)

---

## Change Log

- **2026-03-10:** Decision proposed and accepted (Manager Mike, Human-in-Charge)
- **2026-03-17:** Formalized as DDR-015; original HiC decision request archived in SQLX_Generation repo
