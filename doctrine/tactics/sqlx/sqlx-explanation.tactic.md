# Tactic: SQLX Code Explanation

**Type:** Procedural execution guide  
**Version:** 1.0.0  
**Last Updated:** 2026-03-10  
**Status:** Active  
**Invoked by:** SQLX Interpreter agent; approach [sqlx-spec-driven-authoring](../../approaches/sqlx-spec-driven-authoring.md)

---

## Purpose

Translate SQLX functional unit code into clear, business-language explanations for domain experts, auditors, and reviewers who do not read SQLX. Describe what the FU calculates, what data it uses, what decisions it makes, and what it outputs — without modifying any code.

---

## When to Use

- Task is "explain this SQLX FU" or "document this functional unit for domain experts".
- Audience is non-SQLX (auditors, business analysts, regulators).
- Output is documentation only (no code changes).

**Do not use for:** Generating or validating SQLX (sqlx-author); interpreting pseudo code (sqlx-pseudo-code-to-spec).

---

## Prerequisites

- **Toolguide:** [doctrine/toolguides/sqlx-mcp-and-manual.md](../../toolguides/sqlx-mcp-and-manual.md) — MCP for field/domain decoding; manual chapters 2–4, 7 for context.
- FU directory with `component.sqlx`, `_CF.sqlx`, `_BL.sqlx`, `_DD.sqlx`, and any `.dec` files.

---

## Procedure

### Step 1: Read and Parse the Functional Unit

- [ ] Read all files in the FU directory.
- [ ] Build data flow: inputs → CF preparation → BL logic → output.
- [ ] Identify key CASE expressions, decision tables, joins, and conditions.

### Step 2: Decode Field References

Use MCP `query_datamodel_definitions` (see toolguide):

- [ ] For each field code (e.g. C774, PTY170), resolve id, caption, description, domain.
- [ ] Build a field reference table: Code | Name | Description.

### Step 3: Decode Domain Values

- [ ] For fields used in conditions, resolve domain value meanings (code, caption).
- [ ] Translate conditions into business language (e.g. "When Asset Category is 'Level 1 Assets' (10) or 'Level 2A Assets' (20)").

### Step 4: Write the Explanation

Structure the explanation (business language; avoid SQLX jargon unless defining it):

- [ ] **What This Calculates:** 1–3 sentences, regulatory purpose.
- [ ] **Input Data:** Which entities/views, which fields, for what purpose.
- [ ] **How It Works:**  
  - Step 1 — Data preparation (what CF does: fields, defaults, joins).  
  - Step 2 — Business logic (each block: classification logic as if/then/else; decision table rules as "When… Then…").  
  - Step 3 — Output (what the result contains).
- [ ] **Field Reference:** Table Code | Name | Description.
- [ ] **Dependencies:** Depends on (upstream FUs); depended on by (downstream, if known).

**Depth levels (choose per request):** Summary (2–3 sentences) | Standard (full as above) | Detailed (+ rule-by-rule decision table, edge cases). Default: Standard.

### Step 5: Verify Accuracy

- [ ] Re-read SQLX and compare to explanation.
- [ ] Every CASE branch explained.
- [ ] Every decision table rule covered.
- [ ] No field references left undecoded.
- [ ] Explanation describes what the code *does*, not assumed intent.

---

## Output Artifacts

| Artifact | Location | Description |
|----------|----------|-------------|
| FU Explanation | `docs/explanations/[FU_NAME]_explanation.md` | Full business-language explanation |
| Field reference | (in same file or `[FU_NAME]_fields.md`) | Decoded field table |
| Quick summary | (optional, 2–3 sentences) | For commit messages or review docs |

---

## Exit Criteria

- A domain expert with no SQLX knowledge can understand what the FU calculates.
- All logic (CASE, decision tables) is explained in business terms.
- No unexplained field codes; explanation matches code behavior.

---

## Related

- **Approach:** [sqlx-spec-driven-authoring.md](../../approaches/sqlx-spec-driven-authoring.md)
- **Toolguide:** [sqlx-mcp-and-manual.md](../../toolguides/sqlx-mcp-and-manual.md)
