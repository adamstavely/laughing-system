/**
 * Context capture tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { captureContext, getTimestamp } from '../contextCapture';

describe('contextCapture', () => {
  beforeEach(() => {
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://example.com/page',
      },
      writable: true,
    });

    // Mock window.innerWidth/Height
    Object.defineProperty(window, 'innerWidth', {
      value: 1920,
      writable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 1080,
      writable: true,
    });

    // Mock navigator.userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 Chrome/121.0.0.0',
      writable: true,
    });
  });

  describe('captureContext', () => {
    it('should capture URL', () => {
      const context = captureContext();
      expect(context.url).toBe('https://example.com/page');
    });

    it('should capture viewport dimensions', () => {
      const context = captureContext();
      expect(context.viewport.width).toBe(1920);
      expect(context.viewport.height).toBe(1080);
    });

    it('should capture user agent', () => {
      const context = captureContext();
      expect(context.userAgent).toContain('Chrome');
    });

    it('should generate session ID', () => {
      const context1 = captureContext();
      const context2 = captureContext();
      expect(context1.sessionId).toBe(context2.sessionId);
    });

    it('should include user ID if provided', () => {
      const getUserId = () => 'user-123';
      const context = captureContext(getUserId);
      expect(context.userId).toBe('user-123');
    });

    it('should include app version if provided', () => {
      const context = captureContext(undefined, '1.0.0');
      expect(context.appVersion).toBe('1.0.0');
    });

    it('should include custom context if provided', () => {
      const customContext = { environment: 'production' };
      const context = captureContext(undefined, undefined, customContext);
      expect(context.customContext).toEqual(customContext);
    });
  });

  describe('getTimestamp', () => {
    it('should return ISO 8601 timestamp', () => {
      const timestamp = getTimestamp();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});
