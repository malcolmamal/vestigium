# Directive 041: Use Regnology Branding

**Status:** Active  
**Applies To:** All agents  
**Priority:** HIGH - Mandatory for all Regnology PS repositories  
**Version:** 1.2.0  
**Last Updated:** 2026-03-17

---

## Purpose

Ensure consistent Regnology Professional Services branding and licensing across all repositories and generated artifacts.

---

## Rules

### 1. Markdown File Headers

All Markdown files created or modified by agents MUST include the Regnology PS header as an HTML comment at the top of the file, before any other content:

```markdown
<!--
+----------------------------------------------------+
|████          R E G N O L O G Y                     |
|    ██        Professional Services                 |
|████                                                |
|    ██        professional_services@regnology.net   |
+----------------------------------------------------+

Property of Regnology Group GmbH - All Rights Reserved
              FOR INTERNAL USE ONLY
-->
```

**Source template:** `doctrine/templates/branding/header.txt`

**Scope:**
- Applies to new Markdown files and to existing files receiving substantive edits.
- Does not apply to files inside `doctrine/` itself (the framework is distributed independently).
- Does not apply to third-party or upstream files.

### 2. License in Programming Projects

All Regnology PS programming projects MUST:

1. Include the full `LICENSE` file at the repository root.  
   **Source template:** `doctrine/templates/license/LICENSE`

2. Configure the project's build tool to reference the Regnology PS Internal Tooling License metadata.  
   **Source template:** `doctrine/templates/license/regnology-internal.properties`

Build-tool integration is deliberately unspecified here. Agents MUST load the appropriate tactic for the project's build tool:

| Build Tool | Tactic |
|------------|--------|
| Maven | [`maven-project-compliance-setup.tactic.md`](../tactics/maven-project-compliance-setup.tactic.md) |
| Poetry / uv | _(tactic pending)_ |

Until a tactic exists for a given build tool, agents should apply the license metadata using the tool's conventional license configuration and note the action in the work log.

---

## Web UIs (Locally Hosted Apps, Portals, Forms)

Regnology web UIs MUST use the shared branding CSS and assets so visuals are consistent and reusable.

### Source of Truth

- **Location:** `doctrine/templates/branding/`
- **README:** `doctrine/templates/branding/README.md` — usage, link order, and patterns.

### Required Assets and CSS

1. Copy the full `branding/` folder into the app’s static assets (e.g. `static/branding/` or `public/branding/`).
2. Link in this order: `regnology-brand.css` → `regnology-base.css` → `regnology-web-chrome.css`.
3. Set favicon to `branding/assets/favicon.png`.

### Layout Pattern (Standard)

- **Top banner:** Fixed bar with Regnology logo top-left (petrol background). Use `has-regnology-header` on `body`, `<header class="regnology-header-bar">`, and `Regnology-logo-negative-PNG.png` for the logo. This matches the Regnology portal pattern.
- **Form / section grouping:** Use `.form-card`, `.form-card-title`, and `.form-actions` from `regnology-web-chrome.css` for grouped inputs and submit area.
- **Footer bar:** Optional; omit if using the top banner to avoid duplication. If used, see branding README for `regnology-footer-bar`.

### Reference Implementation

The **Quality Validator** UI in the `gdm-mapping-validator` repository is the reference: top banner with logo, form cards for report type, input files, and options, and no footer bar. New web UIs should follow the same structure and reuse the shared CSS (no page-specific duplication of chrome styles).

---

## Diagrams

All agent-generated diagrams MUST use Regnology brand colours. The diagramming styleguides define the required colour tokens, `classDef` blocks, and rendering procedures.

### Source of Truth

- **Location:** `doctrine/styleguides/diagramming/`

### Styleguides

| Tool | Styleguide | Key Requirement |
|------|-----------|-----------------|
| Mermaid (non-C4) | `doctrine/styleguides/diagramming/mermaid.md` | Paste the `classDef` block and apply `:::className` to every node |
| PlantUML | `doctrine/styleguides/diagramming/plantuml.md` | Use shared theme includes from `doctrine/templates/diagramming/themes/` |
| C4 diagrams | `doctrine/styleguides/diagramming/plantuml.md` | **Use PlantUML with C4-PlantUML**, not Mermaid (Mermaid C4 is poorly supported) |

### Quick Reference

- **Colour palette:** `doctrine/templates/branding/COLOR_PALETTE.md`
- **C4 config (Mermaid):** `doctrine/styleguides/diagramming/regnology-c4.config.json`
- **Mermaid classDef template:** `doctrine/templates/diagramming/themes/mermaid-regnology.md`
- **PlantUML themes:** `doctrine/templates/diagramming/themes/`

---

## Templates

| Template | Location |
|----------|----------|
| ASCII art logos (3 variants) | `doctrine/templates/branding/` |
| Source file header | `doctrine/templates/branding/header.txt` |
| Web branding (CSS, assets) | `doctrine/templates/branding/` — see README and `regnology-web-chrome.css` |
| Branded PDF document | `doctrine/templates/documents/pdf/` |
| Full license text | `doctrine/templates/license/LICENSE` |
| License identifier | `doctrine/templates/license/licenses.properties` |
| License metadata | `doctrine/templates/license/regnology-internal.properties` |

---

## Related Resources

- **Directive 008:** Artifact Templates (template usage standards)
- **Directive 036:** Boy Scout Rule (apply branding header when touching files)
- **Diagramming styleguides:** `doctrine/styleguides/diagramming/` (Mermaid, PlantUML, C4)
- **Diagram Daisy agent:** `doctrine/agents/diagrammer.agent.md`
- **Tactic:** [`create-branded-pdf-document.tactic.md`](../tactics/create-branded-pdf-document.tactic.md) — procedure for generating branded PDFs from Markdown
- **Tactic:** [`create-branded-slidedeck.tactic.md`](../tactics/create-branded-slidedeck.tactic.md) — procedure for generating branded Reveal.js slide decks

---

## Metadata

**Version:** 1.3.0  
**Status:** Active  
**Created:** 2026-02-26  
**Last Updated:** 2026-03-24 (Added branded PDF template and tactic references)  
**Maintainers:** All agents  
**Review Cycle:** Annual
