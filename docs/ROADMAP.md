# Vestigium Roadmap: 10 Cool Improvements

This document outlines potential future enhancements for the Vestigium project, ranging from user experience improvements to advanced AI integrations.

## 1. Browser Extension
**Goal**: Streamline the entry creation process.
- Create a lightweight Chrome/Firefox extension.
- Allow users to save the current tab to Vestigium with one click.
- Support selecting specific text or images to be sent as the initial description or attachment.

## 2. AI-Powered Summarization
**Goal**: Quickly grasp the essence of long content.
- Enhance the enrichment job to generate a "TL;DR" summary for articles and PDFs.
- Display this summary prominently in the entry detail view.

## 3. Semantic Search & Vector Embeddings
**Goal**: Find content by meaning, not just keywords.
- Generate vector embeddings for entry titles and descriptions using a local or cloud LLM.
- Implement similarity-based search and "Related Entries" suggestions.

## 4. Automatic Deduplication
**Goal**: Keep the repository clean and organized.
- Detect when a new URL points to content already in the database (e.g., canonical URL matching).
- Offer to merge entries or link them if they are highly similar.

## 5. Smart Collections (Auto-Lists)
**Goal**: Automate organization.
- Create "Smart Lists" that automatically populate based on rules (e.g., "Domain: youtube.com AND Tag: coding").
- Allow saved searches to be treated as dynamic folders.

## 6. Progressive Web App (PWA) Support
**Goal**: Enhance mobile experience and offline access.
- Implement a service worker for offline caching of entry metadata.
- Make the app "installable" on Android and iOS devices.

## 7. RSS/Atom Feed Integration
**Goal**: Use Vestigium as a discovery hub.
- Allow users to subscribe to RSS/Atom feeds.
- Automatically fetch new feed items and present them as "Draft" entries for enrichment and saving.

## 8. Bulk Metadata Management
**Goal**: Efficiently organize large numbers of entries.
- Add a multi-select mode in the entries list.
- Support bulk-adding tags, moving multiple entries to a list, or marking them as visited/important in one action.

## 9. 3rd Party Service Imports
**Goal**: Easy migration from existing tools.
- Build importers for popular bookmarking services like Pocket, Raindrop.io, and Instapaper.
- Support standard Netscape HTML bookmark file imports.

## 10. Interactive Content Previews
**Goal**: View content without leaving the app.
- For articles, use a "Reader Mode" to display the cleaned-up text directly in the UI.
- Support inline playback for more video platforms beyond YouTube.

