# Repository Vision

_Version: 1.0.0_  
_Last updated: 2026-02-04_
_Format: Strategic context for Regnology agent-based tooling_

---

> This repository provides agent profile specifications, directives, and guidelines that enable Regnology Professional Services consultants and employees to make efficient use of LLM Agent-based tooling through standardized workflows, collected best practices, and enhanced agentic functionality.

**Framework Foundation:** This repository is based on the [SDD Agent-Augmented Development Quickstart](https://sddevelopment-be.github.io/quickstart_agent-augmented-development/), customized and extended for Regnology Professional Services consulting context.

## Problem

Regnology Professional Services consultants and employees need to leverage LLM-based agent tooling effectively for client engagements and internal projects. Without standardized configuration, guidance, and best practices:

- **Inconsistent agent behavior** across users and sessions leads to unpredictable outcomes
- **Repeated context setup** wastes time when consultants must re-explain domain knowledge, workflows, and constraints every session
- **Knowledge fragmentation** prevents sharing effective prompts, agent profiles, and operational patterns across teams
- **Suboptimal utilization** of agentic tooling capabilities due to lack of structured guidance on specialized workflows
- **Quality variation** in agent outputs without established standards for tone, reasoning discipline, and deliverable formats

## Desired Outcomes

This repository succeeds when:

1. **Standardized Agent Behavior:** Consultants and employees can initialize agents with consistent operational context, reasoning modes, and quality standards across all sessions
2. **Rapid Context Loading:** Domain-specific agent profiles (e.g., ABACUS360 mapping, architecture design, documentation) enable immediate productive work without re-explaining fundamentals
3. **Shared Best Practices:** Directives and approaches capture proven patterns for test-driven development, traceable decisions, file-based collaboration, and other workflows
4. **Enhanced Productivity:** Users spend less time on setup and clarification, more time on high-value problem-solving and client deliverables
5. **Quality Assurance:** Established guidelines ensure agent outputs meet professional standards for accuracy, traceability, and alignment with Regnology's consulting methodology
6. **Continuous Improvement:** The framework evolves through captured learnings, SWOT analysis of prompts, and refinement of agent profiles based on real-world usage

## Scope

### In Scope

- **Agent Profile Specifications:** Specialist agent definitions (`.agent.md` files) for common Regnology consulting roles and domains (extends base framework profiles)
- **Directives:** Externalized instruction sets for CLI tooling, test-driven development, decision traceability, documentation levels, and other technical workflows (based on Regnology Professional Services Agent Framework)
- **Guidelines:** Bootstrap procedures, operational rules, general principles, and runtime sheets for agent initialization (inherited from base framework)
- **Approaches:** Strategic patterns for file-based collaboration, locality of change, trunk-based development, and other architectural concerns (extends base patterns)
- **Templates:** Standardized formats for documentation, ADRs, work logs, and deliverables (customized for Regnology context)
- **Regnology-Specific Extensions:** Domain-specific agent profiles (e.g., ABACUS360 mapping), client engagement workflows, and Regnology consulting methodology integration
- **Validation Infrastructure:** Scripts and workflows to ensure profile consistency, directive versioning, and structural integrity
- **Usage Documentation:** Clear instructions (AGENTS.md, CLAUDE.md) explaining how to work with the framework

### Explicitly Out of Scope

- **Base framework maintenance:** Core Regnology Professional Services Agent Framework updates occur upstream; this repository consumes and extends, not maintains the base
- **Client-specific code or data:** No proprietary Regnology or client intellectual property should be stored here
- **Production deployment configuration:** This is a configuration and guidance layer, not a deployment artifact
- **LLM model training or fine-tuning:** Focuses on prompting and orchestration patterns, not model development
- **General-purpose AI tooling:** Scope limited to agent-based workflows relevant to Regnology Professional Services consulting
- **Real-time collaboration infrastructure:** File-based orchestration only; no servers, databases, or live coordination systems

## Role of Agents

Agents in this repository serve dual purposes:

### 1. Configuration Consumers

Consultants and employees use this repository to:
- Initialize agent sessions with standardized context (AGENTS.md specification)
- Load specialist profiles for domain-specific work (e.g., Bootstrap Bill for repo setup, Abacus Abe for ABACUS360 mapping)
- Apply directives on-demand for specific workflows (e.g., TDD, ATDD, traceable decisions)
- Reference guidelines for operational boundaries and collaboration contracts

### 2. Framework Contributors

Agents assist in maintaining and evolving the framework by:
- **Documenting new patterns:** Capturing successful workflows as directives or approaches
- **Validating consistency:** Ensuring agent profiles follow templates and reference correct context files
- **Generating scaffolding:** Bootstrap Bill creates REPO_MAP, SURFACES, and WORKFLOWS artifacts for efficient multi-agent collaboration
- **Analyzing usage:** Store Prompts directive enables SWOT analysis of effective vs. ineffective prompting patterns
- **Improving discoverability:** Curator and Scribe agents organize documentation and maintain glossaries

Agents operating within this framework must:
- Respect the instruction hierarchy (System directives > Developer guidance > User requests)
- Load context layers in priority order (Bootstrap → General → Operational → Vision → Specific → Commands)
- Operate within specialist boundaries defined in agent profiles
- Use integrity symbols (✅ ⚠️ ❗️) to signal confidence and alignment
- Store work artifacts in `work/` for traceability
- Default to `/analysis-mode` with explicit mode switching when needed

---

**Strategic Intent:** Enable Regnology Professional Services to deliver higher quality consulting outcomes through standardized, efficient, and traceable use of LLM agent tooling.

**Upstream Reference:** [SDD Agent-Augmented Development Documentation](https://sddevelopment-be.github.io/quickstart_agent-augmented-development/)
