# DDR-012: Human-in-Charge Escalation Protocol Adoption

**Status:** Accepted
**Date:** 2026-02-23
**Author:** Curator Claire
**Supersedes:** N/A
**Related:** DDR-004 (File-Based Asynchronous Coordination Protocol), DDR-007 (Coordinator Agent Orchestration Pattern)

---

## Context

The upstream doctrine framework (`sddevelopment-be/quickstart_agent-augmented-development`) introduced **Directive 040: Human-in-Charge Escalation Protocol** along with supporting coordination templates, agent profile updates, and shorthand revisions. This decision records the evaluation and selective adoption of these artifacts into the Regnology fork.

**Problem Observed:**

- Agents lacked a structured, asynchronous mechanism for escalating decisions, blockers, and problems to the human-in-charge (HiC).
- AFK-mode pauses relied on informal checkpoint files without consistent structure or routing.
- Manager Mike had no formal monitoring cadence for human-required items.
- Multi-agent initiatives produced no consolidated executive summaries for human review.

**Upstream Artifacts Evaluated:**

| Artifact | Lines | Decision |
|----------|-------|----------|
| `directives/040_human_in_charge_escalation_protocol.md` | 925 | **Accepted** |
| `templates/coordination/README.md` | 302 | **Accepted** |
| `templates/coordination/hic-blocker.md` | 177 | **Accepted** |
| `templates/coordination/hic-decision-request.md` | 179 | **Accepted** |
| `templates/coordination/hic-executive-summary.md` | 162 | **Accepted** |
| `templates/coordination/hic-problem.md` | 259 | **Accepted** |

## Decision

Accept the complete HiC escalation system from upstream, including Directive 040, all five coordination templates, and the related modifications to:

- **Manager Mike** (`agents/manager.agent.md`): Added Directive 040 reference, HiC output artifacts, monitoring cadence (section 4.5), blocker/decision resolution notification protocols, and anti-patterns.
- **Directive 019** (`directives/019_file_based_collaboration.md`): Added agent-to-human escalation path alongside existing agent-to-agent coordination.
- **AFK-Mode** (`shorthands/afk-mode.md`): Updated pause behavior to route escalations to `work/human-in-charge/` subdirectories with structured templates.

Branding changes (`Regnology` → `SDD`) included in these upstream diffs were **rejected** per separate decision (B1). Only functional/behavioral changes were applied.

## Rationale

1. **Fills a real gap:** The Regnology fork already uses file-based orchestration (DDR-004) but had no structured human escalation path. This closes that loop.
2. **Consistent with existing patterns:** The `work/human-in-charge/` directory structure follows the same file-based paradigm established in `work/collaboration/`.
3. **Enables AFK autonomy:** Structured escalation makes AFK-mode more viable — agents can work longer before requiring synchronous human input.
4. **Low adoption risk:** The protocol is additive. It introduces new files and directory conventions without modifying existing core guidelines.

## Consequences

- A `work/human-in-charge/` directory structure must be created in consuming repositories when adopting this protocol.
- Manager Mike's coordination sessions now include HiC monitoring as a mandatory step.
- Agents using AFK-mode will route pause events to structured HiC files instead of ad-hoc checkpoint logs.
- Template files in `doctrine/templates/coordination/` become the canonical source for escalation formats.

## Alternatives Considered

- **Reject entirely:** Would leave the existing ad-hoc escalation behavior in place. Rejected because the upstream protocol is well-structured and addresses real coordination gaps.
- **Partial adoption (directive only, no templates):** Would provide guidance without structure. Rejected because templates are the practical value — they ensure consistency across agents.
- **Custom Regnology protocol:** Would allow full customization but diverge from upstream unnecessarily. Rejected because the upstream protocol already matches Regnology's needs.
