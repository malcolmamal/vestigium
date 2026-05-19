# SQLX MCP and Manual Reference (Toolguide)

**Purpose:** Single reference for SQLX-domain agents for MCP usage, SQLX manual access, and Abacus CLI integration. Agents should consult this toolguide before any SQLX task.

**Version:** 1.1.0  
**Last Updated:** 2026-03-17  
**Status:** Active

---

## Reference Access Hierarchy

SQLX agents have two ways to access the language specification and data model. **Always prefer MCP; fall back to local doctrine only when MCP is unavailable.**

```
┌──────────────────────────────────────────────────────────┐
│  1. PREFERRED — MCP tools (live, authoritative)          │
│     query_datamodel_definitions, get_sqlx_manual_chapter │
├──────────────────────────────────────────────────────────┤
│  2. FAILOVER — Local doctrine reference                  │
│     toolguides/sqlx_language/  (offline language ref)    │
│     approaches/sqlx-coding-standards.md  (conventions)   │
│     tactics/sqlx/sqlx-validation.tactic.md (rule catalog) │
└──────────────────────────────────────────────────────────┘
```

**Why MCP first:**
- The MCP server provides the canonical, up-to-date SQLX language specification (31 chapters) and live data model with entities, fields, domains, and domain values.
- Local doctrine sources are compiled summaries that cover the most commonly used constructs but may lag behind spec changes or omit advanced topics.

**When to use failover:**
- MCP server is not running or not configured in `.cursor/mcp.json`.
- Network/connectivity issues prevent MCP access.
- Quick reference lookup for well-known patterns already codified in doctrine.

---

## MCP Tools

| MCP Tool | Use Case | Tactics Using It |
|----------|----------|------------------|
| `query_datamodel_definitions` | Resolve entities, fields, domains, domain values (ABACUS360 data model). Query patterns: entities by caption, fields by entity, domain values by field. | pseudo-code-to-spec, generation, validation, testing, explanation |
| `get_sqlx_manual_chapter` | Retrieve authoritative SQLX language specification by chapter number (0–30). Request specific chapters, not the full manual. | All SQLX tactics when syntax/semantics are needed |

### MCP Availability Check

Before starting SQLX work, verify MCP is reachable:

1. Check `.cursor/mcp.json` for `data-model-definitions` server configuration.
2. If configured, attempt a lightweight query (e.g., resolve a known entity).
3. If unavailable, note "MCP unavailable — using local doctrine failover" in the work log and proceed with local references.

### Common MCP Query Patterns

**Resolve entity by name:**
```
query_datamodel_definitions: entities WHERE caption LIKE '%position%'
```

**Resolve fields for an entity:**
```
query_datamodel_definitions: fields WHERE entity_id = '<id>'
```

**Resolve domain values:**
```
query_datamodel_definitions: domain_values WHERE domain_id = '<id>'
```

---

## SQLX Manual Chapter Mapping

Request chapters from MCP by number. Avoid loading the full manual — request only the chapters relevant to the current task.

| Chapter | Topic | Use When | Local Failover |
|---------|-------|----------|----------------|
| 0–2 | Language overview | High-level interpretation, explanation | [sqlx-coding-standards §1–2](../approaches/sqlx-coding-standards.md) |
| 3 | Functional Units | Unit syntax, CF/BL/DD structure | [sqlx-coding-standards §1, §3](../approaches/sqlx-coding-standards.md) |
| 4 | Decision Tables | Tabular logic, .dec format | [sqlx-coding-standards §5](../approaches/sqlx-coding-standards.md) |
| 5 | Components | Import/export, component manifest | [sqlx-coding-standards §3](../approaches/sqlx-coding-standards.md) |
| 6 | Expressions | CASE, coalesce, cast, operators | [sqlx-coding-standards §4](../approaches/sqlx-coding-standards.md) (partial) |
| 7 | Datasets | Dataset definition, types, domains | [sqlx-coding-standards §3](../approaches/sqlx-coding-standards.md) |
| 8–13 | Advanced constructs | Checkpoints, persistence, extensibility | _No local failover — MCP required_ |
| 14 | Testing Functional Units | .tab format, test structure, CLI | [sqlx-testing tactic](../tactics/sqlx/sqlx-testing.tactic.md) |
| 15 | Test Data via Excel | Test data conventions | [sqlx-test-data-conventions](../styleguides/sqlx-test-data-conventions.md) |
| 16–17 | Advanced testing | Complex test scenarios | _No local failover — MCP required_ |
| 18 | Test Server | Automated test execution | [sqlx-testing tactic Step 8](../tactics/sqlx/sqlx-testing.tactic.md) |
| 19–30 | Extended topics | Advanced SQLX features | _No local failover — MCP required_ |

