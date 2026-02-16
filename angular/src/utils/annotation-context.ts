/**
 * Utilities for collecting comprehensive annotation context
 * Ported from React src/utils/annotationContext.ts (pure functions, no framework deps)
 */

export function getFullDOMPath(element: HTMLElement): string {
  const path: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current !== document.body && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector += `#${current.id}`;
    }

    if (current.className && typeof current.className === 'string') {
      const classes = current.className
        .trim()
        .split(/\s+/)
        .filter((c) => c.length > 0)
        .join('.');
      if (classes) {
        selector += `.${classes}`;
      }
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(' > ');
}

export function getComprehensiveComputedStyles(element: HTMLElement): Record<string, string> {
  const style = window.getComputedStyle(element);
  const styles: Record<string, string> = {};

  const properties = [
    'color',
    'background-color',
    'border-color',
    'font-size',
    'font-weight',
    'font-family',
    'letter-spacing',
    'text-align',
    'width',
    'height',
    'margin',
    'padding',
    'border',
    'display',
    'position',
    'flex-direction',
    'align-items',
    'justify-content',
    'gap',
    'opacity',
    'z-index',
    'overflow',
    'line-height',
    'text-decoration',
    'text-transform',
    'box-shadow',
    'border-radius',
    'cursor',
  ];

  properties.forEach((prop) => {
    const value = style.getPropertyValue(prop);
    if (value) {
      styles[prop] = value;
    }
  });

  return styles;
}

export function getNearbyElements(element: HTMLElement, count: number = 3): string[] {
  const nearby: string[] = [];
  const parent = element.parentElement;
  if (!parent) return nearby;

  const siblings = Array.from(parent.children);
  const index = siblings.indexOf(element);

  for (let i = Math.max(0, index - count); i < index; i++) {
    const sibling = siblings[i] as HTMLElement;
    if (sibling && sibling !== element) {
      nearby.push(sibling.tagName.toLowerCase());
    }
  }

  for (let i = index + 1; i < Math.min(siblings.length, index + 1 + count); i++) {
    const sibling = siblings[i] as HTMLElement;
    if (sibling && sibling !== element) {
      nearby.push(sibling.tagName.toLowerCase());
    }
  }

  return nearby;
}

export function getPositionDetails(
  rect: DOMRect,
  scrollX: number,
  scrollY: number,
): {
  x: number;
  y: number;
  width: number;
  height: number;
  percentageFromLeft: number;
  pixelsFromTop: number;
} {
  const viewportWidth = window.innerWidth;
  const absoluteX = rect.x + scrollX;
  const absoluteY = rect.y + scrollY;
  const percentageFromLeft = (rect.x / viewportWidth) * 100;

  return {
    x: absoluteX,
    y: absoluteY,
    width: rect.width,
    height: rect.height,
    percentageFromLeft: Math.round(percentageFromLeft * 10) / 10,
    pixelsFromTop: Math.round(absoluteY),
  };
}

export function getElementDescription(elements: HTMLElement[]): string {
  if (elements.length === 0) return '';
  if (elements.length === 1) {
    const el = elements[0];
    const tag = el.tagName.toLowerCase();
    const text = el.textContent?.trim().substring(0, 50) || '';
    return `${tag}${text ? ` "${text}${el.textContent && el.textContent.length > 50 ? '...' : ''}"` : ''}`;
  }

  const descriptions: string[] = [];
  const maxShow = 3;

  for (let i = 0; i < Math.min(elements.length, maxShow); i++) {
    const el = elements[i];
    const tag = el.tagName.toLowerCase();
    const text = el.textContent?.trim().substring(0, 30) || '';

    if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
      descriptions.push(`${tag}: "${text}${el.textContent && el.textContent.length > 30 ? '...' : ''}"`);
    } else if (tag === 'li') {
      descriptions.push('list item');
    } else {
      descriptions.push(tag);
    }
  }

  const remaining = elements.length - maxShow;
  if (remaining > 0) {
    descriptions.push(`+${remaining} more`);
  }

  return descriptions.join(', ');
}

export function getElementContext(element: HTMLElement): string {
  if (element.textContent) {
    return element.textContent.trim().substring(0, 200);
  }
  return '';
}
