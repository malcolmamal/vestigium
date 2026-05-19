# Generic Testing Guidelines

**Version:** 1.0.0  
**Created:** 2026-02-03  
**Purpose:** Consolidated testing principles and practices

---

## Foundations

This guide synthesizes testing wisdom from multiple sources:

- Kent Beck's Test Desiderata
- The Testing Pyramid (Mike Cohn, Martin Fowler)
- Clear Test Boundaries (functional slicing)
- Quadruple-A Test Structure

---

## Test Desiderata (Kent Beck)

Tests should exhibit these properties. Some reinforce each other; some create tension requiring trade-offs.

| Property                  | Description                               | Implication                               |
|---------------------------|-------------------------------------------|-------------------------------------------|
| **Isolated**              | Results don't depend on execution order   | No shared mutable state between tests     |
| **Composable**            | Test dimensions of variability separately | Combine focused tests for coverage        |
| **Deterministic**         | Same input → same result                  | No flaky tests; control randomness        |
| **Fast**                  | Quick execution                           | Enables rapid feedback loops              |
| **Writable**              | Cheap to create relative to code          | Don't over-engineer test infrastructure   |
| **Readable**              | Intent is obvious to readers              | Self-documenting test names and structure |
| **Behavioral**            | Sensitive to behavior changes             | Tests fail when behavior breaks           |
| **Structure-insensitive** | Insensitive to structure changes          | Tests survive refactoring                 |
| **Automated**             | No human intervention required            | CI/CD integration                         |
| **Specific**              | Failure cause is obvious                  | Good error messages, focused assertions   |
| **Predictive**            | Passing tests → production-ready          | High correlation with real-world success  |
| **Inspiring**             | Passing tests inspire confidence          | Trust in the test suite                   |

### Key Tensions

- **Predictive vs. Fast:** More realistic tests are slower
- **Behavioral vs. Structure-insensitive:** Testing behavior can couple to structure
- **Composable** can resolve apparent tensions: fast AND predictive through composition

---

## The Testing Pyramid

Tests exist on a spectrum from isolated to integrated:

```
                    /\
                   /  \     UI/E2E Tests
                  /    \    (slow, realistic)
                 /------\
                /        \  Integration Tests
               /          \ (moderate speed/realism)
              /------------\
             /              \ Unit Tests
            /                \ (fast, isolated)
           /------------------\
```

### Test Types

| Level           | Scope                 | Speed   | Realism     | When to Use                 |
|-----------------|-----------------------|---------|-------------|-----------------------------|
| **Unit/Method** | Single function/class | Fastest | Lowest      | Core logic validation       |
| **Acceptance**  | Feature/story         | Fast    | Medium      | Feature completion gates    |
| **Integration** | Multiple components   | Medium  | Medium-High | External system connections |
| **E2E**         | Full system           | Slowest | Highest     | Critical user journeys      |

### Heuristic

> **Aim for the fastest possible feedback loop that catches ~90% of issues.**

---

## Clear Test Boundaries

### Problem

Tests defined by structural layers (presentation, business, data) become:

- Brittle when layers change
- Over-mocked and coupled to implementation
- Slow to provide meaningful feedback

### Solution

Define test boundaries by **functionality**, not architecture.

```
INSTEAD OF:
  Test Presentation Layer → Mock Business Layer
  Test Business Layer → Mock Data Layer
  Test Data Layer → Mock Database

DO:
  Test "User Registration" functionality
    → Use real business/data layers
    → Only mock external systems (DB, email service)
```

### Benefits

- Tests survive internal refactoring
- Tests document functional behavior, not implementation
- Fewer mocks = more realistic tests
- Changes to implementation don't break tests

---

## Quadruple-A Test Structure

Every test should follow a clear four-stage structure:
Arrange, Assumption-check, Act, Assert.
Optionally, a fifth cleanup step can be added (quintuple-A variant).

### 1. Arrange

Set up preconditions explicitly:

- Create objects
- Seed data
- Configure mocks/stubs

### 2. Assumption-check

Ensure the state of the system post `Arrange` is as expected:

- Verify preconditions
- Verify side effects
- Verify invariants

### 3. Act

Perform a **single** behavior:

- One method call
- One HTTP request
- One command

### 4. Assert

Verify expected outcomes:

- Focused assertions
- Document what changed AND what stayed the same
- Use descriptive assertion messages

### 5. Optional (quintuple-A variant) After (Cleanup)

Reset state for isolation:

- Remove temporary files
- Reset shared resources
- Restore mocks

### Example Structure

