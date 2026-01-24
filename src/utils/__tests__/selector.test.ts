/**
 * Selector generation tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateSelector, validateSelector } from '../selector';

describe('selector', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('generateSelector', () => {
    it('should prefer data-testid', () => {
      const element = document.createElement('button');
      element.setAttribute('data-testid', 'test-button');
      element.id = 'button-id';
      container.appendChild(element);

      const selector = generateSelector(element);
      expect(selector).toBe('[data-testid="test-button"]');
    });

    it('should use ID if no data-testid', () => {
      const element = document.createElement('button');
      element.id = 'button-id';
      container.appendChild(element);

      const selector = generateSelector(element);
      expect(selector).toBe('#button-id');
    });

    it('should use unique class if available', () => {
      const element = document.createElement('button');
      element.className = 'unique-button-class';
      container.appendChild(element);

      const selector = generateSelector(element);
      expect(selector).toContain('unique-button-class');
    });

    it('should fallback to nth-child', () => {
      const parent = document.createElement('div');
      const element1 = document.createElement('button');
      const element2 = document.createElement('button');
      parent.appendChild(element1);
      parent.appendChild(element2);
      container.appendChild(parent);

      const selector = generateSelector(element2);
      expect(selector).toContain('nth-child');
    });
  });

  describe('validateSelector', () => {
    it('should validate unique selector', () => {
      const element = document.createElement('button');
      element.id = 'unique-button';
      container.appendChild(element);

      const selector = generateSelector(element);
      expect(validateSelector(selector)).toBe(true);
    });

    it('should reject invalid selector', () => {
      expect(validateSelector('invalid[selector')).toBe(false);
    });
  });
});
