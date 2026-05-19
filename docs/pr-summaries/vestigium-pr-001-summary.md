# PR: pull/1 refactoring

## Summary

This pull request introduces the doctrine framework into the repository, establishes a robust quality pipeline via SonarQube, and comprehensively resolves all existing reliability, maintainability, and security hotspots across both the Spring Boot backend and Angular frontend.

---

## Features

- **CI/CD Stabilization:** Consolidated Node.js CI test versions dropping redundant matrices targeting strict standard `20.x`. Configured Gradle and Node.js workflows to publish JUnit XML results and upload respective Jacoco / LCOV code coverage artifacts for direct PR access.
- **Agentic Framework Integration:** Bootstrapped the project with the Regnology doctrine stack, including `.cursor` rules, `AGENTS.md` protocols, and OpenCode configurations to ensure agentic uniformity moving forward.
- **Quality Pipeline:** Introduced comprehensive `quality-check.bat` and `quality-check.sh` scripts mirroring standard operations (Build, Test, Lint, SonarQube Analysis).
- **Security Hardening:** Secured the WebSocket configuration by restricting allowed origins strictly to local frontend endpoints and bound the backend server directly to `127.0.0.1`.

---

## Notable fixes

### Security & Vulnerability Resolutions
- **ReDoS Prevention:** Replaced dangerously greedy regex patterns (`\{[\s\S]*\}`) in `EnrichmentParser.java` and `LlmRecommendationParser.java` with safe substring extractions utilizing `indexOf` / `lastIndexOf`.
- **CORS & Binding:** Removed wildcard cross-origin mappings in `WebSocketConfig.java` and updated `application.yml` to close open access.

### Code Quality & Maintainability
- **Brain Methods Dismantled:** Refactored overly complex methods (`S6541`) inside `EnrichEntryJobProcessor.java` and `EntryService.java` by extracting smaller, focused private methods (e.g., `processAttachments`, `fetchSiteSpecificMetadata`, `deduplicateImportItems`).
- **Web Accessibility:** Injected `tabindex="0"` and `(keydown.enter)` listeners alongside existing `(click)` directives across `entry-card`, `entry-details`, `entries-shorts`, and `toasts` to comply with Web accessibility standards.
- **TypeScript Modernization:** Replaced deprecated synchronous `FileReader` instances in `import-export.page.ts` with modern async `Blob.text()`. Removed unsafe index boundary computations (`length - 2`) utilizing `.at(-2)` in `entries-compact`.
- **Java Exception Handling:** Corrected swallowed `InterruptedException` flows inside `YouTubeMetadataFetcher` and `ImdbMetadataFetcher` by properly invoking `Thread.currentThread().interrupt()`.
- **Memory References:** Refactored `InlineImage` record within `GeminiClient` to correctly override `equals` and `hashCode`, protecting `byte[]` arrays against invalid reference comparisons.

---

## Refactoring

- Extracted nested try-catch blocks within `PageScreenshotter.java` breaking recursive structures preventing proper memory tracking.
- Repositioned static form labels spanning `<app-tag-chips-input>` components to neutral `<div>` blocks mitigating invalid DOM structural errors.
- Cleaned up duplicate selector scopes within `entry-details.page.scss` by appropriately nesting `.pill` definitions.
- Purged useless variable assignments and dummy test variables across various services and controllers minimizing Sonar clutter.

---

## Tests

| Area | New specs |
|------|-----------|
| `EntryRepositoryTest` | Refactored mock assignments minimizing `S1854` warnings. |
| `frontend/jest.config.js` | Activated native coverage tracking, mapping explicit bounds to correctly generate the `lcov.info` file utilized within the SonarQube quality pipeline. |

---

## Env changes (`src/env.ts` / `.env`)

- **`.sonar.env`**: Added locally to store `SONAR_TOKEN` (ignored via `.gitignore`).

---

## Docs added / updated

- **`.doctrine-config/specific_guidelines.md`**: Added local instruction schemas dictating development patterns, toolchains, and file conventions specifically mapped for `vestigium`.
- **`.gitignore`**: Added `.scannerwork/` and `.sonar.env`.
- **`opencode.json`**: Implemented configuration binding the `AGENTS.md` instructions dynamically upon repository load.

---

## Checklist

- [x] `./gradlew build test` - passes
- [x] `npm run test` (Frontend) - passes
- [x] `npm run lint` (Frontend) - passes
- [x] `.\quality-check.bat` (SonarQube) - passes (0 bugs, 0 vulnerabilities, 0 code smells remaining)
