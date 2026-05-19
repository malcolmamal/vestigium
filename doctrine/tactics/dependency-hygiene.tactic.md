<!--
████          R E G N O L O G Y
    ██        Professional Services
████
    ██        professional_services@regnology.net
-->

# Tactic: Dependency Hygiene

**Version:** 1.0.0
**Last Updated:** 2026-03-30
**Status:** active

**Invoked by:**
- [Directive 043](../directives/043_appsec_compliance.md) — AppSec Compliance

**Related tactics:**
- `appsec-pipeline-setup.tactic.md` — pipeline setup (run together)
- `security-issue-triage.tactic.md` — handling CVEs found in DependencyTrack

---

## Intent

Keep the dependency tree of a Regnology PS project free of known vulnerabilities and
non-compliant licenses. Apply at project creation, when adding dependencies, and as
part of regular maintenance.

Apply when:
- Starting a new project (establish hygiene from day one)
- Adding or upgrading any dependency
- DependencyTrack reports new CVEs on existing components
- Preparing a release (pre-release audit)

---

## Preconditions

- Root `pom.xml` or `pyproject.toml` exists
- CycloneDX SBOM generation is configured (see `appsec-pipeline-setup.tactic.md`)
- Access to [DependencyTrack](https://dependencytrack.regnology.net) and [Lucy](https://lucy.regnology.net/library)

---

## Execution Steps (Java/Maven)

### Step 1 — Pin all direct dependency versions

Every direct dependency MUST have an explicit version declared in a `<properties>` block.
Never rely on inherited or transitive version resolution for direct dependencies.

```xml
<properties>
    <!-- All versions declared here — no magic numbers in dependency declarations -->
    <spring-boot.version>4.0.5</spring-boot.version>
    <commons-lang3.version>3.20.0</commons-lang3.version>
    <guava.version>33.5.0-jre</guava.version>
    <snakeyaml.version>2.6</snakeyaml.version>
</properties>
```

### Step 2 — Import BOMs before declaring overrides

Import BOM dependencies at the top of `<dependencyManagement>`, before any version overrides.
This ensures your overrides take precedence over BOM-managed versions.

```xml
<dependencyManagement>
    <dependencies>
        <!-- Jackson BOM imported BEFORE Spring Boot so our pins take precedence -->
        <dependency>
            <groupId>tools.jackson</groupId>
            <artifactId>jackson-bom</artifactId>
            <version>${jackson.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>${spring-boot.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
        <!-- Version overrides and additions follow -->
    </dependencies>
</dependencyManagement>
```

### Step 3 — Audit and exclude vulnerable transitives

Identify vulnerable transitive dependencies and exclude them explicitly. Do not rely on
upgrades of parent components to fix transitive CVEs — pin or exclude directly.

Common patterns to apply proactively:

```xml
<!-- Log4Shell mitigation: exclude log4j-core; use slf4j bridge without core -->
<dependency>
    <groupId>org.apache.logging.log4j</groupId>
    <artifactId>log4j-slf4j2-impl</artifactId>
    <exclusions>
        <exclusion>
            <groupId>org.apache.logging.log4j</groupId>
            <artifactId>log4j-core</artifactId>
        </exclusion>
    </exclusions>
</dependency>

<!-- commons-beanutils: deserialization vulnerability vector; exclude from opencsv -->
<dependency>
    <groupId>com.opencsv</groupId>
    <artifactId>opencsv</artifactId>
    <exclusions>
        <exclusion>
            <groupId>commons-beanutils</groupId>
            <artifactId>commons-beanutils</artifactId>
        </exclusion>
    </exclusions>
</dependency>
```

For each exclusion, add a comment explaining the CVE or vulnerability motivation.

### Step 4 — Restrict dependency resolution to Maven Central

Add explicit repository configuration to prevent unintended resolution from external registries:

```xml
<!-- Resolve from Maven Central only. No GitHub Packages or unapproved registries. -->
<repositories>
    <repository>
        <id>central</id>
        <url>https://repo.maven.apache.org/maven2</url>
        <releases><enabled>true</enabled></releases>
        <snapshots><enabled>false</enabled></snapshots>
    </repository>
</repositories>
<pluginRepositories>
    <pluginRepository>
        <id>central</id>
        <url>https://repo.maven.apache.org/maven2</url>
        <releases><enabled>true</enabled></releases>
        <snapshots><enabled>false</enabled></snapshots>
    </pluginRepository>
</pluginRepositories>
```

### Step 5 — Check license compliance before adding a new dependency

Before adding any new component:

1. Check the [Lucy Database](https://lucy.regnology.net/library) for its license classification
2. If the license is **Permissive** (Apache 2.0, MIT, BSD-3-Clause, etc.) — proceed
3. If the license is **Limited Copyleft** (LGPL, MPL, EPL, CDDL) — contact appsec@regnology.net for individual assessment before adding
4. If the license is **Strong Copyleft** (GPL-1.0, GPL-2.0, GPL-3.0, OSL) — **do not add** without explicit AppSec approval

Document the license decision in an ADR or a comment in `pom.xml` if non-obvious.

### Step 6 — Run the dependency update report

Run periodically (pre-release, or quarterly) to identify outdated components:

```bash
mvn versions:dependency-updates-report
# Review: target/site/dependency-updates-report.html
```

Prioritise upgrades for components with known CVEs (check DependencyTrack).
Read the component's CHANGES file before upgrading to detect API incompatibilities.

### Step 7 — Regenerate SBOM and resubmit after any change

After adding, removing, or upgrading any dependency:

```bash
mvn -Pcompliance cyclonedx:makeAggregateBom
# Verify both BOMs produced:
ls target/bom.json target/lucy-bom.json
```

If DependencyTrack upload is enabled, the next CI build will resubmit automatically.
If working locally, trigger a manual upload or push to CI.

---

## Execution Steps (Python)

### Step 1 — Use a lockfile

Always commit a `uv.lock` (or `poetry.lock` / `requirements.txt` with pinned hashes).
Never deploy from unpinned requirements.

```bash
uv lock          # generate/update lockfile
uv sync          # install from lockfile
```

### Step 2 — Audit for known vulnerabilities

```bash
uv run pip-audit        # scans installed packages against PyPI advisory database
# or
uv run safety check     # alternative scanner
```

Review and upgrade any flagged packages.

### Step 3 — Check license compliance

```bash
uv run pip-licenses --format=markdown
```

Review the output for any GPL or strong copyleft licenses. Contact appsec@regnology.net for any non-permissive licenses.

### Step 4 — Regenerate SBOM after any change

```bash
uv run cyclonedx-py environment --output-format JSON --output-file bom-python.json
```

Commit and push to trigger CI resubmission to DependencyTrack.

---

## Verification

```bash
# Java: no dependency resolution errors, both BOMs present
mvn dependency:resolve -q && ls target/bom.json target/lucy-bom.json

# Java: no GPL licenses in dependency tree (quick scan)
mvn license:aggregate-third-party-report
grep -i "GPL" target/site/aggregate-third-party-report.html \
  && echo "WARNING: GPL dependency found" || echo "No GPL found"

# Python: no high/critical advisories
uv run pip-audit --format=json | python3 -c \
  "import sys,json; d=json.load(sys.stdin); \
   [print(f['name'],f['version'],f['id']) for f in d.get('dependencies',[]) \
    for v in f.get('vulns',[]) if v.get('fix_versions')]"
```

---

## Exit Criteria

- All direct dependency versions pinned in properties block
- No transitive dependencies with known Critical/High/Medium CVEs (verify in DependencyTrack)
- No GPL/strong copyleft licenses without AppSec approval
- `<repositories>` block restricts resolution to Maven Central (Java)
- `uv.lock` committed and up to date (Python)
- Both `bom.json` and `lucy-bom.json` generated successfully (Java)
- `bom-python.json` generated successfully (Python)
