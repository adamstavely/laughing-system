/**
 * Validation utilities for feedback data
 */

import type { FeedbackData } from '../types';

const MIN_FEEDBACK_LENGTH = 10;
const MAX_FEEDBACK_LENGTH = 5000;

/**
 * Validate feedback text length
 */
export function validateFeedbackText(text: string): {
  valid: boolean;
  error?: string;
} {
  if (text.length < MIN_FEEDBACK_LENGTH) {
    return {
      valid: false,
      error: `Feedback must be at least ${MIN_FEEDBACK_LENGTH} characters`,
    };
  }

  if (text.length > MAX_FEEDBACK_LENGTH) {
    return {
      valid: false,
      error: `Feedback must be no more than ${MAX_FEEDBACK_LENGTH} characters`,
    };
  }

  return { valid: true };
}

/**
 * Validate NPS score
 */
export function validateNPSScore(score: number | null): {
  valid: boolean;
  error?: string;
} {
  if (score === null || score === undefined) {
    return {
      valid: false,
      error: 'NPS score is required',
    };
  }

  if (score < 0 || score > 10) {
    return {
      valid: false,
      error: 'NPS score must be between 0 and 10',
    };
  }

  return { valid: true };
}

/**
 * Validate complete feedback data
 */
export function validateFeedbackData(
  data: Partial<FeedbackData>,
  requireCategory: boolean = false
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate NPS score
  const npsValidation = validateNPSScore(data.npsScore ?? null);
  if (!npsValidation.valid) {
    errors.push(npsValidation.error!);
  }

  // Validate feedback text
  const textValidation = validateFeedbackText(data.feedbackText || '');
  if (!textValidation.valid) {
    errors.push(textValidation.error!);
  }

  // Validate category if required
  if (requireCategory && !data.category) {
    errors.push('Category is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate NPS segment from score
 */
export function calculateNPSSegment(
  score: number
): 'detractor' | 'passive' | 'promoter' {
  if (score >= 0 && score <= 6) {
    return 'detractor';
  }
  if (score >= 7 && score <= 8) {
    return 'passive';
  }
  return 'promoter';
}
