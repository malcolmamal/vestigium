# Using the Agents - How-To Guides

This directory contains practical guides for working with the Regnology Professional Services Agent Framework.

## Available Guides

### 1. [Getting Started](01_getting_started.md)
Learn how to download, install, and configure the framework for your project.

**Topics covered:**
- Downloading and installing the framework
- Setting up Cursor, Codex, or GitHub Copilot CLI
- Defining your project vision and guidelines with Bootstrap Bill
- Initializing your first agent session

**Target audience:** New users, consultants setting up a new project

---

### 2. [Key Interactions](02_key_interactions.md)
Discover the specialist agents and how to use them for common tasks.

**Topics covered:**
- Overview of 17+ specialist agents and their roles
- Practical examples: reformatting Excel files, aggregating information, writing executive summaries
- Switching between agents during a session
- Using directives and approaches
- Work directory discipline and traceability

**Target audience:** Users familiar with basics, looking to leverage specialist agents

---

### 3. [Building a Feature](03_building_a_feature.md)
End-to-end workflow for designing and implementing a feature with multi-agent collaboration.

**Topics covered:**
- Ideation with Architect Alphonso
- Creating architecture and technical design documents
- Planning with Planning Petra
- Iterative development with Backend Benny, Frontend Freddy, etc.
- Testing, validation, and documentation
- Review gates and handoffs

**Target audience:** Consultants building custom features or components

---

### 4. [Creating Branded PDF Documents](04_creating_branded_documents.md)
Generate polished, print-ready PDF documents carrying the Regnology PS visual identity from
Markdown sources — for both humans setting up the pipeline and agents executing the tactic.

**Topics covered:**
- How the pipeline works (Markdown → HTML → PDF)
- Setting up a new project from the doctrine template
- pandoc vs. python-markdown: when each converter is used and what the differences are
- Authoring Markdown section files
- Running the generator and verifying output
- Agent checklist for executing the tactic
- Troubleshooting common failures

**Target audience:** Consultants producing PS documents; agents executing Directive 041

---

## Quick Navigation

| Guide | Purpose | Estimated Time |
|-------|---------|----------------|
| [Getting Started](01_getting_started.md) | Install and configure framework | 15-30 minutes |
| [Key Interactions](02_key_interactions.md) | Learn agent capabilities and common tasks | 30-45 minutes |
| [Building a Feature](03_building_a_feature.md) | Full feature development workflow | 60+ minutes |
| [Creating Branded PDF Documents](04_creating_branded_documents.md) | Generate branded PDFs from Markdown | 15-20 minutes (setup) |

---

## Additional Resources

- **[AGENTS.md](../../AGENTS.md)** — Core agent specification and governance
- **[CLAUDE.md](../../CLAUDE.md)** — Working with Claude in this framework
- **[README.md](../../README.md)** — Repository overview and quick reference
- **[Specialist Agent Profiles](../../agents/)** — Detailed agent specifications
- **[Directives](../../agents/directives/)** — Externalized instruction sets
- **[Approaches](../../agents/approaches/)** — Strategic patterns and workflows

---

## Feedback and Contributions

These guides are maintained by Regnology Professional Services. If you encounter issues or have suggestions for improvement:

1. Document your experience in `work/notes/`
2. Share feedback with the framework maintainers
3. Propose additions via internal channels

---

**Last Updated:** 2026-02-04  
**Maintained By:** Regnology Professional Services  
**Framework Version:** 1.0.0
