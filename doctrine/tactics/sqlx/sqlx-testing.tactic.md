# Tactic: SQLX Test Suite Generation

**Type:** Procedural execution guide  
**Version:** 1.0.0  
**Last Updated:** 2026-03-10  
**Status:** Active  
**Invoked by:** SQLX Author agent; approach [sqlx-spec-driven-authoring](../../approaches/sqlx-spec-driven-authoring.md)

---

## Purpose

Create a test suite for an SQLX functional unit: test input data (.tab), expected outputs (.tab), test configuration (.json), and scenario documentation. Coverage must include every code path (CASE branches, decision table rules, join behavior) and edge cases (nulls, boundaries, empty input). Do not modify production SQLX code.

---

## When to Use

- Task is "generate tests for this FU" or "create test suite from spec and SQLX".
- FU has been generated and (optionally) validated; spec is available for intent.
- Tests will be run via Abacus CLI (e.g. `abacus test`).

**Do not use for:** Generating or validating SQLX (sqlx-generation, sqlx-validation); interpreting pseudo code; explaining code.

---

## Prerequisites

- FU directory with `_CF.sqlx`, `_BL.sqlx`, `_DD.sqlx` (and component); specification when available.
- **Toolguide:** [sqlx-mcp-and-manual.md](../../toolguides/sqlx-mcp-and-manual.md) — manual Ch. 14, 15, 18; MCP for domain values and field types.
- **Test data conventions:** [sqlx-test-data-conventions.md](../../styleguides/sqlx-test-data-conventions.md) (or cursorrules_test_data / repo equivalent when present).

---

## Procedure

### Step 1: Analyze the Functional Unit

- [ ] Read BL: identify every CASE branch (including implicit ELSE → null), every decision table and its rules, every WHERE, every join.
- [ ] Read CF: all input entities and prepared views.
- [ ] Read DD: output schema.
- [ ] Read spec: business intent for each scenario.

### Step 2: Design Test Scenarios

Build a test matrix covering:

- [ ] **Happy path:** Standard input → expected calculation.
- [ ] **Null handling:** Nullable fields null; verify coalesce defaults.
- [ ] **Boundary values:** Min/max numeric, empty string, edge dates.
- [ ] **Domain coverage:** At least one row per domain value used in CASE/conditions.
- [ ] **Decision table coverage:** At least one input row per decision table rule.
- [ ] **Join behavior:** Left outer join with no matching right (null propagation).
- [ ] **Multi-row:** Multiple inputs → multiple outputs.
- [ ] **Country variants:** (if applicable) Different visibilityContext.COUNTRY_PARAM.
- [ ] **Empty input:** Empty datasets for optional imports.

### Step 3: Generate Test Input Data

- [ ] For each imported dataset, create `.tab` with typed columns matching CF imports.
- [ ] Tab-separated; strings in double quotes; `null` for explicit nulls.
- [ ] Use domain-valid values from MCP when needed.
- [ ] Place under `test/FU_NAME_CF/` (e.g. `POSITION_IN.tab`, `INSTRUMENT_IN.tab`).

### Step 4: Calculate Expected Outputs

- [ ] For each test input row: apply CF view prep → BL intermediate → decision table → CASE → output row.
- [ ] Write expected output `.tab` matching DD schema (e.g. `test/FU_NAME_CF/FU_NAME_CF.tab`).
- [ ] Document trace (which rule/branch produced which value) in scenario doc.

### Step 5: Generate Test Configuration

- [ ] Create JSON (e.g. `test/FU_NAME_CF_TEST.json`) with: name, component, unit, settings (e.g. sqlx.globalVariables for visibilityContext).
- [ ] Align with CLI test runner format (see manual Ch. 14/18).

### Step 6: Document Test Scenarios

- [ ] Markdown: scenario ID, short name, input description, expected output, which code path exercised (CASE branch, DT rule, coalesce, etc.).

### Step 7: Write Test Artifacts

- [ ] Write all files under FU `test/` subdirectory:
  - `test/FU_NAME_CF/*.tab` (inputs and expected output)
  - `test/FU_NAME_CF_TEST.json`
  - `test/FU_NAME_test_scenarios.md`
  - Optional: `FU_NAME_DD_test.sqlx` (dataset extends for test imports) if used by project.

### Step 8: Run Tests via Abacus CLI (if available)

- [ ] Resolve **content root** from repo config (`.doctrine-config/config.yaml` → `sqlx.content_root`) or workspace root; resolve **CLI** from PATH or `sqlx.abacus_cli_path`.
- [ ] Run: `abacus -d <contentRoot> test <unit-test-name>` (e.g. `FU_NAME_CF` for `FU_NAME_CF.tab`). Capture exit code and output.
- [ ] Optionally: `abacus -d <contentRoot> test -l` to list tests, or `-r` for coverage.
- [ ] If CLI not configured: note "Abacus CLI test execution skipped" in scenario doc.
- [ ] Record result in test scenario doc or a short test run report (pass/fail, exit code, relevant output).

**Reference:** `docs/AGENT_STACK_SQLX_CLI_INTEGRATION.md`, `docs/ABACUS_CLI_SQLX_INTEGRATION_SCAN.md`.

---

## Output Artifacts

| Artifact | Location | Description |
|----------|----------|-------------|
| Test inputs | `test/FU_NAME_CF/*.tab` | Per-import .tab files |
| Expected output | `test/FU_NAME_CF/FU_NAME_CF.tab` | Output matching DD schema |
| Test config | `test/FU_NAME_CF_TEST.json` | CLI runner config |
| Scenario doc | `test/FU_NAME_test_scenarios.md` | Scenario list and rationale |
| Test DD (optional) | `test/FU_NAME_DD_test.sqlx` | Dataset defs for test imports |

---

## Exit Criteria

- Every CASE branch and decision table rule has at least one test row.
- Expected outputs traceable to spec/BL logic.
- Tests executable via project CLI (e.g. `abacus test`).
- Edge cases (null, empty, boundaries) explicitly covered.

---

## Related

- **Approach:** [sqlx-spec-driven-authoring.md](../../approaches/sqlx-spec-driven-authoring.md)
- **Toolguide:** [sqlx-mcp-and-manual.md](../../toolguides/sqlx-mcp-and-manual.md) — Ch. 14, 15, 18.
- **Upstream:** Run after [sqlx-generation.tactic.md](./sqlx-generation.tactic.md); optionally after [sqlx-validation.tactic.md](./sqlx-validation.tactic.md).
