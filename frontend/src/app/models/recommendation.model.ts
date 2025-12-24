import type { EntryResponse } from './entry.model';

export interface LlmRecommendRequest {
  promptId?: string | null;
  customPrompt?: string | null;
  limit?: number | null;
  includeNsfw?: boolean | null;
}

export interface LlmRecommendResponse {
  items: { entry: EntryResponse; reason: string }[];
}


