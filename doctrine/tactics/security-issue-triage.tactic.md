<!--
████          R E G N O L O G Y
    ██        Professional Services
████
    ██        professional_services@regnology.net
-->

# Tactic: Security Issue Triage

**Version:** 1.0.0
**Last Updated:** 2026-03-30
**Status:** active

**Invoked by:**
- [Directive 043](../directives/043_appsec_compliance.md) — AppSec Compliance (§ 9 Issue Handling, § 10 Security Exemption)

**Related tactics:**
- `dependency-hygiene.tactic.md` — CVE remediation (3rd party issues)
- `urgent-vulnerability-response.tactic.md` — emergency path for critical CVEs

**Templates:**
- `doctrine/templates/security/security-exemption.md`

---

## Intent

Process security findings from SonarQube (SAST) and DependencyTrack (SCA) through a
structured triage so that each finding is either fixed, correctly classified, or formally
accepted — leaving no unresolved vulnerabilities in the gate before release.

Apply when:
- A Security Gate fails in CI
- SonarQube reports Blocker/Critical/Vulnerability findings on a PR
- DependencyTrack reports Critical/High/Medium CVEs on the SBOM
- Preparing for a release with open security findings

---

## Decision Flow

```
Finding arrives (SonarQube / DependencyTrack)
        │
        ▼
Is it a false positive? ──YES──► Mark FP in tool; add justification comment → DONE
        │NO
        ▼
Can it be fixed in this sprint? ──YES──► Fix, re-verify, close finding → DONE
        │NO
        ▼
Can it be mitigated (probability or impact reduced)? ──YES──►
   Implement mitigation; document; assign owner; set deadline → CONTINUE TO RELEASE
        │NO
        ▼
Is delivery blocked without a Security Exemption?
  → Complete Security Exemption template; escalate to PO
  → File Jira item for remediation in next sprint
  → Do NOT accept Vulnerability-type SonarQube issues (SCA only)
```

---

## Execution Steps

### Step 1 — Classify each finding

Open the SonarQube or DependencyTrack finding and answer:

| Question | Action |
|---|---|
| Is the flagged code path actually reachable in production? | If not — likely a false positive |
| Is the vulnerable component in the runtime delivery (`lucy-bom`)? | If not in `lucy-bom` — not a runtime risk; may qualify as FP for that context |
| Is there an upgrade available? | DependencyTrack shows the safe version |
| Does the vulnerable function actually get called? | If not called — document analysis; PO accepts or gets AppSec confirmation |
| Is there a known CVE with a working exploit? | High urgency — may trigger urgent response tactic |

### Step 2 — Marking false positives in SonarQube

For each false positive:

1. Open the finding in SonarQube
2. Set status to **Won't Fix** or **False Positive**
3. Add a mandatory comment: explain WHY it is a false positive (e.g., "Input validated upstream by X before reaching this method")
4. Request review from the AppSec team if uncertain; do not self-certify complex FPs

**Prohibited:** Never mark a real vulnerability as a false positive to pass the gate. The AppSec team reviews SonarQube projects regularly.

### Step 3 — Fixing code findings (SonarQube SAST)

Common fix patterns:

| Vulnerability | Pattern |
|---|---|
| SQL Injection | Parameterized queries / JPA named parameters; never string concatenation |
| XSS | Output encoding; OWASP HTML Sanitizer; `ESAPI.encoder()` |
| Path Traversal | Resolve against a trusted base path; reject `..` sequences |
| Insecure Deserialization | Avoid Java native serialization; use JSON with type validation |
| Hard-coded credentials | Move to environment variables or a secrets manager |
| Weak cipher | Replace with AES-256/GCM; use Agile Crypto adapter pattern |
| Missing authentication | Add `@PreAuthorize` or equivalent; verify on the server side |

After fixing: push to PR, verify SonarQube re-analyzes and finding is resolved.

### Step 4 — Fixing 3rd party CVEs (DependencyTrack)

For each Critical/High/Medium CVE:

1. Identify the component and version in DependencyTrack
2. Check if an upgrade to a non-vulnerable version is available
3. If upgrade is available: apply per `dependency-hygiene.tactic.md` Step 6
4. If no upgrade is available:
   - Assess whether the vulnerable function is actually called in the delivery
   - If not called: document the analysis; create a Jira item for tracking
   - If called: cannot proceed without AppSec consultation — contact appsec@regnology.net
5. Regenerate SBOM and resubmit to DependencyTrack; verify the finding is resolved

### Step 5 — Requesting a Security Exemption

When delivery cannot wait for a fix and risk can be justified:

1. Confirm the disposition with the PO — only PO or higher can approve a Security Exemption
2. Complete the Security Exemption template (`doctrine/templates/security/security-exemption.md`)
3. Create a file under `work/human-in-charge/` with `type: security-exemption`
4. Obtain formal PO sign-off (written: email or Jira comment is sufficient)
5. Create a Jira backlog item for remediation in the next release cycle with a deadline
6. Retain the exemption document for IKS (Internal Control System) audit trail

**Hard rule:** Vulnerability-type issues in SonarQube MUST NOT be exempted — they must be fixed or marked as false positive. Exemptions are only valid for:
- DependencyTrack CVEs where the vulnerable function is confirmed unused
- SonarQube Code Smell / Bug findings where server-side mitigations are fully documented

### Step 6 — AppSec team escalation

Contact appsec@regnology.net or raise a 3rd Level Ticket when:

- A finding cannot be classified without security expertise
- A fix is not yet available and the component cannot be replaced
- License compliance is uncertain for a new component
- The vulnerability is potentially critical and may affect the product at runtime

The AppSec team runs regular "Security Issues Reviews" with development teams — bring
open findings to these sessions.

---

## Issue Tracking

All open security findings with a deferred fix MUST have a Jira item containing:

- Affected component name and version
- CVE identifier (for SCA issues)
- SonarQube rule key (for SAST issues)
- Recommended fix / safe version
- Deadline agreed with PO
- Link to the Security Exemption document (if applicable)

---

## Verification

Before signing off a release:

```
□ SonarQube: Blocker = 0, Critical = 0, Vulnerabilities = 0
□ DependencyTrack: Critical = 0, High = 0, Medium = 0
□ All false positives commented with justification in SonarQube
□ All deferred findings have a Jira item with a deadline
□ All Security Exemptions are signed by PO and filed under work/human-in-charge/
□ SBOM submitted to DependencyTrack (SKIP_DEPENDENCY_TRACK = false or manual upload done)
```

---

## Exit Criteria

- No open Blocker/Critical/Vulnerability findings in SonarQube at release
- No open Critical/High/Medium CVEs in DependencyTrack at release
- All dispositions documented (fix, FP, exemption)
- PO sign-off on any Security Exemptions
- Jira items exist for all deferred items with agreed deadlines
