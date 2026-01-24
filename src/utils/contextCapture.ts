/**
 * Utility functions for capturing contextual metadata
 */

export interface ContextData {
  url: string;
  userAgent: string;
  viewport: { width: number; height: number };
  userId?: string;
  sessionId: string;
  appVersion?: string;
  customContext?: Record<string, any>;
}

/**
 * Generate or retrieve session ID
 */
function getSessionId(): string {
  const storageKey = 'feedback-component-session-id';
  let sessionId = sessionStorage.getItem(storageKey);

  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(storageKey, sessionId);
  }

  return sessionId;
}

/**
 * Parse user agent to get browser info
 */
function parseUserAgent(): string {
  const ua = navigator.userAgent;
  // Simple parsing - can be enhanced
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

/**
 * Capture all contextual metadata
 */
export function captureContext(
  getUserId?: () => string | null,
  appVersion?: string,
  customContext?: Record<string, any>
): ContextData {
  return {
    url: window.location.href,
    userAgent: parseUserAgent(),
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    userId: getUserId?.() || undefined,
    sessionId: getSessionId(),
    appVersion,
    customContext,
  };
}

/**
 * Get current timestamp in ISO 8601 format
 */
export function getTimestamp(): string {
  return new Date().toISOString();
}
