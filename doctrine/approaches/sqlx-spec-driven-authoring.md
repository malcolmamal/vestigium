# SQLX Spec-Driven Authoring (Approach)

**Approach Type:** Domain workflow (SQLX / ABACUS360)  
**Version:** 1.0.0  
**Last Updated:** 2026-03-10  
**Status:** Active  

---

## Purpose

This approach describes the **mental model and workflow** for producing and validating SQLX functional units in the ABACUS360 context. It bridges pseudo code (or analyst intent) → structured specification → SQLX artifacts → validation → tests, and optionally **explanation** of existing SQLX for domain experts.

**Target audience:** SQLX Interpreter / SQLX Author agents, Manager Mike (routing), and developers invoking SQLX generation or explanation.

**Core question:** *When do I run which tactic: pseudo-code-to-spec, generation, validation, testing, or explanation?*

---

## Workflow Overview

1. **Interpret** — Pseudo code or informal description → structured FU specification with resolved ABACUS360 data model references. **Tactic:** `doctrine/tactics/sqlx/sqlx-pseudo-code-to-spec.tactic.md`.
2. **Generate** — Structured spec → SQLX artifacts (component, CF, BL, DD, .dec). **Tactic:** `doctrine/tactics/sqlx/sqlx-generation.tactic.md`. **Standards:** SQLX coding styleguide (doctrine or repo).
3. **Validate** — SQLX artifacts → compliance report (language spec, conventions, data model). **Tactic:** `doctrine/tactics/sqlx/sqlx-validation.tactic.md`.
4. **Test** — FU + spec → test data, expected outputs, test config. **Tactic:** `doctrine/tactics/sqlx/sqlx-testing.tactic.md`.
5. **Explain** — SQLX code → business-language explanation for domain experts/auditors. **Tactic:** `doctrine/tactics/sqlx/sqlx-explanation.tactic.md`.

**Toolguide:** MCP usage and SQLX manual chapter mapping: `doctrine/toolguides/sqlx-mcp-and-manual.md`. **MCP is the preferred access method** for SQLX language specification and data model queries; local reference (`doctrine/toolguides/sqlx_language/`) is the failover when MCP is unavailable. **Model tier:** Routine SQLX work (generate, validate, test, explain) is **mid** tier per Directive 042; reserve premium for architecture or ambiguous spec decisions.

---

## When to Use Which Tactic

| Task type | Primary tactic | Agent (if two-agent model) |
|-----------|----------------|-----------------------------|
| Pseudo code → spec | [`sqlx-pseudo-code-to-spec`](../tactics/sqlx/sqlx-pseudo-code-to-spec.tactic.md) | [SQLX Interpreter](../agents/sqlx-interpreter.agent.md) |
| Spec → SQLX files | [`sqlx-generation`](../tactics/sqlx/sqlx-generation.tactic.md) | [SQLX Author](../agents/sqlx-author.agent.md) |
| Check SQLX compliance | [`sqlx-validation`](../tactics/sqlx/sqlx-validation.tactic.md) | [SQLX Author](../agents/sqlx-author.agent.md) |
| Create test suite for FU | [`sqlx-testing`](../tactics/sqlx/sqlx-testing.tactic.md) | [SQLX Author](../agents/sqlx-author.agent.md) |
| Explain FU in business language | [`sqlx-explanation`](../tactics/sqlx/sqlx-explanation.tactic.md) | [SQLX Interpreter](../agents/sqlx-interpreter.agent.md) |
| Full pipeline (spec → generate → validate → test) | Sequence 1→2→3→4 | Coordinator or [SQLX Author](../agents/sqlx-author.agent.md) |

---

## Handoffs

- **Upstream:** Analyst / domain expert (pseudo code); SQLX Author (artifacts for validation/test/explain).
- **Downstream:** SQLX Author consumes spec from Interpreter; validator and test engineer consume generated artifacts; domain experts consume explanations.
- **Lateral:** Data model and language reference via toolguide (MCP `query_datamodel_definitions`, `get_sqlx_manual_chapter`).

---

## Related

- **DDR-015:** [SQLX Agent Consolidation](../decisions/DDR-015-sqlx-agent-consolidation.md) — two-agent model (Interpreter + Author) adopted 2026-03-10
- **Directive 042:** Model discipline (mid tier for SQLX routine work)
- **Tactics:** `sqlx-pseudo-code-to-spec.tactic.md`, `sqlx-explanation.tactic.md`, `sqlx-generation.tactic.md`, `sqlx-validation.tactic.md`, `sqlx-testing.tactic.md` (see `doctrine/tactics/sqlx/`)
