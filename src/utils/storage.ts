/**
 * Storage utilities for draft persistence
 */

const STORAGE_KEY = 'feedback-component-draft';
const NPS_SUBMISSION_KEY = 'feedback-component-nps-submission';

export interface DraftData {
  npsScore: number | null;
  feedbackText: string;
  category?: string;
  severity?: string;
  annotations: any[]; // Simplified for storage
  timestamp: string;
}

/**
 * Save draft to sessionStorage
 */
export function saveDraft(data: Partial<DraftData>): void {
  try {
    const existing = loadDraft();
    const draft: DraftData = {
      ...existing,
      ...data,
      timestamp: new Date().toISOString(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch (error) {
    console.warn('Failed to save draft:', error);
  }
}

/**
 * Load draft from sessionStorage
 */
export function loadDraft(): Partial<DraftData> {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load draft:', error);
  }
  return {};
}

/**
 * Clear draft from sessionStorage
 */
export function clearDraft(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear draft:', error);
  }
}

/**
 * Save the timestamp of the last NPS submission to localStorage
 * This persists across browser sessions
 */
export function saveLastNPSSubmission(timestamp: string = new Date().toISOString()): void {
  try {
    localStorage.setItem(NPS_SUBMISSION_KEY, timestamp);
  } catch (error) {
    console.warn('Failed to save last NPS submission:', error);
  }
}

/**
 * Get the timestamp of the last NPS submission from localStorage
 * Returns null if no submission has been recorded
 */
export function getLastNPSSubmission(): string | null {
  try {
    return localStorage.getItem(NPS_SUBMISSION_KEY);
  } catch (error) {
    console.warn('Failed to get last NPS submission:', error);
    return null;
  }
}

/**
 * Check if 90 days have passed since the last NPS submission
 * Returns true if 90 days have passed or if no submission exists
 */
export function shouldResetNPS(): boolean {
  const lastSubmission = getLastNPSSubmission();
  if (!lastSubmission) {
    return true; // No previous submission, should prompt
  }

  try {
    const lastSubmissionDate = new Date(lastSubmission);
    const now = new Date();
    const daysSinceSubmission = Math.floor(
      (now.getTime() - lastSubmissionDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return daysSinceSubmission >= 90;
  } catch (error) {
    console.warn('Failed to parse last NPS submission date:', error);
    return true; // If we can't parse, reset to be safe
  }
}

/**
 * Clear the last NPS submission timestamp
 */
export function clearLastNPSSubmission(): void {
  try {
    localStorage.removeItem(NPS_SUBMISSION_KEY);
  } catch (error) {
    console.warn('Failed to clear last NPS submission:', error);
  }
}
