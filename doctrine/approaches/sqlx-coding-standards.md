# SQLX Coding Standards (Approach)

**Approach Type:** Domain standards (SQLX / ABACUS360)  
**Version:** 3.0.0  
**Last Updated:** 2026-03-17  
**Status:** Active

---

## Purpose

This approach defines the mandatory coding standards and conventions for SQLX development within the Regnology Professional Services environment. Referenced by sqlx-generation and sqlx-validation tactics and by SQLX Author.

**Related:** [sqlx-spec-driven-authoring.md](sqlx-spec-driven-authoring.md), [sqlx-generation.tactic.md](../tactics/sqlx/sqlx-generation.tactic.md), [sqlx-validation.tactic.md](../tactics/sqlx/sqlx-validation.tactic.md).

---

## 1. Functional Unit (FU) Structure

Each Functional Unit follows a strict directory and file naming convention:

```
FU_NAME/
├── component.sqlx          # Component definition with imports/exports
├── FU_NAME_CF.sqlx         # Calculation Flow (data preparation & orchestration)
├── FU_NAME_BL.sqlx         # Business Logic (main calculation logic)
├── FU_NAME_DD.sqlx         # Dataset Definition (output schema)
├── FU_NAME_BASE_BL.sqlx    # Optional: Base/intermediate calculations
├── DEC_*.dec               # Decision tables (if applicable)
└── test/                   # Test data and test definitions
```

### File Suffixes

- **`_CF.sqlx`**: Calculation Flow — imports, view preparation, BL orchestration, final export.
- **`_BL.sqlx`**: Business Logic — main calculation logic, decision table calls, `as function`.
- **`_DD.sqlx`**: Dataset Definition — output schema with field names, types, primary keys.
- **`_BASE_BL.sqlx`**: Base/intermediate business logic.
- **`_DEC_*.sqlx`** or **`DEC_*.dec`**: Decision tables, optionally with context suffixes (e.g., `DEC_ASSET_TYPE_SG`).
- **`_PROTOCOL_BL.sqlx`**: Protocol/logging output for debugging.
- **`component.sqlx`**: Component definition file.

### Context-Specific Suffixes

Append context codes (e.g. country codes) to file names for context-specific logic:

- Example: `DEC_ASSET_TYPE_SG.dec`, `FU_NAME_DEC_CA_BL.sqlx`.
- Default logic typically has no suffix or plain `_BL` suffix.

---

## 2. Naming Conventions

- **Functional Unit folders**: PascalCase with underscores (e.g., `Asset_Category`, `Central_Bank_Assets_Minimum_Reserve`).
- **Files**: UPPERCASE with underscores (e.g., `ASSET_TYPE_CF.sqlx`, `DM_ENRICHMENT_DD.sqlx`).
- **Unit names**: Match file names (e.g., `unit ASSET_TYPE_CF;`).
- **Views/Tables**: UPPERCASE with underscores (e.g., `POSITION`, `INSTRUMENT`, `DEC_ASSET_TYPE_INPUT`).
- **Fields**: UPPERCASE, often with numeric suffixes matching Abacus360 field codes (e.g., `C700`, `VAL115`, `POSITION_ID`).
- **Context Suffixes**: Append to file/unit names for context-specific logic (e.g., `_SG`, `_CA`).

---

## 3. SQLX Component Patterns

### Component Files (`component.sqlx`)

```sqlx
component FU_NAME;

import DEPENDENCY_FU from OTHER_FU;
import ANOTHER_FU from ANOTHER_FU;
import ENTITY_IN from input;  // Base inputs always "from input"
export FU_OUTPUT;

// Optional: Protocol function registration
DatasetCSVProtocol(dataset, dataset) : com.bearingpoint.abacus360.owf.functions.DatasetCSVProtocol;
```

**Rules:**
- First line: `component FU_NAME;`
- Import other FUs: `import FU_NAME from FU_NAME;`
- Import base inputs: `import ENTITY_IN from input;`
- Export calculated outputs: `export OUTPUT_NAME;`
- Order: component declaration → imports → exports → functions.

### Calculation Flow (`_CF.sqlx`)

```sqlx
unit FU_NAME_CF;

import DEPENDENCY_1;
import DEPENDENCY_2;
import INPUT_ENTITY_IN;

// Step 1: Prepare input views (select relevant fields, apply coalesce, joins)
VIEW_NAME := 
	select
		FIELD1,
		coalesce(FIELD2, DEFAULT_VALUE) as FIELD2,
		FIELD3
	from
		INPUT_ENTITY_IN
	left outer join OTHER_ENTITY on
		INPUT_ENTITY_IN.KEY = OTHER_ENTITY.KEY;

// Step 2: Call Business Logic
FU_NAME_OUT := FU_NAME_BL(VIEW1, VIEW2, ...);

// Step 3: Select output fields (final view)
FU_OUTPUT :=
	select
		OUTPUT_FIELD1,
		OUTPUT_FIELD2,
		OUTPUT_FIELD3
	from
		FU_NAME_OUT;

/** @update ENTITY **/ // or @create ENTITY when applicable
export FU_OUTPUT;
```

