/**
 * Hook for element selection annotation
 */

import { useEffect, useCallback } from 'react';
import { generateSelector } from '../utils/selector';
import { getTimestamp } from '../utils/contextCapture';
import type { Annotation } from '../types';

interface UseElementSelectorProps {
  enabled: boolean;
  maxAnnotations: number;
  onAnnotationCreate: (annotation: Annotation) => void;
  selectorPriority?: string[];
}

export function useElementSelector({
  enabled,
  maxAnnotations,
  onAnnotationCreate,
  selectorPriority,
}: UseElementSelectorProps) {
  const handleElementClick = useCallback(
    (e: MouseEvent) => {
      if (!enabled) return;

      const target = e.target as HTMLElement;
      if (!target || target.closest('.feedback-component-container')) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      try {
        const selector = generateSelector(target, selectorPriority);
        const rect = target.getBoundingClientRect();

        // Get computed styles (key properties)
        const computedStyles: Record<string, string> = {};
        const style = window.getComputedStyle(target);
        const importantProps = [
          'color',
          'backgroundColor',
          'fontSize',
          'fontWeight',
          'display',
          'position',
        ];
        importantProps.forEach((prop) => {
          computedStyles[prop] = style.getPropertyValue(prop);
        });

        // Get element path
        const elementPath: string[] = [];
        let current: HTMLElement | null = target;
        while (current && current !== document.body) {
          elementPath.unshift(current.tagName.toLowerCase());
          current = current.parentElement;
        }

        const annotation: Annotation = {
          id: `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'element',
          selector,
          textContent: target.textContent?.substring(0, 200) || undefined,
          coordinates: {
            x: rect.x + window.scrollX,
            y: rect.y + window.scrollY,
            width: rect.width,
            height: rect.height,
          },
          metadata: {
            computedStyles,
            elementPath: elementPath.join(' > '),
          },
          timestamp: getTimestamp(),
        };

        onAnnotationCreate(annotation);
      } catch (error) {
        console.error('Failed to create annotation:', error);
      }
    },
    [enabled, onAnnotationCreate]
  );

  useEffect(() => {
    if (!enabled) return;

    // Add click listener with capture to intercept
    document.addEventListener('click', handleElementClick, true);

    // Change cursor to indicate selection mode
    document.body.style.cursor = 'crosshair';

    return () => {
      document.removeEventListener('click', handleElementClick, true);
      document.body.style.cursor = '';
    };
  }, [enabled, handleElementClick]);
}
