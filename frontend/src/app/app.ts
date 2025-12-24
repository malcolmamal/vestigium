import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

import type { JobResponse } from './models';
import { VestigiumApiService } from './services/vestigium-api.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly api = inject(VestigiumApiService);
  
  readonly jobs = signal<JobResponse[]>([]);
  readonly queueCount = computed(() => 
    this.jobs().filter(j => j.status === 'PENDING' || j.status === 'RUNNING').length
  );

  private pollInterval?: ReturnType<typeof setInterval>;

  constructor() {
    this.loadJobs();
    this.pollInterval = setInterval(() => this.loadJobs(), 1500);
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  private loadJobs() {
    this.api.listJobs({ status: ['PENDING', 'RUNNING'], limit: 100 }).subscribe({
      next: (jobs) => {
        // console.log('Jobs loaded:', jobs);
        this.jobs.set(jobs || []);
      },
      error: () => {}
    });
  }
}
