import { Injectable } from '@angular/core';
import type { ContextData } from '../models/feedback.model';

const SESSION_ID_KEY = 'feedback-component-session-id';

@Injectable()
export class ContextCaptureService {
  captureContext(
    getUserId?: () => string | null,
    appVersion?: string,
    customContext?: Record<string, unknown>,
  ): ContextData {
    return {
      url: window.location.href,
      userAgent: this.parseUserAgent(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
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
    let sessionId = sessionStorage.getItem(SESSION_ID_KEY);

    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    }

    return sessionId;
  }

  private parseUserAgent(): string {
    const ua = navigator.userAgent;

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
