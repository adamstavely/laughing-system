/**
 * General Feedback Modal - For general feedback, questions, praise, etc.
 */

import { useEffect } from 'react';
import { useFeedback } from '../../context/FeedbackContext';
import { AnnotationList } from '../FeedbackModal/AnnotationList';
import { BaseModal } from '../BaseModal';
import { useModalSubmission } from '../../hooks/useModalSubmission';
import type { JiraConfig, ElasticConfig, FeedbackData } from '../../types';
import { MessageSquarePlus } from 'lucide-react';
import sharedStyles from '../../styles/modal.shared.module.css';
import styles from './GeneralFeedbackModal.module.css';

interface GeneralFeedbackModalProps {
  jiraConfig?: JiraConfig;
  elasticConfig?: ElasticConfig;
  onSubmit?: (feedback: FeedbackData) => void;
  onError?: (error: Error) => void;
  getUserId?: () => string | null;
  appVersion?: string;
  customContext?: Record<string, any>;
  screenshotQuality?: number;
  onClose: () => void;
  onAddAnnotation?: () => void;
}

export function GeneralFeedbackModal({
  jiraConfig,
  elasticConfig,
  onSubmit,
  onError,
  getUserId,
  appVersion,
  customContext,
  screenshotQuality = 0.8,
  onClose,
  onAddAnnotation,
}: GeneralFeedbackModalProps) {
  const {
    state,
    setCategory,
    setContactPreference,
    setFeedbackText,
    setToolbarExpanded,
    setToolMode,
    reset,
  } = useFeedback();

  // Use shared submission hook
  const {
    isSubmitting,
    isSuccess,
    errors,
    isGeneratingScreenshots,
    handleSubmit,
    setErrors,
  } = useModalSubmission({
    jiraConfig,
    elasticConfig,
    onSubmit,
    onError,
    getUserId,
    appVersion,
    customContext,
    screenshotQuality,
    category: state.category || 'other',
    npsSegment: 'passive',
  });

  // Keep toolbar expanded when modal opens
  useEffect(() => {
    setToolbarExpanded(true);
  }, [setToolbarExpanded]);

  // Handle submission with validation
  const handleSubmitWithValidation = async () => {
    const validationErrors: string[] = [];
    if (!state.feedbackText || state.feedbackText.trim().length < 10) {
      validationErrors.push('Please provide feedback (at least 10 characters)');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    await handleSubmit(() => validationErrors);
  };

  // Update success state when it changes - close modal after success
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        reset();
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, reset, onClose]);

  const handleAddAnnotation = () => {
    onClose();
    setToolbarExpanded(true);
    setToolMode('element');
    onAddAnnotation?.();
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="General Feedback"
      icon={<MessageSquarePlus size={20} />}
      ariaLabelledBy="general-feedback-title"
      footer={
        !isSuccess && (
          <>
            <button
              className={sharedStyles.modalButtonCancel}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className={sharedStyles.modalButtonPrimary}
              onClick={handleSubmitWithValidation}
              type="button"
              disabled={isSubmitting || !state.feedbackText || state.feedbackText.trim().length < 10}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </>
        )
      }
    >
      {isSuccess ? (
        <div className={sharedStyles.modalSuccessMessage}>
          <div className={sharedStyles.modalSuccessIcon}>✓</div>
          <h3>Thank you for your feedback!</h3>
          <p>Your feedback has been submitted successfully.</p>
        </div>
      ) : (
        <>
          {/* Category Selector */}
          <div className={sharedStyles.modalSection}>
            <label className={sharedStyles.modalLabel}>
              Category (optional)
            </label>
            <div className={styles.categoryButtons}>
              {(['question', 'praise', 'other'] as const).map((category) => (
                <button
                  key={category}
                  className={`${styles.categoryButton} ${
                    state.category === category ? styles.selected : ''
                  }`}
                  onClick={() => setCategory(category)}
                  type="button"
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Annotations */}
          <div className={sharedStyles.modalSection}>
            <label className={sharedStyles.modalLabel}>
              Annotations (optional)
            </label>
            <p className={sharedStyles.modalHelpText}>
              Select elements, text, or areas on the page to provide visual context
            </p>
            {isGeneratingScreenshots && (
              <div className={styles.screenshotLoading}>
                <div className={styles.loadingSpinner}></div>
                <p>Generating screenshots...</p>
              </div>
            )}
            {state.annotations.length === 0 ? (
              <div className={styles.emptyAnnotations}>
                <p>No annotations yet. Click the button below to add annotations.</p>
                <button
                  className={styles.addAnnotationButton}
                  onClick={handleAddAnnotation}
                  type="button"
                >
                  Add Annotation
                </button>
              </div>
            ) : (
              <>
                <AnnotationList />
                <button
                  className={styles.addAnotherButton}
                  onClick={handleAddAnnotation}
                  type="button"
                >
                  + Add Another Annotation
                </button>
              </>
            )}
          </div>

          {/* Feedback Text */}
          <div className={sharedStyles.modalSection}>
            <label className={sharedStyles.modalLabel} htmlFor="general-feedback-text">
              Your Feedback <span className={sharedStyles.modalLabelRequired}>*</span>
            </label>
            <textarea
              id="general-feedback-text"
              className={sharedStyles.modalTextarea}
              value={state.feedbackText || ''}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Share your thoughts, questions, or feedback..."
              rows={6}
              maxLength={5000}
              required
            />
            <div className={sharedStyles.modalCharCount}>
              {5000 - (state.feedbackText?.length || 0)} characters remaining
            </div>
          </div>

          {/* Follow-up Preference */}
          <div className={sharedStyles.modalSection}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={state.contactPreference}
                onChange={(e) => setContactPreference(e.target.checked)}
                className={styles.checkbox}
              />
              <span>I'm open to follow-up questions</span>
            </label>
          </div>

          {/* Error messages */}
          {errors.length > 0 && (
            <div className={sharedStyles.modalErrorContainer} role="alert">
              {errors.map((error, index) => (
                <div key={index} className={sharedStyles.modalErrorMessage}>
                  {error}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </BaseModal>
  );
}
