# Repository-Specific Guidelines

_Version: 1.0.0_  
_Last updated: 2026-02-27_
_Format: Regnology Professional Services agent operational boundaries_

---

These rules override any generic behaviour if there is a conflict.

## Branding and Naming Conventions

- **CRITICAL:** Replace all references to "Regnology Professional Services Agent Framework" with "Regnology Professional Services" in all agent outputs, documentation, and generated artifacts
- **Exception:** Upstream references and attribution may reference SDD or [SDD Agent-Augmented Development](https://sddevelopment-be.github.io/quickstart_agent-augmented-development/) as the base framework
- This is a **Regnology Professional Services extension/adaptation** of the upstream project
- May contain **Regnology trade secrets** and proprietary consulting methodologies
- Not to be confused with the publicly available version despite significant overlap

## Domain Rules

### Confidentiality

- **Never** include client-specific data, code, or configuration in this repository
- **Never** use production credentials, API keys, or authentication tokens
- **Never** reference specific client names or engagement details in examples
- Use anonymized/synthetic examples: "Client A", "Financial Institution X", etc.
- Regnology-internal methodologies and consulting approaches are permitted but must be marked as proprietary

### Intellectual Property

- Agent profiles and directives specific to Regnology consulting domains are **proprietary**
- Generic patterns inherited from upstream remain under upstream licensing
- When in doubt about what constitutes trade secret vs. generic pattern, escalate for review
- Document provenance: clearly mark which patterns are Regnology-specific vs. inherited from base framework

## Technical Constraints

### Target Environments

- **Primary LLM platforms:** Claude (Anthropic), GPT-4 (OpenAI) - optimize for Claude as primary
- **Shell environment:** Bash/Zsh on Linux/macOS - assume POSIX-compatible tooling
- **Preferred languages:** Python 3.9+, TypeScript/JavaScript (Node.js), Java 11+
- **CLI tooling stack:** `rg` (ripgrep), `fd`, `jq`, `yq`, `ast-grep` - assume these are available

### Framework Alignment

- **Strict adherence** to AGENTS.md context stack hierarchy
- **Bootstrap Bill** is the designated agent for repository scaffolding and topology mapping
- Use `work/` directory for all transient artifacts, analysis scripts, and session notes
- Follow Directive 018 (Documentation Level Framework) for all documentation decisions
- Apply TDD (Directive 017) and ATDD (Directive 016) for executable code
- **Enforce Directive 042 (Model Discipline):** All model selection must follow Directive 042. Match model to task arena, prefer cost tier appropriate to risk (prefer mid/high-ROI for routine work; reserve premium for complex or high-stakes tasks). Use `doctrine/toolguides/agentic_model_leaderboard.yaml` as the single parseable source. When configuring execution model or task context, apply the [Model Discipline Selection](../tactics/model-discipline-selection.tactic.md) tactic. Do not default to the most expensive or single “best” model for every task.

### Agent Profile Standards

- All specialist agent profiles must use `.agent.md` extension
- Must include sections: Context Sources, Purpose, Specialization, Collaboration Contract, Mode Defaults
- Must reference applicable directives in "Directive References" section
- Must declare initialization message as specified in section 6
- Regnology-specific profiles (e.g., ABACUS360 mapper) must clearly document domain boundaries

## Output Expectations

### Code Style

- **Python:** Follow PEP 8, use type hints, include docstrings for public APIs
- **TypeScript/JavaScript:** Follow Airbnb style guide, strict TypeScript configuration
- **Java:** Follow Google Java Style Guide
- **Shell scripts:** Use ShellCheck-compliant patterns, include error handling (`set -euo pipefail`)

### Documentation

- **Tone:** Clear, calm, precise, professional - no hype, no flattery, no motivational padding
- **Format:** Markdown with semantic structure (headings, lists, blockquotes)
- **Integrity symbols:** Use ✅ (aligned), ⚠️ (warning/low confidence), ❗️ (critical/misalignment)
- **Traceability:** Always explain reasoning, expose assumptions, cite sources
- **Stability focus:** Document intent and architecture, not volatile implementation details (per Directive 018)

### Testing Expectations

- **Unit tests required** for all Python and TypeScript/JavaScript functions (TDD per Directive 017)
- **Acceptance tests required** for user-facing workflows (ATDD per Directive 016)
- Store test scripts in `work/tmp/` during development, move to appropriate test directories when finalized
- Include test execution logs in work reports for traceability

### Artifact Formats

- **Agent profiles:** Markdown (`.agent.md`)
- **Directives:** Markdown (`.md`) in `agents/directives/`
- **Configuration:** YAML preferred over JSON for human-editable configs
- **Data exchange:** JSON for machine-to-machine, CSV for tabular data review
- **Diagrams:** PlantUML (`.puml`) or Mermaid markdown code blocks

## Regnology-Specific Workflows

### ABACUS360 Integration

- Use **Abacus Abe** specialist agent for ABACUS360 field mapping and data model work
- Reference `model_overview/docs/` for entity relationships, field catalog, domain definitions
- Semantic matching procedure: name-based → type-based → value-based → context-based
- Output mapping specifications with confidence scores (≥70% high, 50-69% medium, <50% low)

### Client Engagement Patterns

- **Project initialization:** Use Bootstrap Bill to scaffold repository structure
- **Architecture decisions:** Use Architect agent, document in ADRs following templates
- **Documentation curation:** Use Curator agent for knowledge organization
- **Technical writing:** Use Scribe agent for formal documentation deliverables

## Work Directory Discipline

- `work/tmp/` - Analysis scripts, throwaway files, temporary experiments
- `work/notes/` - Session notes, brainstorming, informal documentation
- `work/reports/` - Generated reports, validation summaries, analysis results
- `work/collaboration/` - Multi-agent coordination artifacts
- **Always** store analysis scripts in `work/tmp/` before execution for traceability
- Clean up `work/tmp/` after task completion; archive significant artifacts to appropriate locations

## Compliance and Safety

- **No autonomous destructive operations** - always confirm before:
  - Deleting files outside `work/`
  - Modifying `docs/` or `agents/` directories
  - Git force-push or hard reset
  - Bulk file renames or moves
- **Validation checkpoints:** Run `/validate-alignment` before and after major operations
- **Escalation triggers:** Pause and request human review when:
  - Uncertainty >30% on interpretation
  - Potential trade secret disclosure
  - Conflicting directives or guidelines
  - High-impact operations (bulk changes, schema modifications)

---

**Summary:** This repository contains Regnology Professional Services proprietary extensions to the upstream agent framework. Always distinguish between generic upstream patterns and Regnology-specific methodologies. Prioritize confidentiality, traceability, and professional quality standards.
