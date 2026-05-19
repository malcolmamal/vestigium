# DDR-015: Canonical Location Consolidation for Styleguides and Templates

**Status:** Accepted
**Date:** 2026-03-17
**Author:** General-Purpose Agent
**Related:** DDR-008 (Framework Distribution), DDR-014 (Cursor IDE Distribution Mechanism)

---

## Context

Styleguides and templates were scattered across three locations:

| Location | Role | Problem |
|---|---|---|
| `doctrine/styleguides/` | Canonical (intended) | Incomplete — missing several files |
| `docs/styleguides/` | Legacy duplicate | Identical copies of canonical files plus unique files not in doctrine |
| `doctrine/docs/styleguides/` | Older upstream copies | Shorter/outdated versions of files already in canonical location, plus unique files |

The same pattern existed for templates:

| Location | Role | Problem |
|---|---|---|
| `doctrine/templates/` | Canonical (intended) | Complete, Regnology-branded versions |
| `docs/templates/` | Legacy duplicate | 72 files — 13 identical, 51 differing only by missing branding header, 10 unique |

This created confusion about which location was authoritative, risk of edits landing in the wrong copy, and stale references across the codebase.

## Decision

**Consolidate all styleguides into `doctrine/styleguides/` and all templates into `doctrine/templates/` as the single canonical locations. Remove `docs/styleguides/` and `docs/templates/` entirely.**

### Consolidation Steps

1. Identified unique files in each non-canonical location via `md5sum` comparison.
2. Copied unique files to the canonical location (preserving directory structure).
3. For files that differed only by Regnology branding headers, kept the branded `doctrine/` version.
4. Deleted the non-canonical directories.
5. Updated all references across the codebase (31+ occurrences for templates, 17+ for styleguides).
6. Updated `distribution-config.yaml` to point to canonical locations.

### Files Rescued (moved to canonical)

**From `docs/styleguides/`:** `commit-and-markdown-linting.md`, `presentations/reveal-js-slide-deck.md`, `version_control_hygiene.md`, `README.md`

**From `doctrine/docs/styleguides/`:** `shell-scripts.md`, `domain-driven-naming.md`, `SDD_Style.xml`

**From `docs/templates/`:** `architecture/proposal_exec.md`, `branding/COLOR_PALETTE.md`, `branding/word_document_branding_guide.pdf`, 5 PlantUML diagram examples, 2 PlantUML themes

## Rationale

1. **Single source of truth.** The doctrine stack is portable and distributable — it should contain all styleguides and templates. `docs/` is for project-specific documentation, not framework artifacts.
2. **Eliminates drift.** Duplicate files inevitably diverge. The branded `doctrine/` versions were already more complete.
3. **Consistent with DDR-008.** The distribution mechanism packages `doctrine/` — files outside it are not distributed to consuming repositories.
4. **Reduces confusion.** Contributors and agents no longer need to decide which location to edit.

## Consequences

### Positive

- One location to search, edit, and distribute for each artifact type
- References are consistent across the entire codebase
- Distribution config is simpler (no `docs/styleguides` or `docs/templates` entries)

### Negative

- Historical changelog entries reference old paths (left as-is for accuracy)
- Consuming repos that hardcoded `docs/styleguides/` or `docs/templates/` paths will break until updated

### Risks

- If upstream re-introduces `docs/templates/` in a future sync, it will need to be redirected during the acceptance interview
