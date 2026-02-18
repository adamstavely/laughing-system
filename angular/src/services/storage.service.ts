import { Injectable } from '@angular/core';
import type { DraftData } from '../models/feedback.model';

const STORAGE_KEY = 'feedback-component-draft';
const NPS_SUBMISSION_KEY = 'feedback-component-nps-submission';

@Injectable()
export class StorageService {
  saveDraft(data: Partial<DraftData>): void {
    try {
      const existing = this.loadDraft();
      const draft: DraftData = {
        npsScore: null,
        feedbackText: '',
        annotations: [],
        timestamp: new Date().toISOString(),
        ...existing,
        ...data,
      };
      draft.timestamp = new Date().toISOString();
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch (error) {
      console.warn('Failed to save draft:', error);
    }
  }

  loadDraft(): Partial<DraftData> {
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

  clearDraft(): void {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear draft:', error);
    }
  }

  saveLastNPSSubmission(timestamp: string = new Date().toISOString()): void {
    try {
      localStorage.setItem(NPS_SUBMISSION_KEY, timestamp);
    } catch (error) {
      console.warn('Failed to save last NPS submission:', error);
    }
  }

  getLastNPSSubmission(): string | null {
    try {
      return localStorage.getItem(NPS_SUBMISSION_KEY);
    } catch (error) {
      console.warn('Failed to get last NPS submission:', error);
      return null;
    }
  }

  shouldResetNPS(): boolean {
    const lastSubmission = this.getLastNPSSubmission();
    if (!lastSubmission) return true;

    try {
      const lastSubmissionDate = new Date(lastSubmission);
      const now = new Date();
      const daysSinceSubmission = Math.floor(
        (now.getTime() - lastSubmissionDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      return daysSinceSubmission >= 90;
    } catch (error) {
      console.warn('Failed to parse last NPS submission date:', error);
      return true;
    }
  }

  clearLastNPSSubmission(): void {
    try {
      localStorage.removeItem(NPS_SUBMISSION_KEY);
    } catch (error) {
      console.warn('Failed to clear last NPS submission:', error);
    }
  }

  resetNPSContext(): void {
    try {
      localStorage.removeItem(NPS_SUBMISSION_KEY);
      const draft = this.loadDraft();
      if (draft.npsScore !== undefined) {
        this.saveDraft({ ...draft, npsScore: null });
      }
      console.log('NPS context reset successfully. The NPS prompt will appear on next modal open.');
    } catch (error) {
      console.warn('Failed to reset NPS context:', error);
    }
  }
}
