# Vestigium

Vestigium is a **repository of links** (URLs) with **tags**, **attachments**, and **LLM-powered enrichment** (Gemini) to auto-generate descriptions/tags and thumbnails.

## Features (v1)
- Create entries with mandatory **URL**, optional title/description/tags, optional attachments (PDF/images)
- List + search by title/description and filter by tags / important / visited
- Edit entries, mark visited/important
- Enqueue background jobs:
  - Enrich description/tags via Gemini (`gemini-2.5-flash` by default)
  - Regenerate thumbnail (og:image → YouTube → screenshot)
- SQLite database + local filesystem storage (`./data/**`)

## Ports
- **Backend**: `http://localhost:8008`
- **Frontend**: `http://localhost:3003`

## Backend (Java, Spring Boot)

### Requirements
- Java **21**

### Run
From repo root:

```bash
.\gradlew.bat bootRun
```

### Health + Swagger/OpenAPI
- Health: `GET /api/health`
- Swagger UI: `/swagger-ui`
- OpenAPI JSON: `/v3/api-docs`

### Configuration
Defaults are in [`src/main/resources/application.yml`](src/main/resources/application.yml).

- **SQLite DB**: `./data/vestigium.db`
- **Files**:
  - attachments: `./data/files/`
  - thumbnails: `./data/thumbnails/`

### Gemini API key
Provide the key via:
- `GOOGLE_API_KEY` environment variable (preferred), or
- the repo file [`google-api-key`](google-api-key) (dev fallback)

### Screenshot thumbnails (Playwright)
Thumbnail fallback uses **Playwright (Chromium)**. The first run may download browser binaries automatically; if it fails, rerun after ensuring outbound network access.

## Frontend (Angular)

### Requirements
- Node **20+**
- npm **10+**

### Install
```bash
cd frontend
npm install
```

### Run
```bash
cd frontend
npm start
```

Frontend runs on **3003** and proxies `/api` to the backend (`http://localhost:8008`) via [`frontend/proxy.conf.json`](frontend/proxy.conf.json).

### Generate OpenAPI client (ng-openapi-gen)
Start the backend first, then:

```bash
cd frontend
npm run api:generate
```

This downloads the OpenAPI spec from `http://localhost:8008/v3/api-docs` and generates a client into `frontend/src/app/api/`.

## Background jobs
Jobs are stored durably in SQLite (`jobs` table) and processed one-at-a-time by the backend scheduler.

## Roadmap (next)
- SQLite FTS5 full-text search
- Better screenshot robustness + caching
- Job dashboard + metrics
- Import/export + browser extension


