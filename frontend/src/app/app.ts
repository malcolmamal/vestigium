import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

import { JobsStore } from './store/jobs.store';
import { ToastsComponent } from './components/toasts/toasts.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ToastsComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  readonly jobsStore = inject(JobsStore);

  readonly queueCount = computed(
    () =>
      this.jobsStore.items().filter((j) => j.status === 'PENDING' || j.status === 'RUNNING').length
  );
}
