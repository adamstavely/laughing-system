/**
 * Feedback Textarea Component
 */

import React from 'react';
import { useFeedback } from '../../context/FeedbackContext';
import { validateFeedbackText } from '../../utils/validation';
import styles from './FeedbackTextarea.module.css';

const MIN_LENGTH = 10;
const MAX_LENGTH = 5000;

export function FeedbackTextarea() {
  const { state, setFeedbackText } = useFeedback();
  const [error, setError] = React.useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setFeedbackText(text);

    // Only validate if text is provided (optional field)
    if (text.length > 0) {
      const validation = validateFeedbackText(text);
      if (!validation.valid) {
        setError(validation.error || null);
      } else {
        setError(null);
      }
    } else {
      setError(null);
    }
  };

  const remaining = MAX_LENGTH - state.feedbackText.length;
  const isNearLimit = remaining < 100;

  return (
    <div className={styles.container}>
      <label htmlFor="feedback-text" className={styles.label}>
        Overall feedback (optional)
      </label>
      <textarea
        id="feedback-text"
        className={`${styles.textarea} ${error ? styles.error : ''}`}
        value={state.feedbackText}
        onChange={handleChange}
        placeholder="Optionally provide overall feedback about your experience..."
        rows={6}
        maxLength={MAX_LENGTH}
        aria-describedby="feedback-help feedback-error"
        aria-invalid={error ? 'true' : 'false'}
      />
      <div className={styles.footer}>
        {error && (
          <span id="feedback-error" className={styles.errorText} role="alert">
            {error}
          </span>
        )}
        <span
          id="feedback-help"
          className={`${styles.counter} ${isNearLimit ? styles.warning : ''}`}
        >
          {remaining} characters remaining
        </span>
      </div>
    </div>
  );
}
