# Developer Guide - Vestigium

Vestigium is a personal repository for links, featuring web crawling, automated enrichment via LLM (Gemini), and a rich Angular frontend.

## Prerequisites

- **Java 21** (Required for the Spring Boot backend)
- **Node.js 20+** (Required for the Angular frontend)
- **Playwright browsers** (Required for the web crawler)

## Project Structure

- `/src`: Spring Boot backend (Java 21, Gradle)
- `/frontend`: Angular 20 frontend
- `/frontend/api`: Generated API client (do not edit manually)

---

## Backend (Spring Boot)

### Running the Backend
From the root directory:
```bash
./gradlew bootRun
```
The API will be available at `http://localhost:8008`.
- Swagger UI: `http://localhost:8008/swagger-ui/index.html`
- OpenAPI Spec: `http://localhost:8008/v3/api-docs`

### Building the Backend
```bash
./gradlew build
```

### Testing
It is critical to run tests to ensure backend stability.
```bash
./gradlew test
```
- Tests cover services, utilities, and API controllers.
- Always run tests before pushing changes.

---

## Frontend (Angular)

### Setup
```bash
cd frontend
npm install
```

### Running the Frontend
```bash
cd frontend
npm start
```
The app will be available at `http://localhost:3003`. It uses a proxy configuration to forward `/api` requests to the backend.

### Building the Frontend
```bash
cd frontend
npm run build
```

### Testing the Frontend
Run unit tests (Jest):
```bash
cd frontend
npm test
```
- Tests cover Stores, Components, and Services.
- Run these to ensure UI logic and state management are correct.

---

## API Client Generation

The frontend uses `ng-openapi-gen` to generate a typed API client from the backend's OpenAPI specification.

### To (Re)generate the API:
1. **Start the backend** first (it must be running to serve the spec).
2. Run the generation script:
```bash
cd frontend
npm run generate-api
```
3. This will update the files in `frontend/api`.

### Development Workflow for API Changes:
1. **Backend**: Modify DTOs in `com.vestigium.api.dto`.
   - Use `jakarta.validation.constraints.NotNull` to mark required fields (helps documentation, though TypeScript generation may still treat them as optional).
2. **Backend**: Restart the server (`./gradlew bootRun`).
3. **Frontend**: Run `npm run generate-api`.
4. **Frontend**: The generated models in `frontend/api/models` will be updated.
   - **Important**: Fields are often generated as optional (`string | undefined`). Use non-null assertions (`!`) in the frontend code when you are certain the field is present.
   - We re-export all models in `frontend/src/app/models/index.ts` for clean imports.

---

## Web Crawler & Playwright

The app uses Playwright for screenshots and metadata extraction.
To install browsers:
```bash
npx playwright install chromium
```

---

## Real-time Updates (WebSockets)

The application uses STOMP over WebSockets for real-time job updates.
- **Backend**: Configured in `WebSocketConfig.java`. Pushes to `/topic/jobs`.
- **Frontend**: Managed by `WebSocketService` and consumed by `JobsStore`.

This replaces manual polling for background jobs (enrichment, thumbnails).

---

## YouTube Integration

A dedicated utility `extractYouTubeId` in `frontend/src/app/utils/youtube.ts` handles ID extraction from various YouTube URL formats (standard, shortened, shorts, embed).
Unit tests in `youtube.spec.ts` ensure all formats are supported.

---

## Frontend Architecture

### State Management (Store Pattern)
We use a custom **Store pattern** built on Angular Signals. 
- **Centralized State**: Each store holds a private `state` signal containing the entire store's state.
- **Atomic Updates**: Use a `patchState(patch: Partial<State>)` method to update the state.
- **Selectors**: Use `computed` signals to expose specific parts of the state.
- **Triggering Effects**: Use `toObservable(computedFilterState)` to trigger side-effects (like API reloads). 
  - **CRITICAL**: The `filterState` computed must only depend on the fields that *should* trigger a reload. Do not access result fields like `loading` or `items` inside it, as this will cause an infinite loop.

### Component Architecture
- **Smart Components (Pages)**: Located in `src/app/pages`. They inject stores and services, handle business logic, and orchestrate the flow.
- **Dumb Components (Presentation)**: Located in `src/app/components`. They receive data via `input()` signals and notify parents via `output()`. They **must not** inject stores or services directly.
- **Change Detection**: All components should use `ChangeDetectionStrategy.OnPush`.

---

## Future Roadmap

For a list of planned features and cool improvements, see [docs/ROADMAP.md](ROADMAP.md).
