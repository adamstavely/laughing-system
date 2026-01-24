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
