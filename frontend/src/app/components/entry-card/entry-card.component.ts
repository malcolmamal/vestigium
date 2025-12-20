import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import type { EntryResponse } from '../../models/entry.model';

@Component({
  selector: 'app-entry-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <a class="card" [routerLink]="['/entries', entry().id]">
      <div class="thumb">
        <img [src]="entry().thumbnailUrl" alt="" (error)="onImgError($event)" />
      </div>
      <div class="body">
        <div class="titleRow">
          <div class="title">{{ entry().title || entry().url }}</div>
          @if (entry().important) {
            <span class="pill">Important</span>
          }
          @if (entry().visitedAt) {
            <span class="pill">Visited</span>
          }
        </div>
        @if (entry().description) {
          <div class="desc">{{ entry().description }}</div>
        }
        @if (entry().tags.length > 0) {
          <div class="tags">
            @for (tag of entry().tags; track tag) {
              <span class="tag">{{ tag }}</span>
            }
          </div>
        }
      </div>
    </a>
  `,
  styles: `
    .card {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 14px;
      padding: 12px;
      border-radius: 14px;
      text-decoration: none;
      color: inherit;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.10);
    }
    .card:hover {
      background: rgba(255, 255, 255, 0.07);
      border-color: rgba(255, 255, 255, 0.14);
    }
    .thumb {
      border-radius: 10px;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.10);
      height: 80px;
      align-self: start;
    }
    .thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .body {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 0;
    }
    .titleRow {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
    .title {
      font-weight: 650;
      letter-spacing: -0.01em;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1 1 auto;
    }
    .pill {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.10);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.85);
    }
    .desc {
      color: rgba(255, 255, 255, 0.74);
      font-size: 13px;
      line-height: 1.35;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .tag {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 999px;
      background: rgba(90, 97, 255, 0.14);
      border: 1px solid rgba(90, 97, 255, 0.20);
      color: rgba(255, 255, 255, 0.86);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntryCardComponent {
  readonly entry = input.required<EntryResponse>();

  onImgError(evt: Event) {
    (evt.target as HTMLImageElement).style.display = 'none';
  }
}


