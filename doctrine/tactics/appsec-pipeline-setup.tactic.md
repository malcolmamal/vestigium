<!--
████          R E G N O L O G Y
    ██        Professional Services
████
    ██        professional_services@regnology.net
-->

# Tactic: AppSec Pipeline Setup

**Version:** 1.0.0
**Last Updated:** 2026-03-30
**Status:** active

**Invoked by:**
- [Directive 043](../directives/043_appsec_compliance.md) — AppSec Compliance

**Related tactics:**
- `dependency-hygiene.tactic.md` — dependency pinning, exclusions, license checks (run alongside this tactic)
- `maven-project-compliance-setup.tactic.md` — pom.xml compliance configuration (prerequisite for Java projects)

**Templates:**
- `doctrine/templates/ci/Jenkinsfile.maven-appsec.template`
- `doctrine/templates/ci/Jenkinsfile.python.template`
- `doctrine/templates/ci/jenkins-agent.yaml`

---

## Intent

Add all mandatory Regnology AppSec controls to a project's Jenkins CI pipeline so that every
build automatically enforces the Security Gates defined in Directive 043.

Apply when:
- Creating a CI pipeline for a new Regnology PS project
- Graduating a project from `maven-minimal` to full AppSec compliance
- Onboarding an existing project into the AppSec toolchain

---

## Preconditions

- Jenkins instance accessible; Kubernetes agent infrastructure available
- Project registered with AppSec team for SonarQube access (contact appsec@regnology.net)
- `pom.xml` configured per `maven-project-compliance-setup.tactic.md` (Java projects)
- `pyproject.toml` / `uv.lock` present (Python projects)
- DependencyTrack project UUID obtained (or `SKIP_DEPENDENCY_TRACK = 'true'` used until registered)

---

## Execution Steps

### Step 1 — Copy the appropriate pipeline template

Copy the matching template to the repository root as `Jenkinsfile`:

```bash
# Java/Maven project:
cp doctrine/templates/ci/Jenkinsfile.maven-appsec.template Jenkinsfile

# Python project:
cp doctrine/templates/ci/Jenkinsfile.python.template Jenkinsfile

# Add the Kubernetes agent pod spec:
cp doctrine/templates/ci/jenkins-agent.yaml jenkins-agent.yaml
```

### Step 2 — Substitute all TODO: markers

Search for `TODO:` in the Jenkinsfile and fill in all project-specific values:

| Placeholder | Value |
|---|---|
| `TODO: project-name` | Repository slug (e.g. `my-service`) |
| `TODO: CONS-project-name` | SonarQube project key (e.g. `CONS-my-service`); must match `sonar.projectKey` in `pom.xml` |
| `TODO: DT-PROJECT-UUID` | DependencyTrack project UUID (from AppSec team); leave `SKIP_DEPENDENCY_TRACK = 'true'` until obtained |
| `TODO: artifactory-project` | Artifactory generic local repo name |

Verify no `TODO:` remain before committing:

```bash
grep -n 'TODO:' Jenkinsfile && echo "UNRESOLVED TODOs FOUND" || echo "Clean"
```

### Step 3 — Configure SonarQube in pom.xml (Java)

Ensure the root `pom.xml` contains correct Sonar properties (see `maven-project-compliance-setup.tactic.md` Step 3):

```xml
<sonar.host.url>https://sonar.regnology.net/</sonar.host.url>
<sonar.projectKey>CONS-your-project-name</sonar.projectKey>
<sonar.projectName>CONS/your-project-name</sonar.projectName>
```

### Step 4 — Add SpotBugs + FindSecBugs to pom.xml (Java)

Add to `<pluginManagement>` in the root `pom.xml`. This is the minimum required security configuration:

```xml
<plugin>
    <groupId>com.github.spotbugs</groupId>
    <artifactId>spotbugs-maven-plugin</artifactId>
    <version>${spotbugs-maven-plugin.version}</version>
    <dependencies>
        <dependency>
            <groupId>com.h3xstream.findsecbugs</groupId>
            <artifactId>findsecbugs-plugin</artifactId>
            <version>${findsecbugs-plugin.version}</version>
        </dependency>
    </dependencies>
    <configuration>
        <!-- Max effort = deepest analysis; Medium threshold = flag Medium+ severity -->
        <effort>Max</effort>
        <threshold>Medium</threshold>
        <failOnError>true</failOnError>
    </configuration>
    <executions>
        <execution>
            <id>spotbugs-check</id>
            <phase>verify</phase>
            <goals><goal>check</goal></goals>
        </execution>
    </executions>
</plugin>
```

Add version properties:

```xml
<spotbugs-maven-plugin.version>4.9.3.0</spotbugs-maven-plugin.version>
<findsecbugs-plugin.version>1.14.0</findsecbugs-plugin.version>
```

### Step 5 — Configure dual CycloneDX SBOM in compliance profile (Java)

Ensure the `compliance` Maven profile produces both BOM variants (see `maven-project-compliance-setup.tactic.md`):

```xml
<!-- Full aggregate BOM — submitted to DependencyTrack -->
<execution>
    <id>generate-dt-sbom</id>
    <phase>package</phase>
    <goals><goal>makeAggregateBom</goal></goals>
    <configuration><outputName>bom</outputName></configuration>
</execution>
<!-- Runtime-only BOM — consumed by Lucy for license compliance -->
<execution>
    <id>generate-lucy-sbom</id>
    <phase>package</phase>
    <goals><goal>makeAggregateBom</goal></goals>
    <configuration>
        <outputName>lucy-bom</outputName>
        <includeProvidedScope>false</includeProvidedScope>
        <includeSystemScope>false</includeSystemScope>
    </configuration>
</execution>
```

### Step 6 — Add OWASP security logging dependency (Java)

Add to `dependencyManagement` and to the module(s) that handle authentication, authorization, or audit events:

```xml
<dependency>
    <groupId>org.owasp</groupId>
    <artifactId>security-logging-common</artifactId>
    <version>${security-logging-common.version}</version>
</dependency>
```

```xml
<security-logging-common.version>1.1.7</security-logging-common.version>
```

### Step 7 — Install Python toolchain (Python projects)

Ensure the following are declared as dev dependencies in `pyproject.toml`:

```toml
[tool.uv.dev-dependencies]
ruff = ">=0.4"
pytest = ">=8"
pytest-cov = ">=5"
cyclonedx-bom = ">=4"
```

The Jenkins Python template bootstraps `uv` in the Initialize stage. No additional configuration needed.

### Step 8 — Register the project in DependencyTrack

Contact appsec@regnology.net with:
- Project name (format: `CONS-<slug>`)
- Repository URL
- Primary language(s)

AppSec will provide a DependencyTrack project UUID. Set it in the Jenkinsfile `DEPENDENCY_TRACK_PROJECT_ID` environment variable, then change `SKIP_DEPENDENCY_TRACK` to `'false'`.

### Step 9 — Add sonar-project.properties (Python / standalone scanner)

For Python projects not using `sonar-maven-plugin`, create `sonar-project.properties` at the repository root:

```properties
sonar.projectKey=CONS-your-project-name
sonar.projectName=CONS/your-project-name
sonar.sources=src
sonar.tests=tests
sonar.python.version=3.12
sonar.exclusions=**/test_architecture.py
sonar.coverage.exclusions=**/test_architecture.py
```

---

## Verification

After completing the steps, run the following checks locally:

```bash
# Java: verify compliance profile builds and produces both BOMs
mvn clean install -Pcompliance
ls target/bom.json target/lucy-bom.json

# Java: verify SpotBugs runs (will fail if findings exist)
mvn spotbugs:check

# Java: verify Sonar analysis (requires network + token)
mvn sonar:sonar -Dsonar.branch.name=$(git branch --show-current)

# Python: verify lint passes
uv run ruff check .

# Python: verify tests pass with coverage
uv run pytest --cov=. --cov-report=xml

# Python: verify SBOM generated
uv run cyclonedx-py environment --output-format JSON --output-file bom-python.json
ls bom-python.json
```

---

## Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| `SKIP_DEPENDENCY_TRACK=true` still set | Project not yet registered | Contact AppSec; register project; obtain UUID |
| SpotBugs fails with findings | Real security issues detected | Fix findings; do not lower threshold to pass |
| SonarQube `401 Unauthorized` | Missing or expired token | Set `SONAR_TOKEN` env var or pass `-Dsonar.login=...` |
| `lucy-bom` not produced | CycloneDX execution ID misconfigured | Verify both executions present in `compliance` profile |
| `bom-aggregate.json` missing | SBOM merge script not run | Add SBOM aggregate stage; check `scripts/merge-sboms.py` exists |

---

## Exit Criteria

- `Jenkinsfile` present at repository root with no `TODO:` markers remaining
- `jenkins-agent.yaml` present at repository root
- SpotBugs + FindSecBugs configured in `pom.xml` with `failOnError: true` (Java)
- CycloneDX compliance profile produces `bom.json` and `lucy-bom.json` (Java)
- `bom-python.json` generated during build (Python)
- SonarQube project key configured and analysis runs on branch + PR
- DependencyTrack upload configured (active or `SKIP_DEPENDENCY_TRACK` with a Jira item to enable)
- `mvn clean install` (Java) or `uv run pytest` (Python) passes locally