**Rules:**
- First line: `unit FU_NAME_CF;`
- Imports: Sorted alphabetically.
- Input views: Select only needed fields, apply `coalesce()` for defaults.
- Use `left outer join` for optional relationships.
- BL call: Assign result to `FU_NAME_OUT` (e.g. `ENRICHMENT_CALC_OUT`), not a generic name like `BL_OUTPUT`.
- Export: Last statement. Include `/** @update ENTITY **/` or `/** @create ENTITY **/` only when the FU modifies an entity; omit otherwise.

### Business Logic (`_BL.sqlx`)

```sqlx
unit FU_NAME_BL as function;

import INPUT_VIEW1;
import INPUT_VIEW2;

// Intermediate calculations
INTERMEDIATE_VIEW := 
	select
		...
	from
		INPUT_VIEW1
	where
		CONDITIONS;

// Decision table input preparation
DEC_INPUT := 
	select
		FIELD1,
		coalesce(FIELD2, 0) as FIELD2,
		KEY_FIELD
	from
		INTERMEDIATE_VIEW;

DEC_OUTPUT := DEC_NAME(DEC_INPUT);

// Final calculation
FU_NAME_BL := 
	select
		INTERMEDIATE_VIEW.KEY,
		case
			when CONDITION1 then cast(null as Type)
			when CONDITION2 then VALUE
		end as OUTPUT_FIELD
	from
		INTERMEDIATE_VIEW
	left outer join DEC_OUTPUT on
		INTERMEDIATE_VIEW.KEY = DEC_OUTPUT.KEY;

export FU_NAME_BL;
```

**Rules:**
- First line: `unit FU_NAME_BL as function;` — the `as function` is mandatory.
- Import parameter views (passed from CF).
- Assign the final result to `FU_NAME_BL` (the unit name) and export `FU_NAME_BL`; do not assign or export a different name (e.g. `FU_NAME_OUT`) in the BL file.
- Use `cast(null as Type)` for explicit null handling (Type: Double, String, Integer).
- Decision table inputs must apply `coalesce()` to ensure non-null values.
- Use `case when ... then ... else ... end` for conditional logic.

### Dataset Definition (`_DD.sqlx`)

```sqlx
dataset OUTPUT_NAME (
    FIELD1 Type,
    FIELD2 Type,
    FIELD3 Type,
    Primary Key (KEY_FIELD1, KEY_FIELD2)
);
```

**Rules:**
- First line: `dataset OUTPUT_NAME (`
- 4-space indentation inside parentheses.
- List all output fields with their types (String, Double, Integer, Date).
- Fields sorted alphabetically within logical groups.
- Primary key always at the end. Composite keys: `Primary Key (FIELD1, FIELD2)`.

---

## 4. SQL Patterns & Best Practices

### Field Selection
- **Alphabetically order fields** in select lists (strict alphabetical, no exceptions).
- **Always use table/view aliases** in multi-table queries.
- **Use explicit field lists**, never `select *`.

### Coalesce Usage
- Use `coalesce()` to handle nullable fields with sensible defaults:
  - Flags/Booleans: `coalesce(FIELD, 0)` or `coalesce(FIELD, 1)`
  - Strings: `coalesce(FIELD, 'DEFAULT')`
  - Numeric with alternate field: `coalesce(FIELD1, FIELD2)`
  - Date with fallback: `coalesce(DATE_FIELD1, DATE_FIELD2)`
  - In WHERE: `coalesce(FIELD, 1) in (0, 3)`

### Joins
- **Prefer `left outer join`** over `inner join` (unless filtering is intended).
- **Always specify join conditions** with `on` clause.
- **Use meaningful aliases** for tables.

### Case Statements
- Use `case when ... then ... else ... end` for conditional logic.
- Include `else` clause only when it has a meaningful value (not null).
- If all unmatched conditions should be null, omit the `else` clause.
- When needed, use explicit null casting: `cast(null as Double)`, `cast(null as String)`.

### WHERE Clauses
- Use `in (...)` for multiple values: `FIELD in (1, 2, 3)`
- Use `<>` for not equal: `FIELD <> 3`
- Combine with `and`/`or`: `(FIELD1 in (2, 3) or FIELD2 = 1)`
- Apply filters in the BL layer (not in CF) to keep business logic encapsulated.

### Comments
- Use `--` for inline comments explaining complex logic.
- Use `/** @update ENTITY **/` or `/** @create ENTITY **/` before export statements when the FU updates or creates that entity; omit when not applicable.
- Use visibility context comments at the top of context-specific units:
  ```sqlx
  /** ${not empty globalString.get('visibilityContext.CONTEXT_PARAM') && globalString.get('visibilityContext.CONTEXT_PARAM').equals("VALUE")} */
  ```

