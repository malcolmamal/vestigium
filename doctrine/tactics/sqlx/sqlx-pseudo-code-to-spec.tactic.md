# Tactic: SQLX Pseudo Code to Specification

**Type:** Procedural execution guide  
**Version:** 1.0.0  
**Last Updated:** 2026-03-10  
**Status:** Active  
**Invoked by:** SQLX Interpreter agent; approach [sqlx-spec-driven-authoring](../../approaches/sqlx-spec-driven-authoring.md)

---

## Purpose

Transform pseudo code or informal regulatory logic descriptions into a structured functional unit specification with resolved ABACUS360 data model references, so that sqlx-author can generate SQLX artifacts without further clarification.

---

## When to Use

- Task is "pseudo code → spec" or "interpret pseudo code into SQLX specification".
- Input is human-authored pseudo code, analyst notes, or regulatory calculation description.
- Output must be consumable by sqlx-generation tactic (no SQLX syntax in this tactic).

**Do not use for:** Generating SQLX code (use sqlx-generation); explaining existing SQLX (use sqlx-explanation).

---

## Prerequisites

- **Toolguide:** [doctrine/toolguides/sqlx-mcp-and-manual.md](../../toolguides/sqlx-mcp-and-manual.md) — MCP `query_datamodel_definitions`, `get_sqlx_manual_chapter` (chapters 3–5, 7 as needed).
- Access to pseudo code or specification source (file or inline).

---

## Procedure

### Step 1: Ingest Pseudo Code

- [ ] Read the provided pseudo code in its entirety.
- [ ] Identify: FU name, purpose, regulatory context (LCR/NSFR/ALMM etc.).
- [ ] Extract high-level data flow: inputs → transformations → outputs.

### Step 2: Resolve Data Model References

Use MCP `query_datamodel_definitions` (see toolguide):

- [ ] Resolve entity references (e.g. entities WHERE caption LIKE '%position%').
- [ ] Resolve field references to concrete field IDs (fields + domains).
- [ ] For enumerated values, verify domain membership (domain_values).
- [ ] Build a resolved reference table: pseudo code term → ABACUS360 entity/field/domain.

**If a reference cannot be resolved:** Add to "Unresolved Items" in the spec; do not guess.

### Step 3: Structure the Specification

Decompose into the standard SQLX functional unit pattern:

- [ ] **Component manifest:** Imports (from other FUs or `input`), exports.
- [ ] **Calculation Flow (CF):** Input view preparation — fields to select, joins, coalesce defaults.
- [ ] **Business Logic (BL):** Core calculation — CASE expressions, decision table inputs/outputs, intermediate views, aggregations.
- [ ] **Dataset Definition (DD):** Output schema — field names, types, primary key.
- [ ] **Decision tables:** If tabular conditional logic → input/output columns and rule rows.

### Step 4: Validate Completeness

- [ ] All referenced entities and fields resolved or listed as unresolved.
- [ ] Output schema covers all fields the pseudo code produces.
- [ ] Primary key fields identified.
- [ ] No circular dependencies in data flow.
- [ ] Join keys exist on both sides of every join.

### Step 5: Produce Specification Document

Write structured markdown to `${WORKSPACE_ROOT}/specs/` (or as directed). Include:

- **Overview:** Name, purpose, regulatory context, module.
- **Resolved References:** Table mapping pseudo code terms to ABACUS360 entity/field/domain.
- **Data Flow:** Inputs, upstream dependencies, output dataset.
- **CF Specification:** Input views, BL invocation, output selection, export annotation.
- **BL Specification:** Intermediate calculations, conditional logic, decision tables, final result.
- **DD Specification:** Field name, type, domain, primary key.
- **Decision Tables (if applicable):** Input/output fields, rules summary.
- **Unresolved Items:** Ambiguities, missing references, clarification questions.

---

## Output Artifacts

| Artifact | Location | Description |
|----------|----------|-------------|
| FU Specification | `specs/[FU_NAME]_spec.md` | Complete structured specification |
| Reference resolution log | `specs/[FU_NAME]_references.md` | Pseudo code term → data model mapping |
| Clarification requests | `specs/[FU_NAME]_questions.md` | Questions for domain expert (if any) |

---

## Exit Criteria

- Specification is complete and internally consistent.
- sqlx-author can run sqlx-generation tactic without additional clarification for resolved items.
- Unresolved items are explicitly listed with specific, answerable questions.

---

## Related

- **Approach:** [sqlx-spec-driven-authoring.md](../../approaches/sqlx-spec-driven-authoring.md)
- **Toolguide:** [sqlx-mcp-and-manual.md](../../toolguides/sqlx-mcp-and-manual.md)
- **Downstream:** sqlx-generation tactic consumes the produced spec.
