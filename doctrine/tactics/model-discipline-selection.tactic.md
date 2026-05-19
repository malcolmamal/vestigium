# Tactic: Model Discipline Selection

**Purpose:** Choose an LLM model for agent execution by task type (arena) and cost tier so that users avoid undue cost and ineffective model selection.

**Context:** Invoked by Directive 042 (Model Discipline) and by coordinators when assigning execution context (e.g. "prefer high-ROI model for this task"). Uses `doctrine/toolguides/agentic_model_leaderboard.yaml` as the parseable reference.

**Source:** [work/reports/llm_model_leaderboard_research_2026-02-27.md](../../work/reports/llm_model_leaderboard_research_2026-02-27.md)

---

## When to Use

- Before starting an agent task that will call an LLM (e.g. code gen, docs, analysis).
- When creating or updating task context with a recommended model or model tier.
- When reviewing cost/effectiveness of current default model for a workflow.

---

## Procedure

### Step 1: Classify Task by Arena

Map the task to the primary arena that best matches the work:

| Task type | Arena | Examples |
|-----------|--------|----------|
| Documentation, YAML, specs, curation | text | Structural docs, toolguides, directives |
| Code generation, review, refactor | code | Backend, frontend, tests |
| Image understanding, multimodal | vision | Diagrams, screenshots, visual QA |
| RAG, search, grounding | search | Knowledge retrieval, cited answers |
| Image generation | text-to-image | Art, mockups |
| Video generation | text-to-video / image-to-video | Media tasks |

**Checklist:**
- [ ] Primary arena identified.
- [ ] If hybrid (e.g. code + docs), pick the dominant one or the one with highest quality bar.

### Step 2: Choose Cost Tier

Select cost tier from task risk and complexity:

| Tier | Use when | Examples |
|------|----------|----------|
| **economy** | Bulk, low-stakes, high volume | Linting, simple rewrites, trivial edits |
| **mid** | Routine work, good quality needed, cost-sensitive | Structural docs, routine code, YAML, tactics, most agent tasks |
| **premium** | Complex reasoning, high-stakes, one-off | Architecture decisions, security review, ambiguous specs |

**Default for agent execution:** Prefer **mid** (high ROI) unless the task explicitly requires premium (e.g. complex reasoning, critical decision).

**Checklist:**
- [ ] Tier chosen: economy | mid | premium.
- [ ] Rationale consistent with task description (record in task context if needed).

### Step 3: Consult Toolguide

1. Open `doctrine/toolguides/agentic_model_leaderboard.yaml`.
2. Use `metadata.last_updated` to gauge freshness; refresh if stale (see Directive 042).
3. For the chosen arena and cost tier:
   - Filter `models` where `arenas.<arena>` is present and `cost_tier` matches (or one step higher if no match).
   - Prefer entries in `high_roi_by_task_type` when the task type matches (e.g. `structural_docs_yaml`, `code_review_routine`).
4. Select one model (or model family) for execution.

**Checklist:**
- [ ] Toolguide read; model(s) shortlisted.
- [ ] Selected model has rank/tier in the right arena and acceptable cost_tier.
- [ ] If toolguide missing or empty, fall back to provider default and log gap.

### Step 4: Set Execution Context

Add to task or execution context so the running agent uses the chosen model:

- **Task YAML:** e.g. `context.preferred_execution_model: "gemini-3-flash"` or `context.preferred_execution_model_tier: "mid"`.
- **Orchestrator/config:** Set model identifier for the agent run to the selected model (or tier) per platform.

**Checklist:**
- [ ] Context updated with model or tier.
- [ ] No override by a lower-ROI default unless justified.

### Step 5: Log Selection (Optional)

For audit or tuning, record in work log:

- Task ID, arena, cost tier, selected model, and one-line rationale.

---

## Quick Reference: High-ROI by Task Type

From `doctrine/toolguides/agentic_model_leaderboard.yaml`:

- **Structural / docs / YAML:** gemini-3-flash, claude-sonnet-4-6  
- **Routine code / review:** gemini-3-flash, claude-sonnet-4-6  
- **Complex reasoning:** claude-opus-4-6, gemini-3.1-pro-preview  
- **Search / grounding:** gemini-3-flash-grounding, claude-opus-4-6-search  

---

## Related

- **Directive 042:** [Model Discipline](../directives/042_model_discipline.md) — constraints and guidelines.
- **Toolguide:** [doctrine/toolguides/agentic_model_leaderboard.yaml](../toolguides/agentic_model_leaderboard.yaml).
- **Research:** work/reports/llm_model_leaderboard_research_2026-02-27.md.

---

## Metadata

- **Version:** 1.0.0
- **Created:** 2026-02-27
- **Invoked by:** Directive 042; coordinators (e.g. Manager Mike) when assigning execution model.
- **Status:** Active
