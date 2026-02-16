import { inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';

const PAUSE_CLASS = 'feedback-component-pause-animations';
const STYLE_ID = 'feedback-component-animation-pause';

@Injectable()
export class AnimationPauseService {
  private readonly doc = inject(DOCUMENT);

  pause(): void {
    if (this.doc.getElementById(STYLE_ID)) return;

    const style = this.doc.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .${PAUSE_CLASS} *,
      .${PAUSE_CLASS} *::before,
      .${PAUSE_CLASS} *::after {
        animation-play-state: paused !important;
        transition: none !important;
      }
    `;
    this.doc.head.appendChild(style);
    this.doc.documentElement.classList.add(PAUSE_CLASS);
  }

  resume(): void {
    this.doc.documentElement.classList.remove(PAUSE_CLASS);
    const style = this.doc.getElementById(STYLE_ID);
    if (style) {
      style.remove();
    }
  }
}
