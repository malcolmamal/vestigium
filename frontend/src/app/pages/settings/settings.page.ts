import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SettingsStore } from '../../store/settings.store';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsPage {
  readonly settings = inject(SettingsStore);

  onShowNsfwChange(evt: Event) {
    const v = (evt.target as HTMLInputElement).checked;
    this.settings.setShowNsfw(v);
  }
}
