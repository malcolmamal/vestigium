# Tactic: SQLX Optimization Experiment

**Type:** Procedural execution guide  
**Version:** 1.0.0  
**Last Updated:** 2026-03-17  
**Status:** Active  
**Invoked by:** SQLX Author agent, Architect Alphonso, Manager Mike; approach [sqlx-spec-driven-authoring](../../approaches/sqlx-spec-driven-authoring.md)

---

## Purpose

Systematically identify and implement performance optimizations in generated SQLX artifacts using the Abacus CLI and data model definitions. This tactic leverages execution plan analysis to reduce computational overhead and improve parallelization.

---

## When to Use

- Initial SQLX artifacts have been generated from pseudo code or spec.
- Performance bottlenecks are suspected in complex regulatory models.
- The model contains large decision tables or deep unit dependency chains.
- Access to the Abacus CLI and MCP data model definitions is available.

**Do not use for:** Generating SQLX (sqlx-generation); validating compliance (sqlx-validation); creating tests (sqlx-testing).

---

## Prerequisites

- **SQLX Model/Component Directory:** A syntactically valid model that passes `abacus validate`.
- **Abacus CLI Access:** The `abacus.cmd` or `abacus.sh` tool must be executable in the environment.
- **Data Model MCP:** Access to `query_datamodel_definitions` to verify field types and domains.
- **Toolguide:** [sqlx-mcp-and-manual.md](../../toolguides/sqlx-mcp-and-manual.md) — CLI commands and MCP usage.

⚠️ **Runtime Dependency:** This tactic requires access to an actual SQLX runtime environment and the corresponding data model metadata. It cannot be performed in "blind" generation mode.

---

## Procedure

### 1. Baseline Model Assessment
- [ ] Run `abacus info` on the model to get a summary of artifacts.
- [ ] Record the number of Functional Units, Decision Tables, and Dataset Definitions.
- [ ] Identify large decision tables (rule count) that may lack optimized Java execution.

### 2. Execution Plan Analysis (DAG)
- [ ] Run `abacus dag-dump -c [COMPONENT_DIR] -o [OUTPUT_DIR]` to generate the unit execution graph.
- [ ] Inspect the `.gv` file (or rendered PDF) for:
    - **Critical Path**: Long sequential chains of units.
    - **Fan-out Nodes**: Units whose exports are imported by many downstream units.
    - **Bottlenecks**: Units that act as synchronization points.
- [ ] Identify independent units that are currently coupled but could be parallelized.

### 3. Static Analysis for Data Flow
- [ ] Run `abacus analyse -f -o [OUTPUT_DIR]` to generate provides/uses reports.
- [ ] Search `problems.csv` for SQL queries that are problematic for the optimizer.
- [ ] Inspect `occurrences.csv` for redundant field selections across different units.

### 4. Hypothesis Generation
Based on the analysis, select one or more optimization hypotheses:
- **Optimization H1 (UDF Promotion)**: Add `_DD.sqlx` files for large decision tables to trigger Java UDF generation.
- **Optimization H2 (Checkpoint Insertion)**: Insert `CHECKPOINT` expressions at high-fan-out nodes to truncate Spark query plans.
- **Optimization H3 (DAG Flattening)**: Refactor units to move filtering/projection earlier in the flow, enabling better parallelization.
- **Optimization H4 (Column Pruning)**: Remove unused fields from intermediate SELECT statements identified in `analyse`.

### 5. Experiment Execution
- [ ] Implement the selected optimization in a copy of the SQLX code.
- [ ] Run `abacus validate` to ensure no semantic errors were introduced.
- [ ] (Optional) Run `abacus test` to verify logic integrity remains intact.

### 6. Validation of Results
- [ ] Run `abacus dag-dump` again to verify the structural change in the execution plan.
- [ ] Run `abacus analyse` to confirm reduction in problematic queries or redundant columns.
- [ ] Compare the "Before" and "After" `abacus info` output (e.g., increased count of DatasetDefs).

---

## Outputs
- **Optimization Report**: Summary of identified bottlenecks and implemented changes.
- **Optimized DAG**: Updated execution graph showing improved parallelism.
- **Refined SQLX Artifacts**: The updated `.sqlx` and `.dec` files.
- **Traceability Note**: Link the optimization back to the original calculation intent.

---

## Exit Criteria

- Baseline assessment recorded (artifact counts, DAG structure).
- At least one optimization hypothesis tested with before/after comparison.
- All optimized artifacts pass `abacus validate`.
- Optimization report produced with traceability to original calculation intent.

---

## Related

- **Approach:** [sqlx-spec-driven-authoring.md](../../approaches/sqlx-spec-driven-authoring.md)
- **Toolguide:** [sqlx-mcp-and-manual.md](../../toolguides/sqlx-mcp-and-manual.md)
- **Related tactics:** [adversarial-testing.tactic.md](../adversarial-testing.tactic.md) (stress-test scenarios), [safe-to-fail-experiment-design.tactic.md](../safe-to-fail-experiment-design.tactic.md) (experiment design)
- **Upstream:** Run after [sqlx-generation.tactic.md](./sqlx-generation.tactic.md) and [sqlx-validation.tactic.md](./sqlx-validation.tactic.md).
