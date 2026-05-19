# Runtime Sheet: Minimal Agent Context

Use this when you need a compact, ready-to-run context for single-agent or low-risk edits. It replaces long in-prompt checklists with links and defaults.

## When to Use Which Path

- **Small-footprint (default):** typo fixes, docs touch-ups, localized code edits, or log updates.
- **Full governance pack:** architecture changes, security-sensitive work, migrations, or tasks touching cross-cutting concerns.

## Small-Footprint Checklist (copy-friendly)

- Load this runtime sheet + your specialist profile (if any).
- Read the task + relevant local files only; do not pre-load the entire repo.
- Stay in `/analysis-mode` unless asked to ideate; surface ⚠️ if assumptions remain.
- Output a brief summary + next steps; keep tokens lean (no duplicate restatements).

## References Instead of Inline Walls of Text

- General behavior and collaboration expectations: `guidelines/general_guidelines.md`
- Repo-specific operational norms: `guidelines/operational_guidelines.md`
- Alias commands and mode markers: `shorthands/README.md`
- Specialist capabilities: agent profile files
- Extended directives (load as needed): `directives/XXX_name.md` via `load_directives.sh`

## High-Stakes Toggle

If the task is high-risk, append the full governance pack: general + operational guidelines, the relevant specialist profile, and any required directives (risk, escalation, mode protocol).

## Model Discipline (Directive 042)

- Match task to arena (text/code/vision/search) and cost tier (economy/mid/premium).
- Delegate routine tasks (file creation, search, git ops, templates) to cheaper/faster subagents — these are mid-tier, not premium.
- Reserve the premium thread for complex reasoning, architecture, debugging, and user iteration.
- When coordinating tasks, set `preferred_execution_model_tier` in context.
- Consult `doctrine/toolguides/agentic_model_leaderboard.yaml` for model rankings.
- Self-check: "Which arena? Which tier? Does this need my full reasoning depth?"

## Token Discipline

- Prefer links and section references over inlining entire guidelines in the prompt.
- Drop non-essential sections when the task scope is narrow.
- Keep transient reasoning in `${WORKSPACE_ROOT}/notes` instead of the prompt transcript.

## Scripted Context Assembly

- Use `ops/scripts/assemble-agent-context.sh --agent backend-dev --mode minimal` to emit the above bundle plus the specialist profile.
- Add `--directives 001 006` (or similar codes) to pull in specific directives without copy/paste.
- For high-stakes mode: `--mode full` auto-includes general + operational guidelines alongside the runtime sheet.
