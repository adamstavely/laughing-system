/**
 * Inline Feedback Tooltip - Replaces QuickFeedbackModal
 * Appears near the annotation for less intrusive feedback collection
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { Annotation } from '../../types';
import styles from './InlineFeedbackTooltip.module.css';

interface InlineFeedbackTooltipProps {
  annotation: Annotation;
  position: { x: number; y: number };
  onClose: () => void;
  onSubmit: (feedback: string) => void;
}

export function InlineFeedbackTooltip({
  position,
  onClose,
  onSubmit,
}: InlineFeedbackTooltipProps) {
  const [feedback, setFeedback] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState(position);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleSubmit = useCallback(() => {
    if (feedback.trim()) {
      onSubmit(feedback.trim());
      onClose();
    }
  }, [feedback, onSubmit, onClose]);

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
        return;
      }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleSubmit();
        return;
      }

      // Focus trap: Tab and Shift+Tab
      if (e.key === 'Tab' && tooltipRef.current) {
        const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const focusableElements = Array.from(
          tooltipRef.current.querySelectorAll<HTMLElement>(selector)
        ).filter(
          (el) => !el.hasAttribute('disabled') && !el.hasAttribute('aria-hidden')
        );

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

        if (e.shiftKey) {
          // Shift+Tab: move backwards
          if (currentIndex <= 0 || document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: move forwards
          if (currentIndex === focusableElements.length - 1 || document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    };
  }, [position, handleSubmit, onClose]);

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
