/**
 * Submission abstraction types
 * The consuming Angular app provides its own submission callback
 */

import type { FeedbackData, Annotation } from './feedback.model';

export interface SubmissionOptions {
  getUserId?: () => string | null;
  appVersion?: string;
  customContext?: Record<string, unknown>;
  screenshotQuality?: number;
  category: FeedbackData['category'];
  severity?: FeedbackData['severity'];
  npsScore?: number;
  npsSegment?: FeedbackData['npsSegment'];
  autoGenerateScreenshots?: boolean;
  onSubmit?: (feedback: FeedbackData) => void | Promise<void>;
  onError?: (error: Error) => void;
}

export interface SubmissionResult {
  success: boolean;
  feedback?: FeedbackData;
  errors: string[];
}
