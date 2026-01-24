/**
 * Utility functions for generating robust CSS selectors
 */

/**
 * Priority order for selector generation
 */
const DEFAULT_SELECTOR_PRIORITY = [
  'data-testid',
  'id',
  'unique-class',
  'nth-child',
] as const;

/**
 * Generate a robust CSS selector for an element
 */
export function generateSelector(
  element: HTMLElement,
  priority: string[] = [...DEFAULT_SELECTOR_PRIORITY]
): string {
  // Try data-testid first
  if (priority.includes('data-testid')) {
    const testId = element.getAttribute('data-testid');
    if (testId) {
      return `[data-testid="${testId}"]`;
    }
  }

  // Try ID
  if (priority.includes('id') && element.id) {
    return `#${element.id}`;
  }

  // Try unique class combinations
  if (priority.includes('unique-class')) {
    const classes = Array.from(element.classList).filter(
      (cls) => !cls.startsWith('_') // Filter out internal classes
    );
    if (classes.length > 0) {
      // Try single class if unique
      for (const cls of classes) {
        const selector = `.${cls}`;
        if (document.querySelectorAll(selector).length === 1) {
          return selector;
        }
      }

      // Try class combination
      if (classes.length > 1) {
        const combinedSelector = classes.map((cls) => `.${cls}`).join('');
        if (document.querySelectorAll(combinedSelector).length === 1) {
          return combinedSelector;
        }
      }
    }
  }

  // Fallback to nth-child
  if (priority.includes('nth-child')) {
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(element) + 1;
      const tagName = element.tagName.toLowerCase();
      const parentSelector = generateSelector(parent, priority);
      return `${parentSelector} > ${tagName}:nth-child(${index})`;
    }
  }

  // Last resort: tag name with path
  return getElementPath(element);
}

/**
 * Get element path as fallback selector
 */
function getElementPath(element: HTMLElement): string {
  const path: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    if (current.id) {
      selector += `#${current.id}`;
    } else if (current.className) {
      const classes = Array.from(current.classList)
        .filter((cls) => !cls.startsWith('_'))
        .slice(0, 2)
        .map((cls) => `.${cls}`)
        .join('');
      if (classes) {
        selector += classes;
      }
    }

    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (el) => el.tagName === current!.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    path.unshift(selector);
    current = parent;
  }

  return path.join(' > ');
}

/**
 * Validate that a selector uniquely identifies an element
 */
export function validateSelector(selector: string): boolean {
  try {
    const elements = document.querySelectorAll(selector);
    return elements.length === 1;
  } catch {
    return false;
  }
}
