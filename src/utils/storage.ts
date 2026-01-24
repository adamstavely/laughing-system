/**
 * Storage utilities for draft persistence
 */

const STORAGE_KEY = 'feedback-component-draft';

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
