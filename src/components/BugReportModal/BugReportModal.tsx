/**
 * Bug Report Modal - Streamlined flow for reporting bugs
 */

import { useEffect } from 'react';
import { useFeedback } from '../../context/FeedbackContext';
import { AnnotationList } from '../FeedbackModal/AnnotationList';
import { BaseModal } from '../BaseModal';
import { useModalSubmission } from '../../hooks/useModalSubmission';
import type { JiraConfig, ElasticConfig, FeedbackData } from '../../types';
import { Bug } from 'lucide-react';
import sharedStyles from '../../styles/modal.shared.module.css';
import styles from './BugReportModal.module.css';

interface BugReportModalProps {
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

export function BugReportModal({
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
}: BugReportModalProps) {
  const {
    state,
    setSeverity,
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
    setIsSuccess,
  } = useModalSubmission({
    jiraConfig,
    elasticConfig,
    onSubmit,
    onError,
    getUserId,
    appVersion,
    customContext,
    screenshotQuality,
    category: 'bug',
    severity: state.severity,
    npsSegment: 'detractor',
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
    if (!state.severity) {
      validationErrors.push('Please select a severity level');
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
      title="Report a Bug"
      icon={<Bug size={20} />}
      ariaLabelledBy="bug-report-title"
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
              disabled={isSubmitting || state.annotations.length === 0 || !state.severity}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Bug Report'}
            </button>
          </>
        )
      }
    >
      {isSuccess ? (
        <div className={sharedStyles.modalSuccessMessage}>
          <div className={sharedStyles.modalSuccessIcon}>✓</div>
          <h3>Thank you for your feedback!</h3>
          <p>Your bug report has been submitted successfully.</p>
        </div>
      ) : (
        <>
          {/* Severity Selector */}
          <div className={sharedStyles.modalSection}>
            <label className={sharedStyles.modalLabel}>
              Severity <span className={sharedStyles.modalLabelRequired}>*</span>
            </label>
            <div className={styles.severityButtons}>
              {(['low', 'medium', 'high', 'critical'] as const).map((severity) => (
                <button
                  key={severity}
                  className={`${styles.severityButton} ${
                    state.severity === severity ? styles.selected : ''
                  }`}
                  onClick={() => setSeverity(severity)}
                  type="button"
                >
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Annotations */}
          <div className={sharedStyles.modalSection}>
            <label className={sharedStyles.modalLabel}>
              Annotations <span className={sharedStyles.modalLabelRequired}>*</span>
            </label>
            <p className={sharedStyles.modalHelpText}>
              Select elements, text, or areas on the page to highlight the bug
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
            <label className={sharedStyles.modalLabel} htmlFor="bug-additional-details">
              Additional Details (optional)
            </label>
            <textarea
              id="bug-additional-details"
              className={sharedStyles.modalTextarea}
              value={state.feedbackText || ''}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Describe the bug in detail, steps to reproduce, expected vs actual behavior..."
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
              <span>I'm open to follow-up questions about this bug</span>
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
