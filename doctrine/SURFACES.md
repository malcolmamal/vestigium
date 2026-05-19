# Doctrine Framework: Extension Surfaces

_Version: 1.0.0_  
_Last Updated: 2026-02-23_  
_Agent: Bootstrap Bill_  
_Purpose: Extension points and integration interfaces for the Regnology doctrine fork_

---

## Overview

This document describes **how to extend, customize, and integrate** the Doctrine Framework into consuming repositories. It catalogs the **extension points, integration interfaces, and customization patterns** that enable safe, maintainable adaptations without breaking core governance.

### Key Principles

1. **Additive, Not Overriding** — Local extensions augment doctrine, never replace core guidelines
2. **Clear Precedence** — Framework guidelines > Local extensions > User requests
3. **Backward Compatible** — Extensions don't break existing agents or workflows
4. **Portable** — Customizations remain portable when updating doctrine via git subtree

---

## Extension Points

### 1. Local Guidelines

**Location:** `.doctrine-config/specific_guidelines.md` or `specific_guidelines.md` (repo root)  
**Purpose:** Add repository-specific constraints and conventions  
**Constraints:**
- Cannot override `guidelines/general_guidelines.md` or `guidelines/operational_guidelines.md`
- Can extend with project-specific rules (testing standards, naming conventions, commit formats)

### 2. Custom Agent Profiles

**Location:** `.doctrine-config/custom-agents/`  
**Purpose:** Create repository-specific agents or specialize existing ones  
**Pattern:** Copy from `doctrine/agents/<name>.agent.md`, customize specialization boundaries  
**Example:** `gdm-mapping-validator` could define a custom validation agent scoped to COREP data

### 3. Custom Directives

**Location:** `.doctrine-config/custom-directives/`  
**Numbering:** Use codes 100+ for local directives (001-099 reserved for doctrine)  
**Load pattern:** `/require-directive 100`

### 4. Custom Approaches

**Location:** `.doctrine-config/approaches/`  
**Purpose:** Domain-specific workflows and mental models  
**Example:** `excel_to_validated_specification_workflow.md` — domain-specific requirement refinement workflow used in `gdm-mapping-validator`

### 5. Custom Tactics

**Location:** `.doctrine-config/tactics/`  
**Purpose:** Domain-specific procedural execution guides  
**Example:** Terminology validation checklists, domain-specific review checklists

### 6. Repository Guidelines

**Location:** `.doctrine-config/repository-guidelines.md`  
**Purpose:** Project conventions (branching strategy, CI/CD rules, review processes)

### 7. Model Router Configuration

**Location:** `.doctrine-config/model_router.yaml`  
**Template:** `doctrine/templates/project/model_router.template.yaml` (PROVISIONARY)  
**Purpose:** LLM model selection, pricing ceilings, fallback configuration

---

## Integration Patterns

### Pattern 1: Consuming Repository Setup

```
your-repo/
├── .doctrine-config/
│   ├── config.yaml                    # Path overrides, settings
│   ├── repository-guidelines.md       # Project conventions
│   ├── specific_guidelines.md         # Domain rules (optional, can also be at repo root)
│   ├── custom-agents/                 # Repository-specific agents
│   ├── custom-directives/             # Repository-specific directives
│   ├── approaches/                    # Domain workflows
│   ├── tactics/                       # Domain procedures
│   └── hooks/                         # Git hooks, automation
├── doctrine/                          # Git subtree from this repo
│   └── ...                            # Full doctrine framework
├── work/                              # Agent work directory
│   ├── collaboration/                 # Agent-to-agent task files
│   ├── human-in-charge/               # Agent-to-human escalations (Directive 040)
│   └── reports/                       # Work logs, metrics, prompts
├── AGENTS.md                          # Repository-local ASD (points to doctrine/)
└── specific_guidelines.md             # Domain-specific rules
```

### Pattern 2: Config Resolution

The `config.yaml` in `.doctrine-config/` resolves paths:

```yaml
paths:
  doctrine_upstream: "/path/to/regnology-agent-doctrine"
  workspace_root: "work"
  doc_root: "docs"
  spec_root: "specifications"
```

Agents read `config.yaml` to resolve `${DOCTRINE_UPSTREAM}` before loading the doctrine stack.

### Pattern 3: Doctrine Update (Git Subtree)

```bash
# Add doctrine as subtree
git subtree add --prefix=doctrine \
  ssh://git@bitbucket.regnology.net:7999/cons/regnology-agent-doctrine.git \
  main --squash

# Update doctrine
git subtree pull --prefix=doctrine \
  ssh://git@bitbucket.regnology.net:7999/cons/regnology-agent-doctrine.git \
  main --squash
```

---

## Artifact Formats

### Agent Profile (`.agent.md`)

Required sections: Context Sources, Directive References, Purpose, Specialization, Collaboration Contract, Mode Defaults, Initialization Declaration.  
Template: `doctrine/templates/automation/NEW_SPECIALIST.agent.md`

### Directive (`NNN_kebab_case.md`)

Required sections: Purpose, Instructions, Related Tactics, Related Directives.  
Template: `doctrine/directives/README.md` for conventions.

### Tactic (`kebab-case.tactic.md`)

Required sections: Preconditions, Exclusions, Procedure (step-by-step), Success Criteria, Failure Modes.  
Template: `doctrine/templates/tactic.md`

### Decision Record (`DDR-NNN-slug.md`)

Required sections: Context, Decision, Rationale, Consequences, Alternatives Considered.  
Template: `doctrine/templates/architecture/adr.md`

### Task Descriptor (`.yaml`)

Required fields: id, title, agent, priority, status, context, artefacts.  
Template: `doctrine/templates/agent-tasks/task-descriptor.yaml`

### HiC Escalation (`.md`)

Templates in `doctrine/templates/coordination/`:
- `hic-blocker.md` — External blockers awaiting human action
- `hic-decision-request.md` — Decisions needing human input
- `hic-executive-summary.md` — Multi-agent initiative summaries
- `hic-problem.md` — Internal problems requiring human judgment

---

## Consuming Repositories (Regnology)

| Repository | Stack | Local Overrides |
|------------|-------|-----------------|
| `gdm-mapping-validator` | Java 21 / Spring Boot / Maven | Custom agents, domain approaches, repository guidelines |
| `helpertools/quality_check` | Python | Repository guidelines, config |
| `helpertools/gdm_mapping_validations` | Python | Specific guidelines |

Each consuming repository has its own `AGENTS.md` that resolves `${DOCTRINE_UPSTREAM}` from `.doctrine-config/config.yaml` and follows the bootstrap protocol defined here.

---

## Precedence Summary

```
1. doctrine/guidelines/general_guidelines.md          (HIGHEST — immutable)
2. doctrine/guidelines/operational_guidelines.md       (HIGH — immutable)
3. doctrine/guidelines/bootstrap.md                    (ROOT — initialization)
4. .doctrine-config/ local overrides                   (MEDIUM — additive only)
5. specific_guidelines.md                              (MEDIUM — project rules)
6. doctrine/directives/ + local directives             (MEDIUM — load on-demand)
7. User requests                                       (LOWEST)
```

---

_Generated by Bootstrap Bill_  
_For extension questions: consult AGENTS.md or doctrine/guidelines/bootstrap.md_  
_For local customizations: use `.doctrine-config/` directory_  
_Last Updated: 2026-02-23_
