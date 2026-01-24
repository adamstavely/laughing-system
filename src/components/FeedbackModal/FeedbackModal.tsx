/**
 * Feedback Modal Component
 */

import React, { useEffect, useRef, useState } from 'react';
import { useFeedback } from '../../context/FeedbackContext';
import { NPSRating } from './NPSRating';
import { AnnotationList } from './AnnotationList';
import type { JiraConfig, ElasticConfig, FeedbackData } from '../../types';
import { validateFeedbackData } from '../../utils/validation';
import { captureContext, getTimestamp } from '../../utils/contextCapture';
import { createJiraIssueWithRetry } from '../../integrations/jira';
import { indexElasticsearchDocumentWithRetry } from '../../integrations/elasticsearch';
import { calculateNPSSegment } from '../../utils/validation';
import { generateAnnotationScreenshot } from '../../utils/screenshot';
import { getErrorMessage } from '../../utils/configValidation';
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
    updateAnnotation,
  } = useFeedback();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus trap and close toolbar when modal opens
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    modalRef.current?.focus();
    
    // Close toolbar when modal opens
    setToolbarExpanded(false);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
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

  const handleClose = () => {
    // TODO: Check for unsaved changes
    setModalOpen(false);
    setCurrentStep(1);
  };

  const handleBack = () => {
    if (state.currentStep > 1) {
      setCurrentStep(state.currentStep - 1);
    }
  };

  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [isGeneratingScreenshots, setIsGeneratingScreenshots] = useState(false);
  const screenshotsGeneratedRef = useRef<Set<string>>(new Set());

  // Generate screenshots when entering Step 1 (Review step) or when annotations are added
  useEffect(() => {
    if (state.currentStep === 1 && state.annotations.length > 0) {
      const generateScreenshots = async () => {
        const annotationsNeedingScreenshots = state.annotations.filter(
          (annotation) => !annotation.screenshot && !screenshotsGeneratedRef.current.has(annotation.id)
        );

        if (annotationsNeedingScreenshots.length === 0) {
          return; // All annotations already have screenshots or are being processed
        }

        setIsGeneratingScreenshots(true);
        try {
          // Generate screenshots for all annotations that don't have them
          for (const annotation of annotationsNeedingScreenshots) {
            screenshotsGeneratedRef.current.add(annotation.id);
            try {
              const screenshot = await generateAnnotationScreenshot(annotation, {
                quality: screenshotQuality,
                maxWidth: 1200,
              });
              updateAnnotation(annotation.id, { screenshot });
            } catch (error) {
              console.warn('Failed to generate screenshot for annotation:', error);
              screenshotsGeneratedRef.current.delete(annotation.id);
              // Continue without screenshot
            }
          }
        } catch (error) {
          console.error('Failed to generate screenshots:', error);
        } finally {
          setIsGeneratingScreenshots(false);
        }
      };

      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(generateScreenshots, 100);
      return () => clearTimeout(timeoutId);
    } else if (state.currentStep !== 1) {
      // Reset when leaving step 1
      screenshotsGeneratedRef.current.clear();
    }
  }, [state.currentStep, state.annotations, updateAnnotation, screenshotQuality]);

  const handleNext = () => {
    // Validate current step before proceeding
    const validation = validateStep(
      state.currentStep,
      state,
      requireCategory,
      enableNPS
    );

    if (!validation.valid) {
      setStepErrors(validation.errors);
      return;
    }

    setStepErrors([]);
    if (state.currentStep < TOTAL_STEPS) {
      setCurrentStep(state.currentStep + 1);
    }
  };

  const handleSkip = () => {
    // Skip NPS and go to next step
    setStepErrors([]);
    if (state.currentStep < TOTAL_STEPS) {
      setCurrentStep(state.currentStep + 1);
    }
  };

  const handleSubmit = async () => {
    // Validate before submit (Step 1: Review annotations)
    const validation = validateStep(1, state, requireCategory, enableNPS);
    if (!validation.valid) {
      setStepErrors(validation.errors);
      return;
    }

    setStepErrors([]);

    // Set submitting state
    dispatch({ type: 'SET_SUBMITTING', payload: true });

    try {
      // Generate screenshots for annotations that don't have them
      const annotationsWithScreenshots = await Promise.all(
        state.annotations.map(async (annotation) => {
          if (annotation.screenshot) {
            return annotation; // Already has screenshot
          }

          try {
            const screenshot = await generateAnnotationScreenshot(annotation, {
              quality: screenshotQuality,
              maxWidth: 1200,
            });
            return {
              ...annotation,
              screenshot,
            };
          } catch (error) {
            console.warn('Failed to generate screenshot for annotation:', error);
            return annotation; // Continue without screenshot
          }
        })
      );

      // Build complete feedback data
      const context = captureContext(
        getUserId,
        appVersion,
        customContext
      );

      // NPS is optional - use 0 as default if not provided
      const npsScore = state.npsScore ?? 0;
      
      const completeFeedback: FeedbackData = {
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: getTimestamp(),
        npsScore,
        npsSegment: calculateNPSSegment(npsScore),
        category: state.category,
        severity: state.severity,
        feedbackText: state.feedbackText || '', // Overall feedback is optional
        annotations: annotationsWithScreenshots,
        context,
        contactPreference: state.contactPreference,
      };

      // Submit to integrations in parallel
      const promises: Promise<any>[] = [];

      if (jiraConfig) {
        promises.push(
          createJiraIssueWithRetry(completeFeedback, jiraConfig).catch(
            (error) => {
              console.error('Jira submission failed:', error);
              throw error;
            }
          )
        );
      }

      if (elasticConfig) {
        promises.push(
          indexElasticsearchDocumentWithRetry(completeFeedback, elasticConfig).catch(
            (error) => {
              console.error('Elasticsearch submission failed:', error);
              throw error;
            }
          )
        );
      }

      // Wait for all submissions
      await Promise.allSettled(promises);

      // Call optional onSubmit callback
      onSubmit?.(completeFeedback);

      // Move to NPS step (Step 2) after submission
      if (enableNPS) {
        setCurrentStep(2);
      } else {
        // Skip NPS and go directly to confirmation
        setCurrentStep(3);
      }
    } catch (error) {
      dispatch({ type: 'SET_SUBMITTING', payload: false });
      const err = error instanceof Error ? error : new Error('Submission failed');
      const userFriendlyMessage = getErrorMessage(err);
      onError?.(err);
      
      // Show user-friendly error message inline
      setStepErrors([`Failed to submit feedback: ${userFriendlyMessage}`]);
    }
  };

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
          {stepErrors.length > 0 && (
            <div className={styles.errorContainer} role="alert">
              {stepErrors.map((error, index) => (
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
                onClick={handleSubmit}
                type="button"
                disabled={state.isSubmitting || state.annotations.length === 0}
              >
                {state.isSubmitting ? 'Submitting...' : 'Submit'}
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
