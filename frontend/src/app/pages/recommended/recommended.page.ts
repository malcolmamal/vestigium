import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EntryCardComponent } from '../../components/entry-card/entry-card.component';
import type { EntryResponse } from '../../models/entry.model';
import type { LlmRecommendResponse } from '../../models/recommendation.model';
import { VestigiumApiService } from '../../services/vestigium-api.service';
import { SettingsStore } from '../../store/settings.store';

@Component({
  selector: 'app-recommended-page',
  standalone: true,
  imports: [RouterLink, EntryCardComponent],
  templateUrl: './recommended.page.html',
  styleUrl: './recommended.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecommendedPage {
  private readonly api = inject(VestigiumApiService);
  private readonly settings = inject(SettingsStore);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly items = signal<EntryResponse[]>([]);
  readonly llmItems = signal<LlmRecommendResponse['items']>([]);

  readonly includeNsfw = computed(() => this.settings.showNsfw());

  readonly mode = signal<'random' | 'llm'>('random');
  readonly promptId = signal<
    'movie' | 'short_funny' | 'learn' | 'music' | 'food' | 'workout' | 'news' | 'coding' | 'relax' | 'surprise' | 'custom'
  >('movie');
  readonly customPrompt = signal('');

  readonly activeAction = signal<'random' | 'llm' | null>(null);

  loadRandom() {
    this.loading.set(true);
    this.error.set(null);
    this.mode.set('random');
    this.llmItems.set([]);
    this.activeAction.set('random');
    this.api.getRandomRecommendations({ limit: 30, includeNsfw: this.includeNsfw() }).subscribe({
      next: (items) => {
        this.items.set(items ?? []);
        this.loading.set(false);
        this.activeAction.set(null);
      },
      error: (e) => {
        this.loading.set(false);
        this.activeAction.set(null);
        this.error.set(e?.error?.detail ?? e?.message ?? 'Failed to load recommendations');
      }
    });
  }

  runLlm() {
    this.loading.set(true);
    this.error.set(null);
    this.mode.set('llm');
    this.items.set([]);
    this.llmItems.set([]);
    this.activeAction.set('llm');

    const pid = this.promptId();
    this.api
      .getLlmRecommendations({
        promptId: pid === 'custom' ? null : pid,
        customPrompt: this.customPrompt().trim() || null,
        limit: 10,
        includeNsfw: this.includeNsfw()
      })
      .subscribe({
        next: (res) => {
          this.llmItems.set(res?.items ?? []);
          this.loading.set(false);
          this.activeAction.set(null);
        },
        error: (e) => {
          this.loading.set(false);
          this.activeAction.set(null);
          this.error.set(e?.error?.detail ?? e?.message ?? 'Failed to get LLM recommendation');
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

  constructor() {
    this.loadRandom();
  }

  onCardChanged(evt: { kind: 'queued' | 'updated' | 'deleted'; entryId: string }) {
    if (!evt) return;
    if (evt.kind !== 'deleted') return;

    this.items.set(this.items().filter((e) => e.id !== evt.entryId));
    this.llmItems.set(this.llmItems().filter((r) => r.entry.id !== evt.entryId));
  }
}


