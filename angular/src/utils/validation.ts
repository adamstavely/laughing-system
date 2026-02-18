/**
 * Validation utilities for feedback data
 * Ported from React src/utils/validation.ts (pure functions, no framework deps)
 */

import type { FeedbackData, ValidationResult } from '../models/feedback.model';

const MIN_FEEDBACK_LENGTH = 10;
const MAX_FEEDBACK_LENGTH = 5000;

export function validateFeedbackText(text: string): { valid: boolean; error?: string } {
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

export function validateNPSScore(score: number | null): { valid: boolean; error?: string } {
  if (score === null || score === undefined) {
    return { valid: false, error: 'NPS score is required' };
  }

  if (score < 0 || score > 10) {
    return { valid: false, error: 'NPS score must be between 0 and 10' };
  }

  return { valid: true };
}

export function validateFeedbackData(
  data: Partial<FeedbackData>,
  requireCategory: boolean = false,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const npsValidation = validateNPSScore(data.npsScore ?? null);
  if (!npsValidation.valid) {
    errors.push(npsValidation.error!);
  }

  const textValidation = validateFeedbackText(data.feedbackText || '');
  if (!textValidation.valid) {
    errors.push(textValidation.error!);
  }

  if (requireCategory && !data.category) {
    errors.push('Category is required');
  }

  return { valid: errors.length === 0, errors };
}

export function calculateNPSSegment(
  score: number | null,
): 'detractor' | 'passive' | 'promoter' | null {
  if (score === null) return null;
  if (score >= 0 && score <= 6) return 'detractor';
  if (score >= 7 && score <= 8) return 'passive';
  return 'promoter';
}

export function getErrorMessage(error: Error | string): string {
  if (typeof error === 'string') return error;

  const message = error.message || 'An unknown error occurred';

  if (message.includes('CORS')) {
    return 'Cross-origin request blocked. Please check CORS configuration.';
  }
  if (message.includes('401') || message.includes('403')) {
    return 'Authentication failed. Please check your credentials.';
  }
  if (message.includes('404')) {
    return 'Endpoint not found. Please check your API endpoint configuration.';
  }
  if (message.includes('429')) {
    return 'Rate limit exceeded. Please try again later.';
  }
  if (message.includes('500') || message.includes('502') || message.includes('503')) {
    return 'Server error. Please try again later.';
  }
  if (message.includes('NetworkError') || message.includes('Failed to fetch')) {
    return 'Network error. Please check your internet connection.';
  }

  return message;
}

export function validateConfig(props: {
  screenshotQuality?: number;
  maxAnnotations?: number;
  debounceMs?: number;
  selectorPriority?: string[];
  customContext?: Record<string, unknown>;
  onSubmit?: unknown;
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (props.screenshotQuality !== undefined) {
    if (props.screenshotQuality < 0 || props.screenshotQuality > 1) {
      errors.push('screenshotQuality must be between 0 and 1');
    }
  }

  if (props.maxAnnotations !== undefined) {
    if (props.maxAnnotations < 1 || props.maxAnnotations > 50) {
      warnings.push('maxAnnotations should be between 1 and 50');
    }
  }

  if (props.debounceMs !== undefined) {
    if (props.debounceMs < 0 || props.debounceMs > 5000) {
      warnings.push('debounceMs should be between 0 and 5000ms');
    }
  }

  if (props.selectorPriority) {
    const validPriorities = ['data-testid', 'id', 'unique-class', 'nth-child'];
    const invalid = props.selectorPriority.filter((p) => !validPriorities.includes(p));
    if (invalid.length > 0) {
      warnings.push(
        `Invalid selector priorities: ${invalid.join(', ')}. Valid options: ${validPriorities.join(', ')}`,
      );
    }
  }

  if (props.customContext) {
    try {
      JSON.stringify(props.customContext);
    } catch {
      errors.push('customContext must be JSON serializable');
    }
  }

  if (!props.onSubmit) {
    warnings.push('No onSubmit callback configured. Feedback will not be submitted anywhere.');
  }

  return { valid: errors.length === 0, errors, warnings };
}
