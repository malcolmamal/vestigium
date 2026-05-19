# Getting Started with the Agent Framework

A practical guide to installing, configuring, and using the Regnology Professional Services Agent Framework.

---

## Overview

This guide will help you:
1. Download and install the framework
2. Set up your AI assistant (Cursor, Codex, or GitHub Copilot)
3. Define your project vision and guidelines
4. Initialize your first agent session

**Estimated time:** 15-30 minutes

---

## Prerequisites

- Access to one of the following AI assistants:
  - **Cursor** (recommended for Regnology PS)
  - **Claude Code** (via Codex CLI)
  - **GitHub Copilot CLI**
- Git installed and configured
- Basic familiarity with command-line operations
- Python 3.12+ (if using framework scripts)

---

## Step 1: Download the Framework

### Option A: Install from Release Artifact (Recommended)

1. **Download the latest release:**
   ```bash
   # From internal Bitbucket or artifact repository
   # Example: regnology-agent-framework-1.0.0.zip
   ```

2. **Extract the artifact:**
   ```bash
   unzip regnology-agent-framework-1.0.0.zip
   cd regnology-agent-framework-1.0.0
   ```

3. **Install into your project:**
   ```bash
   # For fresh installation
   ./scripts/framework_install.sh . /path/to/your/project
   
   # For upgrading existing installation
   ./scripts/framework_upgrade.sh . /path/to/your/project
   ```

### Option B: Clone from Repository

If you have direct access to the `reg_agents` repository:

```bash
# Clone the repository
git clone ssh://git@bitbucket.regnology.net:7999/~ce-stijn.dejongh/reg_agents.git
cd reg_agents

# Copy framework files to your project
cp -r agents/ /path/to/your/project/
cp -r docs/ /path/to/your/project/
cp AGENTS.md CLAUDE.md README.md /path/to/your/project/
```

---

## Step 2: Set Up Your AI Assistant

### Cursor Setup (Recommended)

Cursor provides the best integration with the framework through its `.cursor/` directory support.

1. **Open your project in Cursor:**
   ```bash
   cursor /path/to/your/project
   ```

2. **Verify framework files are present:**
   - `AGENTS.md` in project root
   - `agents/` directory with profiles and directives
   - `.cursor/` or `.claude/` directory (if exported)

3. **Load framework context:**
   - In Cursor, start a new conversation
   - Type: `Initialize as per the AGENTS.md file in this directory.`
   - Wait for confirmation: `✅ Regnology Agent initialized.`

### Codex CLI Setup

For Claude Code via command-line:

1. **Install Codex CLI:**
   ```bash
   npm install -g @anthropic-ai/claude-code-cli
   ```

2. **Initialize in your project:**
   ```bash
   cd /path/to/your/project
   codex init
   ```

3. **Load framework:**
   ```bash
   codex chat "Initialize as per the AGENTS.md file."
   ```

### GitHub Copilot CLI Setup

For GitHub Copilot users:

1. **Install GitHub Copilot CLI:**
   ```bash
   gh extension install github/gh-copilot
   ```

2. **Use the `.github/agents/` directory:**
   - Framework provides GitHub Copilot-compatible agent definitions
   - Agents are available via Copilot's agent panel (top-right icon in GitHub UI)

3. **Initialize via chat:**
   ```bash
   gh copilot suggest "Initialize as per the AGENTS.md specification"
   ```

---

## Step 3: Define Your Project Vision

Now that the framework is installed, customize it for your project with Bootstrap Bill.

### Initialize Bootstrap Bill

In your AI assistant:

```
Initialize as Bootstrap Bill (as per the AGENTS.md specification). 
We will set up this project together.
```

Bootstrap Bill will help you create two critical files:

---

### 3.1 Create `vision.md`

This file defines **what you're building and why**.

**Template prompts from Bootstrap Bill:**

```
Create vision.md for this project. The purpose is to [describe your project goal].
```

**Example: ABACUS360 Integration Project**

```markdown
# Vision: ABACUS360 Data Integration

## Purpose
Enable seamless data exchange between OSX risk platform and ABACUS360 
regulatory reporting system for Regnology clients.

## Problems Addressed
1. Manual data mapping between systems (error-prone, time-consuming)
2. Lack of validation framework for data quality
3. No automated testing for mapping rules

## Desired Outcomes
- Automated field mapping with 95%+ accuracy
- Validation engine for data quality checks
- Test harness for continuous integration
- Documentation for client onboarding

## Success Criteria
- 100% of required ABACUS360 fields mapped
- Zero data quality incidents in production
- Client onboarding time reduced by 50%
```

---

### 3.2 Create `specific_guidelines.md`

This file defines **how agents should work in your project**.

**Template prompts from Bootstrap Bill:**

