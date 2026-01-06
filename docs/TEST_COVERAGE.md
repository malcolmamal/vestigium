# Test Coverage Report

## Frontend Coverage

**Overall:**
- Statements: 56.13%
- Branches: 32.24%
- Functions: 29.16%
- Lines: 54.3%

### Currently Tested
✅ **Stores** (Good coverage)
- `entries.store.spec.ts` - EntriesStore (6 tests)
- `jobs.store.spec.ts` - JobsStore (3 tests)

✅ **Components** (Partial coverage)
- `entry-card.component.spec.ts` - EntryCardComponent (8 tests)

✅ **Services** (Good coverage)
- `vestigium-api.service.spec.ts` - VestigiumApiService

✅ **Utils** (Good coverage)
- `youtube.spec.ts` - YouTube ID extraction

✅ **App** (Basic)
- `app.spec.ts` - Basic app creation test

### Missing Coverage (Critical)

❌ **Pages** (No tests)
- `entries.page.ts` - Main entries list page
- `entry-details.page.ts` - Entry detail/edit page
- `create-entry.page.ts` - Entry creation form
- `bulk-add.page.ts` - Bulk entry creation
- `recommended.page.ts` - Recommendations page
- `tags.page.ts` - Tags management
- `lists.page.ts` - Lists management
- `queue.page.ts` - Job queue
- `failed-jobs.page.ts` - Failed jobs view
- `settings.page.ts` - Settings page
- `import-export.page.ts` - Import/export functionality

❌ **Components** (No tests)
- `tag-chips-input.component.ts` - Tag input component
- `toasts.component.ts` - Toast notifications
- `video-modal.component.ts` - Video modal

❌ **Services** (No tests)
- `websocket.service.ts` - WebSocket connection management
- `toast.service.ts` - Toast notification service

❌ **Stores** (No tests)
- `settings.store.ts` - Settings state management
- `lists.store.ts` - Lists state management

---

## Backend Coverage

**Overall:**
- Instructions: 25%
- Branches: 14%
- Lines: ~25%

### Currently Tested
✅ **Persistence** (Good coverage - 56%)
- `EntryRepositoryTest.java` - Entry CRUD and search (5 tests)
- `JobRepositoryTest.java` - Job management (7 tests)
- `TagRepositoryTest.java` - Tag operations (3 tests)

✅ **Services** (Partial coverage - 42%)
- `EntryServiceTest.java` - Entry service logic (6 tests)
- `TagNormalizerTest.java` - Tag normalization (5 tests)
- `UrlTaggerTest.java` - URL-based tagging (6 tests)

✅ **API** (Low coverage - 8%)
- `EntriesControllerTest.java` - Basic controller tests (3 tests)

✅ **Events** (Perfect coverage - 100%)
- `JobEventListenerTest.java` - Job event handling (1 test)

### Missing Coverage (Critical)

❌ **API Controllers** (Very Low - 8%)
- `EntriesController.java` - Main entry endpoints (partial)
- `JobsController.java` - Job management endpoints (0%)
- `FilesController.java` - File/thumbnail serving (0%)
- `ListsController.java` - Lists management (0%)
- `TagsController.java` - Tag suggestions (0%)
- `RecommendationsController.java` - Recommendations (0%)
- `HealthController.java` - Health check (0%)

❌ **Job Processors** (0% - Critical!)
- `RegenerateThumbnailJobProcessor.java` - Thumbnail generation
- `EnrichEntryJobProcessor.java` - LLM enrichment
- `JobWorker.java` - Job execution
- `JobDispatcher.java` - Job scheduling

❌ **Services** (Low coverage)
- `RecommendationService.java` - Recommendation logic (0%)
- `FileStorageService.java` - File storage operations (0%)

❌ **Enrichment** (1% - Critical!)
- `UrlContentFetcher.java` - Web content fetching
- `YouTubeMetadataFetcher.java` - YouTube metadata
- `EnrichmentParser.java` - LLM response parsing

❌ **Thumbnail** (0% - Critical!)
- `ThumbnailFetcher.java` - Image downloading
- `PageScreenshotter.java` - Page screenshots
- `ImageThumbs.java` - Image processing
- `YouTube.java` - YouTube thumbnail extraction

❌ **LLM Integration** (0% - Critical!)
- `GeminiClient.java` - Gemini API client
- `LlmRecommendationParser.java` - LLM recommendation parsing

❌ **Storage** (0%)
- `FileStorageService.java` - File storage operations
- `StoragePaths.java` - Path management

❌ **Config** (6%)
- `ErrorHandlingConfig.java` - Error handling configuration
- `WebSocketConfig.java` - WebSocket configuration

---

## Priority Recommendations

### High Priority (Critical Business Logic)

1. **Backend Job Processors** (0% coverage)
   - These handle all background jobs (thumbnails, enrichment)
   - Critical for reliability
   - Should test: success paths, error handling, edge cases

2. **Backend API Controllers** (8% coverage)
   - All user-facing endpoints
   - Should test: request validation, error responses, success paths

3. **Frontend Pages** (0% coverage)
   - User interaction flows
   - Should test: form submissions, navigation, error handling

4. **Thumbnail/Storage Services** (0% coverage)
   - File operations are critical
   - Should test: file saving, loading, error handling

### Medium Priority

5. **Frontend Components** (Partial)
   - Tag input, modals, toasts
   - Should test: user interactions, edge cases

6. **Enrichment Services** (1%)
   - Content fetching and parsing
   - Should test: various URL types, error handling

7. **LLM Integration** (0%)
   - AI features
   - Should test: API calls, response parsing, error handling

### Low Priority

8. **Config Classes** (6%)
   - Configuration setup
   - Can be tested with integration tests

---

## Testing Strategy

### Backend
1. **Unit Tests** for services and processors (mock dependencies)
2. **Integration Tests** for repositories (use test database)
3. **Controller Tests** (mock services, test HTTP layer)

### Frontend
1. **Component Tests** (test inputs/outputs, user interactions)
2. **Store Tests** (test state management, side effects)
3. **Service Tests** (test API calls, error handling)
4. **E2E Tests** (optional, for critical user flows)

---

## Current Test Status

✅ All existing tests are passing
- Frontend: 31 tests passing
- Backend: 38 tests passing

