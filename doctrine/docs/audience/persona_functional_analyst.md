# Persona: Functional Analyst Fiona

**Category:** `INTERNAL Stakeholder`  
**Audience Type:** Professional Services functional analyst specializing in regulatory reporting migrations  
**Primary Goal:** Deliver confident migration sign-offs by proving ABACUS reproduces OSX RE5/COREP outputs without forcing customers to change workflows.  
**Reading Context:** Guidance for architects, developers, and fellow analysts collaborating on the validation toolkit.

---

## Overview

* **Role Focus:** Business-domain expert translating regulatory calculation intent into validation scenarios.  
* **Primary Function:** Curate sample datasets, interpret discrepancy reports with customers, and recommend remediation steps.  
* **Environment / Context:** Works inside Regnology Professional Services, coordinating with customer risk teams and internal engineering enablement.

---

## Core Motivations

* **Professional Drivers:** Provide timely, defensible validation evidence so customers approve migrations and renew services.  
* **Emotional or Cognitive Drivers:** Pragmatic, detail-oriented; trusts tooling only when logic is transparent and reproducible.  
* **Systemic Positioning:** Acts as the bridge between analytical tooling and customer sign-off boards; influences backlog priorities through feedback.

---

## Desiderata

| Category    | Expectation / Need                               | Description                                                                 |
|-------------|--------------------------------------------------|-----------------------------------------------------------------------------|
| Information | Transparent manifests & comparison summaries     | Needs to trace numbers back to sheets and columns during customer reviews. |
| Interaction | Fast CLI feedback plus sharable Markdown reports | Wants to run, skim, and forward results without manual formatting.         |
| Support     | Up-to-date playbooks & sample configs            | Relies on battle-tested examples when onboarding new customers.            |
| Governance  | Audit-ready evidence retention                   | Must hand over run artifacts for internal QA and external regulators.      |

---

## Frustrations and Constraints

* **Pain Points:** Manual spreadsheet reconciliation, opaque Python stack traces, unreliable column mappings in legacy scripts.  
* **Trade-Off Awareness:** Balances thoroughness with tight customer timelines; occasionally accepts “workarounds” if time-boxed.  
* **Environmental Constraints:** Travel-heavy schedule, limited direct access to engineering resources, customer security policies restricting tooling.

---

## Behavioral Cues

| Situation            | Typical Behavior                                        | Interpretation                                     |
|----------------------|--------------------------------------------------------|----------------------------------------------------|
| Stable / Routine     | Follows playbooks meticulously, keeps detailed notes.  | Values predictable scripts and templated outputs.  |
| Change / Uncertainty | Asks probing questions, seeks quick dry runs.          | Needs fast experiments to rebuild confidence.      |
| Under Pressure       | Escalates blockers early, requests engineering backup. | Appreciates clear ownership boundaries.            |

---

## Collaboration Preferences

* **Decision Style:** Evidence-led; prefers side-by-side comparisons to abstract discussions.  
* **Communication Style:** Concise updates with annotated screenshots or tables.  
* **Feedback Expectations:** Direct, context-rich explanations; wants to know “why” a change helps customers.

---

## Measures of Success

| Dimension   | Indicator                                           | Type        |
|-------------|-----------------------------------------------------|-------------|
| Performance | Time from data delivery to signed-off comparison    | Quantitative|
| Quality     | Number of discrepancies resolved before go-live    | Quantitative|
| Growth      | Ability to run validations autonomously in new pods | Qualitative |

---

## Cross-Context Adaptation

| Domain    | Specific Focus                    | Adaptation Notes                                                     |
|-----------|-----------------------------------|----------------------------------------------------------------------|
| Technical | Understands schema + tolerances   | Reads manifests and diff files but does not modify code.             |
| Service   | Customer workshops & presentations| Simplifies reports for business stakeholders, highlights key risks.  |

---

## Narrative Summary

Fiona is the anchor of every migration rehearsal. She receives raw customer exports, runs the validator, and walks clients through any exposures that diverge between OSX and ABACUS. She is comfortable in spreadsheets but expects engineering to shield her from brittle scripts. When reports are transparent and repeatable, she becomes the strongest advocate for the platform because she can confidently explain every number.

---

## Metadata

| Field                 | Value                                                                 |
|-----------------------|-----------------------------------------------------------------------|
| **Persona ID**        | `4fa9a3d4-711c-4b1b-8bff-4374c1c1f345`                                |
| **Created / Updated** | `2026-01-27`                                                          |
| **Domain / Context**  | Regnology Professional Services – RE5/COREP migrations                |
| **Linked Artifacts**  | `functional_requirements_osx_abacus_validator.md`, `design_vision_osx_abacus_validator.md` |
