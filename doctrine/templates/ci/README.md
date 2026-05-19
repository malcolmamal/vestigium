<!--
████          R E G N O L O G Y
    ██        Professional Services
████
    ██        professional_services@regnology.net
-->

---
packaged: true
audiences: [devops_danny, software_engineer, build_automation_specialist]
note: Jenkins pipeline templates for Regnology PS projects.
---

# CI Pipeline Templates

Templates for Jenkins declarative pipelines used in Regnology Professional Services projects.
Maintained by DevOps Danny. All templates comply with Regnology AppSec requirements.

## When to Use Which Template

| Template | Use when |
|---|---|
| `Jenkinsfile.maven-appsec.template` | Java/Maven project ready for full AppSec compliance — SBOM, DependencyTrack, SpotBugs+FindSecBugs, SonarQube |
| `Jenkinsfile.maven-minimal.template` | Java/Maven project in early development — basic quality gates, SonarQube, no SBOM/DependencyTrack yet |
| `Jenkinsfile.python.template` | Python project using `uv` — ruff, pytest, CycloneDX SBOM |
| `jenkins-agent.yaml` | Kubernetes pod spec for the Jenkins build agent (used by all pipeline templates) |

## Graduation Path

New projects start with `maven-minimal`, add AppSec tooling as the project matures:

```
maven-minimal  →  add SpotBugs/FindSecBugs  →  add CycloneDX SBOM  →  enable DependencyTrack  →  maven-appsec
```

Enable DependencyTrack upload by setting `SKIP_DEPENDENCY_TRACK = 'false'` once a project ID
has been registered with the AppSec team at `appsec@regnology.net`.

## Required Substitutions

All templates contain `TODO:` markers for project-specific values that Danny must fill in
before committing a pipeline:

| Placeholder | Description |
|---|---|
| `TODO: project-name` | Repository/project slug (e.g. `gdm-mapping-validator`) |
| `TODO: CONS-project-name` | SonarQube project key (format: `CONS-<slug>`) |
| `TODO: DT-PROJECT-UUID` | DependencyTrack project UUID (obtain from AppSec team) |
| `TODO: artifactory-project` | Artifactory generic local repo name |

## AppSec Compliance

Full AppSec pipeline requirements are governed by Directive 043 (`doctrine/directives/043_appsec_compliance.md`).
The `maven-appsec` template satisfies all mandatory controls:

- SonarQube SAST (branch + PR aware) — [Sonar](https://sonar.regnology.net)
- SpotBugs + FindSecBugs (effort: Max, failOnError: true)
- CycloneDX SBOM — full aggregate + runtime-only lucy-bom
- DependencyTrack SCA upload — [DependencyTrack](https://dependencytrack.regnology.net)
- Code style enforcement (Spotless / Google Java Format)
- JaCoCo coverage reporting
- Javadoc quality gate

## Related Doctrine

- `doctrine/directives/043_appsec_compliance.md` — mandatory AppSec controls
- `doctrine/tactics/maven-project-compliance-setup.tactic.md` — pom.xml compliance configuration
- `doctrine/tactics/appsec-pipeline-setup.tactic.md` — step-by-step pipeline setup procedure
- `doctrine/toolguides/sonarqube.md` — SonarQube usage reference
- `doctrine/toolguides/dependency-track.md` — DependencyTrack integration reference
- `doctrine/guidelines/java-conventions.md` — Java code quality standards
- `doctrine/guidelines/python-conventions.md` — Python code quality standards
