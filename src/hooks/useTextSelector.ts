/**
 * Hook for text selection annotation
 */

import { useEffect, useCallback } from 'react';
import { generateSelector } from '../utils/selector';
import { getTimestamp } from '../utils/contextCapture';
import type { Annotation } from '../types';

interface UseTextSelectorProps {
  enabled: boolean;
  maxAnnotations: number;
  onAnnotationCreate: (annotation: Annotation) => void;
}

export function useTextSelector({
  enabled,
  maxAnnotations,
  onAnnotationCreate,
}: UseTextSelectorProps) {
  const handleTextSelection = useCallback(() => {
    if (!enabled) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    if (range.collapsed) {
      return; // No text selected
    }

    // Get the containing element
    const container = range.commonAncestorContainer;
    const element =
      container.nodeType === Node.TEXT_NODE
        ? (container.parentElement as HTMLElement)
        : (container as HTMLElement);

    if (!element || element.closest('.feedback-component-container')) {
      return;
    }

    try {
      const selector = generateSelector(element);
      const selectedText = selection.toString().trim();

      if (!selectedText) return;

      // Get bounding rect of selection
      const rects = range.getClientRects();
      if (rects.length === 0) return;

      // Combine all rects into a bounding box
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      Array.from(rects).forEach((rect) => {
        minX = Math.min(minX, rect.left);
        minY = Math.min(minY, rect.top);
        maxX = Math.max(maxX, rect.right);
        maxY = Math.max(maxY, rect.bottom);
      });

      // Get text range info
      const textContent = element.textContent || '';
      const startOffset = range.startOffset;
      const endOffset = range.endOffset;

      const annotation: Annotation = {
        id: `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'text',
        selector,
        textContent: selectedText,
        coordinates: {
          x: minX + window.scrollX,
          y: minY + window.scrollY,
          width: maxX - minX,
          height: maxY - minY,
        },
        metadata: {
          textRange: {
            start: startOffset,
            end: endOffset,
          },
          elementPath: element.tagName.toLowerCase(),
        },
        timestamp: getTimestamp(),
      };

      onAnnotationCreate(annotation);

      // Clear selection
      selection.removeAllRanges();
    } catch (error) {
      console.error('Failed to create text annotation:', error);
    }
  }, [enabled, onAnnotationCreate]);

  useEffect(() => {
    if (!enabled) return;

    // Listen for mouseup to capture text selection
    document.addEventListener('mouseup', handleTextSelection);

    // Change cursor to indicate text selection mode
    document.body.style.cursor = 'text';

    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.body.style.cursor = '';
    };
  }, [enabled, handleTextSelection]);
}
