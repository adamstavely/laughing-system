/**
 * Feedback Modal Component
 */

import React, { useEffect, useRef } from 'react';
import { useFeedback } from '../../context/FeedbackContext';
import { NPSRating } from './NPSRating';
import { saveLastNPSSubmission, shouldResetNPS } from '../../utils/storage';
import { AnnotationList } from './AnnotationList';
import type { JiraConfig, ElasticConfig } from '../../types';
import { calculateNPSSegment } from '../../utils/validation';
import { useModalSubmission } from '../../hooks/useModalSubmission';
import { MessageSquare } from 'lucide-react';
import styles from './FeedbackModal.module.css';

interface FeedbackModalProps {
  jiraConfig?: JiraConfig;
  elasticConfig?: ElasticConfig;
  onSubmit?: (feedback: any) => void;
  onError?: (error: Error) => void;
  requireCategory?: boolean;
  enableNPS?: boolean;
  getUserId?: () => string | null;
  appVersion?: string;
  customContext?: Record<string, any>;
  screenshotQuality?: number;
}

const TOTAL_STEPS = 3; // Step 1: Review, Step 2: NPS (after submit), Step 3: Confirmation

// Validation helper for each step
function validateStep(
  step: number,
  state: any,
  requireCategory: boolean,
  enableNPS: boolean
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (step === 1) {
    // Step 1: At least one annotation required
    if (state.annotations.length === 0) {
      errors.push('Please add at least one annotation');
    }
  }

  if (step === 2 && enableNPS) {
    // Step 2: NPS is optional, no validation needed
    return { valid: true, errors: [] };
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function FeedbackModal({
  jiraConfig,
  elasticConfig,
  onSubmit,
  onError,
  requireCategory = false,
  enableNPS = true,
  getUserId,
  appVersion,
  customContext,
  screenshotQuality = 0.8,
}: FeedbackModalProps) {
  const {
    state,
    setModalOpen,
    setCurrentStep,
    reset,
    dispatch,
    setToolbarExpanded,
    setToolMode,
  } = useFeedback();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

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
    category: state.category,
    severity: state.severity,
    npsScore: state.npsScore ?? 0,
    npsSegment: calculateNPSSegment(state.npsScore ?? 0),
    autoGenerateScreenshots: state.currentStep === 1,
  });

  // Check if NPS should be reset when modal opens (90 days have passed)
  useEffect(() => {
    if (state.isModalOpen && enableNPS && shouldResetNPS() && state.npsScore !== null) {
      // Reset NPS score if 90 days have passed
      dispatch({ type: 'SET_NPS_SCORE', payload: null });
    }
  }, [state.isModalOpen, enableNPS, state.npsScore, dispatch]);

  // Focus trap and close toolbar when modal opens
  useEffect(() => {
    if (!state.isModalOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement;
    
    // Get all focusable elements within the modal
    const getFocusableElements = (): HTMLElement[] => {
      if (!modalRef.current) return [];
      
      const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      return Array.from(modalRef.current.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => !el.hasAttribute('disabled') && !el.hasAttribute('aria-hidden')
      );
    };

    // Focus first focusable element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    } else {
      modalRef.current?.focus();
    }
    
    // Close toolbar when modal opens
    setToolbarExpanded(false);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
        return;
      }

      // Focus trap: Tab and Shift+Tab
      if (e.key === 'Tab') {
        const focusableElements = getFocusableElements();
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
  }, [state.isModalOpen, handleClose, setToolbarExpanded]);

  const handleClose = () => {
    // TODO: Check for unsaved changes
    setModalOpen(false);
    setCurrentStep(1);
    setErrors([]);
    setIsSuccess(false);
  };

  const handleNext = () => {
    // Validate current step before proceeding
    const validation = validateStep(
      state.currentStep,
      state,
      requireCategory,
      enableNPS
    );

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors([]);
    if (state.currentStep < TOTAL_STEPS) {
      setCurrentStep(state.currentStep + 1);
    }
  };

  const handleSubmitStep = async () => {
    // Validate before submit (Step 1: Review annotations)
    const validation = validateStep(1, state, requireCategory, enableNPS);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors([]);
    await handleSubmit(() => validation.errors);
  };

  useEffect(() => {
    if (!isSuccess) return;

    if (enableNPS) {
      setCurrentStep(2);
    } else {
      setCurrentStep(3);
    }
  }, [isSuccess, enableNPS, setCurrentStep]);

  const progress = (state.currentStep / TOTAL_STEPS) * 100;

  return (
    <div
      className={styles.backdrop}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      <div
        ref={modalRef}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <MessageSquare size={20} className={styles.headerIcon} />
            <div>
              <h2 id="feedback-modal-title">Share Your Feedback</h2>
              <div className={styles.stepIndicator}>
                Step {state.currentStep} of {TOTAL_STEPS}
              </div>
            </div>
          </div>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className={styles.progress}>
          <div
            className={styles.progressBar}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className={styles.content}>
          {/* Step 1: Review & Edit Annotations */}
          {state.currentStep === 1 && (
            <div>
              <div className={styles.stepHeader}>
                <h3>Review Annotations</h3>
                <p className={styles.stepDescription}>
                  Review and edit your annotations. At least one annotation is required.
                </p>
              </div>
              {isGeneratingScreenshots && (
                <div className={styles.screenshotLoading}>
                  <div className={styles.loadingSpinner}></div>
                  <p>Generating screenshots...</p>
                </div>
              )}
              <AnnotationList />
              <div className={styles.addAnotherContainer}>
                <button
                  className={styles.addAnotherButton}
                  onClick={() => {
                    setModalOpen(false);
                    setToolbarExpanded(true);
                    setToolMode('element');
                  }}
                  type="button"
                >
                  + Add Another Annotation
                </button>
              </div>
            </div>
          )}
          
          {/* Step 2: NPS (after submission) */}
          {state.currentStep === 2 && enableNPS && (
            <div>
              <div className={styles.stepHeader}>
                <h3>How likely are you to recommend us?</h3>
                <p className={styles.stepDescription}>
                  Your feedback has been submitted! This step is optional.
                </p>
              </div>
              <NPSRating 
                onNext={() => {
                  // Save NPS submission timestamp when user provides a score
                  if (state.npsScore !== null) {
                    saveLastNPSSubmission();
                  }
                  // Move to confirmation after NPS
                  setCurrentStep(3);
                }} 
                onSkip={() => {
                  // Skip NPS and go to confirmation
                  setCurrentStep(3);
                }} 
              />
            </div>
          )}
          
          {/* Step 3: Confirmation */}
          {state.currentStep === 3 && (
            <div className={styles.confirmation}>
              <div className={styles.confirmationIcon}>✓</div>
              <h3>Thank you for your feedback!</h3>
              <p>Your feedback has been submitted successfully.</p>
              <button
                className={styles.submitAnotherButton}
                onClick={() => {
                  reset();
                  setIsSuccess(false);
                  setErrors([]);
                  setModalOpen(false);
                  setToolbarExpanded(true);
                  setToolMode('element');
                }}
                type="button"
              >
                Submit Another
              </button>
            </div>
          )}
          
          {/* Error messages */}
          {errors.length > 0 && (
            <div 
              className={styles.errorContainer} 
              role="alert"
              aria-live="assertive"
              aria-atomic="true"
            >
              {errors.map((error, index) => (
                <div key={index} className={styles.errorMessage}>
                  {error}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {state.currentStep === 1 && (
            <>
              <div className={styles.spacer} />
              <button
                className={styles.buttonPrimary}
                onClick={handleSubmitStep}
                type="button"
                disabled={isSubmitting || state.annotations.length === 0}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </>
          )}
          {state.currentStep === 2 && enableNPS && (
            <>
              <div className={styles.spacer} />
              <button
                className={styles.buttonPrimary}
                onClick={handleNext}
                type="button"
              >
                Continue
              </button>
            </>
          )}
          {state.currentStep === 3 && (
            <>
              <div className={styles.spacer} />
              <button
                className={styles.buttonPrimary}
                onClick={() => {
                  reset();
                  setIsSuccess(false);
                  setErrors([]);
                  setModalOpen(false);
                }}
                type="button"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
