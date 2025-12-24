import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private nextId = 0;
  private readonly toastsSignal = signal<Toast[]>([]);

  readonly toasts = this.toastsSignal.asReadonly();

  show(message: string, type: ToastType = 'info') {
    const id = this.nextId++;
    const toast: Toast = { id, message, type };
    this.toastsSignal.update((t) => [...t, toast]);

    setTimeout(() => {
      this.remove(id);
    }, 5000);
  }

  success(message: string) {
    this.show(message, 'success');
  }

  error(message: string) {
    this.show(message, 'error');
  }

  info(message: string) {
    this.show(message, 'info');
  }

  remove(id: number) {
    this.toastsSignal.update((t) => t.filter((x) => x.id !== id));
  }
}
