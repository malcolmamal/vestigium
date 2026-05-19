# Doctrine Changelog - Regnology Professional Services Agent Framework

All notable changes to the doctrine framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**Note:** Repository-specific changes (code structure, tooling) are documented in the [root CHANGELOG.md](../CHANGELOG.md).

---

## [Unreleased]

### Canonical Location Consolidation & Diagramming Styleguides (2026-03-17)

#### Added
- **DDR-015:** Canonical Location Consolidation — documents the decision to consolidate styleguides and templates into `doctrine/` (single source of truth)
- **`doctrine/styleguides/diagramming/mermaid.md`** — Mermaid diagramming style guide with Regnology brand colours, `classDef` block, per-diagram-type guidelines, and C4 deprecation notice
- **`doctrine/toolguides/ripgrep.md`** — Full toolguide for ripgrep (`rg`): quick reference, file filtering, context options, repo-specific patterns, integration with `rtk grep`
- **`doctrine/toolguides/rtk.md`** — Full toolguide for RTK (Rust Token Killer): output obfuscation warning, verbosity flags (`-v`/`-vv`/`-vvv`), all subcommands by category, hook-based usage, when-to-use decision table

#### Changed
- **Directive 041** (`041_use_regnology_branding.md`, v1.1.0 → v1.2.0): Added **Diagrams** section with styleguide table (Mermaid, PlantUML, C4), source-of-truth location, quick-reference links; C4 row now specifies PlantUML as preferred tool
- **Directive 001** (`001_cli_shell_tooling.md`): Added `rtk` and `rg` (ripgrep) inline sections with common patterns, verbosity flags, and links to toolguides
- **Diagram Daisy** (`agents/diagrammer.agent.md`): Added **Tool Selection** table (8 diagram types mapped to preferred tools; PlantUML for C4/class/deployment, Mermaid for flowcharts/state/ER); added Directive 041 to directive references; added diagramming styleguides and colour palette to context sources
- **Mermaid C4 deprecated:** `doctrine/styleguides/diagramming/mermaid.md` now states Mermaid C4 is experimental/poorly supported; existing Mermaid C4 theme assets retained for legacy rendering only; new C4 diagrams must use PlantUML with C4-PlantUML
- **`doctrine/templates/diagramming/themes/mermaid-regnology.md`** — Fixed accent colour from `#FDB913` to `#EC9D1C` (Hay yellow per official palette); updated handoff note to reference new Mermaid styleguide
- **`doctrine/styleguides/presentations/reveal-js-slide-deck.md`** — Updated Diagram Daisy handoff to reference Mermaid styleguide
- **`.cursor/skills/diagramming/SKILL.md`** — Added Mermaid, PlantUML, and C4 theme styleguide references

#### Moved (DDR-015)
- **Styleguides** consolidated from `docs/styleguides/` and `doctrine/docs/styleguides/` into `doctrine/styleguides/` (canonical). Unique files rescued: `commit-and-markdown-linting.md`, `presentations/reveal-js-slide-deck.md`, `shell-scripts.md`, `domain-driven-naming.md`, `SDD_Style.xml`, `version_control_hygiene.md`, `README.md`
- **Templates** consolidated from `docs/templates/` into `doctrine/templates/` (canonical). Unique files rescued: `architecture/proposal_exec.md`, `branding/COLOR_PALETTE.md`, `branding/word_document_branding_guide.pdf`, 5 PlantUML diagram examples, 2 PlantUML themes

#### Removed
- **`docs/styleguides/`** — Entire directory removed (duplicates of `doctrine/styleguides/`)
- **`docs/templates/`** — Entire directory removed (duplicates of `doctrine/templates/`)
- **`doctrine/docs/styleguides/`** — Entire directory removed (older copies superseded by `doctrine/styleguides/`)

#### References Updated
- 48+ file references updated across ADRs, agent profiles, test files, tools, fixtures, config files, and root docs to point to canonical `doctrine/styleguides/` and `doctrine/templates/` locations
- `distribution-config.yaml` updated: `docs/styleguides` → `doctrine/styleguides`, `docs/templates` → `doctrine/templates`

### Cursor IDE Integration & Linting (2026-03-03)

