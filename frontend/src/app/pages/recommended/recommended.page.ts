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
  readonly promptId = signal<'movie' | 'short_funny' | 'learn' | 'custom'>('movie');
  readonly customPrompt = signal('');

  loadRandom() {
    this.loading.set(true);
    this.error.set(null);
    this.mode.set('random');
    this.llmItems.set([]);
    this.api.getRandomRecommendations({ limit: 30, includeNsfw: this.includeNsfw() }).subscribe({
      next: (items) => {
        this.items.set(items ?? []);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
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
        },
        error: (e) => {
          this.loading.set(false);
          this.error.set(e?.error?.detail ?? e?.message ?? 'Failed to get LLM recommendation');
        }
      });
  }

  constructor() {
    this.loadRandom();
  }
}


