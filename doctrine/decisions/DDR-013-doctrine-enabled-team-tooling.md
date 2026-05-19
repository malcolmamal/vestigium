# DDR-013: Doctrine-Enabled Team Tooling

**Status:** Proposed  
**Date:** 2026-02-23  
**Author:** Architect Alphonso  
**Related:** DDR-003 (Local Doctrine Overrides), DDR-008 (Framework Distribution), DDR-010 (Modular Directive System)

---

## Context

Regnology Professional Services teams regularly need to create internal helper tools — validators, data transformers, configuration assistants, and other utilities that accelerate consulting delivery. Today, several such tools already exist (quality validators, mapping validation tools, configuration assistants), but there is no formalized architectural pattern for how new tool projects should leverage the doctrine stack to get consistent, agent-augmented development support from day one.

The current situation:

1. **Ad-hoc adoption:** Each project independently figures out how to reference the doctrine stack. Pointer files (local `AGENTS.md`) vary in structure and completeness.
2. **Inconsistent enablement:** Some projects carry full copies of guidelines; others use path-based references. The experience of working with agents varies across projects.
3. **Repeated bootstrapping effort:** Every new tool project re-solves the same onboarding problem — how to set up agent context, where to put domain guidelines, and which directives matter.
4. **Unclear boundaries:** Teams are unsure which parts of the doctrine they should customize versus consume as-is.

The doctrine stack already contains the building blocks to solve this (DDR-003 defines override boundaries, DDR-008 defines distribution, DDR-010 defines modular directives). What is missing is an explicit architectural pattern that composes these building blocks into a repeatable enablement path for team-created tooling.

## Decision

**We establish a standardized enablement pattern — the "Doctrine Consumer Blueprint" — that defines how teams bootstrap new helper tool projects with agent-augmented development support, using the doctrine stack as a shared governance layer.**

The pattern consists of three tiers of adoption, each adding capability without requiring the previous tier to be fully realized first.

### Tier 1: Minimal Viable Consumer (required)

A new tool project establishes agent support with three artifacts:

```
<tool-project>/
├── AGENTS.md                        # Pointer to doctrine upstream + local context
├── specific_guidelines.md           # Domain rules, stack choices, testing norms
└── .doctrine-config/
    └── config.yaml                  # Resolves ${DOCTRINE_UPSTREAM} path
```

**`AGENTS.md`** acts as a thin bootstrap document. It does not duplicate the doctrine — it references it. Its responsibilities:

- Resolve `${DOCTRINE_UPSTREAM}` from `.doctrine-config/config.yaml`
- Direct agents to load the central ASD and bootstrap protocol
- Declare repository-specific context (stack, architecture style, key local files)
- Establish the local instruction hierarchy

**`specific_guidelines.md`** captures what makes this tool project unique:

- Technology stack and conventions (language, framework, build system)
- Testing standards and validation gates
- Commit message conventions
- Domain-specific constraints that agents must respect

**`.doctrine-config/config.yaml`** resolves the physical path to the doctrine upstream, decoupling project files from any team member's local filesystem layout.

### Tier 2: Structured Development (recommended)

Projects that expect sustained development add vision and planning artifacts:

```
<tool-project>/
├── ...tier 1 artifacts...
├── vision.md                        # What the tool does and why it exists
├── work/                            # Agent coordination and progress logs
│   ├── collaboration/inbox/         # Task descriptors (Directive 019)
│   └── notes/                       # Scratch reasoning
└── docs/
    └── planning/                    # Roadmap and batch plans
```

**`vision.md`** provides strategic context that agents use to evaluate whether proposed changes align with the tool's purpose. It answers: what problem does this tool solve, for whom, and what outcomes matter.

The `work/` directory enables file-based agent coordination (DDR-004) and provides a place for progress logs, intermediate notes, and task descriptors.

### Tier 3: Full Governance (for complex or long-lived tools)

