# Tactic: SQLX Validation

**Type:** Procedural execution guide  
**Version:** 1.0.0  
**Last Updated:** 2026-03-10  
**Status:** Active  
**Invoked by:** SQLX Author agent; approach [sqlx-spec-driven-authoring](../../approaches/sqlx-spec-driven-authoring.md)

---

## Purpose

Validate SQLX artifacts against language specification, coding standards, data model constraints, and known anti-patterns. Produce an actionable report (errors and warnings with location and recommended fix). Do not modify source files.

---

## When to Use

- After generating SQLX (run sqlx-validation on output of sqlx-generation).
- On request: "validate this FU" or "check SQLX compliance".
- Before handoff to test or integration.

**Do not use for:** Generating SQLX (sqlx-generation); interpreting pseudo code; generating tests.

---

## Prerequisites

- FU directory with SQLX files to validate.
- **Toolguide:** [sqlx-mcp-and-manual.md](../../toolguides/sqlx-mcp-and-manual.md) — language spec (manual), data model (MCP) when DM rules are applied.
- **Styleguide:** [sqlx-coding-standards.md](../../approaches/sqlx-coding-standards.md) — coding standards and conventions.

---

## Procedure

### Step 1: Load Artifacts

- [ ] Read all SQLX files in the target FU directory.
- [ ] Load coding standards.
- [ ] If data model validation needed, use MCP `query_datamodel_definitions`.

### Step 2: Apply Validation Rules (by category)

Execute in order. For each rule: check; if violated, record ID, file, location, finding, recommended fix; classify as Error ❗️ or Warning ⚠️.

#### Category 1: File Structure (FS)

| ID | Rule | Severity |
|----|------|----------|
| FS-001 | FU directory contains `component.sqlx` | ❗️ Error |
| FS-002 | FU directory contains `FU_NAME_CF.sqlx` | ❗️ Error |
| FS-003 | FU directory contains `FU_NAME_BL.sqlx` | ❗️ Error |
| FS-004 | FU directory contains `FU_NAME_DD.sqlx` | ❗️ Error |
| FS-005 | File names UPPERCASE with underscores | ⚠️ Warning |
| FS-006 | Folder name matches component name | ⚠️ Warning |
| FS-007 | `test/` subdirectory exists | ⚠️ Warning |

#### Category 2: Unit Declarations (UD)

| ID | Rule | Severity |
|----|------|----------|
| UD-001 | CF file starts with `unit FU_NAME_CF;` | ❗️ Error |
| UD-002 | BL file starts with `unit FU_NAME_BL as function;` | ❗️ Error |
| UD-003 | Unit name matches file name (no .sqlx) | ❗️ Error |
| UD-004 | Component file starts with `component FU_NAME;` | ❗️ Error |

#### Category 3: Import/Export (IE)

| ID | Rule | Severity |
|----|------|----------|
| IE-001 | All imported datasets used in unit body | ⚠️ Warning |
| IE-002 | All datasets used are imported or assigned | ❗️ Error |
| IE-003 | Component exports match FU exports | ❗️ Error |
| IE-004 | Component imports: `from input` for base, `from FU` for upstream | ❗️ Error |
| IE-005 | CF imports alphabetically sorted | ⚠️ Warning |
| IE-006 | BL exports `FU_NAME_BL` (not FU_NAME_OUT etc.) | ❗️ Error |
| IE-007 | CF assigns BL result to `FU_NAME_OUT` | ⚠️ Warning |
| IE-008 | Export annotations only when FU modifies entity | ⚠️ Warning |
| IE-009 | Export is last statement in CF | ⚠️ Warning |
| IE-010 | No subcomponents (unsupported in some CLI versions) | ❗️ Error |

#### Category 4: SQL Patterns (SP)

| ID | Rule | Severity |
|----|------|----------|
| SP-001 | No `select *` | ❗️ Error |
| SP-002 | Fields alphabetically ordered in SELECT | ⚠️ Warning |
| SP-003 | Table/view aliases in multi-table queries | ⚠️ Warning |
| SP-004 | coalesce() for nullable fields in DT inputs | ❗️ Error |
| SP-005 | coalesce() for nullable in WHERE | ⚠️ Warning |
| SP-006 | Prefer left outer join | ⚠️ Warning |
| SP-007 | cast(null as Type) for explicit nulls | ⚠️ Warning |
| SP-008 | Explicit field lists in all SELECT | ❗️ Error |
| SP-009 | No ambiguous field references | ❗️ Error |

#### Category 5: Dataset Definition (DD)

