# Vestigium - Local Doctrine Overrides

_Version: 1.0.0_  
_Last updated: 2026-05-17_

---

## Purpose

This directory (`vestigium`) contains a Spring Boot backend and an Angular frontend project.
These local guidelines ensure agents operate within the established architectural constraints, framework conventions, and tooling choices of the Vestigium repository.

## Primary Audience

- **Persona:** [Fox Nemhauser - Senior / Lead Developer](../docs/audience/persona_fox_nemhauser.md) (`fox-ks-001`)

## Communication & Anti-Patterns
- **Format:** Direct, peer-level communication. Use bullet points and checklists.
- **Tone:** Confident, no apologies, no filler.
- **Anti-Patterns:** Do not use apologetic filler, over-explain obvious concepts, repeat user instructions, or use unnecessary emojis.

## Tech Stack & Tooling

### Backend
- **Language/Framework:** Java 21, Spring Boot
- **Database:** SQLite with Flyway migrations
- **Build Tool:** Gradle (`./gradlew`)
- **Key Constraints:** 
  - Use **Java Records** for DTOs and Domain models.
  - Annotate DTO fields with `@NotNull` for documentation.
  - Database changes must be via Flyway migrations (`src/main/resources/db/migration`).
  - **Testing:** Always run `./gradlew build` and `./gradlew test` to ensure no regressions.
  - Do NOT run `./gradlew bootRun` directly during normal workflow unless requested; rely on build/test commands.

### Frontend
- **Language/Framework:** TypeScript, Angular 20
- **Package Manager:** npm
- **State Management:** Angular Signals using the Store pattern (injectable services with signals).
- **Styling:** SCSS, following a dark-mode, translucent aesthetic.
- **Key Constraints:**
  - **Smart vs. Dumb Components:** `src/app/pages` handles logic/stores, `src/app/components` uses `input()`/`output()` and `ChangeDetectionStrategy.OnPush`.
  - **API Client:** `frontend/api/` is generated. **NEVER edit files in this folder manually.**
  - **Re-exports:** Use `frontend/src/app/models/index.ts`.
  - **API Generation:** If backend DTOs change, run the backend, then `cd frontend && npm run generate-api`. Use non-null assertions (`!`) for fields in the frontend that are functionally required but typed as optional.
  - **Testing:** Run `cd frontend && npm test`.

### Web Crawler
- Uses **Playwright (Chromium)** for screenshot and metadata extraction.

## Workflow Integration

- Use the existing tests to verify your changes. If you implement a new feature, add corresponding tests for the frontend (Jest) or backend (JUnit).
- Do not bypass the `quality-check.sh` / `quality-check.bat` scripts if they are part of the process.

## Local Doctrine Customization

- **Templates:** Use the doctrine templates for creating architectural decision records (ADRs) and documentation.
- **Traceability:** Maintain traceability according to doctrine practices, linking tests to features.
