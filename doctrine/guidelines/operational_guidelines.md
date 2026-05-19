# Operational Guidelines

_Version: 1.3.0_
_Last updated: 2025-11-23_
_Format: Markdown protocol for agent initialization and governance_

---

How agents should operate inside this repository.

> For low-risk tasks, prefer the lightweight context from
`guidelines/runtime_sheet.md` + your specialist profile. Use the full contents below when operating in high-stakes or cross-cutting areas.

## Files and directories

- Treat `docs/` as the **source of truth** about intent and constraints.
- Use `work/` for:
    - scratch notes
    - progress logs
    - intermediate drafts
- Use `output/` for:
    - generated artifacts ready for human review
- Prefer small, incremental changes over large rewrites.

### Repository Structure Note

**Important:** The `agents/` directory is a symlink to `doctrine/` in consuming repositories. Any changes made to files or directories under
`agents/` will actually modify `doctrine/` in consuming repositories and vice versa. This means:

- `agents/directives/` → `directives/` (same location)
- `agents/approaches/` → `approaches/` (same location)
- There is only ONE copy of each file, not duplicates
- Edits to either path modify the same underlying file

## Universal Directives

The following directives apply to **all agents for all tasks** and must not be treated as optional or load-on-demand:

| Code | Directive | Why Universal |
|------|-----------|---------------|
| 038  | [Ensure Conceptual Alignment](../directives/038_ensure_conceptual_alignment.md) | Prevents misinterpretation of domain terminology before task execution |
| 040  | [Human-in-Charge Escalation](../directives/040_human_in_charge_escalation_protocol.md) | Defines when and how to escalate to humans; safety-critical |
| 041  | [Use Regnology Branding](../directives/041_use_regnology_branding.md) | Mandatory branding headers and licensing for all repositories |
| 042  | [Model Discipline](../directives/042_model_discipline.md) | LLM model selection by task type and cost tier; prevents wasteful defaults |

Agents do not need to load the full directive text into context for every task, but must be aware of these obligations and load the relevant directive when the situation applies.

## Cost-Aware Execution

Agents running on premium models (high-cost tiers) MUST actively minimize cost by delegating routine work:

- **Match model to arena:** Map each task to its arena (text, code, vision, search) and select the appropriate cost tier. Routine extraction, file reading, and template work are mid-tier text tasks. Consult `doctrine/toolguides/agentic_model_leaderboard.yaml` when uncertain.
- **Delegate to cheaper models/subagents:** File creation, search, git operations, template generation, structured artifact writing, repetitive edits across files.
- **Keep on the current model:** Complex reasoning, architecture decisions, trade-off analysis, debugging requiring correlation across many files, active user iteration.
- **Document model choice in task context:** When coordinating tasks, set `context.preferred_execution_model_tier: "mid"` (or `"economy"` / `"premium"`) so downstream agents respect cost-appropriate selection.
- **Self-check:** Before each task, ask: "Which arena? Which tier? Does this require my full reasoning depth?" If not, delegate.
- **Batch independent tasks** into parallel delegations rather than sequential execution.

This is not optional. Premium model usage on routine tasks is a direct violation of Directive 042 and wastes user budget.

## Rules

- Do not modify files under `docs/` unless explicitly instructed.
- Prefer creating new files in `work/` or `output/` over rewriting existing ones without context.
- Keep output structured and easy to diff.
- Always reference relevant guidelines before executing tasks.
- When in doubt, ask for clarification rather than making assumptions.
- If you are a specialist agent: NEVER exceed your specific role's scope.

## Token Discipline

- Prefer links and section references over inlining entire guidelines in the prompt.
- Drop non-essential sections when the task scope is narrow.
- Keep transient reasoning in `${WORKSPACE_ROOT}/notes` instead of the prompt transcript.

## Style Guidelines

- Reuse existing templates and patterns (`templates/`) whenever possible.
- Adhere to the writing guidelines in the `${DOC_ROOT}/styleguide/` directory.
- Use clear, concise language. Maintain a calm and professional tone.
- Follow existing style conventions in code and documentation.
- Content over Hype: Avoid buzzwords and jargon unless necessary.
