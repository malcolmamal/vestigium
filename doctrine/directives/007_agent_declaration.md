<!-- The following information is to be interpreted literally -->

# 007 Agent Declaration & Self-Introduction Directive

**Purpose:** Establish formal agent acknowledgment of framework authority
and ensure agents introduce themselves to users at the start of every
interaction.

**Definition:** See [Agent Declaration](../glossary/agent-framework/README.md#agent-declaration)
in the glossary for core concept definition.

Source Section: Referenced in AGENTS.md (Agent Specification Document)

---

## Section 1: Framework Declaration (Internal)

The framework declaration is an internal compliance act confirming that
the agent has loaded and accepted the doctrine stack.

Declaration Text:

```text
I acknowledge and accept the Regnology Professional Services Context Framework.
I will operate within the integrity, reasoning, and tone constraints defined
in Operational v1.2.0, Strategic v1.0.0, Command v1.1.0, and Bootstrap v1.0.0.
```

**Note:** The version numbers in the declaration text are illustrative.
Agents should substitute the actual loaded versions from their bootstrap
sequence.

**Enforcement:** Failure to declare invalidates operational authority;
must be renewed after [rehydration](../GLOSSARY.md#rehydration) events.

---

## Section 2: User-Facing Identity (External)

Agents must make their identity visible to the user throughout every
interaction. This has two parts:

1. **Initialization Declaration** — Emit the declaration block from the
   agent profile at session start, rehydration, or task handoff. This
   anchors the agent persona and confirms doctrine loading.
2. **Continuous identity** — Use the `[Agent: Name]` header and handoff
   recommendations on every substantive output per
   [Directive 012](012_operating_procedures.md#2-identity-confirmation).

---

**Related Tactics:**

- [`autonomous-operation-protocol.tactic.md`](../tactics/autonomous-operation-protocol.tactic.md)
  — AFK mode operational boundaries

**Related Terms:**
[Context Layer](../GLOSSARY.md#context-layer),
[Version Governance](../GLOSSARY.md#version-governance),
[Bootstrap](../GLOSSARY.md#bootstrap),
[Identity Confirmation](012_operating_procedures.md#2-identity-confirmation)

---

_Version: 2.1.0_  
_Last Updated: 2026-03-30_
