# Approaches

This directory contains an overview of agentic approaches. These are descriptions of step-by-step guides, to be used as a reference by agents to simplify their task execution.

**Goal:** Reduce reasoning complexity and search-space by collecting task-specific operational approaches here.

## Available Approaches

| Approach                                                           | Description                                                                                                   | Agent(s)               | Version |
|--------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|------------------------|---------|
| [work-directory-orchestration.md](work-directory-orchestration.md) | Canonical guide to the file-based orchestration workflow that powers `work/`                                  | All agents             | 1.1.0   |
| [spec-driven-development.md](spec-driven-development.md)           | Comprehensive guide to creating specifications that bridge requirements and implementation (Directive 034)    | All agents             | 1.0.0   |
| [decision-first-development.md](decision-first-development.md)     | Step-by-step workflow for capturing architectural decisions during development with flow-aware timing         | All agents             | 1.0.0   |
| [tooling-setup-best-practices.md](tooling-setup-best-practices.md) | Best practices for tool selection, configuration, and maintenance in agent-augmented development environments | All agents             | 1.0.0   |
| [target-audience-fit.md](target-audience-fit.md)                   | Workflow for applying persona-driven communication (“Target Audience Personas”) to any artifact               | Writing-focused agents | 1.0.0   |
| [locality-of-change.md](locality-of-change.md)                     | Comprehensive guide to avoiding premature optimization through problem measurement and severity assessment    | All agents             | 1.0.0   |
| [trunk-based-development.md](trunk-based-development.md)           | Practical guide for trunk-based development in agent-first workflows with conflict avoidance strategies       | All agents             | 1.0.0   |
| [create-branded-slidedeck.md](create-branded-slidedeck.md)         | Mental model and creation flow for branded Reveal.js slide decks (delegates to Editor Eddy and Diagram Daisy) | Slidedeck Stanislav    | 1.0.0   |
| [ports-and-adapters-architecture.md](ports-and-adapters-architecture.md) | Mental model for structuring applications with business logic independent of infrastructure (Hexagonal, Clean, Onion) | Architect Alphonso, Backend Benny | 1.0.0   |
| [sqlx-spec-driven-authoring.md](sqlx-spec-driven-authoring.md)      | Workflow for pseudo code → spec → SQLX artifacts → validation → tests (and optional explanation) in ABACUS360 | SQLX Interpreter, SQLX Author | 1.0.0   |
| [sqlx-coding-standards.md](sqlx-coding-standards.md)                | Mandatory SQLX coding conventions: FU structure, naming, SQL patterns, decision tables, anti-patterns           | SQLX Author                  | 1.0.0   |

## Usage

Agents should reference approaches when:

- Executing tasks that match a documented pattern
- Learning operational workflows
- Needing step-by-step guidance for complex coordination

Load approach content as context when applicable to reduce reasoning overhead and ensure consistency.
