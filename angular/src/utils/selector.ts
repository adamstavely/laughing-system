/**
 * Utility functions for generating robust CSS selectors
 * Ported from React src/utils/selector.ts (pure functions, no framework deps)
 */

const DEFAULT_SELECTOR_PRIORITY = [
  'data-testid',
  'id',
  'unique-class',
  'nth-child',
] as const;

export function generateSelector(
  element: HTMLElement,
  priority: string[] = [...DEFAULT_SELECTOR_PRIORITY],
): string {
  if (priority.includes('data-testid')) {
    const testId = element.getAttribute('data-testid');
    if (testId) {
      return `[data-testid="${testId}"]`;
    }
  }

  if (priority.includes('id') && element.id) {
    return `#${element.id}`;
  }

  if (priority.includes('unique-class')) {
    const classes = Array.from(element.classList).filter(
      (cls) => !cls.startsWith('_'),
    );
    if (classes.length > 0) {
      for (const cls of classes) {
        const selector = `.${cls}`;
        if (document.querySelectorAll(selector).length === 1) {
          return selector;
        }
      }

      if (classes.length > 1) {
        const combinedSelector = classes.map((cls) => `.${cls}`).join('');
        if (document.querySelectorAll(combinedSelector).length === 1) {
          return combinedSelector;
        }
      }
    }
  }

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

  return getElementPath(element);
}

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
        (el) => el.tagName === current!.tagName,
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

export function validateSelector(selector: string): boolean {
  try {
    const elements = document.querySelectorAll(selector);
    return elements.length === 1;
  } catch {
    return false;
  }
}
