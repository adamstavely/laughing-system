/**
 * Inline Feedback Tooltip - Replaces QuickFeedbackModal
 * Appears near the annotation for less intrusive feedback collection
 */

import React, { useEffect, useRef, useState } from 'react';
import type { Annotation } from '../../types';
import styles from './InlineFeedbackTooltip.module.css';

interface InlineFeedbackTooltipProps {
  annotation: Annotation;
  position: { x: number; y: number };
  onClose: () => void;
  onSubmit: (feedback: string) => void;
}

export function InlineFeedbackTooltip({
  annotation,
  position,
  onClose,
  onSubmit,
}: InlineFeedbackTooltipProps) {
  const [feedback, setFeedback] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState(position);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    textareaRef.current?.focus();

    // Position tooltip to avoid viewport edges
    if (tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let x = position.x;
      let y = position.y - rect.height - 10; // Position above by default

      // Adjust if tooltip would go off screen
      if (x + rect.width > viewportWidth) {
        x = viewportWidth - rect.width - 10;
      }
      if (x < 10) {
        x = 10;
      }
      if (y < 10) {
        y = position.y + 10; // Position below if no room above
      }
      if (y + rect.height > viewportHeight - 10) {
        y = viewportHeight - rect.height - 10;
      }

      setTooltipPosition({ x, y });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleSubmit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    };
  }, [position]);

  const handleSubmit = () => {
    if (feedback.trim()) {
      onSubmit(feedback.trim());
      onClose();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <>
      {/* Backdrop to capture clicks outside */}
      <div
        className={styles.backdrop}
        onClick={handleCancel}
        aria-hidden="true"
      />
      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={styles.tooltip}
        style={{
          left: `${tooltipPosition.x}px`,
          top: `${tooltipPosition.y}px`,
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inline-feedback-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <label htmlFor="inline-feedback-text" id="inline-feedback-title" className={styles.label}>
            What should change?
          </label>
        </div>
        <div className={styles.content}>
          <textarea
            id="inline-feedback-text"
            ref={textareaRef}
            className={styles.textarea}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Describe what should change..."
            rows={3}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
        </div>
        <div className={styles.footer}>
          <button
            className={styles.cancelButton}
            onClick={handleCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className={styles.addButton}
            onClick={handleSubmit}
            type="button"
            disabled={!feedback.trim()}
          >
            Add
          </button>
        </div>
      </div>
    </>
  );
}