Tools that grow in scope or involve multiple contributors add deeper doctrine integration:

```
<tool-project>/
├── ...tier 2 artifacts...
├── .doctrine-config/
│   ├── config.yaml
│   ├── repository-guidelines.md     # Extended project conventions
│   ├── custom-agents/               # Project-specific agent extensions
│   ├── custom-directives/           # Local directive overrides
│   └── hooks/                       # Git hooks and automation
├── docs/
│   ├── architecture/adrs/           # Project-level ADRs
│   └── styleguides/                 # Project coding and testing standards
└── specifications/                  # Functional specs (Directive 034)
```

At this tier, teams use the spec-driven development cycle (Directive 034) for complex features, maintain local ADRs for project-level decisions, and may extend agent profiles with project-specific capabilities through `.doctrine-config/custom-agents/`.

### Boundary Rules

Regardless of tier, the DDR-003 boundary constraint holds:

- Local overrides in `.doctrine-config/` **may** extend, refine, or add context-specific guidance.
- Local overrides **must not** override or weaken `general_guidelines.md` or `operational_guidelines.md`.
- The doctrine upstream remains the single source of truth for agent behavioral norms.

### Agent Interaction Model

When an agent initializes in a consumer project, it follows this resolution chain:

1. Read local `AGENTS.md` → discover `${DOCTRINE_UPSTREAM}` path
2. Load central doctrine stack (bootstrap → guidelines → approaches → directives → tactics → templates)
3. Load local `.doctrine-config/` overrides
4. Load `specific_guidelines.md` for domain rules
5. Load `vision.md` (if present) for strategic alignment
6. Announce readiness

This means teams do not need LLM expertise to benefit from agent-augmented development. The doctrine stack provides the behavioral governance; the team provides the domain context.

## Rationale

### Why a standardized consumer pattern?

**Reduced bootstrapping cost.** A new tool project can be agent-ready in minutes by following the tier 1 pattern. The alternative — each team independently discovering how to set up agent context — wastes effort and produces inconsistent results.

**Progressive complexity.** Not every script or utility needs full governance. The tiered approach lets a weekend prototype start at tier 1 and grow into tier 3 only if it warrants the investment. This avoids front-loading ceremony on exploratory work.

**Consistent agent experience.** When all tool projects follow the same consumer pattern, agents behave predictably across the portfolio. A consultant switching between projects finds familiar conventions and can invoke the same commands and workflows.

### Why pointer-based `AGENTS.md` instead of doctrine copies?

**Single source of truth.** Duplicating doctrine files into each consumer creates drift. Pointer-based references ensure all projects benefit from doctrine improvements automatically (DDR-008 distribution handles upgrades).

**Token efficiency.** Agents load the central doctrine once per session. Local `AGENTS.md` files remain small, reducing initial context overhead.

**Clear ownership.** The doctrine team owns behavioral governance. Tool teams own domain context. The boundary is unambiguous.

### Why three tiers instead of one prescriptive structure?

**Proportional governance.** A one-off data conversion script does not need ADRs, specifications, and a full `work/` directory. Forcing that structure would discourage adoption. Conversely, a tool with multiple contributors and a multi-month roadmap benefits from the structure.

**Adoption incentive.** Low entry cost (tier 1) encourages experimentation. Teams that find value naturally progress to tier 2 and 3 as their tool matures.

### How existing projects map to this pattern

| Project | Current State | Target Tier | Gap |
|---------|--------------|-------------|-----|
| `helpertools` (parent) | Vision + specific guidelines + doctrine agents | Tier 2 | Formalize `.doctrine-config/config.yaml` |
| `gdm-mapping-validator` | Full AGENTS.md + `.doctrine-config/` + ADRs + styleguides | Tier 3 | Already aligned |
| `gdm_mapping_validations` | Pointer AGENTS.md + external path reference | Tier 1 | Needs `.doctrine-config/config.yaml` |

## Envisioned Consequences

