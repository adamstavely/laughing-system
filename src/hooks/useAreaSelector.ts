/**
 * Hook for area selection annotation (drag to select region)
 */

import { useEffect, useCallback, useRef } from 'react';
import { getTimestamp } from '../utils/contextCapture';
import type { Annotation } from '../types';

interface UseAreaSelectorProps {
  enabled: boolean;
  maxAnnotations: number;
  onAnnotationCreate: (annotation: Annotation) => void;
}

export function useAreaSelector({
  enabled,
  maxAnnotations,
  onAnnotationCreate,
}: UseAreaSelectorProps) {
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!enabled) return;

      const target = e.target as HTMLElement;
      if (target.closest('.feedback-component-container')) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      startPos.current = {
        x: e.clientX + window.scrollX,
        y: e.clientY + window.scrollY,
      };

      // Create overlay element for visual feedback
      const overlay = document.createElement('div');
      overlay.className = 'feedback-area-selection-overlay';
      overlay.style.position = 'absolute';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '99999';
      overlay.style.border = '2px dashed var(--annotation-highlight, #3b82f6)';
      overlay.style.backgroundColor = 'var(--annotation-overlay, rgba(59, 130, 246, 0.1))';
      overlay.style.borderRadius = '4px';
      document.body.appendChild(overlay);
      overlayRef.current = overlay;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!startPos.current || !overlay) return;

        const currentX = moveEvent.clientX + window.scrollX;
        const currentY = moveEvent.clientY + window.scrollY;

        const left = Math.min(startPos.current.x, currentX);
        const top = Math.min(startPos.current.y, currentY);
        const width = Math.abs(currentX - startPos.current.x);
        const height = Math.abs(currentY - startPos.current.y);

        overlay.style.left = `${left}px`;
        overlay.style.top = `${top}px`;
        overlay.style.width = `${width}px`;
        overlay.style.height = `${height}px`;
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        if (!startPos.current) return;

        const endX = upEvent.clientX + window.scrollX;
        const endY = upEvent.clientY + window.scrollY;

        const left = Math.min(startPos.current.x, endX);
        const top = Math.min(startPos.current.y, endY);
        const width = Math.abs(endX - startPos.current.x);
        const height = Math.abs(endY - startPos.current.y);

        // Only create annotation if area is large enough
        if (width > 10 && height > 10) {
          const annotation: Annotation = {
            id: `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'area',
            coordinates: {
              x: left,
              y: top,
              width,
              height,
            },
            metadata: {},
            timestamp: getTimestamp(),
          };

          onAnnotationCreate(annotation);
        }

        // Cleanup
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        if (overlayRef.current) {
          overlayRef.current.remove();
          overlayRef.current = null;
        }
        startPos.current = null;
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp, { once: true });
    },
    [enabled, onAnnotationCreate]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('mousedown', handleMouseDown, true);
    document.body.style.cursor = 'crosshair';

    return () => {
      document.removeEventListener('mousedown', handleMouseDown, true);
      document.body.style.cursor = '';
      if (overlayRef.current) {
        overlayRef.current.remove();
        overlayRef.current = null;
      }
    };
  }, [enabled, handleMouseDown]);
}