```
test "transfer reduces source and increases target balance":
    # Arrange
    source = Account(balance=100)
    target = Account(balance=0)
    
    # Assumption
    assert source.balance >= 25
    assert target.is_accessible
    assert source.is_accessible
    
    # Act
    result = transfer(source, target, amount=25)
    
    # Assert
    assert result.is_ok()
    assert source.balance == 75
    assert target.balance == 25
    
    # After
    cleanup_accounts(source, target)
```

---

## Test Minimization Principles

### Logical vs Code Duplication

When reviewing test suites, distinguish between:

| Type | Definition | Policy |
|------|------------|--------|
| **Code path overlap** | Multiple tests execute the same lines | ✅ Allowed |
| **Logical duplication** | Multiple tests assert the same invariant/contract | ❌ Remove |

**Rationale:** Contract-based tests (symmetrical, parameterized invariants) are more generic and stable than spot-checks. When a contract test covers the same *reasoning* as a spot-check, the spot-check becomes redundant.

### Test Minimization Process

1. **Run tests with coverage** — Establish baseline
2. **Identify logically duplicative tests** — Tests asserting the same contract differently
3. **Disable candidates** — Comment out or use `@Disabled`
4. **Re-run coverage** — Compare to baseline
5. **If identical:** Delete the superfluous tests
6. **If coverage drops:** The test was not redundant; restore it

### Exceptions

- **Bug regression tests:** Keep even if they overlap, as they document specific defects
- **Documentation tests:** Spot-checks that clarify expected format may be retained for readability

### "Just Enough" Testing

Apply the same principle as "just enough documentation":
- Tests should be **useful**, not merely complete
- Remove tests that no longer add value
- Each test should document a distinct decision or contract

> *"Documentation that no one reads is waste; archive or delete artefacts that no longer guide active work."*
> — Traceable Decisions pattern

---

## Lessons Learned

### From This Project

1. **Contract tests are stronger than spot-checks**
    - Round-trip tests (`deserialize(serialize(x)) == x`) capture correctness in one assertion
    - Spot-checks (`json.contains("field")`) only verify specific details

2. **Parameterized tests reduce duplication**
    - One test definition, multiple cases
    - Easier to add edge cases
    - Better coverage with less code

3. **Negative tests are essential**
    - Every positive assertion needs a negative counterpart
    - "Not equal when fields differ" is as important as "equal when same"

4. **Test names document contracts**
    - `equals_reflexive`, `hashCode_consistent` are self-explanatory
    - Names should state the invariant being tested

5. **ATDD catches design issues early**
    - Writing tests first exposes API awkwardness
    - Tests become living documentation

### Anti-Patterns Observed

| Anti-Pattern           | Symptom                       | Fix                      |
|------------------------|-------------------------------|--------------------------|
| Over-mocking           | Tests break on refactoring    | Widen test boundary      |
| Testing implementation | `verify(mock).methodCalled()` | Assert on behavior/state |
| No negative tests      | Mutations survive             | Add failure cases        |
| Shared mutable state   | Flaky tests                   | Isolate test data        |
| Unclear test names     | Can't understand failures     | Name after invariant     |

---

## Test Quality Checklist

### Structure

- [ ] Tests follow Arrange-Act-Assert-After structure
- [ ] Each test verifies one behavior
- [ ] Test names describe the invariant/behavior
- [ ] No shared mutable state between tests

### Coverage

- [ ] Positive cases (happy path)
- [ ] Negative cases (error conditions)
- [ ] Edge cases (null, empty, boundary values)
- [ ] Contract tests for equality/hashing/serialization
- [ ] Prefer formal specifications over spot checks (see [GENERIC TESTING](GENERIC_TESTING.md))

### Properties

- [ ] Isolated: order-independent
- [ ] Deterministic: no flakiness
- [ ] Fast: milliseconds, not seconds
- [ ] Readable: intent is clear
- [ ] Specific: failures point to cause

### Maintenance

- [ ] Tests survive implementation refactoring
- [ ] No hardcoded expected values (use invariants)
- [ ] Parameterized where appropriate
- [ ] Cleanup happens even on assertion failure

---

## References

- Beck, K. (2022). [Test Desiderata](https://testdesiderata.com/)
- Fowler, M. (2018). [The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)
- Dejongh, S. (2023). The Testing Pyramid. Penguin Pragmatic Patterns.
- Dejongh, S. (2024). Clear Test Boundaries. Penguin Pragmatic Patterns.
- Dejongh, S. (2024). The Quadruple-A Test Structure. Penguin Pragmatic Patterns.
- Beck, K. (2003). Test Driven Development: By Example. Addison-Wesley.

---

_Consolidated from project lessons and industry best practices._
