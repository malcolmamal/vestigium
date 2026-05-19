# General Agent Guidelines

_Version: 1.2.0_
_Last updated: 2026-03-17_
_Format: Markdown protocol for agent initialization and governance_

---

These guidelines apply to all agents in this repository.

> For runtime brevity, reference
`guidelines/runtime_sheet.md` and link back here instead of pasting full sections into prompts unless the task is high-stakes.

## Behaviour

- Act as a careful, cooperative assistant.
- Prefer clarity over cleverness.
- Be explicit about assumptions.
- Keep changes small and reviewable.

## Communication

- Introduce yourself by name and role at the start of each interaction (see [Directive 007, Section 2](../directives/007_agent_declaration.md#section-2-user-facing-self-introduction-external)).
- Explain what you're doing and why when it matters.
- Use clear, concise language.
- When something is ambiguous, propose options and trade-offs.

## Branding & Licensing

- All Markdown files must carry the Regnology PS header (see [Directive 041](../directives/041_use_regnology_branding.md)).
- All programming projects must include the Regnology PS Internal Tooling License and reference it in the build tool.

## Commits

All agents must follow the commit message format defined in [Directive 026](../directives/026_commit_protocol.md):

```
<agent-slug>: task/epic description - specifics
```

- Use the agent's slug (e.g. `backend-dev`, `architect`, `curator`) or `general-purpose` when not specialised.
- Keep commits small, atomic, and traceable. Commit after each logical change.
- Agent commits must be unsigned (`--no-gpg-sign`). Signed commits are reserved for human-authored work.
- Do not batch unrelated changes or commit broken state.

## Model Discipline

All agents MUST apply cost-aware model selection per [Directive 042](../directives/042_model_discipline.md):

- **Match model to arena.** Every task maps to an arena (text, code, vision, search). Routine extraction, file reading, YAML edits, and git operations are text-arena, mid-tier work — not premium.
- **Consult the toolguide.** Use `doctrine/toolguides/agentic_model_leaderboard.yaml` as the single reference for model rankings by arena and cost tier. Do not guess.
- **Delegate routine tasks** (file creation, search, git operations, template generation, repetitive edits) to cheaper or faster models/subagents when available.
- **Reserve premium models** for complex reasoning, architecture decisions, trade-off analysis, debugging requiring correlation, and active user iteration.
- **Document model choice.** When coordinating multi-agent tasks, set `preferred_execution_model_tier` (and optionally `preferred_execution_model`) in task context so downstream agents respect cost-appropriate selection.
- **Self-check before each task:** "Which arena? Which tier? Does this require my full reasoning depth?"
- **Batch independent tasks** into parallel delegations rather than sequential premium-thread execution.
- **Log deviations** from recommended tier (Directive 018).

Reference: [Model Discipline Selection tactic](../tactics/model-discipline-selection.tactic.md) for the step-by-step procedure.

## Collaboration

- Respect repo-specific rules from `${LOCAL_DOCTRINE_ROOT}/specific_guidelines.md` (expected default: `.doctrine-config/specific_guidelines.md`).
- When you create or modify files, summarise the change in a short note.
- Use `work/` for intermediate notes and coordination.
