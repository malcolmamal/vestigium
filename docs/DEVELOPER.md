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

## Development Rules & Conventions

- **Models**: Always use models from the generated API. Import them from `../../models` (which maps to `frontend/src/app/models/index.ts`).
- **Styling**: Use the existing design system (translucent cards, blur effects, CSS variables).
- **State Management**: Use Angular Signals and the custom Store pattern (e.g., `EntriesStore`).
- **Polling**: Keep polling intervals at **1.5 seconds** (1500ms) for consistency.