#### Added
- **`doctrine/cursor/`** — Canonical Cursor configuration source that travels with doctrine symlink/subtree (DDR-014)
- **`tools/scripts/setup-cursor.sh`** — Setup script: symlinks hooks on Linux/macOS, copies as fallback, generates skills
- **`doctrine/cursor/setup.sh`** — Convenience wrapper for consuming repos
- **`doctrine/cursor/hooks/check-markdown-lint.sh`** — afterFileEdit hook for markdownlint validation on `.md` files
- **`doctrine/cursor/hooks/session-init.sh`** — sessionStart hook with doctrine upstream update checking and model discipline advisory
- **`.commitlintrc.yaml`** — Conventional Commits linting config with project-specific type extensions
- **`.markdownlint.yaml`** — Markdown linting config tuned for doctrine's prose style
- **`doctrine/styleguides/commit-and-markdown-linting.md`** — Styleguide for commit message and markdown formatting standards
- **`.cursor/rules/model-discipline.md`** — Always-on Cursor rule enforcing Directive 042 delegation on premium models
- **DDR-014:** Cursor IDE Distribution Mechanism — documents symlink-over-copy architecture
- **Glossary:** "Indoctrinated Repository" term added

#### Changed
- **All hook scripts** rewritten for POSIX compatibility — replaced `grep -oP` (GNU PCRE) with `sed -n` extraction; works on macOS + Linux
- **`tools/scripts/deploy-cursor-skills.js`** — `extractPurpose()` now skips bullet/table lines; manual description overrides for all tactic skills; merged `test-readability-check` into `test-readability` skill (33 skills, down from 34)
- **Bootstrap Bill** (`agents/bootstrap-bill.agent.md`): Cursor IDE section updated to reference `setup.sh` instead of manual `.cursorrules` creation
- **`framework_install.sh`** — calls `setup_cursor_integration()` post-install for Cursor bootstrapping
- **`distribution-config.yaml`** — added `.cursor` to export directories, `.commitlintrc.yaml` and `.markdownlint.yaml` to root files
- **Source repo** `.cursor/hooks*` replaced with symlinks to `doctrine/cursor/` (eat your own dog food)
- **`doctrine/guidelines/general_guidelines.md`** — added Model Discipline section requiring delegation of routine tasks
- **`doctrine/guidelines/operational_guidelines.md`** — added Cost-Aware Execution section with enforcement language
- **`doctrine/guidelines/runtime_sheet.md`** — added Model Discipline quick-reference for small-footprint agents
- **`AGENTS.md`** — added Model Discipline subsection under Default Runtime Behavior
- **`session-init.sh`** — emits advisory when premium model detected, reminding agent of Directive 042

#### Fixed
- `tdd-workflow` skill had broken description (extracted bullet instead of purpose)
- 5 more tactic skills had same broken-description pattern (architecture-decisions, code-review, maven-compliance, refactoring, risk-analysis, safe-to-fail-experiments)
- `setup-cursor.sh` skills fallback path resolved to wrong directory
- `doctrine/cursor/README.md` referenced non-existent `doctrine/templates/cursor/`

### Upstream Sync: Selective Adoption (2026-02-23)

Selective sync with upstream (`sddevelopment-be/quickstart_agent-augmented-development`). Each difference evaluated via acceptance interview; branding changes (`Regnology` → `SDD`) rejected.

#### Added
- **Directive 040:** Human-in-Charge Escalation Protocol — structured agent-to-human escalation via `work/human-in-charge/` directory (DDR-012)
- **`doctrine/templates/coordination/`** — 5 HiC templates (blocker, decision-request, executive-summary, problem, README)
- **`doctrine/REPO_MAP.md`** — Framework navigation map (Bootstrap Bill, tailored to Regnology fork)
- **`doctrine/SURFACES.md`** — Extension points and integration interfaces catalog (Bootstrap Bill)
- **`doctrine/docs/workflows/core-use-cases.md`** — Practical use-case reference (from upstream)
- **`doctrine/styleguides/shell-scripts.md`** — Shell script style guide with ShellCheck compliance (from upstream)
- **`doctrine/templates/project/model_router.template.yaml`** — LLM model routing configuration template (PROVISIONARY, from upstream)
- **`doctrine/decisions/DDR-012`** — HiC adoption rationale (authored by Curator Claire)

#### Changed
- **Manager Mike** (`agents/manager.agent.md`): Added HiC monitoring (section 4.5), Directive 040 reference, `coordination/` → `collaboration/` path rename, blocker/decision resolution protocols
- **Directive 019** (`directives/019_file_based_collaboration.md`): Added agent-to-human escalation path and Directive 040 cross-reference
- **AFK-Mode** (`shorthands/afk-mode.md`): Pause events now route to `work/human-in-charge/` subdirectories with structured templates
- **Analyst Annie** (`agents/analyst-annie.agent.md`): Merged domain-agnostic content from Regnology-specific analyst profile (extended workflow, key principles, anti-patterns); table formatting cleanup
- **DevOps Danny** (`agents/build-automation.agent.md`): Added shell script styleguide reference
- **`approaches/test-first-bug-fixing.md`**: Corrected author attribution to Stijn Dejongh
- **Styleguide references** updated in `using_the_agents/01_getting_started.md`, `styleguides/java_guidelines.md`

