<!--
████          R E G N O L O G Y
    ██        Professional Services
████
    ██        professional_services@regnology.net
-->

# Security Exemption — [PROJECT NAME] — [SHORT FINDING DESCRIPTION]

**Template Version:** 1.0.0
**Instruction:** Copy this file to `work/human-in-charge/security-exemption-YYYYMMDD-NNN.md`.
Replace all `[PLACEHOLDER]` values. Obtain PO sign-off before release.
This file is retained as an IKS audit artifact.

---

## Exemption Header

| Field | Value |
|---|---|
| **Exemption ID** | SE-[YYYYMMDD]-[NNN] |
| **Date Filed** | [YYYY-MM-DD] |
| **Project** | [Project name / repository] |
| **Release / Version** | [Release version this exemption covers] |
| **Finding Source** | SonarQube / DependencyTrack / Fortify (circle one) |
| **Finding ID** | [SonarQube issue key / CVE ID / Fortify rule ID] |
| **Severity** | Critical / High / Medium / Low (as reported by tool) |
| **Filed by** | [Name, role] |
| **PO Approval** | [PO name] — [Date of approval] — ⚠️ REQUIRED before release |

---

## 1. Finding Description

**What the tool reported:**

[Paste the exact finding description from SonarQube / DependencyTrack]

**Affected component / code location:**

[Component name + version (for SCA) OR file + line range (for SAST)]

**Data classification of affected data:**

[Public / Internal / Restricted / Confidential — per Regnology Data Classification policy]

---

## 2. Risk Assessment

**Is the vulnerable function/path actually reachable in production?**

[Yes / No / Unknown — explain]

**What is the realistic attack surface?**

[Describe: internet-accessible? internal only? requires authentication? requires specific data input?]

**Probability of exploitation (Low / Medium / High):**

[Justify]

**Impact if exploited (Low / Medium / High):**

[What could an attacker achieve? Data leakage? RCE? DoS? Describe the worst case.]

**Overall risk level:**

[Low / Medium / High / Critical — your assessment of Probability × Impact]

---

## 3. Why a Fix is Not Possible Now

**Primary constraint:**

[ ] No fix/upgrade available yet (upstream dependency unpatched)  
[ ] Upgrade available but introduces breaking API changes requiring substantial rework  
[ ] Risk of regression in delivery outweighs the security risk at this time  
[ ] Delivery deadline — risk of NOT delivering is higher (justify below)  
[ ] Other: ________

**Justification:**

[Explain specifically why immediate remediation is not feasible for this release]

---

## 4. Compensating Controls

List the mitigations currently in place that reduce the probability or impact:

| Control | Description | Reduces |
|---|---|---|
| [e.g., Network ACL] | [e.g., Component only accessible from internal network, not internet-facing] | Probability |
| [e.g., Input validation layer] | [e.g., All inputs validated by upstream gateway before reaching this component] | Probability |
| [e.g., Monitoring/alerting] | [e.g., WAF rule deployed; alerts on exploit signatures] | Impact (early detection) |

**AppSec team confirmation of adequacy:** [ ] Confirmed / [ ] Not yet confirmed / [ ] Not required

---

## 5. Remediation Plan

**Planned fix:**

[Describe the planned remediation: upgrade version, code change, architecture change]

**Target release for remediation:**

[Version / sprint / date — must be agreed with PO]

**Jira item tracking remediation:**

[JIRA-KEY] — [summary]

**If no Jira item exists:** create one before filing this exemption.

---

## 6. Approvals

This exemption requires Product Owner (or higher) sign-off before the release proceeds.

| Role | Name | Date | Signature / Email reference |
|---|---|---|---|
| **Product Owner** | | | |
| **Architect** (if design-level risk) | | | (optional) |
| **AppSec** (for High/Critical severity) | | | (recommended) |

> ⚠️ Vulnerability-type SonarQube issues MUST NOT be exempted. They require a code fix or
> a documented false-positive marking in SonarQube. This template is for SCA (DependencyTrack)
> CVEs where the vulnerable function is confirmed unused, or SonarQube Code Smell / Bug
> findings with full compensating controls.

---

## 7. Expiry and Review

**Exemption expires:** [Date — maximum: end of next release cycle]

**Review trigger:** Any of the following must prompt re-assessment:
- A safe upgrade becomes available for the affected component
- The deployment topology changes (e.g., component becomes internet-facing)
- A working exploit for this CVE is published
- The next release cycle begins

---

_Filed by:_ _________________________ _Date:_ ____________

_PO Approval:_ _________________________ _Date:_ ____________

---

**Retention:** Retain this file indefinitely in `work/human-in-charge/` for IKS audit purposes.
Do not delete after the exemption expires — update the status instead.
