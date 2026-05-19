# Java Conventions & Style Guide

**Version:** 1.0.0
**Last Updated:** 2026-03-17
**Status:** Active

---

## Purpose

Java coding conventions and quality standards for agent-augmented development. These guidelines ensure consistency, prevent common defects flagged by SonarQube and SpotBugs, and maintain compliance with automated build quality gates.

---

## Formatting & Style

### Use Google Java Format via Spotless

**Tool:** Spotless Maven plugin with Google Java Format.

**Command:**

```bash
mvn spotless:apply
```

Run before every commit. Formatting is enforced in the build — unformatted code fails CI.

### Import Organization

IDEs should be configured to match Google Java Format import ordering. Avoid wildcard imports (`import java.util.*`).

---

## Numeric Precision

### Do not use `==` or `!=` on floating-point types

Floating-point arithmetic (`double`, `float`) introduces rounding errors. Equality comparisons are unreliable (SonarQube `java:S1244`).

**Instead of:**

```java
double numeric = Double.parseDouble(value);
if (numeric == Math.floor(numeric)) { ... }
```

**Use:**

```java
BigDecimal bd = new BigDecimal(value);
if (bd.stripTrailingZeros().scale() <= 0) { ... }
```

For approximate comparisons, use an explicit tolerance:

```java
if (Math.abs(a - b) < 1e-9) { ... }
```

### Prefer `BigDecimal` for financial and regulatory data

All monetary values MUST use `BigDecimal`, never `double` or `float`. Use `BigDecimal.compareTo()` for ordering and equality, not `.equals()` (which also compares scale).

---

## Naming Conventions

### Constants and enum values: `UPPER_SNAKE_CASE`

All `static final` constants and enum constants MUST match `^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$` (SonarQube `java:S115`).

**Instead of:**

```java
public enum InputFormat {
    CSV,
    Excel,
    Database
}
```

**Use:**

```java
public enum InputFormat {
    CSV,
    EXCEL,
    DATABASE
}
```

This applies to all `static final` fields (except loggers) and all enum constants.

---

## Collection Sizing

### Presize collections when the capacity is known

When creating `HashMap`, `ArrayList`, `HashSet`, or similar where the expected size is known, pass the capacity to the constructor. Avoids unnecessary rehashing/resizing (SpotBugs `fb-contrib:PSC_PRESIZE_COLLECTIONS`).

**Instead of:**

```java
Map<String, Integer> index = new HashMap<>();
for (int i = 0; i < header.length; i++) { ... }
```

**Use:**

```java
Map<String, Integer> index = new HashMap<>(header.length);
for (int i = 0; i < header.length; i++) { ... }
```

---

## String vs Character

### Use `char` for single-character constants

When a delimiter, separator, or marker is a single character, declare it as `char`. Avoids unnecessary object allocation (SpotBugs `fb-contrib:UCPM_USE_CHARACTER_PARAMETERIZED_METHOD`).

**Instead of:**

```java
String sep = ";";
sb.append(sep);
```

**Use:**

```java
char sep = ';';
sb.append(sep);
```

---

## Javadoc

- `@see` tags must reference valid targets. Use fully qualified class names for cross-package references.
- Wrap free-text references in quotes: `@see "ADR-027 Generic Record Parser Abstraction"`.
- HTML in javadoc must be well-formed. Escape `<` as `&lt;` in prose.
- Include `<caption>` on all `<table>` elements.
- Use Google-style: document `@param`, `@return`, `@throws` for public API.

---

## Guard Clauses

Prefer guard clauses over nested conditionals. Validate inputs early, fail fast with clear messages.

```java
public Record parse(String line) {
    if (line == null || line.isBlank()) {
        throw new IllegalArgumentException("Input line must not be blank");
    }
    if (!line.contains(delimiter)) {
        throw new ParseException("No delimiter found in: " + line);
    }
    // Main logic follows with clean, flat flow
    return doParse(line);
}
```

---

## Testing

### Quad-A Pattern

Tests MUST follow **Arrange → Assumption Check → Act → Assert**:

```java
@Test
void shouldParseValidRecord() {
    // Arrange
    String input = "field1;field2;field3";
    RecordParser parser = new RecordParser(';');

    // Assumption Check
    assertThat(input).contains(";");

    // Act
    Record result = parser.parse(input);

    // Assert
    assertThat(result.fields()).hasSize(3);
}
```

### Test Behavior, Not Construction

Follow the "Function Over Form" approach. Do not write dedicated tests for constructors, builders, factory methods, or getters/setters. Test them indirectly through functional behavior.

### Coverage Targets

- Minimum 80% on new code.
- All tests passing before marking work complete.
- Use JaCoCo for coverage measurement.

---

## Build Compliance

### Standard Quality Gate

A compliant Maven build (`mvn clean install`) should enforce:

| Tool | Purpose |
|------|---------|
| Spotless | Code formatting (Google Java Format) |
| License plugin | License header verification |
| JaCoCo | Code coverage (≥80% on new code) |
| Javadoc plugin | Documentation generation and validation |
| CycloneDX | SBOM generation |

### SonarQube

Run before submitting work for review:

```bash
mvn clean verify sonar:sonar \
  -Dsonar.branch.name=$(git branch --show-current) \
  -Dsonar.newCode.referenceBranch=main
```

All new Sonar issues MUST be resolved before the change is considered complete.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-17 | Extracted from gdm-mapping-validator .doctrine-config (generic patterns only) |

---

**Maintained by:** Regnology Professional Services
**Review Cycle:** Quarterly or when Java tooling evolves
**Related:** `doctrine/guidelines/python-conventions.md` for Python equivalent