| ID | Rule | Severity |
|----|------|----------|
| DD-001 | Dataset definition for all component exports | ❗️ Error |
| DD-002 | Primary key defined | ❗️ Error |
| DD-003 | Field types valid (String, Double, Integer, Date, Boolean) | ❗️ Error |
| DD-004 | Domain references exist in data model | ⚠️ Warning |
| DD-005 | 4-space indentation inside parentheses | ⚠️ Warning |

#### Category 6: Decision Tables (DT)

| ID | Rule | Severity |
|----|------|----------|
| DT-001 | Input/Output declarations at top of .dec | ❗️ Error |
| DT-002 | `---` separates rules | ❗️ Error |
| DT-003 | `# Input` and `# Output` in each rule | ⚠️ Warning |
| DT-004 | DT input view applies coalesce() to nullable | ❗️ Error |
| DT-005 | Dataset definition for DT output (performance) | ⚠️ Warning |
| DT-006 | No `*` wildcard used for "else" rules | ❗️ Error |

#### Category 7: Data Model (DM) — when MCP available

| ID | Rule | Severity |
|----|------|----------|
| DM-001 | Referenced entities exist in ABACUS360 | ❗️ Error |
| DM-002 | Referenced fields exist in entities | ⚠️ Warning |
| DM-003 | Domain values in conditions exist in domains | ⚠️ Warning |
| DM-004 | Entity field types match usage | ⚠️ Warning |

### Step 3a: Run Abacus CLI (if available)

- [ ] Resolve **content root** from repo config (`.doctrine-config/config.yaml` → `sqlx.content_root`) or workspace root; resolve **CLI** from PATH or `sqlx.abacus_cli_path`.
- [ ] **Environment Check:** Ensure `HADOOP_HOME` is set and `winutils.exe` is in the PATH (mandatory for Windows).
- [ ] **JVM Configuration:** If execution fails with memory errors, use `-Xms512m -Xmx4G`. If using Java 23+, use `-Djava.security.manager=allow`.
- [ ] Run: `abacus -d <contentRoot> validate [path]` (path = FU directory or omit for full model). Capture exit code, stdout, stderr.
- [ ] If CLI not configured: note "Abacus CLI validation skipped" and proceed with report from Step 2 only.
- [ ] Merge CLI output into the validation report.

#### CLI Troubleshooting Table

| Error / Symptom | Likely Cause | Recommended Fix |
| :--- | :--- | :--- |
| `DOS error/errno=1455` | JVM initial heap (`-Xms`) too large for free virtual memory. | Reduce `-Xms` to `512m` or `1G` in `abacus.cmd`. |
| `UnsatisfiedLinkError` (Hadoop) | `winutils.exe` or `hadoop.dll` missing/not in PATH. | Install `winutils` and set `HADOOP_HOME`. |
| `UnsupportedOperationException` (getSubject) | Java 23+ security manager restriction. | Add `-Djava.security.manager=allow` to JVM flags. |
| `Subcomponents not supported` | Component nesting in `component.sqlx`. | Flatten model; use single root component. |
| `Invalid expression '*'` | Wildcard used in `.dec` rule. | Use an "else" rule with no condition instead. |

**Reference:** `docs/AGENT_STACK_SQLX_CLI_INTEGRATION.md`, `docs/ABACUS_CLI_SQLX_INTEGRATION_SCAN.md`.

### Step 3: Produce Validation Report

Write report (e.g. `reports/validation/[FU_NAME]_validation.md`) with:

- **Summary:** Errors count, Warnings count, Passed count; **Abacus CLI:** exit code and status (if run).
- **Errors (must fix):** Table: ID | File | Location | Rule | Finding | Recommended Fix.
- **Warnings (should fix):** Same structure.
- **Passed:** Summary by category.
- **Abacus CLI result** (if run): exit code, relevant stderr/stdout excerpt.
- One-line pass/fail for CI if needed.

---

## Output Artifacts

- **Validation report:** `reports/validation/[FU_NAME]_validation.md` (or as configured).
- **Summary line:** Pass/fail suitable for CI.

---

## Exit Criteria

- All rules in FS, UD, IE, SP, DD, DT (and DM if MCP used) applied.
- Report has zero false positives (every finding is a documented rule violation).
- Each issue has file, location, and recommended fix.

---

## Related

- **Approach:** [sqlx-spec-driven-authoring.md](../../approaches/sqlx-spec-driven-authoring.md)
- **Toolguide:** [sqlx-mcp-and-manual.md](../../toolguides/sqlx-mcp-and-manual.md)
- **Upstream:** Run after [sqlx-generation.tactic.md](./sqlx-generation.tactic.md); findings may trigger re-generation.
