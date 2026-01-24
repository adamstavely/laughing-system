/**
 * Validation utility tests
 */

import { describe, it, expect } from 'vitest';
import {
  validateFeedbackText,
  validateNPSScore,
  validateFeedbackData,
  calculateNPSSegment,
} from '../validation';

describe('validation', () => {
  describe('validateFeedbackText', () => {
    it('should validate minimum length', () => {
      const result = validateFeedbackText('short');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 10');
    });

    it('should validate maximum length', () => {
      const longText = 'a'.repeat(5001);
      const result = validateFeedbackText(longText);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('no more than 5000');
    });

    it('should accept valid text', () => {
      const result = validateFeedbackText('This is valid feedback text');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateNPSScore', () => {
    it('should reject null score', () => {
      const result = validateNPSScore(null);
      expect(result.valid).toBe(false);
    });

    it('should reject scores below 0', () => {
      const result = validateNPSScore(-1);
      expect(result.valid).toBe(false);
    });

    it('should reject scores above 10', () => {
      const result = validateNPSScore(11);
      expect(result.valid).toBe(false);
    });

    it('should accept valid scores', () => {
      for (let i = 0; i <= 10; i++) {
        const result = validateNPSScore(i);
        expect(result.valid).toBe(true);
      }
    });
  });

  describe('calculateNPSSegment', () => {
    it('should return detractor for 0-6', () => {
      expect(calculateNPSSegment(0)).toBe('detractor');
      expect(calculateNPSSegment(3)).toBe('detractor');
      expect(calculateNPSSegment(6)).toBe('detractor');
    });

    it('should return passive for 7-8', () => {
      expect(calculateNPSSegment(7)).toBe('passive');
      expect(calculateNPSSegment(8)).toBe('passive');
    });

    it('should return promoter for 9-10', () => {
      expect(calculateNPSSegment(9)).toBe('promoter');
      expect(calculateNPSSegment(10)).toBe('promoter');
    });
  });

  describe('validateFeedbackData', () => {
    it('should validate complete feedback data', () => {
      const feedback = {
        npsScore: 8,
        feedbackText: 'This is valid feedback text',
        category: 'bug' as const,
        annotations: [],
      };

      const result = validateFeedbackData(feedback);
      expect(result.valid).toBe(true);
    });

    it('should require category if requireCategory is true', () => {
      const feedback = {
        npsScore: 8,
        feedbackText: 'This is valid feedback text',
        annotations: [],
      };

      const result = validateFeedbackData(feedback, true);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Category is required');
    });

    it('should validate NPS score', () => {
      const feedback = {
        npsScore: null,
        feedbackText: 'This is valid feedback text',
        annotations: [],
      };

      const result = validateFeedbackData(feedback);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate feedback text', () => {
      const feedback = {
        npsScore: 8,
        feedbackText: 'short',
        annotations: [],
      };

      const result = validateFeedbackData(feedback);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