```
Create specific_guidelines.md with:
- Client name and confidentiality requirements
- Technology stack and constraints
- Testing standards
- Approval workflows
```

**Example: Client Project Guidelines**

```markdown
# Project-Specific Guidelines

## Client Context
- **Client:** [Client Name] (confidential)
- **Domain:** Banking regulatory reporting
- **Sensitivity:** Trade secret - no external sharing

## Technology Stack
- **Backend:** Python 3.12, FastAPI
- **Database:** PostgreSQL 15
- **Testing:** pytest, Quadruple-A structure
- **CI/CD:** Bitbucket Pipelines

## Development Standards
- All code requires unit tests (>80% coverage)
- ADR required for architectural decisions
- Code review by Architect before merge
- No external dependencies without approval

## Regnology-Specific Rules
- Use ABACUS360 terminology (not generic terms)
- Reference Regnology internal docs (not public sources)
- Follow enterprise Java/Python conventions
```

---

## Step 4: Initialize Your First Agent Session

Now you're ready to start working with agents!

### General-Purpose Session

For exploratory work, analysis, or general coding:

```
Initialize as per the AGENTS.md file in this directory.
```

Claude will confirm:
```
✅ Context loaded successfully — Guardrails, Operational, Strategic, and Command layers aligned.
```

### Specialist Agent Session

For domain-specific work (e.g., backend development, architecture, testing):

**Example: Backend Development**

```
Initialize as Backend Benny (as per the AGENTS.md specification).
```

Backend Benny will confirm:
```
✅ Regnology Agent "Backend Benny" initialized.
Context layers: Operational ✓, Strategic ✓, Command ✓, Bootstrap ✓, AGENTS ✓.
Ready for backend development, API design, data models, testing.
```

**Example: Architecture Review**

```
Initialize as Architect Alphonso (as per the AGENTS.md specification).
```

---

## Step 5: Verify Installation

### Quick Validation Checklist

Run this command to validate alignment:

```
/validate-alignment
```

Expected output:
```
✅ Context loaded successfully — Guardrails, Operational, Strategic, and Command layers aligned.
Current mode: /analysis-mode
Active agent: [your-agent-name or general-mode]
All integrity checks passed.
```

### Test Basic Functionality

Ask the agent to demonstrate framework awareness:

```
What specialist agents are available in this framework?
```

Expected response should list 17+ agents: Bootstrap Bill, Backend Benny, Architect Alphonso, Abacus Abe, etc.

---

## Common Setup Issues

### Issue: "AGENTS.md not found"

**Cause:** Framework not properly installed in project root.

**Fix:**
```bash
# Verify AGENTS.md exists in project root
ls -la AGENTS.md

# If missing, re-run installation
./framework_install.sh /path/to/extracted/framework .
```

---

### Issue: "Context layers misaligned"

**Cause:** `vision.md` or `specific_guidelines.md` missing or malformed.

**Fix:**
1. Check files exist:
   ```bash
   ls -la vision.md specific_guidelines.md
   ```

2. If missing, create them with Bootstrap Bill (see Step 3)

3. Re-initialize:
   ```
   Initialize as per the AGENTS.md file.
   ```

---

### Issue: Agent doesn't load specialist profile

**Cause:** Incorrect agent name or `.agent.md` file missing.

**Fix:**
1. List available agents:
   ```bash
   ls agents/*.agent.md
   ```

2. Use correct agent name (hyphenated):
   ```
   Initialize as backend-benny (as per the AGENTS.md specification).
   # NOT: Backend Benny, backend_benny, BackendBenny
   ```

---

## Next Steps

Now that you're set up, proceed to:

- **[Key Interactions](02_key_interactions.md)** — Learn how to use specialist agents for common tasks
- **[Building a Feature](03_building_a_feature.md)** — End-to-end feature development workflow

---

## Quick Reference Commands

| Command | Purpose |
|---------|---------|
| `Initialize as per the AGENTS.md file.` | Start general-purpose session |
| `Initialize as [agent-name] (as per the AGENTS.md specification).` | Start specialist agent session |
| `/validate-alignment` | Check context layers and alignment |
| `/analysis-mode` | Switch to structured reasoning mode (default) |
| `/creative-mode` | Switch to narrative/generative mode |
| `/meta-mode` | Switch to process reflection mode |
| `/require-directive 026` | Load testing styleguide directive |

---

## Additional Resources

- **Repository README:** [README.md](../../README.md)
- **Claude Usage Guide:** [CLAUDE.md](../../CLAUDE.md)
- **Agent Profiles:** [agents/](../../agents/)
- **Directives:** [agents/directives/](../../agents/directives/)
- **Testing Standards:** [styleguides/](../../styleguides/)

---

**Last Updated:** 2026-02-04  
**Framework Version:** 1.0.0  
**Maintained By:** Regnology Professional Services
