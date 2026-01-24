/**
 * NPS Rating Component
 */

import React from 'react';
import { useFeedback } from '../../context/FeedbackContext';
import { calculateNPSSegment } from '../../utils/validation';
import styles from './NPSRating.module.css';

interface NPSRatingProps {
  onNext: () => void;
  onSkip?: () => void;
}

export function NPSRating({ onNext, onSkip }: NPSRatingProps) {
  const { state, setNPSScore } = useFeedback();
  const npsScore = state.npsScore ?? null;

  const handleScoreClick = (score: number) => {
    setNPSScore(score);
  };

  const segment = npsScore !== null ? calculateNPSSegment(npsScore) : null;
  const canProceed = npsScore !== null;

  return (
    <div className={styles.container}>
      {npsScore !== null ? (
        <h3 className={styles.thankYouMessage}>
          Thanks for your feedback!
        </h3>
      ) : (
        <>
          <h3 className={styles.question}>
            How satisfied are you with this application?
          </h3>

          <div className={styles.scale} role="radiogroup" aria-label="NPS rating scale">
            {Array.from({ length: 11 }, (_, i) => (
              <button
                key={i}
                className={`${styles.scoreButton} ${
                  npsScore === i ? styles.selected : ''
                }`}
                onClick={() => handleScoreClick(i)}
                aria-label={`Rate ${i} out of 10`}
                type="button"
                role="radio"
                aria-checked={npsScore === i}
              >
                {i}
              </button>
            ))}
          </div>

          <div className={styles.labels}>
            <span>Not at all likely</span>
            <span>Extremely likely</span>
          </div>
        </>
      )}

      {segment && (
        <div className={styles.followUp}>
          <p className={styles.followUpQuestion}>
            {segment === 'detractor' && 'What frustrated you?'}
            {segment === 'passive' && 'What would make this better?'}
            {segment === 'promoter' && 'What do you love most?'}
          </p>
        </div>
      )}

      <div className={styles.actions}>
        {onSkip && (
          <button
            className={styles.skipButton}
            onClick={onSkip}
            type="button"
          >
            Skip
          </button>
        )}
        {canProceed && (
          <button
            className={styles.nextButton}
            onClick={onNext}
            type="button"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