### Positive

- ✅ **Lower barrier to entry.** Teams can make any new tool project agent-ready with three files and a path reference.
- ✅ **Portfolio consistency.** All helper tools follow recognizable patterns, reducing context-switching cost for consultants and agents alike.
- ✅ **Governance without overhead.** Tier 1 adds near-zero ceremony. Governance scales with project complexity, not upfront.
- ✅ **Doctrine leverage.** Improvements to the central doctrine (new directives, refined guidelines, better agent profiles) propagate to all consuming tool projects without per-project migration effort.
- ✅ **Team autonomy.** Teams control their domain context (`specific_guidelines.md`, `vision.md`) independently. They are not bottlenecked on doctrine maintainers for domain-specific changes.
- ✅ **Onboarding acceleration.** New team members (human or agent) can orient themselves in any tool project by reading `AGENTS.md` → `vision.md` → `specific_guidelines.md`.

### Negative (Accepted Trade-offs)

- ⚠️ **Path dependency on doctrine upstream.** Consumer projects require access to the doctrine repository at agent initialization time. If the path is misconfigured or the upstream is unavailable, agents cannot bootstrap. Mitigated by clear error messaging in `config.yaml` validation.
- ⚠️ **Tiering requires judgment.** Teams must decide which tier is appropriate. Mitigated by the recommendation defaults (tier 1 for scripts, tier 2 for sustained tools, tier 3 for complex or multi-contributor projects).
- ⚠️ **Additional files in small projects.** Even tier 1 adds three files. Accepted because the cost is minimal and the benefit — consistent agent behavior — applies regardless of project size.
- ⚠️ **Doctrine coupling.** Consumer projects implicitly depend on the doctrine stack's stability. Breaking changes to bootstrap protocol or guideline structure affect all consumers. Mitigated by DDR-008 versioned distribution and upgrade mechanisms.

## Considered Alternatives

- **Embedded doctrine copies per project.** Each tool project carries a full copy of the doctrine stack. Rejected because it creates drift, increases maintenance burden, and contradicts DDR-008 distribution principles.
- **No standardized pattern (status quo).** Let each team figure out adoption independently. Rejected because the current inconsistency demonstrates this does not scale — projects end up with varying quality of agent support.
- **Single mandatory structure for all projects.** One prescribed directory layout regardless of tool complexity. Rejected because it front-loads ceremony on small utilities and discourages adoption.
- **Central tooling registry.** A catalog service that manages tool project configurations centrally. Rejected as premature — the current portfolio is small enough that file-based conventions suffice, and a service adds operational complexity.

## Implementation Guidance

### For teams starting a new helper tool

1. Create the tier 1 artifacts (`AGENTS.md`, `specific_guidelines.md`, `.doctrine-config/config.yaml`).
2. Use an existing consumer project as reference (e.g., `gdm-mapping-validator` for tier 3, `gdm_mapping_validations` for tier 1).
3. Write `specific_guidelines.md` covering: stack, testing approach, commit conventions, and any domain-specific constraints.
4. Start working with agents. Promote to tier 2 when you need planning or sustained development. Promote to tier 3 when architectural decisions accumulate.

### For doctrine maintainers

1. Provide a scaffold script or template directory that generates tier 1 artifacts for a new project.
2. Document the consumer blueprint in the doctrine's own developer guide.
3. Validate that doctrine changes do not break the consumer bootstrap chain.

## Related

- **Doctrine:** DDR-003 (Local Doctrine Overrides) — boundary enforcement for consumer projects
- **Doctrine:** DDR-008 (Framework Distribution) — how doctrine reaches consumers
- **Doctrine:** DDR-010 (Modular Directive System) — load-on-demand efficiency for consumers
- **Directive:** 034 (Spec-Driven Development) — development lifecycle for tier 3 projects
- **Directive:** 019 (File-Based Collaboration) — coordination mechanism used in tier 2+
