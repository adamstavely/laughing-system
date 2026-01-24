/**
 * Smart Selector Hook - Automatically detects element, text, or area selection
 */

import { useEffect, useCallback, useRef } from 'react';
import { generateSelector } from '../utils/selector';
import { getTimestamp } from '../utils/contextCapture';
import {
  getFullDOMPath,
  getComprehensiveComputedStyles,
  getNearbyElements,
  getPositionDetails,
  getElementContext,
} from '../utils/annotationContext';
import type { Annotation } from '../types';

interface UseSmartSelectorProps {
  enabled: boolean;
  onAnnotationCreate: (annotation: Annotation) => void;
  selectorPriority?: string[];
}

export function useSmartSelector({
  enabled,
  onAnnotationCreate,
  selectorPriority,
}: UseSmartSelectorProps) {
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const dragOverlay = useRef<HTMLDivElement | null>(null);

  // Handle text selection
  const handleTextSelection = useCallback(() => {
    if (!enabled || isDragging.current || mouseDownPos.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    const container = range.commonAncestorContainer;
    const element =
      container.nodeType === Node.TEXT_NODE
        ? (container.parentElement as HTMLElement)
        : (container as HTMLElement);

    if (!element || element.closest('.feedback-component-container')) {
      return;
    }

    try {
      const selector = generateSelector(element, selectorPriority);
      const selectedText = selection.toString().trim();
      if (!selectedText) return;

      const rects = range.getClientRects();
      if (rects.length === 0) return;

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      Array.from(rects).forEach((rect) => {
        minX = Math.min(minX, rect.left);
        minY = Math.min(minY, rect.top);
        maxX = Math.max(maxX, rect.right);
        maxY = Math.max(maxY, rect.bottom);
      });

      // Get comprehensive context for text selection
      const fullDOMPath = getFullDOMPath(element);
      const computedStyles = getComprehensiveComputedStyles(element);
      const nearbyElements = getNearbyElements(element, 3);
      const rect = element.getBoundingClientRect();
      const position = getPositionDetails(rect, window.scrollX, window.scrollY);

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
          elementCount: 1,
          elementDescription: `text: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`,
          fullDOMPath,
          position: {
            x: position.x,
            y: position.y,
            width: position.width,
            height: position.height,
            percentageFromLeft: position.percentageFromLeft,
            pixelsFromTop: position.pixelsFromTop,
          },
          context: selectedText,
          computedStyles,
          nearbyElements,
          // Legacy field
          textRange: {
            start: range.startOffset,
            end: range.endOffset,
          },
          elementPath: element.tagName.toLowerCase(),
        },
        timestamp: getTimestamp(),
      };

      onAnnotationCreate(annotation);
      selection.removeAllRanges();
    } catch (error) {
      console.error('Failed to create text annotation:', error);
    }
  }, [enabled, onAnnotationCreate, selectorPriority]);

  // Handle mouse down for element/area selection
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!enabled) return;

      const target = e.target as HTMLElement;
      if (target.closest('.feedback-component-container')) {
        return;
      }

      mouseDownPos.current = {
        x: e.clientX + window.scrollX,
        y: e.clientY + window.scrollY,
      };
      isDragging.current = false;

      // Create drag overlay
      const overlay = document.createElement('div');
      overlay.className = 'feedback-smart-select-overlay';
      overlay.style.position = 'absolute';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '99999';
      overlay.style.border = '2px dashed rgba(59, 130, 246, 0.6)';
      overlay.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
      overlay.style.borderRadius = '4px';
      document.body.appendChild(overlay);
      dragOverlay.current = overlay;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!mouseDownPos.current) return;

        const currentX = moveEvent.clientX + window.scrollX;
        const currentY = moveEvent.clientY + window.scrollY;
        const distance = Math.sqrt(
          Math.pow(currentX - mouseDownPos.current.x, 2) +
          Math.pow(currentY - mouseDownPos.current.y, 2)
        );

        if (distance > 5) {
          isDragging.current = true;
        }

        if (isDragging.current && overlay) {
          const left = Math.min(mouseDownPos.current.x, currentX);
          const top = Math.min(mouseDownPos.current.y, currentY);
          const width = Math.abs(currentX - mouseDownPos.current.x);
          const height = Math.abs(currentY - mouseDownPos.current.y);

          overlay.style.left = `${left}px`;
          overlay.style.top = `${top}px`;
          overlay.style.width = `${width}px`;
          overlay.style.height = `${height}px`;
        }
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        if (!mouseDownPos.current) return;

        const endX = upEvent.clientX + window.scrollX;
        const endY = upEvent.clientY + window.scrollY;
        const distance = Math.sqrt(
          Math.pow(endX - mouseDownPos.current.x, 2) +
          Math.pow(endY - mouseDownPos.current.y, 2)
        );

        // Cleanup overlay
        if (dragOverlay.current) {
          dragOverlay.current.remove();
          dragOverlay.current = null;
        }

        // If dragged, create area annotation
        if (isDragging.current && distance > 10) {
          const left = Math.min(mouseDownPos.current.x, endX);
          const top = Math.min(mouseDownPos.current.y, endY);
          const width = Math.abs(endX - mouseDownPos.current.x);
          const height = Math.abs(endY - mouseDownPos.current.y);

          if (width > 10 && height > 10) {
            // For area selections, find elements within the area
            const elementsInArea = document.elementsFromPoint(
              left + width / 2,
              top + height / 2
            ) as HTMLElement[];
            
            const primaryElement = elementsInArea.find(
              (el) => !el.closest('.feedback-component-container')
            ) as HTMLElement | undefined;

            let metadata: Annotation['metadata'] = {
              elementCount: 0,
            };

            if (primaryElement) {
              const rect = primaryElement.getBoundingClientRect();
              const fullDOMPath = getFullDOMPath(primaryElement);
              const computedStyles = getComprehensiveComputedStyles(primaryElement);
              const nearbyElements = getNearbyElements(primaryElement, 3);
              const position = getPositionDetails(rect, window.scrollX, window.scrollY);
              const context = getElementContext(primaryElement);

              metadata = {
                elementCount: elementsInArea.length,
                fullDOMPath,
                position: {
                  x: position.x,
                  y: position.y,
                  width: position.width,
                  height: position.height,
                  percentageFromLeft: position.percentageFromLeft,
                  pixelsFromTop: position.pixelsFromTop,
                },
                context,
                computedStyles,
                nearbyElements,
              };
            }

            const annotation: Annotation = {
              id: `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: 'area',
              coordinates: {
                x: left,
                y: top,
                width,
                height,
              },
              metadata,
              timestamp: getTimestamp(),
            };
            onAnnotationCreate(annotation);
          }
        } else if (!isDragging.current) {
          // Single click - element selection
          const target = upEvent.target as HTMLElement;
          if (target && !target.closest('.feedback-component-container')) {
            try {
              const selector = generateSelector(target, selectorPriority);
              const rect = target.getBoundingClientRect();

              // Collect comprehensive context
              const fullDOMPath = getFullDOMPath(target);
              const computedStyles = getComprehensiveComputedStyles(target);
              const nearbyElements = getNearbyElements(target, 3);
              const position = getPositionDetails(rect, window.scrollX, window.scrollY);
              const context = getElementContext(target);

              // Legacy element path for backward compatibility
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
                  x: position.x,
                  y: position.y,
                  width: position.width,
                  height: position.height,
                },
                metadata: {
                  elementCount: 1,
                  elementDescription: `${target.tagName.toLowerCase()}${context ? ` "${context.substring(0, 50)}${context.length > 50 ? '...' : ''}"` : ''}`,
                  fullDOMPath,
                  position: {
                    x: position.x,
                    y: position.y,
                    width: position.width,
                    height: position.height,
                    percentageFromLeft: position.percentageFromLeft,
                    pixelsFromTop: position.pixelsFromTop,
                  },
                  context,
                  computedStyles,
                  nearbyElements,
                  // Legacy fields for backward compatibility
                  elementPath: elementPath.join(' > '),
                },
                timestamp: getTimestamp(),
              };

              onAnnotationCreate(annotation);
            } catch (error) {
              console.error('Failed to create element annotation:', error);
            }
          }
        }

        mouseDownPos.current = null;
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp, { once: true });
    },
    [enabled, onAnnotationCreate, selectorPriority]
  );

  useEffect(() => {
    if (!enabled) return;

    // Listen for text selection
    document.addEventListener('mouseup', handleTextSelection);

    // Listen for element/area selection
    document.addEventListener('mousedown', handleMouseDown, true);

    // Change cursor
    document.body.style.cursor = 'crosshair';

    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('mousedown', handleMouseDown, true);
      document.body.style.cursor = '';
      if (dragOverlay.current) {
        dragOverlay.current.remove();
        dragOverlay.current = null;
      }
    };
  }, [enabled, handleTextSelection, handleMouseDown]);
}
