# Tactic: SQLX Generation (Spec to Artifacts)

**Type:** Procedural execution guide  
**Version:** 1.0.0  
**Last Updated:** 2026-03-10  
**Status:** Active  
**Invoked by:** SQLX Author agent; approach [sqlx-spec-driven-authoring](../../approaches/sqlx-spec-driven-authoring.md)

---

## Purpose

Generate production-ready SQLX artifacts from a structured FU specification: component manifest, calculation flow (CF), business logic (BL), dataset definition (DD), and decision tables (.dec). Output must be convention-compliant and pass sqlx-validation.

---

## When to Use

- Task is "generate SQLX from spec" or "implement FU from specification".
- Input is a structured spec (e.g. from sqlx-pseudo-code-to-spec tactic or `specs/[FU_NAME]_spec.md`).
- No SQLX code exists yet, or regeneration from updated spec is requested.

**Do not use for:** Interpreting pseudo code (sqlx-interpreter); validating existing code (sqlx-validation); generating tests (sqlx-testing).

---

## Prerequisites

- **Specification:** Complete structured spec with resolved data model references (CF/BL/DD and decision tables if any).
- **Toolguide:** [sqlx-mcp-and-manual.md](../../toolguides/sqlx-mcp-and-manual.md) — data model and language reference.
- **Styleguide:** [sqlx-coding-standards.md](../../approaches/sqlx-coding-standards.md) — file naming, SQL patterns, decision tables, anti-patterns.
- **Reference:** `SQLX-Samples/` when present for structural patterns.

---

## Procedure

### Step 1: Load Specification and Context

- [ ] Read the structured specification.
- [ ] Load SQLX coding standards from [sqlx-coding-standards.md](../../approaches/sqlx-coding-standards.md).
- [ ] Query data model for entity schemas and field types needed for this FU.
- [ ] If referencing an existing component, read its `component.sqlx` for imports/exports.

### Step 2: Generate Dataset Definition (_DD.sqlx)

Start with the output contract. Rules: UPPERCASE field names; types String, Double, Integer, Date, Boolean; domain references per data model; primary key at end; 4-space indentation inside parentheses.

- [ ] Define `dataset FU_OUTPUT ( ... );` with all output fields and Primary Key.

### Step 3: Generate Business Logic (_BL.sqlx)

- [ ] First line: `unit FU_NAME_BL as function;`
- [ ] Imports: parameter views passed from CF.
- [ ] Intermediate calculations, decision table input view with `coalesce()` on nullable fields, decision table call, final result.
- [ ] Assign result to `FU_NAME_BL`; `export FU_NAME_BL`.
- [ ] Apply: **mandatory alphabetical field order** in SELECT; `coalesce()` on ALL nullable DT inputs; `cast(null as Type)` for explicit nulls; table aliases; prefer left outer join.

### Step 4: Generate Calculation Flow (_CF.sqlx)

- [ ] First line: `unit FU_NAME_CF;`
- [ ] Imports alphabetically sorted.
- [ ] Input views: select only needed fields, coalesce defaults, joins.
- [ ] Call BL: `FU_NAME_OUT := FU_NAME_BL(VIEW1, VIEW2);`
- [ ] Output selection from `FU_NAME_OUT`; export with `@update`/`@create` only when FU modifies an entity; export last.

### Step 5: Generate Component Manifest (component.sqlx)

- [ ] First line: `component FU_NAME;`
- [ ] Imports: base inputs `from input`; upstream FUs `from FU_NAME`.
- [ ] Exports; order: declaration → imports → exports → function registrations.

### Step 6: Generate Decision Tables (.dec) (if applicable)

- [ ] Input/Output declarations at top.
- [ ] Rules separated by `---`; `# Input` and `# Output` section headers.
- [ ] **Else Rules:** Do not use `*` wildcard. Use a rule with no input condition as the catch-all.
- [ ] Operators: `in (...)`, `<>`, `<=`, `>=`, `!=`, `=`; string values in single quotes.

### Step 7: Write Files

- [ ] Write to target FU directory: `component.sqlx`, `FU_NAME_CF.sqlx`, `FU_NAME_BL.sqlx`, `FU_NAME_DD.sqlx`, `DEC_*.dec` (if any).
- [ ] Folder structure: `FU_NAME/` with files as above; optional `test/` placeholder.
- [ ] **Component Nesting:** For standalone units or initial validation, prefer a single root `component.sqlx` to avoid CLI restrictions on subcomponents.
- [ ] Produce generation report: files produced, conventions applied, any deviations.

---

## Anti-Patterns (Do Not Do)

- `select *` — always enumerate fields.
- Missing coalesce on nullable fields in decision table inputs.
- Generic view names (use `FU_NAME_OUT` in CF, `FU_NAME_BL` in BL).
- Exporting wrong name from BL (must be `FU_NAME_BL`).
- Non-alphabetical field order in SELECT; missing `as function` in BL.

---

## Output Artifacts

- `component.sqlx`, `FU_NAME_CF.sqlx`, `FU_NAME_BL.sqlx`, `FU_NAME_DD.sqlx`, `DEC_*.dec` (if applicable).
- Generation report (summary, conventions, deviations).

---

## Exit Criteria

- All files written; naming and structure match styleguide.
- Run sqlx-validation tactic; zero errors before handoff.
- Developer can integrate files without manual edits.

---

## Related

- **Approach:** [sqlx-spec-driven-authoring.md](../../approaches/sqlx-spec-driven-authoring.md)
- **Toolguide:** [sqlx-mcp-and-manual.md](../../toolguides/sqlx-mcp-and-manual.md)
- **Validation:** [sqlx-validation.tactic.md](./sqlx-validation.tactic.md) (run after generation).
