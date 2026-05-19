# Doctrine Framework: Repository Map

_Version: 1.0.0_  
_Last Updated: 2026-02-23_  
_Agent: Bootstrap Bill_  
_Purpose: Navigate the Regnology fork of the portable agentic framework_

---

## Overview

The **Doctrine Framework** is a **standalone, zero-dependency agentic governance system** designed for AI-augmented development workflows. This repository is the **Regnology Professional Services fork** of the upstream [quickstart_agent-augmented-development](https://github.com/sddevelopment-be/quickstart_agent-augmented-development) framework.

**Key Characteristics:**
- **Portable:** Distributable via git subtree to consuming repositories
- **Zero Dependencies:** Pure markdown and YAML, no external libraries
- **LLM-Agnostic:** Compatible with any LLM supporting markdown context
- **Modular:** Load only relevant instructions (token-efficient)
- **Regnology-Customized:** Includes domain-specific agents, styleguides, and onboarding docs

### Quick Stats

| Metric | Value |
|--------|-------|
| **Files** | 315 |
| **Agents** | 22 specialized profiles (21 upstream + 1 domain-specific) |
| **Directives** | 34 operational instructions |
| **Tactics** | 49 procedural execution guides |
| **Approaches** | 26 mental models and workflows |
| **Templates** | 90 structure contracts |
| **Decisions (DDRs)** | 13 doctrine decision records |
| **Shorthands** | 10 command aliases |

---

## Directory Structure

```
doctrine/
├── AGENTS.md (consuming repos)  # Central ASD — read FIRST
├── DOCTRINE_STACK.md            # Five-layer governance model
├── GLOSSARY.md                  # Standardized terminology
├── CHANGELOG.md                 # Version history
├── REPO_MAP.md                  # This file
├── SURFACES.md                  # Extension points catalog
│
├── agents/                      # 22 agent profiles
│   ├── abacus_mapper.agent.md         # ★ Regnology-specific
│   ├── analyst-annie.agent.md
│   ├── architect.agent.md
│   ├── backend-dev.agent.md
│   ├── bootstrap-bill.agent.md
│   ├── build-automation.agent.md
│   ├── code-reviewer-cindy.agent.md
│   ├── curator.agent.md
│   ├── diagrammer.agent.md
│   ├── framework-guardian.agent.md
│   ├── frontend.agent.md
│   ├── java-jenny.agent.md
│   ├── lexical.agent.md
│   ├── manager.agent.md
│   ├── project-planner.agent.md
│   ├── python-pedro.agent.md
│   ├── researcher.agent.md
│   ├── reviewer.agent.md
│   ├── scribe.agent.md
│   ├── synthesizer.agent.md
│   ├── translator.agent.md
│   └── writer-editor.agent.md
│
├── directives/                  # 34 operational instructions
│   ├── 001_cli_shell_tooling.md ... 040_human_in_charge_escalation_protocol.md
│   └── README.md
│
├── tactics/                     # 49 procedural guides
│   ├── README.md                # Catalog and applicability matrix
│   └── *.tactic.md              # Individual tactics
│
├── approaches/                  # 26 mental models
│   ├── README.md
│   ├── spec-driven-development.md
│   ├── trunk-based-development.md
│   ├── decision-first-development.md
│   ├── file-based-orchestration.md
│   ├── locality-of-change.md
│   ├── ralph-wiggum-loop.md
│   ├── file_based_collaboration/   # Step-by-step orchestration
│   ├── operating_procedures/
│   └── prompt_documentation/
│
├── guidelines/                  # Core behavioral (HIGHEST precedence)
│   ├── general_guidelines.md
│   ├── operational_guidelines.md
│   ├── bootstrap.md
│   ├── rehydrate.md
│   ├── regnology_specific.md    # ★ Regnology-specific
│   ├── runtime_sheet.md
│   ├── python-conventions.md
│   ├── version-control-hygiene.md
│   └── commit-message-phase-declarations.md
│
├── decisions/                   # 13 DDRs
│   ├── DDR-001 ... DDR-013
│   └── README.md
│
├── templates/                   # 90 structure contracts
│   ├── agent-tasks/             # Task YAML schemas
│   ├── architecture/            # ADR, design doc templates
│   ├── automation/              # Scripts, config templates
│   ├── checklists/              # Review/setup checklists
│   ├── coordination/            # HiC escalation templates
│   ├── diagramming/             # PlantUML themes and examples
│   ├── documentation/           # Audience, concept, pattern templates
│   ├── project/                 # Changelog, vision, guidelines templates
│   ├── prompts/                 # Structured prompt templates
│   ├── schemas/                 # JSON schemas, migration guides
│   ├── specifications/          # Feature spec templates
│   └── structure/               # Repo map, surfaces, workflow templates
│
├── shorthands/                  # 10 command aliases
│   ├── afk-mode.md
│   ├── architect-adr.md
│   ├── bootstrap-repo.md
│   ├── curate-directory.md
│   └── ... (6 more)
│
├── styleguides/                 # ★ Regnology-specific styleguides
│   ├── FORMALIZED_CONSTRAINT_TESTING.md
│   ├── GENERIC_TESTING.md
│   ├── programming/             # Java and Python conventions
│   └── diagramming/             # PlantUML conventions
│
├── docs/                        # Documentation
│   ├── styleguides/             # Shared styleguides (upstream)
│   ├── using_the_agents/        # ★ Regnology onboarding guides
│   ├── workflows/               # Core use-case reference
│   ├── references/              # Research and comparisons
│   └── VISION.md                # ★ Regnology project vision
│
└── examples/                    # Persona examples
    └── personas/
```

---

## Five-Layer Architecture

```
┌─────────────────────────────────────────────┐
│ 1. Guidelines (values, preferences)         │ ← Highest precedence
├─────────────────────────────────────────────┤
│ 2. Approaches (mental models, philosophies) │
├─────────────────────────────────────────────┤
│ 3. Directives (instructions, constraints)   │ ← Select tactics
├─────────────────────────────────────────────┤
│ 4. Tactics (procedural execution guides)    │ ← Execute work
├─────────────────────────────────────────────┤
│ 5. Templates (output structure contracts)   │ ← Lowest precedence
└─────────────────────────────────────────────┘
```

## Regnology-Specific Additions

This fork includes the following additions not present in the upstream framework:

| Artifact | Type | Purpose |
|----------|------|---------|
| `agents/abacus_mapper.agent.md` | Agent | ABACUS/OSX data mapping specialist |
| `guidelines/regnology_specific.md` | Guideline | Regnology-specific operational rules |
| `styleguides/` | Directory | Java, Python, testing, and diagramming conventions |
| `docs/using_the_agents/` | Docs | Onboarding: getting started, key interactions, building features |
| `docs/VISION.md` | Docs | Regnology Professional Services project vision |

Consuming repositories (e.g., `gdm-mapping-validator`) may further extend via `.doctrine-config/` with local agents, directives, approaches, and guidelines.

## Key Navigation Paths

| I want to... | Start here |
|---------------|-----------|
| Initialize an agent | `guidelines/bootstrap.md` → `agents/<name>.agent.md` |
| Find a directive | `directives/README.md` or `AGENTS.md` § Extended Directives Index |
| Find a tactic | `tactics/README.md` (applicability matrix) |
| Create a decision record | `templates/architecture/adr.md` + Directive 018 |
| Write a work log | `templates/agent-tasks/worklog.md` + Directive 014 |
| Escalate to human | `templates/coordination/` + Directive 040 |
| Understand the glossary | `GLOSSARY.md` |
| Onboard to agents | `docs/using_the_agents/01_getting_started.md` |
| Extend for a project | `SURFACES.md` → `.doctrine-config/` |

---

_Generated by Bootstrap Bill_  
_Upstream: sddevelopment-be/quickstart_agent-augmented-development_  
_Fork: bitbucket.regnology.net/cons/regnology-agent-doctrine_  
_Last Updated: 2026-02-23_
