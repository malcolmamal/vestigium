export interface AttachmentResponse {
  id: string;
  kind: 'PDF' | 'IMAGE' | 'OTHER' | string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  downloadUrl: string;
}

export interface EntryResponse {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  tags: string[];
  important: boolean;
  visitedAt: string | null;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl: string;
  thumbnailLargeUrl: string;
}

export interface EntryDetailsResponse {
  entry: EntryResponse;
  attachments: AttachmentResponse[];
}

export interface EntryListResponse {
  page: number;
  pageSize: number;
  items: EntryResponse[];
}

export interface PatchEntryRequest {
  title?: string | null;
  description?: string | null;
  important?: boolean | null;
  tags?: string[] | null;
}