**Full local language reference:** [toolguides/sqlx_language/](./sqlx_language/) — syntax patterns, key rules, and doctrine cross-references.

---

## Model Tier (Directive 042)

SQLX routine work (generate, validate, test, explain, pseudo-code-to-spec) is **mid** tier. Use **premium** only for ambiguous spec decisions, cross-FU architecture, or security-sensitive validation. Consult `doctrine/toolguides/agentic_model_leaderboard.yaml` for model selection.

---

## Abacus CLI (Validation, Test, Run)

The **Abacus CLI** (`abacus`) is the official tool to validate SQLX, run unit tests, and execute components.

### Setup

- Resolve CLI path from `.doctrine-config/config.yaml` → `sqlx.abacus_cli_path` first; fall back to `abacus` on PATH.
- **Java Compatibility:** Java 8–15 is standard. For Java 23+, add `-Djava.security.manager=allow`.
- **Memory:** Use `-Xms512m -Xmx4G` to avoid startup failures on constrained systems.
- **Environment:** Windows requires `winutils.exe` and `HADOOP_HOME` set; ensure `%HADOOP_HOME%\bin` is on PATH.
- **Execution:** Run from **content root** or use `-d <baseDir>`.

### Content Root

Read `.doctrine-config/config.yaml` → `sqlx.content_root` (default `.`); use for all `abacus -d <contentRoot>` invocations.

### Commands

| Command | Usage | Reference |
|---------|-------|-----------|
| `validate` | `abacus -d <contentRoot> validate [path]` — run after generation; feeds into sqlx-validation tactic (Step 3a) | [sqlx-validation tactic](../tactics/sqlx/sqlx-validation.tactic.md) |
| `test` | `abacus -d <contentRoot> test <unit-test-name>` — unit-test name = test file without `.tab`. Use `-l` to list, `-r` for coverage | [sqlx-testing tactic Step 8](../tactics/sqlx/sqlx-testing.tactic.md) |
| `run` | `abacus run [component] [functional-unit]` — requires `settings.json` and parquet input at `sqlx.baseUrl` | — |
| `info` | `abacus info` — list components and content objects | [sqlx-optimization-experiment](../tactics/sqlx/sqlx-optimization-experiment.tactic.md) |
| `dag-dump` | `abacus dag-dump -c [COMPONENT_DIR] -o [OUTPUT_DIR]` — execution graph for optimization | [sqlx-optimization-experiment](../tactics/sqlx/sqlx-optimization-experiment.tactic.md) |
| `analyse` | `abacus analyse -f -o [OUTPUT_DIR]` — provides/uses reports, problem detection | [sqlx-optimization-experiment](../tactics/sqlx/sqlx-optimization-experiment.tactic.md) |
| `format` | `abacus format [path]` — normalize SQLX formatting | — |
| `language-server` | `abacus language-server` — LSP over stdio; can be bridged to MCP for diagnostics | — |

### Troubleshooting

| Error / Symptom | Likely Cause | Fix |
|:---|:---|:---|
| `DOS error/errno=1455` | JVM initial heap too large | Reduce `-Xms` to `512m` or `1G` |
| `UnsatisfiedLinkError` (Hadoop) | `winutils.exe` missing / not on PATH | Install winutils, set `HADOOP_HOME` |
| `UnsupportedOperationException` (getSubject) | Java 23+ security manager | Add `-Djava.security.manager=allow` |
| `Subcomponents not supported` | Component nesting | Flatten model; single root component |
| `Invalid expression '*'` | Wildcard in `.dec` rule | Use a rule with no input condition instead |

**Extended reference:** `docs/AGENT_STACK_SQLX_CLI_INTEGRATION.md`, `docs/ABACUS_CLI_SQLX_INTEGRATION_SCAN.md` (when present in consuming repository).

---

## Context Sources (Doctrine-Referenced)

| Source | Path | Content |
|--------|------|---------|
| SQLX language reference (local) | [toolguides/sqlx_language/](./sqlx_language/) | Offline syntax reference, key rules, doctrine cross-references |
| SQLX coding standards | [approaches/sqlx-coding-standards.md](../approaches/sqlx-coding-standards.md) | File naming, FU structure, SQL patterns, decision tables, anti-patterns |
| SQLX test data conventions | [styleguides/sqlx-test-data-conventions.md](../styleguides/sqlx-test-data-conventions.md) | Test data XML organization, entity definitions, ID conventions |
| SQLX spec-driven authoring | [approaches/sqlx-spec-driven-authoring.md](../approaches/sqlx-spec-driven-authoring.md) | Workflow routing: which tactic for which task |
| Reference implementations | `SQLX-Samples/` in consuming repository (when present) | Example FU implementations |
