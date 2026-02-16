import { Injectable } from '@angular/core';

const PAUSE_CLASS = 'feedback-component-pause-animations';
const STYLE_ID = 'feedback-component-animation-pause';

@Injectable()
export class AnimationPauseService {
  pause(): void {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .${PAUSE_CLASS} *,
      .${PAUSE_CLASS} *::before,
      .${PAUSE_CLASS} *::after {
        animation-play-state: paused !important;
        transition: none !important;
      }
    `;
    document.head.appendChild(style);
    document.documentElement.classList.add(PAUSE_CLASS);
  }

  resume(): void {
    document.documentElement.classList.remove(PAUSE_CLASS);
    const style = document.getElementById(STYLE_ID);
    if (style) {
      style.remove();
    }
  }
}
