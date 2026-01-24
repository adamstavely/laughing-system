/**
 * Shared hook for modal submission logic
 * Eliminates duplication across BugReportModal, FeatureRequestModal, etc.
 */

import { useState, useRef, useEffect } from 'react';
import { useFeedback } from '../context/FeedbackContext';
import { generateAnnotationScreenshot } from '../utils/screenshot';
import { captureContext, getTimestamp } from '../utils/contextCapture';
import { createJiraIssueWithRetry } from '../integrations/jira';
import { indexElasticsearchDocumentWithRetry } from '../integrations/elasticsearch';
import { getErrorMessage } from '../utils/configValidation';
import type { JiraConfig, ElasticConfig, FeedbackData } from '../types';

export interface UseModalSubmissionOptions {
  jiraConfig?: JiraConfig;
  elasticConfig?: ElasticConfig;
  onSubmit?: (feedback: FeedbackData) => void;
  onError?: (error: Error) => void;
  getUserId?: () => string | null;
  appVersion?: string;
  customContext?: Record<string, any>;
  screenshotQuality?: number;
  category: FeedbackData['category'];
  severity?: FeedbackData['severity'];
  npsSegment?: FeedbackData['npsSegment'];
  autoGenerateScreenshots?: boolean;
}

export function useModalSubmission({
  jiraConfig,
  elasticConfig,
  onSubmit,
  onError,
  getUserId,
  appVersion,
  customContext,
  screenshotQuality = 0.8,
  category,
  severity,
  npsSegment = 'detractor',
  autoGenerateScreenshots = true,
}: UseModalSubmissionOptions) {
  const { state, updateAnnotation } = useFeedback();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isGeneratingScreenshots, setIsGeneratingScreenshots] = useState(false);
  const screenshotsGeneratedRef = useRef<Set<string>>(new Set());

  // Generate screenshots when annotations change (if auto-generate is enabled)
  useEffect(() => {
    if (!autoGenerateScreenshots || state.annotations.length === 0) return;

    const generateScreenshots = async () => {
      const annotationsNeedingScreenshots = state.annotations.filter(
        (annotation) => !annotation.screenshot && !screenshotsGeneratedRef.current.has(annotation.id)
      );

      if (annotationsNeedingScreenshots.length === 0) {
        return;
      }

      setIsGeneratingScreenshots(true);
      try {
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
          }
        }
      } catch (error) {
        console.error('Failed to generate screenshots:', error);
      } finally {
        setIsGeneratingScreenshots(false);
      }
    };

    const timeoutId = setTimeout(generateScreenshots, 100);
    return () => clearTimeout(timeoutId);
  }, [state.annotations, updateAnnotation, screenshotQuality, autoGenerateScreenshots]);

  const handleSubmit = async (validationFn?: () => string[]) => {
    // Run custom validation if provided
    const validationErrors = validationFn ? validationFn() : [];
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setIsSubmitting(true);

    try {
      // Generate screenshots for all annotations that don't have them
      const annotationsWithScreenshots = await Promise.all(
        state.annotations.map(async (annotation) => {
          if (annotation.screenshot) return annotation;

          try {
            const screenshot = await generateAnnotationScreenshot(annotation, {
              quality: screenshotQuality,
              maxWidth: 1200,
            });
            return { ...annotation, screenshot };
          } catch (error) {
            console.warn('Failed to generate screenshot:', error);
            return annotation;
          }
        })
      );

      const context = captureContext(getUserId, appVersion, customContext);

      const completeFeedback: FeedbackData = {
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: getTimestamp(),
        npsScore: 0,
        npsSegment,
        category,
        severity,
        feedbackText: state.feedbackText || '',
        annotations: annotationsWithScreenshots,
        context,
        contactPreference: state.contactPreference,
      };

      const promises: Promise<any>[] = [];

      if (jiraConfig) {
        promises.push(
          createJiraIssueWithRetry(completeFeedback, jiraConfig).catch((error) => {
            console.error('Jira submission failed:', error);
            throw error;
          })
        );
      }

      if (elasticConfig) {
        promises.push(
          indexElasticsearchDocumentWithRetry(completeFeedback, elasticConfig).catch((error) => {
            console.error('Elasticsearch submission failed:', error);
            throw error;
          })
        );
      }

      await Promise.allSettled(promises);
      onSubmit?.(completeFeedback);

      setIsSubmitting(false);
      setIsSuccess(true);
    } catch (error) {
      setIsSubmitting(false);
      const err = error instanceof Error ? error : new Error('Submission failed');
      const userFriendlyMessage = getErrorMessage(err);
      onError?.(err);
      setErrors([`Failed to submit: ${userFriendlyMessage}`]);
    }
  };

  return {
    isSubmitting,
    isSuccess,
    errors,
    isGeneratingScreenshots,
    handleSubmit,
    setErrors,
    setIsSuccess,
  };
}
