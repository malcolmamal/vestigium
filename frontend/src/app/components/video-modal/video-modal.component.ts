import { Component, inject, input, output } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-video-modal',
  standalone: true,
  template: `
    <div class="backdrop" (click)="closeModal.emit()">
      <div class="modal" (click)="$event.stopPropagation()">
        <iframe
          [src]="safeUrl()"
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe>
        <button class="closeBtn" (click)="closeModal.emit()">✕</button>
      </div>
    </div>
  `,
  styles: [
    `
      .backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.85);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(5px);
      }
      .modal {
        position: relative;
        width: 90vw;
        max-width: 1280px;
        aspect-ratio: 16 / 9;
        background: #000;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      }
      iframe {
        width: 100%;
        height: 100%;
        display: block;
      }
      .closeBtn {
        position: absolute;
        top: -40px;
        right: -10px;
        background: none;
        border: none;
        color: white;
        font-size: 32px;
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s;

        &:hover {
          opacity: 1;
        }
      }
      @media (max-width: 768px) {
        .modal {
          width: 100vw;
          border-radius: 0;
        }
        .closeBtn {
          top: 10px;
          right: 10px;
          z-index: 10;
          text-shadow: 0 0 10px black;
        }
      }
    `
  ]
})
export class VideoModalComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly videoId = input.required<string>();
  readonly closeModal = output<void>();

  safeUrl(): SafeResourceUrl {
    const id = this.videoId();
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${id}?autoplay=1`
    );
  }
}
