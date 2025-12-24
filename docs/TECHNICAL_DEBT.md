# Technical Debt & Architecture Review

This document tracks identified technical debt, architectural concerns, and planned improvements for the Vestigium project.

## 1. Critical Issues

### Lack of API Security
- **Issue**: The REST API currently has no authentication or authorization layer.
- **Impact**: Anyone with network access can view, modify, or delete entries.
- **Status**: Pending (Local-only development for now).

### N+1 Query Problem in Repository
- **Issue**: `EntryRepository` executes a separate SQL query for tags for every single entry returned in search results.
- **Impact**: Significant performance degradation as the library grows ($O(N)$ database roundtrips).
- **Status**: Planned (Refactor to batch fetch tags).

## 2. Major Issues

### SQLite Write Contention
- **Issue**: SQLite default settings (DELETE journal mode) can lead to `SQLITE_BUSY` errors when high-frequency background jobs run alongside manual UI updates.
- **Impact**: Intermittent "Save" failures in the UI.
- **Status**: Planned (Enable WAL mode).

### Single-Threaded Job Worker
- **Issue**: `JobWorker` processes one job at a time in a single scheduled task.
- **Impact**: One slow enrichment job blocks the entire queue.
- **Status**: Identified.

### Missing Global Error UI
- **Issue**: Error handling is local to pages. No consistent system-wide notification for server issues or successes.
- **Impact**: Poor UX during failures; lack of confirmation for successful actions.
- **Status**: Planned (Global Toast System).

## 3. Minor Issues

### Hardcoded NSFW Tag List
- **Issue**: Forbidden tags are hardcoded in the Java repository.
- **Impact**: Difficult to customize without rebuilding the backend.
- **Status**: Planned (Move to `nsfw-tags.json`).

### Synchronous HTTP Client in Worker
- **Issue**: Backend workers use blocking I/O for slow LLM and URL fetching calls.
- **Impact**: Threads stay idle waiting for network responses.
- **Status**: Planned (Switch to `sendAsync`).

## 4. Trivial Issues

### Inconsistent Date Formatting
- **Issue**: Manual string slicing in frontend vs ISO strings in backend.
- **Impact**: Brittle UI code; inconsistent display.
- **Status**: Planned (Standardize on Angular DatePipe).

### CSS Over-Budget Warning
- **Issue**: `entry-details.page.scss` exceeds the default Angular budget.
- **Impact**: Build warnings.
- **Status**: Planned (Increase budget).

