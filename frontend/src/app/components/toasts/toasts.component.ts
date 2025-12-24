import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toasts',
  imports: [],
  templateUrl: './toasts.component.html',
  styleUrl: './toasts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class ToastsComponent {
  readonly toastService = inject(ToastService);
}
