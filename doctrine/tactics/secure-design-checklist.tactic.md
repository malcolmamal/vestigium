<!--
████          R E G N O L O G Y
    ██        Professional Services
████
    ██        professional_services@regnology.net
-->

# Tactic: Secure Design Checklist

**Version:** 1.0.0
**Last Updated:** 2026-03-30
**Status:** active

**Invoked by:**
- [Directive 043](../directives/043_appsec_compliance.md) — AppSec Compliance (§ 4 Secure Design Principles, Design phase)

**Authoritative Sources:**
- [Secure Design Principles](https://confluence.regnology.net/spaces/CAS/pages/62794591)
- [Threat Assessment](https://confluence.regnology.net/spaces/CAS/pages/72730750)
- [Standard Security Requirements for Applications](https://confluence.regnology.net/spaces/CAS/pages/72741821)

---

## Intent

Apply the nine Regnology Secure Design Principles at the design phase of a new feature or
component so that security properties are built in rather than retrofitted.

Apply when:
- Starting the design of a new component, service, or feature
- Reviewing an architectural proposal before implementation begins
- Assessing an existing design for security gaps

---

## Checklist

Use this checklist during design review. For each principle, confirm it has been considered
and document the decision (N/A is acceptable if genuinely not applicable — state why).

---

### 1. Least Privilege

> Grant the minimum access rights needed, for the minimum time needed.

- [ ] Does every process/service run with the minimum OS/network permissions required?
- [ ] Are database accounts scoped to only the operations needed (read-only where possible)?
- [ ] Are API tokens/service accounts scoped to specific resources, not admin-level?
- [ ] Are time-bound credentials used where applicable?

**Decision / notes:** _____________________________________

---

### 2. Fail-Safe Defaults

> Access is denied by default. Access is only permitted when explicitly granted.

- [ ] Is the default state of all new feature flags, permissions, and API endpoints **deny**?
- [ ] Does a configuration error (missing value, malformed config) result in safe behaviour (deny), not permissive behaviour (allow)?
- [ ] Are default passwords and default open ports eliminated from the design?

**Decision / notes:** _____________________________________

---

### 3. Economy of Mechanism

> Keep the design as simple as possible. Complexity hides vulnerabilities.

- [ ] Is the security-relevant code path as short and readable as possible?
- [ ] Is authentication/authorization logic centralized rather than scattered across the codebase?
- [ ] Can the design be simplified without losing required security properties?

**Decision / notes:** _____________________________________

---

### 4. Complete Mediation

> Check every access to every resource, every time. Never cache authorization decisions indefinitely.

- [ ] Is every API endpoint explicitly protected (no endpoints forgotten)?
- [ ] Is authorization re-checked at the server for every request (not cached client-side)?
- [ ] Are batch operations checked at the record level, not just the batch level?

**Decision / notes:** _____________________________________

---

### 5. Open Design

> Security must not depend on the secrecy of the design or implementation.

- [ ] If an attacker knew the source code, would the security still hold?
- [ ] Is cryptographic security derived from key secrecy, not algorithm obscurity?
- [ ] Are security-by-obscurity mechanisms documented as risks, not controls?

**Decision / notes:** _____________________________________

---

### 6. Separation of Privilege

> No single condition should be sufficient to grant access. Require multiple conditions.

- [ ] Are high-value operations (delete, admin, financial) protected by multi-factor or dual approval?
- [ ] Are separate roles used for read and write operations rather than a single super-role?
- [ ] Are cross-service operations validated independently by both services?

**Decision / notes:** _____________________________________

---

### 7. Least Common Mechanism

> Do not share access mechanisms across components that do not need to be shared.

- [ ] Are security-critical modules isolated from unrelated business logic?
- [ ] Are shared infrastructure components (auth tokens, session stores) scoped to the minimum necessary consumers?
- [ ] Are test environments isolated from production secrets and data?

**Decision / notes:** _____________________________________

---

### 8. Psychological Acceptability

> Security must not significantly impede usability. If it does, users will find workarounds.

- [ ] Are security controls designed to be the path of least resistance, not an obstacle?
- [ ] Is the user experience of authentication flows clear and concise?
- [ ] Are error messages informative enough for legitimate users but not helpful to attackers?

**Decision / notes:** _____________________________________

---

### 9. Defense in Depth

> Layer multiple independent barriers. Assume each layer can fail.

- [ ] If the authentication layer fails, does the authorization layer still hold?
- [ ] If the application layer is compromised, does the database layer still restrict access?
- [ ] Are secrets protected at multiple levels (encrypted at rest, limited access, audited)?
- [ ] Is input validated at multiple layers (UI, API, database) rather than relying on a single layer?

**Decision / notes:** _____________________________________

---

## Encryption and Data Classification

- [ ] Has all data handled by the design been classified (Public / Internal / Restricted / Confidential)?
- [ ] Is Restricted and Confidential data encrypted in transit (HTTPS, TLS)?
- [ ] Is Confidential data encrypted at rest?
- [ ] Is the encryption algorithm implemented using the Agile Crypto pattern (adapter-based, swappable)?
- [ ] Are cipher suites current (e.g. AES-256/GCM; see [BSI TR-02102](https://www.bsi.bund.de/EN/Themen/Unternehmen-und-Organisationen/Standards-und-Zertifizierung/Technische-Richtlinien/TR-nach-Thema-sortiert/tr02102/tr02102_node.html))?

---

## Threat Assessment Trigger

Request a formal Threat Assessment from AppSec (appsec@regnology.net) when:

- The component handles Confidential data (payments, PII, credentials)
- The component is internet-facing or exposes a public API
- The component implements authentication, authorization, or cryptography
- The design is complex with multiple interacting subsystems

Provide AppSec with a **component view** of the application as input. Threat Assessments are stored by the AppSec team and are confidential — do not share with external parties.

---

## Review Sign-Off

| Reviewer | Role | Date | Outcome |
|---|---|---|---|
| | Developer | | All applicable principles addressed |
| | Architect | | Reviewed and approved |
| | AppSec (if TA requested) | | Threat Assessment complete |

---

## Exit Criteria

- All nine principles considered; non-applicable ones noted with justification
- Data classification completed for all data flows in the design
- Encryption decisions documented
- Threat Assessment requested (if triggered) and AppSec briefed
- Sign-off recorded before implementation begins
