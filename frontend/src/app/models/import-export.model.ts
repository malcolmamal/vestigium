export interface EntryExportItem {
  id: string;
  url: string;
  addedAt: string | null;
  thumbnailPath?: string | null;
  thumbnailLargePath?: string | null;
  title: string | null;
  description: string | null;
  tags: string[];
}

export interface ImportEntriesResponse {
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errors: { url: string; error: string }[];
}


