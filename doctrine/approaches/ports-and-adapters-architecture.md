# Approach: Ports and Adapters Architecture

**Purpose:** Provide a mental model for structuring applications so business logic remains independent of infrastructure, enabling testability, flexibility, and longevity.

**Audience:** Agents, architects, backend developers

**Status:** Active

**Last updated:** 2026-03-17

---

## Overview

Ports and Adapters (also known as Hexagonal Architecture, Clean Architecture, or Onion Architecture) inverts the dependency direction found in traditional layered designs. **Business logic sits at the center** and defines interfaces (ports) for all external concerns. Infrastructure implements these interfaces (adapters) and depends inward toward the core. The core never imports frameworks, databases, or delivery mechanisms.

**Key insight:** Infrastructure depends on business logic, never the reverse. The core defines *what* it needs via ports; adapters provide *how* those needs are satisfied.

**Aliases:** Hexagonal Architecture (Cockburn), Clean Architecture (Martin), Onion Architecture (Palermo). Same essential pattern with different visual metaphors and naming conventions.

---

## Prerequisite: Three-Layer Architecture

Three-layer architecture (Presentation → Business Logic → Data) is the simpler predecessor. Presentation handles user interaction, business logic contains domain rules, and the data layer manages persistence. Dependencies flow top-down. This pattern works well for straightforward CRUD applications.

**Evolution path:** Three-Layer → Ports & Adapters. The shift occurs when you invert dependencies so that business logic no longer imports database or framework libraries. Instead, the core defines interfaces; outer layers implement them.

**Common failure modes of three-layer:**
- **Anemic domain model** — business logic migrates to service classes; entities become data bags
- **Layer bypass** — presentation or business logic reaches past layers to access data directly
- **DTO explosion** — mapping layers multiply as each integration needs its own DTOs; no clear abstraction boundary

---

## Structural Model

```
┌─────────────────────────────────────┐
│  Infrastructure Layer               │  ← Adapters (Web, DB, etc.)
│  ┌───────────────────────────────┐  │
│  │  Application Layer            │  │  ← Use Cases / Application Services
│  │  ┌─────────────────────────┐  │  │
│  │  │  Domain Layer           │  │  │  ← Entities, Value Objects, Rules
│  │  │                         │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘

Dependencies point INWARD only.
```

**Traditional flow:** `UI → Business Logic → Database` (business logic imports DB libraries)

**Ports & Adapters flow:** `UI → Input Port ← Business Logic → Output Port ← Database Adapter` (business logic defines ports; adapters implement them)

---

## Key Identifying Features

- **Framework-free core:** Business rules have no import statements referencing frameworks or databases
- **Port polymorphism:** Multiple adapter implementations can satisfy the same port (e.g., in-memory vs. PostgreSQL for tests vs. production)
- **Context independence:** Application can run in different contexts (CLI, REST, batch) without changing core logic
- **Swapable infrastructure:** Technology migrations (database, messaging, APIs) occur by replacing adapters without touching business code

---

## When to Use

- Complex business domains (finance, healthcare, logistics)
- Long-lived applications (10+ year lifespan)
- Multiple integration points (REST + batch + message consumers)
- Teams with strong DDD/OOP skills
- Technology migrations are frequent or anticipated

---

## When It's Overkill

- Simple CRUD applications with minimal business logic
- Prototypes or throwaway code
- Teams unfamiliar with layered architectures
- Single-developer, short-lifespan applications

---

## Common Variations

- **Clean Architecture (Uncle Bob)** — Concentric circles, strict dependency rule, Entities → Use Cases → Interface Adapters → Frameworks
- **Onion Architecture (Palermo)** — Layered rings, .NET focus, similar dependency flow
- **Functional Core, Imperative Shell** — Pure functions in core; IO and side effects at edges; functional language idiom
- **Screaming Architecture** — Top-level directories named after business concepts rather than technical layers; complements ports-and-adapters structure

---

## Testing Strategy

| Layer | Test Type | Doubles | Speed |
|-------|-----------|---------|-------|
| Domain | Pure unit tests | None | Fast |
| Use cases | Unit / integration | In-memory repositories, test doubles for ports | Fast |
| Adapters | Integration tests | Real infrastructure (DB, HTTP) | Slower |
| Full stack | End-to-end | None | Slowest |

Domain tests exercise entities and value objects in isolation. Use case tests rely on in-memory or fake implementations of ports. Adapter tests hit real databases or services. End-to-end tests verify the full application with all adapters wired.

---

## Common Pitfalls

1. **Anemic Domain Models** — Push logic into domain objects; avoid service layers that reduce entities to data holders
2. **Port Explosion** — Group related operations into cohesive ports; avoid one port per method
3. **Leaky Abstractions** — Separate domain entities from persistence DTOs; do not expose ORM annotations or DB schema in core
4. **Adapter Duplication** — Extract shared mapping logic into translators; avoid copy-paste across adapters

---

## Ecosystem Compatibility

**Fits naturally:** Spring Boot (interfaces + `@Profile`), ASP.NET Core (DI + abstractions), Go (interfaces), Rust (traits). These ecosystems encourage interface-based design and dependency injection.

**Requires adaptation:** Rails, Django, and other framework-centric stacks where models and controllers are tightly coupled. Achievable via service objects and repository patterns, but the framework does not natively encourage the separation.

---

## Evolution Paths

```
Big Ball of Mud → Three-Layer → Ports & Adapters → DDD
                                                  → CQRS
                                                  → Event Sourcing
                                                  → Microservices
```

Ports and Adapters is a foundation for DDD tactical patterns, CQRS, event sourcing, and eventual microservice decomposition. Adopters often introduce these patterns incrementally on top of a hexagonal structure.

---

## Integration with Doctrine Stack

**Related Approaches:**
- [Bounded Context Linguistic Discovery](bounded-context-linguistic-discovery.md) — Context boundaries inform port boundaries
- [Language-First Architecture](language-first-architecture.md) — Ubiquitous language in domain layer
- [Locality of Change](locality-of-change.md) — Avoid over-engineering; apply when complexity justifies it

**Related Directives:**
- [Directive 018: Traceable Decisions](../directives/018_traceable_decisions.md) — Document architectural choices in ADRs
- [Directive 037: Context-Aware Design](../directives/037_context_aware_design.md) — Bounded context and system landscape

---

## References

- Hexagonal Architecture — Alistair Cockburn (2005)
- Clean Architecture — Robert C. Martin
- Onion Architecture — Jeffrey Palermo
- Growing Object-Oriented Software, Guided by Tests — Freeman & Pryce
- Domain-Driven Design — Eric Evans

---

## Version History

- **1.0.0** (2026-03-17): Initial version. Adapted from upstream ports-and-adapters primer for agent consumption. Author: Stijn Dejongh.
