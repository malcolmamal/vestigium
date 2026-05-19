# SQLX Test Data Conventions (Styleguide)

**Type:** Domain styleguide (SQLX test data)  
**Version:** 1.1.0  
**Last Updated:** 2026-03-17  
**Status:** Active

---

## Purpose

This styleguide defines the standards for creating and organizing test data XML files within the Regnology Professional Services environment. Used by the SQLX testing tactic and SQLX Author when generating test suites.

**Related:** [sqlx-spec-driven-authoring.md](../approaches/sqlx-spec-driven-authoring.md), [sqlx-testing.tactic.md](../tactics/sqlx/sqlx-testing.tactic.md).

---

## 1. File Organization

### File Naming
- **Numbered Test Files**: Use 3-digit prefix for test files (e.g., `001_`, `060_`, `109_`).
- **Test Suites**: Group related tests in subdirectories (e.g., `TEST_TOP_20_SG/`, `TEST_TOTAL_ASSET_LIAB/`).
- **Counterparty Files**: Separate shared counterparties into `_CP.xml` files (e.g., `TEST_TOP20_SG_CP.xml`).

### Required Attributes
- `name`: Test file identifier (must match filename without extension).
- `date`: Test reference date (YYYY-MM-DD), e.g., `2021-06-30`.
- `level`: Test level identifier (always `10-001-x-xx-xxxx`).

## 2. Comment Structure

### Header Comments
- Provide an overview of all test cases at the beginning of the file.
- Format: `<!-- CASE_ID - TYPE - COUNTERPARTY - CURRENCY - AMOUNT -->`
- Example: `<!-- A1 - DEPOSIT_1 - 00X_A_PARTNER - SGD - 1000 -->`

### Section Comments
- Repeat the test case header comment before each entity group.
- Label sections like `<!-- COUNTERPARTY -->`, `<!-- ISSUER -->`, `<!-- ISIN -->`, `<!-- STOCK -->`.
- Amount in comment MUST match the actual `VALUE` in the corresponding field.

### Position ID Comments
- List all positions belonging to each test case.
- Format: `<!-- POSITION_ID1;POSITION_ID2;POSITION_ID3 -->` (semicolon-separated).

## 3. Entity Definitions

### Common Entities
1. **PARTNER**: Counterparties, issuers, emitters.
2. **INSTRUMENT**: Financial instruments (deposits, bonds, repos, etc.).
3. **POSITION**: Account positions with balances and attributes.
4. **RATING**: Credit ratings for instruments.
5. **PARTNER_TO_INSTRUMENT**: Relationships between partners and instruments.
6. **PARTNER_TO_POSITION**: Holder/creditor relationships.
7. **CASHFLOW**: Projections for positions.
8. **PLEDGE**: Pledge relationships and collateral pools.

### Entity Definition Pattern
```xml
<ENTITY_TYPE ENTITY_ID="unique_id"/>
<ENTITY_TYPE_FIELD ENTITY_ID="unique_id" FIELDNAME="field_name" VALUE="field_value"/>
```

## 4. ID Conventions

### ID Prefixes
- **Test-Specific**: Use test file prefix (e.g., `001_`, `060_`).
- **Shared/Overarching**: Use `00X_` for shared entities across multiple files.

### ID Structure
- Pattern: `PREFIX_LETTER_SUFFIX` (e.g., `001_A1_DEPOSIT_SGD`).
- Suffixes: `_CP`, `_EM`, `_ISIN`, `_STOCK`, `_DEPOSIT`, `_LOAN`, `_REPO_DEAL`, `_GOLD`, `_SILVER`, `_NET`, `_SGD`, `_USD`, `_EUR`, `_RON`.

## 5. Field Naming Conventions

### Common Field Prefixes
- **C-fields**: Classification/configuration (C700, C763, C206, C207, C213, C214, C215, C702, C750).
- **B-fields**: Partner/rating (B001, B002, B815, B015).
- **PTY-fields**: Position type (PTY001, PTY652, PTY714).
- **VAL-fields**: Amount/value (VAL115, VAL654).
- **CUR-fields**: Currency (CUR007).
- **PRD-fields**: Product (PRD013, PRD150).
- **CTY-fields**: Country (CTY010, CTY011).
- **SIE-fields**: Sector (SIE200).

## 6. Value Conventions

### Date Values
- Format: ISO 8601 `YYYY-MM-DD`.
- Perpetual: `2999-12-31`.

### Amount Values
- **Assets**: Positive values (Loans, Bonds, Gold, Silver).
- **Liabilities**: Negative values (Deposits, Bonds Issued).
- No formatting (commas/periods as thousand separators).

## 7. Entity Ordering Rules

1. **Header Comments**: All test case descriptions at the top.
2. **For Each Test Case** (Alphabetical order: A, B, C, D...):
    - Test case comment.
    - PARTNER definitions.
    - PARTNER_TO_INSTRUMENT relationships.
    - INSTRUMENT definitions.
    - POSITION definitions.
    - RATING definitions.
    - PLEDGE definitions.

## 8. Shared Counterparty Files

- Separate shared counterparties into `_CP.xml` files.
- Use `00X_` prefix for all shared entities.
- Do NOT duplicate shared definitions in test files; use a reference comment instead.
