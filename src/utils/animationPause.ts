/**
 * Animation pause utilities
 */

const PAUSE_CLASS = 'feedback-component-pause-animations';

/**
 * Pause all CSS animations and transitions
 */
export function pauseAnimations(): void {
  const style = document.createElement('style');
  style.id = 'feedback-component-animation-pause';
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

/**
 * Resume all CSS animations and transitions
 */
export function resumeAnimations(): void {
  document.documentElement.classList.remove(PAUSE_CLASS);
  const style = document.getElementById('feedback-component-animation-pause');
  if (style) {
    style.remove();
  }
}

/**
 * Check if animations are currently paused
 */
export function areAnimationsPaused(): boolean {
  return document.documentElement.classList.contains(PAUSE_CLASS);
}
