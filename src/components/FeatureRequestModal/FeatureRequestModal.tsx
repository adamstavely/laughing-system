/**
 * Feature Request Modal - Streamlined flow for requesting features
 */

import { useEffect } from 'react';
import { useFeedback } from '../../context/FeedbackContext';
import { AnnotationList } from '../FeedbackModal/AnnotationList';
import { BaseModal } from '../BaseModal';
import { useModalSubmission } from '../../hooks/useModalSubmission';
import type { JiraConfig, ElasticConfig, FeedbackData } from '../../types';
import { Sparkles } from 'lucide-react';
import sharedStyles from '../../styles/modal.shared.module.css';
import styles from './FeatureRequestModal.module.css';

interface FeatureRequestModalProps {
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

export function FeatureRequestModal({
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
}: FeatureRequestModalProps) {
  const {
    state,
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
    category: 'feature',
    npsSegment: 'promoter',
  });

  // Keep toolbar expanded when modal opens
  useEffect(() => {
    setToolbarExpanded(true);
  }, [setToolbarExpanded]);

  // Handle submission with validation
  const handleSubmitWithValidation = async () => {
    const validationErrors: string[] = [];
    if (state.annotations.length === 0) {
      validationErrors.push('Please add at least one annotation');
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
      title="Request a Feature"
      icon={<Sparkles size={20} />}
      ariaLabelledBy="feature-request-title"
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
              disabled={isSubmitting || state.annotations.length === 0}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feature Request'}
            </button>
          </>
        )
      }
    >
      {isSuccess ? (
        <div className={sharedStyles.modalSuccessMessage}>
          <div className={sharedStyles.modalSuccessIcon}>✓</div>
          <h3>Thank you for your feedback!</h3>
          <p>Your feature request has been submitted successfully.</p>
        </div>
      ) : (
        <>
          {/* Annotations */}
          <div className={sharedStyles.modalSection}>
            <label className={sharedStyles.modalLabel}>
              Annotations <span className={sharedStyles.modalLabelRequired}>*</span>
            </label>
            <p className={sharedStyles.modalHelpText}>
              Select elements, text, or areas on the page to show where this feature should be added
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

          {/* Additional Details */}
          <div className={sharedStyles.modalSection}>
            <label className={sharedStyles.modalLabel} htmlFor="feature-additional-details">
              Additional Details (optional)
            </label>
            <textarea
              id="feature-additional-details"
              className={sharedStyles.modalTextarea}
              value={state.feedbackText || ''}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Describe the feature you'd like to see, use cases, benefits..."
              rows={4}
              maxLength={5000}
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
              <span>I'm open to follow-up questions about this feature</span>
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
