/**
 * Custom context utilities
 */

/**
 * Validate custom context object
 */
export function validateCustomContext(
  context: Record<string, any>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for PII patterns (basic detection)
  const piiPatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, // Credit card
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
  ];

  const contextString = JSON.stringify(context);
  piiPatterns.forEach((pattern) => {
    if (pattern.test(contextString)) {
      errors.push('Custom context may contain sensitive information (PII)');
    }
  });

  // Check size (prevent extremely large contexts)
  const size = new Blob([JSON.stringify(context)]).size;
  if (size > 10000) {
    // 10KB limit
    errors.push('Custom context is too large (max 10KB)');
  }

  // Ensure it's serializable
  try {
    JSON.stringify(context);
  } catch (error) {
    errors.push('Custom context must be JSON serializable');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize custom context (remove potentially sensitive data)
 */
export function sanitizeCustomContext(
  context: Record<string, any>,
  options: {
    removePII?: boolean;
    maxDepth?: number;
  } = {}
): Record<string, any> {
  const { removePII = false, maxDepth = 5 } = options;

  function sanitizeValue(value: any, depth: number): any {
    if (depth > maxDepth) {
      return '[Max depth reached]';
    }

    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string') {
      if (removePII) {
        // Remove email-like patterns
        return value.replace(
          /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
          '[email]'
        );
      }
      return value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => sanitizeValue(item, depth + 1));
    }

    if (typeof value === 'object') {
      const sanitized: Record<string, any> = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val, depth + 1);
      }
      return sanitized;
    }

    return value;
  }

  return sanitizeValue(context, 0) as Record<string, any>;
}