### Context/Visibility Filtering
- Use `globalString('visibilityContext.<PARAM>')` for context checks:
  ```sqlx
  case 
      when coalesce(globalString('visibilityContext.CONTEXT_PARAM'), "DEFAULT") = "DEFAULT" then ...
      when globalString('visibilityContext.CONTEXT_PARAM') = "VALUE" then ...
  end
  ```
- Use `globalDate('<DATE_PARAM>')` for reporting date references.

---

## 5. Decision Tables (`.dec`)

```
FIELD1: Input
FIELD2: Input
OUTPUT_FIELD: Output
---
# Input
FIELD1: VALUE1
FIELD2: in (VAL1, VAL2)
# Output
OUTPUT_FIELD: RESULT1
---
# Input
FIELD1: VALUE2
FIELD2: <> VALUE
# Output
OUTPUT_FIELD: RESULT2
```

**Rules:**
- Declare all input/output fields at the top with `Input`/`Output` keywords.
- Use `---` to separate rules.
- Use `# Input` and `# Output` section headers within rules.
- Operators: `in (...)`, `<>`, `<=`, `>=`, `!=`, `=`.
- String values in single quotes: `'STRING'`.

**Decision table naming:** `DEC_[CALCULATION]_[CONTEXT]` (e.g., `DEC_ASSET_TYPE_SG`, `DEC_RISK_WEIGHT`).

**Input preparation:** Create a view named `DEC_*_INPUT` with fields matching decision table inputs. Apply `coalesce()` to ensure non-null values where the table expects them. Call syntax: `DEC_OUTPUT := DEC_NAME(DEC_INPUT);`

---

## 6. Functional Unit Design Principles

### Single Responsibility
- Each FU should calculate one specific enrichment or classification.
- FUs that update entities should export fields that are then available as inputs to other FUs.

### Dependencies
- Shared/common FUs should be reusable across different calculation domains.
- Domain-specific FUs can depend on shared FUs but not vice versa.
- Import only what you need; avoid circular dependencies.

### Data Flow

1. **Input data** (`*_IN` entities) →
2. **Shared enrichments** (update entities with classifications, flags) →
3. **Domain calculations** (produce output datasets for reporting).

### Modularity
- Extract context-specific logic into separate `_DEC_XX_BL` files.
- Use `case when globalString('visibilityContext.<PARAM>') = 'XX'` to route to context-specific BLs.
- Keep base/default logic in `_BL` or `_DEC_BL` (no context suffix).

---

## 7. Testing & Validation

- Test data files go in `test/` subdirectory under each FU.
- Use `.json` or `.xlsx` for test input data.
- Use `.tab` files for expected outputs.
- Test file naming: `FU_NAME_CF_TEST.json`, `FU_NAME_CF_TEST_INPUT.tab`, `FU_NAME_CF_TEST_OUTPUT.tab`.

---

## 8. Common Anti-Patterns to Avoid

1. **Don't use `select *`** — always list fields explicitly.
2. **Don't forget `coalesce` for nullable fields** in decision table inputs or WHERE clauses.
3. **Don't mix inner/outer joins inconsistently** — prefer `left outer join`.
4. **Don't create circular dependencies** between FUs.
5. **Don't hard-code context-specific logic in shared FUs** — use context-specific FUs in the appropriate domain module.
6. **Don't forget to alphabetize fields** in select lists (strict alphabetical order, no exceptions).
7. **Don't use ambiguous field references** — always use table aliases in multi-table queries.
8. **Add export annotations when applicable** (`/** @update ENTITY **/` or `/** @create ENTITY **/`) only when the FU updates or creates that entity.
9. **Don't forget `as function`** in BL unit declarations.
10. **Don't skip explicit null handling** — use `cast(null as Type)` when needed.
11. **Don't use generic names for the BL result view in CF** — use `FU_NAME_OUT`, not `BL_OUTPUT`.
12. **In BL, assign and export the function result as `FU_NAME_BL`** — do not assign or export a different name (e.g. `FU_NAME_OUT`) in the BL file.

---

## 9. Summary Checklist

When creating or modifying a Functional Unit:

- [ ] **Component file** has correct imports/exports.
- [ ] **CF file** has all dependencies imported, views prepared with coalesce, BL result assigned to `FU_NAME_OUT`, final output selected from it, export (with annotation when applicable).
- [ ] **BL file** has `as function`, result assigned to `FU_NAME_BL` and exported as `FU_NAME_BL`, decision table calls (if applicable), proper null handling.
- [ ] **DD file** has all output fields with types, primary key defined.
- [ ] **Decision tables** (if applicable) have inputs prepared with coalesce, context-specific suffixes.
- [ ] **Field names** are UPPERCASE, views are UPPERCASE, files are UPPERCASE.
- [ ] **Fields alphabetically ordered** in select lists.
- [ ] **Joins** use `left outer join` with explicit conditions.
- [ ] **Context-specific logic** is in separate files with appropriate suffix or visibility context.
- [ ] **No circular dependencies** between FUs.
- [ ] **Test data** provided in `test/` subdirectory (if creating new FU).