#### Moved
- **Regnology-specific styleguides** consolidated into `doctrine/styleguides/` (canonical location)
- **`approaches/excel_to_validated_specification_workflow.md`** to `gdm-mapping-validator/.doctrine-config/approaches/` (local doctrine override)

#### Removed
- **`agents/analyst.agent.md`** — Merged into `analyst-annie.agent.md`
- **`GLOSSARY.md.backup`** — Stale backup file

#### Rejected (from upstream)
- Branding changes (`Regnology` → `SDD`) across 18+ files — intentional fork divergence

---

### Phase 1: Doctrine Extraction & Portability (2026-02-08)

#### Added
- **`doctrine/` directory** - Standalone, portable framework with zero external dependencies
- **`docs/architecture/design/DOCTRINE_MAP.md`** - Comprehensive navigation guide for all 201 framework files
- **`doctrine/DOCTRINE_STACK.md`** - Five-layer architecture documentation
- **`doctrine/GLOSSARY.md`** - Centralized terminology reference
- **`doctrine/templates/`** - Canonical template location (80 templates)
- **`doctrine/templates/automation/doctrine-config-template.yaml`** - Path configuration template
- **Path parameterization** - All files use `${WORKSPACE_ROOT}`, `${DOC_ROOT}`, `${SPEC_ROOT}`, `${OUTPUT_ROOT}` for portability
- **Bootstrap Bill doctrine setup** - Automatically creates `.doctrine/config.yaml` during repository initialization
- **`doctrine/agents/reviewer.agent.md`** - Quality assurance specialist for ADRs, specifications, and documentation (21st agent profile)
- **`doctrine/guidelines/python-conventions.md`** - Comprehensive Python coding standards with Quad-A test pattern
- **`doctrine/guidelines/version-control-hygiene.md`** - Git workflow discipline and conventional commit standards
- **`doctrine/templates/documentation/`** - Documentation template collection (pattern, concept, audience persona)
- **`doctrine/examples/personas/`** - Example audience personas (emerging developer, technical lead)

#### Changed
- **BREAKING:** Agent profiles context sources now reference `doctrine/` instead of `.github/agents/`
- **Moved:** All templates from `doctrine/docs/templates/` to `doctrine/templates/` (canonical location per architecture)
- **Renamed:** `prompts/` → `doctrine/shorthands/` (clarifies purpose as reusable command aliases)
- **Updated:** All 20 agent profiles to use doctrine paths
- **Updated:** All directives, approaches, guidelines, tactics to use parameterized paths
- **Updated:** 38 files with template path references

#### Removed
- **Symlink:** `./agents` (deprecated, pointed to old `.github/agents/`)
- **External dependencies:** All outgoing references from doctrine/ eliminated

#### Migration Details

**Phase 1a: Zero-dependency content (46 files)**
- Tactics: 20 files (ready for subtree distribution)
- Clean agents: 8 files (Alphonso, Annie, Benny, etc.)
- Clean directives: 11 files
- Clean approaches: 7 files + subdirectories

**Phase 1b: Parameterized content (155 files)**
- Agents: 12 remaining profiles (all parameterized)
- Approaches: 27 files (all parameterized)
- Directives: 18 files (all parameterized)
- Guidelines: 5 files (all parameterized)
- Templates: 80 files (moved to canonical location)
- Shorthands: 3 files (renamed from prompts/)
- Reference docs: 4 comparative studies

**Validation:**
- Created `ops/scripts/validate-doctrine-dependencies.sh` (6 validation checks)
- All checks passing (excluding expected documentation references)
- Curator Claire consistency audit: Grade A- (Excellent, production-ready)

#### Documentation

**Added:**
- `docs/architecture/design/DOCTRINE_MAP.md` - Quick navigation, file catalog, path parameterization guide
- `doctrine/templates/automation/doctrine-config-template.yaml` - Configuration template for consuming repos
- Updated `specific_guidelines.md` with Glossary update requirement and bootstrap requirements

**Updated:**
- Bootstrap Bill profile with doctrine configuration responsibilities
- All agent profiles with new context source paths
- `templates/automation/README.md` with template catalog

#### Architecture

**Five-Layer Doctrine Stack:**
1. **Guidelines** (values, preferences) - Highest precedence
2. **Approaches** (mental models, philosophies)
3. **Directives** (instructions, constraints)
4. **Tactics** (procedural execution guides)
5. **Templates** (output structure contracts) - Lowest precedence

