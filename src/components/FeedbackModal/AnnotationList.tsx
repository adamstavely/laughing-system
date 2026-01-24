/**
 * Annotation List Component
 */

import React, { useState } from 'react';
import { useFeedback } from '../../context/FeedbackContext';
import { Edit2, Check, X } from 'lucide-react';
import styles from './AnnotationList.module.css';

export function AnnotationList() {
  const { state, removeAnnotation, updateAnnotation } = useFeedback();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const handleStartEdit = (annotation: any) => {
    setEditingId(annotation.id);
    setEditText(annotation.metadata?.feedbackText || '');
  };

  const handleSaveEdit = (id: string) => {
    updateAnnotation(id, {
      metadata: {
        ...state.annotations.find(a => a.id === id)?.metadata,
        feedbackText: editText.trim(),
      },
    });
    setEditingId(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  if (state.annotations.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No annotations added. Add annotations by selecting elements, text, or areas on the page.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.list}>
        {state.annotations.map((annotation, index) => {
          const isEditing = editingId === annotation.id;
          const feedbackText = annotation.metadata?.feedbackText || '';

          return (
            <div key={annotation.id} className={styles.item}>
              <div className={styles.header}>
                <span className={styles.badge}>#{index + 1}</span>
                <span className={styles.type}>{annotation.type}</span>
                <div className={styles.actions}>
                  {!isEditing && (
                    <button
                      className={styles.editButton}
                      onClick={() => handleStartEdit(annotation)}
                      aria-label={`Edit annotation ${index + 1}`}
                      type="button"
                      title="Edit feedback"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                  <button
                    className={styles.removeButton}
                    onClick={() => removeAnnotation(annotation.id)}
                    aria-label={`Remove annotation ${index + 1}`}
                    type="button"
                    title="Remove annotation"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              {annotation.selector && (
                <div className={styles.selector}>
                  <code>{annotation.selector}</code>
                </div>
              )}
              
              {annotation.textContent && (
                <div className={styles.textContent}>
                  {annotation.textContent.substring(0, 100)}
                  {annotation.textContent.length > 100 && '...'}
                </div>
              )}

              {/* Feedback text section */}
              <div className={styles.feedbackSection}>
                {isEditing ? (
                  <div className={styles.editContainer}>
                    <textarea
                      className={styles.editTextarea}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      placeholder="What should change?"
                      rows={3}
                      autoFocus
                    />
                    <div className={styles.editActions}>
                      <button
                        className={styles.saveButton}
                        onClick={() => handleSaveEdit(annotation.id)}
                        type="button"
                        disabled={!editText.trim()}
                      >
                        <Check size={16} />
                        Save
                      </button>
                      <button
                        className={styles.cancelEditButton}
                        onClick={handleCancelEdit}
                        type="button"
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.feedbackText}>
                    {feedbackText ? (
                      <>
                        <div className={styles.feedbackLabel}>Feedback:</div>
                        <div className={styles.feedbackContent}>{feedbackText}</div>
                      </>
                    ) : (
                      <div className={styles.noFeedback}>
                        No feedback provided. Click edit to add feedback.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {annotation.screenshot && (
                <div className={styles.screenshot}>
                  <img
                    src={annotation.screenshot}
                    alt={`Annotation ${index + 1} screenshot`}
                    style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
