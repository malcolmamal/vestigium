import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EntryCardComponent } from '../../components/entry-card/entry-card.component';
import { VideoModalComponent } from '../../components/video-modal/video-modal.component';
import type { EntryResponse, LlmRecommendRequest, LlmRecommendResponse } from '../../models';
import { VestigiumApiService } from '../../services/vestigium-api.service';
import { SettingsStore } from '../../store/settings.store';

@Component({
  selector: 'app-recommended-page',
  standalone: true,
  imports: [RouterLink, EntryCardComponent, VideoModalComponent],
  templateUrl: './recommended.page.html',
  styleUrl: './recommended.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecommendedPage {
  private readonly api = inject(VestigiumApiService);
  private readonly settings = inject(SettingsStore);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly errorDetail = signal<string | null>(null);
  readonly items = signal<EntryResponse[]>([]);
  readonly llmItems = signal<LlmRecommendResponse['items']>([]);
  readonly lastLlmRequest = signal<LlmRecommendRequest | null>(null);

  readonly includeNsfw = computed(() => this.settings.showNsfw());
  readonly canRunLlm = computed(() => {
    if (this.loading()) return false;
    if (this.promptId() !== 'custom') return true;
    return this.customPrompt().trim().length > 0;
  });

  readonly mode = signal<'random' | 'llm'>('random');
  readonly promptId = signal<
    | 'movie'
    | 'short_funny'
    | 'learn'
    | 'music'
    | 'food'
    | 'workout'
    | 'news'
    | 'coding'
    | 'relax'
    | 'surprise'
    | 'custom'
  >('movie');
  readonly customPrompt = signal('');

  readonly activeAction = signal<'random' | 'llm' | null>(null);
  readonly busyStates = signal<Record<string, 'enrich' | 'thumb' | 'important' | 'delete' | null>>(
    {}
  );
  readonly activeVideoId = signal<string | null>(null);

  loadRandom() {
    this.loading.set(true);
    this.error.set(null);
    this.errorDetail.set(null);
    this.mode.set('random');
    this.items.set([]);
    this.llmItems.set([]);
    this.activeAction.set('random');

    this.api.getRandomRecommendations({ limit: 20, includeNsfw: this.includeNsfw() }).subscribe({
      next: (res) => {
        this.items.set(res ?? []);
        this.loading.set(false);
        this.activeAction.set(null);
      },
      error: (e) => {
        this.loading.set(false);
        this.activeAction.set(null);
        this.setErrorFromHttp(e, 'Failed to get random recommendations');
      }
    });
  }

  // ... (inside class)

  onEnrich(id: string) {
    this.updateBusy(id, 'enrich');
    this.api.enqueueEnrich(id).subscribe({
      next: () => this.updateBusy(id, null),
      error: () => this.updateBusy(id, null)
    });
  }

  onThumbnail(id: string) {
    this.updateBusy(id, 'thumb');
    this.api.enqueueThumbnail(id).subscribe({
      next: () => this.updateBusy(id, null),
      error: () => this.updateBusy(id, null)
    });
  }

  onToggleImportant(id: string) {
    const entry =
      this.items().find((e) => e.id === id) ||
      this.llmItems()?.find((r) => r.entry!.id === id)?.entry;
    if (!entry) return;
    this.updateBusy(id, 'important');
    this.api.patchEntry(id, { important: !entry.important }).subscribe({
      next: () => {
        this.updateBusy(id, null);
        // Local update for simple toggle
        this.items.update((items) =>
          items.map((e) => (e.id === id ? { ...e, important: !e.important } : e))
        );
        this.llmItems.update((items) =>
          items?.map((r) =>
            r.entry!.id === id
              ? { ...r, entry: { ...r.entry!, important: !r.entry!.important } }
              : r
          )
        );
      },
      error: () => this.updateBusy(id, null)
    });
  }

  onDelete(id: string) {
    this.updateBusy(id, 'delete');
    this.api.deleteEntry(id).subscribe({
      next: () => {
        this.updateBusy(id, null);
        this.items.set(this.items().filter((e) => e.id !== id));
        this.llmItems.set(this.llmItems()?.filter((r) => r.entry!.id !== id) ?? []);
      },
      error: () => this.updateBusy(id, null)
    });
  }

  onPlayVideo(videoId: string) {
    this.activeVideoId.set(videoId);
  }

  closeVideo() {
    this.activeVideoId.set(null);
  }

  private updateBusy(id: string, type: 'enrich' | 'thumb' | 'important' | 'delete' | null) {
    this.busyStates.update((s) => ({ ...s, [id]: type }));
  }

  runLlm() {
    const pid = this.promptId();
    const req: LlmRecommendRequest = {
      promptId: pid === 'custom' ? undefined : pid,
      customPrompt: this.customPrompt().trim() || undefined,
      limit: 10,
      includeNsfw: this.includeNsfw()
    };
    this.runLlmRequest(req);
  }

  retryLlm() {
    const req = this.lastLlmRequest();
    if (!req) {
      this.runLlm();
      return;
    }
    this.runLlmRequest(req);
  }

  private runLlmRequest(req: LlmRecommendRequest) {
    this.loading.set(true);
    this.error.set(null);
    this.errorDetail.set(null);
    this.mode.set('llm');
    this.items.set([]);
    this.llmItems.set([]);
    this.activeAction.set('llm');
    this.lastLlmRequest.set(req);

    this.api.getLlmRecommendations(req).subscribe({
      next: (res) => {
        this.llmItems.set(res?.items ?? []);
        this.loading.set(false);
        this.activeAction.set(null);
      },
      error: (e) => {
        this.loading.set(false);
        this.activeAction.set(null);
        this.setErrorFromHttp(e, 'Failed to get LLM recommendation');
      }
    });
  }

  onSuggestionKeydown(evt: KeyboardEvent) {
    if (evt.key === 'Enter' && !evt.shiftKey) {
      evt.preventDefault();
      if (!this.loading()) {
        this.runLlm();
      }
    }
  }

  private setErrorFromHttp(e: unknown, fallback: string) {
    const status = (e as { status?: number })?.status;
    const detail = (e as { error?: { detail?: string }; message?: string })?.error?.detail ?? (e as { message?: string })?.message ?? null;
    let msg = fallback;
    if (status === 0) {
      msg = 'Could not reach the server. Check that the backend is running.';
    } else if (status === 502) {
      msg = 'LLM service is unavailable or failed to respond.';
    } else if (status && status >= 500) {
      msg = 'Server error while requesting recommendations.';
    } else if (status === 400) {
      msg = 'Invalid LLM request. Check the prompt and try again.';
    }
    this.error.set(msg);
    this.errorDetail.set(detail && detail !== msg ? String(detail) : null);
  }
}
