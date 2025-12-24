# Technical Debt & Architecture Review

This document tracks identified technical debt, architectural concerns, and planned improvements for the Vestigium project.

## 1. Critical Issues

### Lack of API Security
- **Issue**: The REST API currently has no authentication or authorization layer.
- **Impact**: Anyone with network access can view, modify, or delete entries.
- **Status**: Pending (Local-only development for now).

## 2. Major Issues

### Single-Threaded Job Worker
- **Issue**: `JobWorker` processes one job at a time in a single scheduled task.
- **Impact**: One slow enrichment job blocks the entire queue.
- **Status**: Identified.

## 3. Future Improvements
- **Bulk Operations**: Add UI for selecting multiple entries and applying tags or deleting them.
- **Improved LLM Prompting**: Refine the prompt used for enrichment to better handle different types of content (videos, articles, images).
- **Search enhancements**: Support for searching by tag combinations (AND/OR).
