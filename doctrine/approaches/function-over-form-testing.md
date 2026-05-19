# Testing Philosophy: Function Over Form

**Approach Type:** Testing Strategy
**Version:** 1.0.0
**Last Updated:** 2026-03-17
**Status:** Active

---

## Purpose

Define a testing philosophy that prioritizes behavioral validation over structural verification. Tests should prove that the system does what it should, not that it was assembled from the right parts.

---

## Core Principle

**Test behavior, not construction.**

Follow ATDD (Acceptance Test-Driven Development) where tests validate functional requirements and business logic, not implementation details.

---

## What NOT to Test Directly

### Constructors and Builders

Do not write dedicated tests for:
- Constructors
- Builder patterns
- Factory methods
- Setters/Getters
- Record accessors

These are construction details. They get tested *indirectly* through functional tests that exercise the objects they create.

### toString, equals, hashCode (in isolation)

Do not test formatting or identity methods in isolation unless they encode business logic. These methods should be validated through integration with collections, logging, or comparison operations that depend on them.

---

## What TO Test

### Functional Behavior

Test the *observable outcomes* of operations:

```
Given [preconditions],
When [action is performed],
Then [observable result matches expectation].
```

### Validation Logic

Validation rules are business logic and MUST be tested:
- Required field presence
- Format constraints
- Range boundaries
- Cross-field consistency

### Edge Cases Through Behavior

Test edge cases via the public API, not internal state:
- Empty inputs, null inputs, boundary values
- Missing optional fields
- Malformed data
- Concurrent access (if applicable)

---

## Natural Coverage Principle

When you test behavior thoroughly, construction coverage follows naturally:

```
Functional test exercises:
  create object → configure it → use it → verify result
```

This single test path covers: constructor, configuration, business logic, and output formatting — without testing any of them in isolation.

---

## Anti-Patterns

| Anti-Pattern | Why It's Wrong | Instead |
|---|---|---|
| Testing getters/setters | Verifies Java syntax, not behavior | Test through a functional scenario |
| Dedicated constructor tests | Constructors are setup, not behavior | Use constructors in behavioral tests |
| Mocking everything | Tests prove mock wiring, not behavior | Use real objects when feasible |
| Testing private methods | Couples tests to implementation | Test through the public API |
| Assertion on internal state | Breaks encapsulation | Assert on observable output |

---

## Guidelines Summary

1. **Write tests for behavior** — what the system does, not how it's built.
2. **Let construction coverage come naturally** from functional tests.
3. **Test validation logic explicitly** — it IS business logic.
4. **Avoid structural tests** for constructors, builders, and accessors.
5. **Focus on Given/When/Then** scenarios that map to requirements.

---

## Relationship to Other Approaches

- **Directive 016 (ATDD):** This approach explains the *philosophy*; ATDD defines the *workflow* (write acceptance tests first).
- **Directive 017 (TDD):** TDD covers the RED/GREEN/REFACTOR cycle; this approach guides *what* to test during that cycle.
- **Quad-A Pattern:** The test structure (Arrange/Assumption/Act/Assert) is complementary — use it for every test written under this philosophy.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-17 | Extracted from gdm-mapping-validator .doctrine-config (generic patterns only) |

---

**Maintained by:** Regnology Professional Services
**Applicability:** All languages and frameworks; examples may use Java but principles are universal
