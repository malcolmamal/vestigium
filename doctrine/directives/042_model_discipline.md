# Directive 042: Model Discipline

**Status:** Active  
**Introduced:** 2026-02-27  
**Applies to:** All agents and users of the agent stack (especially coordinators, config owners)  
**Related Directives:** 018 (Traceable Decisions), 019 (File-Based Collaboration)

---

## Purpose

Ensure that LLM model selection is driven by **task type** (arena) and **cost tier** so that users of the agent stack do not incur undue cost or use ineffective models. Agents and orchestrators should prefer high-ROI models for routine work and reserve premium models for complex or high-stakes tasks.

---

## Core Principles

### 1. Match Model to Arena

- **Arena:** The category of task (text, code, vision, search, etc.). Models rank differently per arena (see [Arena Leaderboard](https://arena.ai/leaderboard)).
- **Rule:** Prefer models that rank well in the **arena that matches the task**. Do not default to the single "best" overall model for every task.
- **Reference:** `doctrine/toolguides/agentic_model_leaderboard.yaml` — field `arenas` per model.

### 2. Prefer Cost Tier Appropriate to Risk

- **Tiers:** `premium` (Opus/Pro/high), `mid` (Sonnet/Flash), `economy` (Haiku/Mini/nano). Align with provider pricing.
- **Rule:** Use **mid** (high ROI) for routine structural work, documentation, YAML, tactics, and most agent execution. Use **premium** only for complex reasoning, architecture, or high-stakes decisions. Use **economy** for high-volume, low-stakes tasks when quality bar allows.
- **Reference:** `doctrine/toolguides/agentic_model_leaderboard.yaml` — field `cost_tier` and section `high_roi_by_task_type`.

### 3. Single Parseable Source

- **Rule:** Consult `doctrine/toolguides/agentic_model_leaderboard.yaml` for model awareness. Do not hardcode model lists in multiple places; keep the toolguide as the single reference and refresh it periodically (see Freshness below).
- **Procedure:** Use the [Model Discipline Selection](../tactics/model-discipline-selection.tactic.md) tactic when assigning execution model or reviewing defaults.

---

## When to Apply

**Always:**
- When configuring which model an agent or workflow uses for a given task type.
- When creating or updating task context with a recommended model or tier (e.g. "prefer high-ROI model for this task").
- When adding or changing default models in orchestration or runner config.

**Recommended:**
- When starting a batch of agent tasks, run the model-discipline-selection tactic once per task type and set context accordingly.
- When reporting cost or quality issues, check whether model choice matches this directive.

**Not required for:**
- One-off human runs where the user explicitly chooses a model.
- Environments where model choice is fixed by policy (document the rationale and align with this directive where possible).

---

## Execution Context

Coordinators (e.g. Manager Mike) and task templates may set:

- `context.preferred_execution_model_tier: "mid"` — prefer high-ROI tier.
- `context.preferred_execution_model: "<model-id>"` — specific model from toolguide when needed.
- `context.notes`: "Execution: Prefer high-ROI (mid-tier) model for this task per Directive 042."

Agents should respect these when invoking an LLM so that the stack-wide default aligns with model discipline.

---

## Freshness and Maintenance

- **Toolguide:** `doctrine/toolguides/agentic_model_leaderboard.yaml` includes `metadata.last_updated`. Rankings and model names change over time; refresh the toolguide periodically (e.g. quarterly or when new arenas/models matter).
- **Source:** Arena leaderboard at https://arena.ai/leaderboard. Cost tiers should be aligned with provider pricing pages.
- **Gap:** If the toolguide is missing or stale, fall back to provider defaults and log the gap; do not block execution.

---

## Related

- **Tactic:** [Model Discipline Selection](../tactics/model-discipline-selection.tactic.md) — step-by-step procedure.
- **Toolguide:** [doctrine/toolguides/agentic_model_leaderboard.yaml](../toolguides/agentic_model_leaderboard.yaml).
- **Directive 018:** Traceable Decisions — document model choice rationale when it affects cost or quality.
- **Directive 019:** File-Based Collaboration — task context may carry preferred model/tier.

---

## Metadata

**Version:** 1.0.0  
**Created:** 2026-02-27  
**Author:** Curator Claire (from Researcher Ralph research and Manager Mike coordination)  
**Status:** Active
