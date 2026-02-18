/**
 * Core type definitions for the Angular Feedback Component
 * Ported from React src/types/index.ts
 */

export interface Annotation {
  id: string;
  type: 'element' | 'text' | 'area';
  selector?: string;
  textContent?: string;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  screenshot?: string;
  metadata: {
    elementCount?: number;
    elementDescription?: string;
    fullDOMPath?: string;
    position?: {
      x: number;
      y: number;
      width: number;
      height: number;
      percentageFromLeft: number;
      pixelsFromTop: number;
    };
    context?: string;
    computedStyles?: Record<string, string>;
    nearbyElements?: string[];
    elementPath?: string;
    textRange?: { start: number; end: number };
    feedbackText?: string;
  };
  timestamp: string;
}

export interface ContextData {
  url: string;
  userAgent: string;
  viewport: { width: number; height: number };
  userId?: string;
  sessionId: string;
  appVersion?: string;
  customContext?: Record<string, unknown>;
}

export interface FeedbackData {
  id: string;
  timestamp: string;
  npsScore: number;
  npsSegment: 'detractor' | 'passive' | 'promoter';
  category?: 'bug' | 'feature' | 'question' | 'praise' | 'other';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  feedbackText: string;
  annotations: Annotation[];
  context: ContextData;
  contactPreference: boolean;
}

export type ToolMode = 'none' | 'element' | 'text' | 'area';

export interface FeedbackState {
  annotations: Annotation[];
  npsScore: number | null;
  feedbackText: string;
  category: FeedbackData['category'];
  severity: FeedbackData['severity'];
  contactPreference: boolean;
  isSubmitting: boolean;
  currentStep: number;
  toolMode: ToolMode;
  isAnimationPaused: boolean;
  isModalOpen: boolean;
  isToolbarExpanded: boolean;
}

export type ToolbarPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
export type Theme = 'light' | 'dark' | 'auto';

export interface ScreenshotOptions {
  quality?: number;
  maxWidth?: number;
  element?: HTMLElement;
  coordinates?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface DraftData {
  npsScore: number | null;
  feedbackText: string;
  category?: string;
  severity?: string;
  annotations: Annotation[];
  timestamp: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}
