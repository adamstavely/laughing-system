/**
 * Quick Feedback Modal - Shown immediately after annotation
 */

import React, { useEffect, useRef, useState } from 'react';
import type { Annotation } from '../../types';
import { MessageSquare, X } from 'lucide-react';
import styles from './QuickFeedbackModal.module.css';

interface QuickFeedbackModalProps {
  annotation: Annotation;
  onClose: () => void;
  onSubmit: (feedback: string) => void;
}

export function QuickFeedbackModal({
  annotation,
  onClose,
  onSubmit,
}: QuickFeedbackModalProps) {
  const [feedback, setFeedback] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    inputRef.current?.focus();

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
  }, []);

  const handleSubmit = () => {
    if (feedback.trim()) {
      onSubmit(feedback.trim());
      onClose();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  // Get annotation description
  const getAnnotationDescription = () => {
    if (annotation.textContent && annotation.type === 'text') {
      const text = annotation.textContent.substring(0, 50);
      return `"${text}${annotation.textContent.length > 50 ? '...' : ''}"`;
    }
    if (annotation.selector) {
      // Extract a readable name from selector
      const match = annotation.selector.match(/#([\w-]+)|\[data-testid="([^"]+)"\]|\.([\w-]+)/);
      if (match) {
        return `"${match[1] || match[2] || match[3]}"`;
      }
      return `"${annotation.selector}"`;
    }
    return 'Selected element';
  };

  return (
    <div
      className={styles.backdrop}
      onClick={handleCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-feedback-title"
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <MessageSquare size={18} className={styles.headerIcon} />
            <h3 id="quick-feedback-title" className={styles.title}>
              {getAnnotationDescription()}
            </h3>
          </div>
          <button
            className={styles.closeButton}
            onClick={handleCancel}
            aria-label="Close modal"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className={styles.content}>
          <textarea
            ref={inputRef}
            className={styles.textarea}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What should change?"
            rows={4}
            autoFocus
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
    </div>
  );
}
