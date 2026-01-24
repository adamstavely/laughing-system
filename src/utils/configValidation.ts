/**
 * Configuration validation utilities
 */

import type { FeedbackComponentProps } from '../types';
import { validateJiraConfig, validateElasticsearchConfig } from './auth';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate FeedbackComponent props
 */
export function validateConfig(
  props: FeedbackComponentProps
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate Jira config if provided
  if (props.jiraConfig) {
    const jiraValidation = validateJiraConfig(props.jiraConfig);
    if (!jiraValidation.valid) {
      errors.push(...jiraValidation.errors);
    }
  }

  // Validate Elasticsearch config if provided
  if (props.elasticConfig) {
    const esValidation = validateElasticsearchConfig(props.elasticConfig);
    if (!esValidation.valid) {
      errors.push(...esValidation.errors);
    }
  }

  // Validate screenshot quality
  if (props.screenshotQuality !== undefined) {
    if (props.screenshotQuality < 0 || props.screenshotQuality > 1) {
      errors.push('screenshotQuality must be between 0 and 1');
    }
  }

  // Validate max annotations
  if (props.maxAnnotations !== undefined) {
    if (props.maxAnnotations < 1 || props.maxAnnotations > 50) {
      warnings.push('maxAnnotations should be between 1 and 50');
    }
  }

  // Validate debounce
  if (props.debounceMs !== undefined) {
    if (props.debounceMs < 0 || props.debounceMs > 5000) {
      warnings.push('debounceMs should be between 0 and 5000ms');
    }
  }

  // Validate selector priority
  if (props.selectorPriority) {
    const validPriorities = ['data-testid', 'id', 'unique-class', 'nth-child'];
    const invalid = props.selectorPriority.filter(
      (p) => !validPriorities.includes(p)
    );
    if (invalid.length > 0) {
      warnings.push(
        `Invalid selector priorities: ${invalid.join(', ')}. Valid options: ${validPriorities.join(', ')}`
      );
    }
  }

  // Validate custom context
  if (props.customContext) {
    try {
      // Ensure custom context is serializable
      JSON.stringify(props.customContext);
    } catch (error) {
      errors.push('customContext must be JSON serializable');
    }
  }

  // Warn if no integrations configured
  if (!props.jiraConfig && !props.elasticConfig && !props.onSubmit) {
    warnings.push(
      'No integrations or onSubmit callback configured. Feedback will not be submitted anywhere.'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: Error | string): string {
  if (typeof error === 'string') {
    return error;
  }

  const message = error.message || 'An unknown error occurred';

  // Provide user-friendly messages for common errors
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
