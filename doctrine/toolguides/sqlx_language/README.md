# SQLX Language Reference (Local Failover)

**Purpose:** Offline reference for the SQLX language specification when the MCP server (`get_sqlx_manual_chapter`) is unavailable.  
**Version:** 1.0.0  
**Last Updated:** 2026-03-17  
**Status:** Active

---

## Access Strategy

```
┌──────────────────────────────────────────────────────────┐
│  1. PREFERRED — MCP: get_sqlx_manual_chapter             │
│     Live, authoritative, chapter-level access.           │
│     Request chapters by number (0–30).                   │
├──────────────────────────────────────────────────────────┤
│  2. FAILOVER — This directory (sqlx_language/)           │
│     Offline reference compiled from doctrine sources.    │
│     Use when MCP is unavailable or unresponsive.         │
└──────────────────────────────────────────────────────────┘
```

**Always try MCP first.** The `get_sqlx_manual_chapter` tool provides the canonical, up-to-date SQLX language specification (31 chapters). This local reference is a secondary source compiled from doctrine-internal knowledge and may not cover every chapter or recent spec changes.

---

## Chapter Index

The SQLX manual comprises 31 chapters. Below is the chapter mapping with local doctrine cross-references that cover the same concepts.

| Ch. | Topic | Local Doctrine Coverage |
|-----|-------|------------------------|
| 0–2 | Language overview | [sqlx-coding-standards §1–2](../../approaches/sqlx-coding-standards.md) (FU structure, naming) |
| 3 | Functional Units | [sqlx-coding-standards §1, §3](../../approaches/sqlx-coding-standards.md) (CF, BL, DD patterns) |
| 4 | Decision Tables | [sqlx-coding-standards §5](../../approaches/sqlx-coding-standards.md) (.dec format, rules, operators); [sqlx-validation DT rules](../../tactics/sqlx/sqlx-validation.tactic.md) |
| 5 | Components | [sqlx-coding-standards §3](../../approaches/sqlx-coding-standards.md) (component.sqlx, import/export); [sqlx-generation Step 5](../../tactics/sqlx/sqlx-generation.tactic.md) |
| 6 | Expressions | _Partial:_ [sqlx-coding-standards §4](../../approaches/sqlx-coding-standards.md) (CASE, coalesce, cast) |
| 7 | Datasets | [sqlx-coding-standards §3](../../approaches/sqlx-coding-standards.md) (DD file, types, primary key); [sqlx-validation DD rules](../../tactics/sqlx/sqlx-validation.tactic.md) |
| 8–13 | Advanced constructs | _Not covered locally — use MCP_ |
| 14 | Testing Functional Units | [sqlx-testing tactic](../../tactics/sqlx/sqlx-testing.tactic.md) (.tab format, test config, CLI); [sqlx-test-data-conventions](../../styleguides/sqlx-test-data-conventions.md) |
| 15 | Test Data via Excel | [sqlx-test-data-conventions](../../styleguides/sqlx-test-data-conventions.md) (XML format, entity definitions, ID conventions) |
| 16–17 | Advanced testing | _Not covered locally — use MCP_ |
| 18 | Test Server | [sqlx-testing tactic Step 8](../../tactics/sqlx/sqlx-testing.tactic.md) (CLI `abacus test` invocation) |
| 19–30 | Extended topics | _Not covered locally — use MCP_ |

---

## Quick Reference: Core SQLX Syntax

This section provides essential syntax patterns for when MCP is unavailable. For complete semantics, consult the MCP manual chapters.

### Unit Declarations

```sqlx
unit FU_NAME_CF;                    -- Calculation Flow
unit FU_NAME_BL as function;        -- Business Logic (always "as function")
```

### Component Manifest

```sqlx
component FU_NAME;

import DEPENDENCY_FU from OTHER_FU;
import ENTITY_IN from input;
export FU_OUTPUT;
```

Order: component declaration → imports → exports → function registrations.

### Dataset Definition

```sqlx
dataset OUTPUT_NAME (
    FIELD1 Type,
    FIELD2 Type,
    Primary Key (KEY_FIELD1, KEY_FIELD2)
);
```

Types: `String`, `Double`, `Integer`, `Date`, `Boolean`.

### View Assignment

