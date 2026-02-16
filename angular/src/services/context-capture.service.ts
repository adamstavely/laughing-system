import { inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import type { ContextData } from '../models/feedback.model';

const SESSION_ID_KEY = 'feedback-component-session-id';

@Injectable()
export class ContextCaptureService {
  private readonly doc = inject(DOCUMENT);

  captureContext(
    getUserId?: () => string | null,
    appVersion?: string,
    customContext?: Record<string, unknown>,
  ): ContextData {
    const win = this.doc.defaultView;
    return {
      url: win?.location.href ?? '',
      userAgent: this.parseUserAgent(),
      viewport: {
        width: win?.innerWidth ?? 0,
        height: win?.innerHeight ?? 0,
      },
      userId: getUserId?.() || undefined,
      sessionId: this.getSessionId(),
      appVersion,
      customContext,
    };
  }

  getTimestamp(): string {
    return new Date().toISOString();
  }

  private getSessionId(): string {
    const win = this.doc.defaultView;
    let sessionId = win?.sessionStorage.getItem(SESSION_ID_KEY) ?? null;

    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      win?.sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    }

    return sessionId;
  }

  private parseUserAgent(): string {
    const ua = this.doc.defaultView?.navigator.userAgent ?? '';

    if (ua.includes('Chrome')) {
      const match = ua.match(/Chrome\/(\d+)/);
      return match ? `Chrome ${match[1]}` : 'Chrome';
    }
    if (ua.includes('Firefox')) {
      const match = ua.match(/Firefox\/(\d+)/);
      return match ? `Firefox ${match[1]}` : 'Firefox';
    }
    if (ua.includes('Safari') && !ua.includes('Chrome')) {
      const match = ua.match(/Version\/(\d+)/);
      return match ? `Safari ${match[1]}` : 'Safari';
    }
    if (ua.includes('Edge')) {
      const match = ua.match(/Edge\/(\d+)/);
      return match ? `Edge ${match[1]}` : 'Edge';
    }

    return ua;
  }
}
