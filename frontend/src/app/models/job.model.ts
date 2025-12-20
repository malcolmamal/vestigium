export interface JobResponse {
  id: string;
  type: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | string;
  entryId: string;
  attempts: number;
  lockedAt: string | null;
  finishedAt: string | null;
  lastError: string | null;
  createdAt: string;
}


