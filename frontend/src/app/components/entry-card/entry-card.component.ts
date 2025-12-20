import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import type { EntryResponse } from '../../models/entry.model';

@Component({
  selector: 'app-entry-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './entry-card.component.html',
  styleUrl: './entry-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntryCardComponent {
  readonly entry = input.required<EntryResponse>();

  onImgError(evt: Event) {
    (evt.target as HTMLImageElement).style.display = 'none';
  }
}