```sqlx
VIEW_NAME :=
    select
        FIELD1,
        coalesce(FIELD2, DEFAULT) as FIELD2
    from
        SOURCE
    left outer join OTHER on
        SOURCE.KEY = OTHER.KEY;
```

### Function Call (BL from CF)

```sqlx
FU_NAME_OUT := FU_NAME_BL(VIEW1, VIEW2);
```

### Export with Annotation

```sqlx
/** @update ENTITY **/
export FU_OUTPUT;
```

Use `@update` or `@create` only when the FU modifies an entity; omit otherwise.

### Decision Table (.dec)

```
FIELD1: Input
FIELD2: Input
OUTPUT: Output
---
# Input
FIELD1: value1
FIELD2: in (a, b)
# Output
OUTPUT: result1
---
# Input
FIELD1: value2
# Output
OUTPUT: result2
```

Rules separated by `---`. No `*` wildcard for else rules — use a rule with no input condition as catch-all.

### Conditional Logic

```sqlx
case
    when CONDITION1 then VALUE1
    when CONDITION2 then cast(null as Double)
end as OUTPUT_FIELD
```

### Context/Visibility Filtering

```sqlx
case
    when coalesce(globalString('visibilityContext.COUNTRY'), "DEFAULT") = "DEFAULT" then ...
    when globalString('visibilityContext.COUNTRY') = "SG" then ...
end
```

---

## Key Rules Summary

These rules are enforced by the [sqlx-validation tactic](../../tactics/sqlx/sqlx-validation.tactic.md):

| Rule | Category | Severity |
|------|----------|----------|
| Fields alphabetically ordered in SELECT | SQL Pattern | ⚠️ |
| No `select *` — always enumerate fields | SQL Pattern | ❗️ |
| `coalesce()` on nullable decision table inputs | SQL Pattern | ❗️ |
| BL exports `FU_NAME_BL`, not `FU_NAME_OUT` | Import/Export | ❗️ |
| CF assigns BL result to `FU_NAME_OUT` | Import/Export | ⚠️ |
| `as function` in BL unit declaration | Unit Declaration | ❗️ |
| No subcomponents (CLI restriction) | Import/Export | ❗️ |
| Dataset definition for all component exports | Dataset | ❗️ |
| Primary key defined | Dataset | ❗️ |
| No `*` wildcard in decision tables | Decision Table | ❗️ |

---

## Doctrine Sources Cross-Reference

| Doctrine File | What It Covers |
|---------------|----------------|
| [sqlx-coding-standards.md](../../approaches/sqlx-coding-standards.md) | FU structure, naming, SQL patterns, decision tables, anti-patterns, design principles |
| [sqlx-test-data-conventions.md](../../styleguides/sqlx-test-data-conventions.md) | Test data XML organization, entities, ID conventions, field naming |
| [sqlx-spec-driven-authoring.md](../../approaches/sqlx-spec-driven-authoring.md) | Workflow routing: which tactic for which task |
| [sqlx-generation.tactic.md](../../tactics/sqlx/sqlx-generation.tactic.md) | Step-by-step artifact generation from spec |
| [sqlx-validation.tactic.md](../../tactics/sqlx/sqlx-validation.tactic.md) | 7-category rule catalog (FS, UD, IE, SP, DD, DT, DM) |
| [sqlx-testing.tactic.md](../../tactics/sqlx/sqlx-testing.tactic.md) | Test suite generation, .tab format, CLI execution |
| [sqlx-explanation.tactic.md](../../tactics/sqlx/sqlx-explanation.tactic.md) | Business-language explanation procedure |
| [sqlx-pseudo-code-to-spec.tactic.md](../../tactics/sqlx/sqlx-pseudo-code-to-spec.tactic.md) | Pseudo code → structured specification |

---

## Limitations

This local reference is compiled from doctrine sources and covers the most commonly used SQLX constructs. It does **not** replace the full 31-chapter manual. The following areas require MCP access for authoritative guidance:

- Advanced expression types (chapters 8–13)
- Extended testing features (chapters 16–17)
- Advanced topics (chapters 19–30)
- Recent language additions not yet reflected in doctrine

When MCP is unavailable and the needed topic isn't covered here, escalate per Directive 040.
