<!--
████          R E G N O L O G Y
    ██        Professional Services
████
    ██        professional_services@regnology.net
-->

# Directive 043 — AppSec Compliance

**Version:** 1.0.0
**Status:** active
**Last Updated:** 2026-03-30
**Authoritative Source:** [Regnology AppSec Confluence — Processes & Compliance](https://confluence.regnology.net/spaces/CAS/pages/59083006)
**AppSec Contact:** appsec@regnology.net

---

## Applicability

This directive applies to **all Regnology Professional Services projects that produce deliverable software** — including tools, validators, integrations, and internal services. It does not apply to pure documentation, configuration, or infrastructure-only repositories.

External contractors working on Regnology projects are subject to the same requirements.

---

## 1. Mandatory Tool Stack

Every deliverable software project MUST integrate the following tools in its CI pipeline:

| Control | Tool | Threshold | References |
|---|---|---|---|
| SAST — code security | [SonarQube](https://sonar.regnology.net) | Hard fail: Blocker > 0 OR Critical > 0 OR Vulnerabilities > 0 | [Security Gate](https://confluence.regnology.net/spaces/CAS/pages/29789349) |
| SAST — deep analysis | Fortify (AppSec-run) | All findings are defects; must be addressed | [Security Issues Review](https://confluence.regnology.net/spaces/CAS/pages/72742361) |
| SCA — vulnerabilities | [DependencyTrack](https://dependencytrack.regnology.net) | Hard fail: Critical, High, or Medium CVEs = 0 | [3rd Party FOSS](https://confluence.regnology.net/spaces/CAS/pages/62800206) |
| SCA — license compliance | Lucy / Fossology | No GPL/strong copyleft; OSS list required per delivery | [License Compliance](https://confluence.regnology.net/spaces/CAS/pages/51295640) |
| SBOM generation | CycloneDX | Generated every build; archived; submitted to DependencyTrack | [AppSec Overview](https://confluence.regnology.net/spaces/CAS/pages/221261711) |
| Security bytecode scan (Java) | SpotBugs + FindSecBugs | Hard fail: `failOnError: true`, effort: Max, threshold: Medium | — |
| Code style | Spotless (Java) / ruff (Python) | UNSTABLE on failure | — |
| Test coverage | JaCoCo (Java) / pytest-cov (Python) | Reported; ≥ 80% on new code | — |

Use `doctrine/templates/ci/Jenkinsfile.maven-appsec.template` or `Jenkinsfile.python.template` as the starting point.
Use the `appsec-pipeline-setup` tactic (`doctrine/tactics/appsec-pipeline-setup.tactic.md`) for step-by-step setup.

---

## 2. Security Gate Thresholds

### SonarQube

The Security Gate **FAILS** when any of the following is true:

- Blocker Issues > 0
- Critical Issues > 0
- Vulnerabilities > 0 (of any severity)

SonarQube severity mapping vs. Regnology classification:

| SonarQube | Regnology | Meaning |
|---|---|---|
| Blocker | Critical | OWASP Top 10; XSS, Injection; may expose CONFIDENTIAL data |
| Critical | High | OWASP Top 10; may expose RESTRICTED data |
| Major | Medium | Difficult to exploit; INTERNAL USE data |
| Minor | Low | Rare circumstances; low probability and impact |

False positives MUST be marked and commented in SonarQube with a reason. Vulnerability-type issues MUST NOT be accepted — only fix or mark as false positive.

### DependencyTrack

The SCA gate **FAILS** when the SBOM contains any component with:

- Critical CVE
- High CVE
- Medium CVE

Low and Info CVEs must also be addressed, with lower urgency.

---

## 3. Mandatory Coding Standards

### Five Golden Rules

All developers MUST follow the [Five Golden Rules](https://confluence.regnology.net/spaces/CAS/pages/59083381):

1. **Cleanse untrusted input; encode output.** All input channels are untrusted: web forms, XML, config files, database content, environment variables.
2. **Never rely on client-side validation alone.** Always validate server-side. Client-side validation is UX only.
3. **Use encryption by default.** Not optional. Implement Agile Crypto — encapsulate algorithms in adapters so they can be swapped when they become breakable.
4. **Do not reinvent security.** Use trusted frameworks. Ask the AppSec team.
5. **Do it right from the beginning.** Secure Configuration + Secure Design + Secure Code from day one. Retrofitting security is expensive.

### Industry Standards

Code MUST comply with:

- [OWASP Top 10](https://owasp.org/www-project-top-ten/) (2021 edition) — enforced via SonarQube
- [CWE Top 25](https://cwe.mitre.org/top25/) (2023 edition) — enforced via Fortify
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) — for building, configuration, deployment, assurance and verification

---

## 4. Secure Design Principles

Architects MUST apply the applicable subset of the nine [Secure Design Principles](https://confluence.regnology.net/spaces/CAS/pages/62794591) when designing new systems or features:

1. **Least Privilege** — minimal access rights, time-bound
2. **Fail-Safe Defaults** — deny access by default; grant explicitly
3. **Economy of Mechanism** — keep systems as simple and small as possible
4. **Complete Mediation** — check all access to all resources
5. **Open Design** — security must not depend on secrecy of design
6. **Separation of Privilege** — access requires more than one condition
7. **Least Common Mechanism** — do not share access mechanisms
8. **Psychological Acceptability** — security must not impede usability
9. **Defense in Depth** — layer authorization; multiple independent barriers

Use the `secure-design-checklist` tactic (`doctrine/tactics/secure-design-checklist.tactic.md`) during design reviews.

---

## 5. Data Classification

All data handled by an application must be classified per the [Regnology Data Classification](https://confluence.regnology.net/spaces/CAS/pages/29786932) policy:

| Class | Description | Encryption Required |
|---|---|---|
| Public | No harm from disclosure | No |
| Internal | All-employee; NDA-covered third parties | No (standard access controls) |
| Restricted | Legal/financial impact if leaked | In transit; access controls |
| Confidential | Severe legal/financial consequences; GDPR-relevant | In transit AND at rest |

**Encryption by default applies to Restricted and Confidential data.** Confidential data MUST be stored encrypted even on protected servers.

---

## 6. Dependency Hygiene

See tactic `dependency-hygiene.tactic.md` for the full procedure. Key rules:

- Pin ALL direct dependency versions explicitly in a properties block
- Override vulnerable transitives with explicit `<exclusion>` blocks (e.g. `log4j-core`, `commons-beanutils`)
- Resolve dependencies from Maven Central only — no unapproved external registries
- Do NOT use GPL or strong copyleft licensed components without AppSec approval
- For any new component, verify its license via the [Lucy Database](https://lucy.regnology.net/library) or contact appsec@regnology.net
- After any dependency change: regenerate SBOM and resubmit to DependencyTrack

**Approved license categories (common):** Apache 2.0, MIT, BSD-3-Clause, JSON, CC0-1.0, Python-2.0, PostgreSQL, W3C.
**Requires individual check:** LGPL, MPL, EPL, CDDL.
**Prohibited without approval:** GPL-1.0, GPL-2.0, GPL-3.0, OSL (all versions).

---

## 7. SBOM Requirements

Every build MUST produce and archive a CycloneDX SBOM:

- **Full aggregate BOM** (`bom.json` + `bom.xml`) — all dependency scopes; submitted to DependencyTrack
- **Runtime-only BOM** (`lucy-bom.json` + `lucy-bom.xml`) — excludes provided/system scope; consumed by Lucy for license compliance

For multi-language projects, merge component SBOMs into a single aggregate using a merge script before submitting to DependencyTrack.

To enable DependencyTrack upload: register the project with the AppSec team (appsec@regnology.net) to obtain a project UUID, then set `SKIP_DEPENDENCY_TRACK = 'false'` in the Jenkinsfile.

---

## 8. SDLC Integration Checklist

Security must be integrated at every development phase, not only at build/test time:

| Phase | Required Activity | Responsible |
|---|---|---|
| Requirements | Define CIA requirements; identify data classification; state encryption needs | Developer + Architect |
| Design | Apply 9 Secure Design Principles; request Threat Assessment from AppSec for sensitive systems | Architect |
| Coding | Follow Five Golden Rules; use IDE security plugins; fix SAST findings before PR merge | Developer |
| Build | SonarQube SAST; SpotBugs+FindSecBugs; CycloneDX SBOM generation | CI pipeline |
| Test | Security Issues Review; Security Gate verification; 3rd party CVE scan via DependencyTrack | Developer + AppSec |
| Deployment | HTTPS enforced; encryption enabled by default; secure configuration verified | Developer + Ops |
| Maintenance | Regular CVE rescans; security hotfixes; re-run SBOM after dependency changes | Developer |

---

## 9. Security Issue Handling

See tactic `security-issue-triage.tactic.md` for the full procedure. Summary:

| Disposition | Meaning | Conditions |
|---|---|---|
| **Fix** | Vulnerability eliminated | Preferred outcome |
| **False Positive** | Tool mis-detected; not a real issue | Must be commented with reason in SonarQube |
| **Mitigate** | Risk reduced (probability or impact lowered) | Must be documented |
| **Own** | Assigned with a deadline | Deadline must be honoured |
| **Security Exemption** | PO accepts risk; delivery proceeds | Requires formal exemption document (see template) |

Vulnerability-type issues in SonarQube MUST NOT be accepted — they must be fixed or marked false positive.

---

## 10. Security Exemption Process

When a Security Gate fails and delivery cannot be delayed:

1. The PO documents the justification (mitigation in place, higher risk of NOT delivering, etc.)
2. Complete the Security Exemption template (`doctrine/templates/security/security-exemption.md`)
3. File via the Human-in-Charge escalation path (`work/human-in-charge/`) with `type: security-exemption`
4. Obtain formal PO (or higher) sign-off before release
5. Record a Jira backlog item to remediate within the next release cycle

Security Exemptions are time-bound and must be documented for IKS (Internal Control System) compliance.

---

## 11. Urgent Vulnerability Response

When a critical 3rd party vulnerability is announced (e.g. Log4Shell severity):

1. All team members MUST report known critical vulnerabilities to the AppSec team immediately
2. AppSec will run an impact assessment across all products using DependencyTrack
3. Product teams have **2 working days** to confirm: is the product affected? Under what conditions? What mitigations are possible?
4. The PO decides: client notification required? Mitigation sufficient? Security hotfix needed?

See tactic `urgent-vulnerability-response.tactic.md` for the full procedure.

---

## 12. AppSec Support

The AppSec team provides support for all items in this directive:

- **Monthly Talk 2 AppSec** meetings — PS teams are encouraged to attend
- **Ad-hoc support** — contact appsec@regnology.net for questions on tools, findings, licenses, or threat assessments
- **Onboarding** — new projects should request AppSec onboarding to register in SonarQube and DependencyTrack
- **Threat Assessment** — request for security-sensitive new applications; provide component view as input

---

## Related Doctrine

| Artifact | Type | Purpose |
|---|---|---|
| `doctrine/tactics/appsec-pipeline-setup.tactic.md` | Tactic | Step-by-step CI pipeline setup |
| `doctrine/tactics/dependency-hygiene.tactic.md` | Tactic | Dependency pinning, exclusions, license checks |
| `doctrine/tactics/security-issue-triage.tactic.md` | Tactic | Handling SonarQube/DependencyTrack findings |
| `doctrine/tactics/urgent-vulnerability-response.tactic.md` | Tactic | Emergency CVE response process |
| `doctrine/tactics/maven-project-compliance-setup.tactic.md` | Tactic | Maven pom.xml compliance configuration |
| `doctrine/templates/ci/Jenkinsfile.maven-appsec.template` | Template | Full AppSec Jenkins pipeline (Java/Maven) |
| `doctrine/templates/ci/Jenkinsfile.python.template` | Template | AppSec Jenkins pipeline (Python) |
| `doctrine/templates/security/security-exemption.md` | Template | Security Exemption documentation artifact |
| `doctrine/guidelines/java-conventions.md` | Guideline | Java security tooling conventions |
| `doctrine/guidelines/python-conventions.md` | Guideline | Python security tooling conventions |

---

## Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.0 | 2026-03-30 | Initial directive; sourced from Regnology AppSec Confluence CAS space |