**Path Parameterization Pattern:**
```yaml
# .doctrine/config.yaml
paths:
  workspace_root: "work"           # ${WORKSPACE_ROOT}
  doc_root: "docs"                 # ${DOC_ROOT}
  spec_root: "specifications"      # ${SPEC_ROOT}
  output_root: "output"            # ${OUTPUT_ROOT}
```

#### Distribution Readiness

Doctrine is now ready for:
- **Git subtree distribution:** `git subtree split --prefix=doctrine -b doctrine-main`
- **Standalone consumption:** Zero dependencies on parent repository
- **Multi-repository deployment:** Path variables allow customization per repo
- **Tool integration:** Supports GitHub Copilot, Claude, Cursor, OpenCode

#### Phase 1c: Knowledge Extraction (2026-02-08)

**External Repository Learning Extraction** - Generic patterns only, zero proprietary content:

**Reviewer Agent:**
- Multi-dimensional quality assurance (Structural, Editorial, Technical, Standards)
- 3 rigor levels (Light/Standard/Comprehensive)
- Evidence-based findings with actionable recommendations
- Collaboration patterns with Writer-Editor, Curator agents
- Source: Extracted from external repository, all proprietary content removed

**Python Conventions Guideline:**
- **Novel Contribution:** Quad-A test pattern (Arrange-Assumption-Act-Assert)
  - Extends traditional AAA with assumption checks
  - Validates test setup to catch fixture failures early
  - Provides precise failure messages distinguishing setup vs behavior issues
- Guard clause validation patterns (fail-fast, flat code)
- Type hints and f-string standards
- Testing pyramid philosophy (50-70% unit, 20-30% integration, 10-20% e2e)
- Black/Ruff tooling discipline
- Common patterns (Path objects, UTC timestamps, YAML handling)
- Source: Extracted from external repository styleguides (generic patterns only)

**Version Control Hygiene Guideline:**
- Conventional commit format (type(scope): summary)
- One logical change per commit discipline
- Small, reviewable commits (<500 lines ideal)
- Branch hygiene (short-lived <24h, focused scope)
- Destructive command safety warnings (reset --hard, force push)
- Agent-specific conventions (identity in commits, multi-agent coordination)
- Source: Extracted from external repository styleguides (already generic)

**Documentation Templates (Pattern/Concept/Persona):**
- **Pattern Template:** Forces-based practice documentation
  - Problem/Intent/Solution with explicit Enablers/Deterrents
  - Consequences & Mitigation strategies
  - Complements ADR template (decisions vs practices)
- **Concept Template:** Abstract idea documentation
  - Definition, Background, Comparisons, Significance
  - Bridges theory to practical implications
- **Audience Persona Template:** Reader profile framework
  - Desiderata (Information/Interaction/Support/Governance)
  - Behavioral Cues, Collaboration Preferences
  - Enables systematic target-audience fit
- **Example Personas:** Emerging Developer, Technical Lead
- Source: Extracted from Penguin Pragmatic Patterns (generic editorial patterns only)

**Commits:** 31 commits from initial extraction through Phase 1c completion (up to 5470188)

---

## Version Strategy

**Doctrine versioning** (independent of repository):
- **Major (X.0.0):** Breaking changes to directive contracts, approach signatures, agent interfaces
- **Minor (0.X.0):** New directives, approaches, agents; backward-compatible additions
- **Patch (0.0.X):** Clarifications, typo fixes, documentation improvements

**Current Status:** Unreleased (Phase 1 complete, awaiting Phase 2 tooling)

---

## Future Phases

### Phase 2: Doctrine Tooling (Planned)
- Exporters: doctrine/ → `.github/instructions/`, `.claude/skills/`
- Update existing exporters to read from doctrine/
- Create `doctrine/README.md` with usage instructions
- Update `AGENTS.md` to reference doctrine/

### Phase 3: Multi-Repository Testing (Planned)
- Test doctrine distribution to downstream repositories
- Validate `.doctrine/config.yaml` path overrides
- Document integration patterns for consuming repositories

---

## Notes

- **Zero external dependencies:** Doctrine must never reference files outside `doctrine/`
- **Path parameterization:** All file references use `${VARIABLE}` syntax
- **Bootstrap requirement:** Bootstrap Bill MUST create `.doctrine/config.yaml` during repo setup
- **Glossary discipline:** New terms MUST be added to `doctrine/GLOSSARY.md`
- **Template canonical location:** `doctrine/templates/` (not `doctrine/docs/templates/`)
