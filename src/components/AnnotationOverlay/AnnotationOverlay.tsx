/**
 * Annotation Overlay Component
 */

import React from 'react';
import { useFeedback } from '../../context/FeedbackContext';
import { ElementHighlight } from './ElementHighlight';
import { TextHighlight } from './TextHighlight';
import { AreaHighlight } from './AreaHighlight';
import { useSmartSelector } from '../../hooks/useSmartSelector';
import type { ToolMode } from '../../types';

interface AnnotationOverlayProps {
  toolMode: ToolMode;
  maxAnnotations: number;
  onAnnotationCreate?: (annotation: any) => void;
  selectorPriority?: string[];
}

export function AnnotationOverlay({
  toolMode,
  maxAnnotations,
  onAnnotationCreate,
  selectorPriority,
}: AnnotationOverlayProps) {
  const { state } = useFeedback();

  // Only run the selector hook when toolMode is not 'none'
  // This enables selection, but we still render highlights when toolMode is 'none'
  useSmartSelector({
    enabled: toolMode !== 'none',
    maxAnnotations,
    onAnnotationCreate: (annotation) => {
      onAnnotationCreate?.(annotation);
    },
    selectorPriority,
  });

  // Always render highlights if there are annotations, even when not in selection mode
  // This keeps the overlays visible on screen after they've been added
  if (state.annotations.length === 0) {
    return null;
  }

  return (
    <div className="feedback-annotation-overlay">
      {state.annotations.map((annotation, index) => {
        switch (annotation.type) {
          case 'element':
            return (
              <ElementHighlight
                key={annotation.id}
                annotation={annotation}
                index={index}
              />
            );
          case 'text':
            return (
              <TextHighlight
                key={annotation.id}
                annotation={annotation}
                index={index}
              />
            );
          case 'area':
            return (
              <AreaHighlight
                key={annotation.id}
                annotation={annotation}
                index={index}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
