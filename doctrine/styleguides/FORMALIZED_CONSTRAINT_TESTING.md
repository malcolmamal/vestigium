# Formalized Constraint Testing

**Version:** 1.0.0  
**Created:** 2026-02-03  
**Purpose:** Testing core contracts as formal invariants

---

## Overview

Formalized Constraint Testing is an approach where tests encode the fundamental mathematical properties (invariants) that a component must satisfy. Rather than testing specific input-output pairs, we test that the component upholds its **contract** across a representative sample of inputs.

This approach resembles formal proofs: if the invariants hold, the implementation is correct with respect to those constraints.

---

## Core Principle

> **Test the contract, not the implementation.**

Every data type and operation has implicit or explicit contracts. For example:
- `equals()` must be reflexive, symmetric, and transitive
- Serialization must be lossless (round-trip preserves data)
- A hash function must be consistent and aligned with equality

Formalized Constraint Testing makes these contracts explicit through test cases.

---

## Patterns

### 1. Symmetry / Round-Trip Testing

**Invariant:** `deserialize(serialize(x)) == x`

Tests that transformations are lossless. If data survives a round-trip unchanged, both directions of the transformation are correct.

```
GIVEN any valid object X
WHEN X is serialized then deserialized
THEN the result equals X
```

**Negative case:** Modified serialized form should NOT equal original.

```
GIVEN any valid object X
AND a modified serialized representation Y'
WHEN Y' is deserialized
THEN the result does NOT equal X
```

**Why this works:**
- Self-validating: no handcrafted expected values
- Tests both serialize AND deserialize simultaneously  
- Parameterized variants cover edge cases efficiently

---

### 2. Equality Contract Testing

The equality contract defines how objects compare. In most languages, `equals()` must satisfy:

| Property | Definition | Test |
|----------|------------|------|
| **Reflexive** | `x.equals(x) == true` | Object equals itself |
| **Symmetric** | `x.equals(y) == y.equals(x)` | Order doesn't matter |
| **Transitive** | `x==y && y==z → x==z` | Equality chains |
| **Null-safe** | `x.equals(null) == false` | Never equals null |
| **Type-safe** | `x.equals(other_type) == false` | Different types not equal |

**Positive tests:** Equal objects are recognized as equal.

**Negative tests (parameterized):** Objects differing in ANY field must be unequal.

```
FOR EACH field F in object type T:
  GIVEN two objects X and Y identical except for field F
  THEN X does NOT equal Y
  AND Y does NOT equal X  (symmetry of inequality)
```

---

### 3. Hash Code Contract Testing

Hash codes must align with equality:

| Property | Definition | Test |
|----------|------------|------|
| **Consistent** | Multiple calls return same value | `x.hashCode() == x.hashCode()` |
| **Equals-aligned** | `x.equals(y) → x.hashCode() == y.hashCode()` | Equal objects, equal hashes |
| **Distribution** | Unequal objects *should* have different hashes | Best-effort, not mandatory |

**Note:** Hash collisions are allowed, so the distribution test documents expected behavior rather than enforcing a strict contract.

---

### 4. Sparse Serialization Testing

When serializing, empty or default values may be omitted for cleaner output.

**Invariant:** Empty collections/null values are not present in serialized form.

```
GIVEN an object with empty optional fields
WHEN serialized
THEN the output does NOT contain those field names
```

This requires production code to use appropriate annotations (e.g., `@JsonInclude(NON_EMPTY)`).

---

## Implementation Strategy

### Parameterized Tests

Use parameterized tests to cover multiple cases with a single test definition:

```
TEST CASES:
  - Object with field A populated, B empty
  - Object with field A empty, B populated  
  - Object with all fields empty
  - Object with all fields populated

FOR EACH case:
  VERIFY invariant holds
```

### Positive and Negative Pairs

For every positive invariant, consider its negative counterpart:

| Positive | Negative |
|----------|----------|
| Equal objects are equal | Unequal objects are not equal |
| Valid input succeeds | Invalid input fails appropriately |
| Round-trip preserves data | Modified data breaks equality |

### Edge Case Coverage

Parameterized tests should include:
- Empty/zero values
- Boundary values
- Null values (where applicable)
- Maximum/extreme values
- Mixed populated/empty states

---

## Benefits

1. **Contract Documentation:** Tests serve as executable specification of the contract
2. **Regression Safety:** Any violation of the contract is immediately detected
3. **Refactoring Confidence:** Implementation can change; contract tests remain stable
4. **Completeness:** Systematic coverage of all contract aspects
5. **Mutation Resistance:** Hard to mutate code without breaking contract tests

---

## Example: Data Transfer Object

For a DTO with fields `(id, name, items[])`:

```
EQUALS CONTRACT:
  ✓ reflexive: x.equals(x)
  ✓ symmetric: x.equals(y) == y.equals(x)  
  ✓ transitive: x==y && y==z → x==z
  ✓ null-safe: x.equals(null) == false
  ✓ type-safe: x.equals("string") == false
  ✓ field-wise: different id → not equal
  ✓ field-wise: different name → not equal
  ✓ field-wise: different items → not equal

HASHCODE CONTRACT:
  ✓ consistent: multiple calls same result
  ✓ equals-aligned: equal objects same hash
  ✓ distribution: different objects different hash (best effort)

SERIALIZATION CONTRACT:
  ✓ symmetry: deserialize(serialize(x)) == x
  ✓ asymmetry: modified JSON ≠ original
  ✓ sparse: empty items[] omitted from output
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Better Approach |
|--------------|---------|-----------------|
| Testing only happy path | Misses contract violations | Add negative cases |
| Hardcoded expected JSON | Brittle, hard to maintain | Use round-trip tests |
| Testing implementation | Breaks on refactoring | Test contract/behavior |
| Single equality test | Misses field discrimination | Parameterized field tests |
| Ignoring null/edge cases | Incomplete contract | Explicit null-safety tests |

---

## Checklist

When implementing formalized constraint testing:

- [ ] Identify all contracts the component must satisfy
- [ ] Write positive tests for each contract property
- [ ] Write negative tests for each contract property
- [ ] Use parameterization for field-wise and edge case coverage
- [ ] Include null/empty/boundary cases
- [ ] Verify tests are isolated and deterministic
- [ ] Document the contract being tested in test names

---

_Based on lessons learned from Java record testing in quality-validator project._  
_Influenced by property-based testing and formal methods._
