/**
 * Core type definitions for the Contextual Feedback Component
 */

export interface Annotation {
  id: string;
  type: 'element' | 'text' | 'area';
  selector?: string; // CSS selector
  textContent?: string;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  screenshot?: string; // base64
  metadata: {
    // Element count and description (for multi-element selections)
    elementCount?: number;
    elementDescription?: string; // e.g., "h2 'How it works', paragraph: 'Text...', list item +3 more"
    
    // Forensic data for first/primary element
    fullDOMPath?: string; // e.g., "body > main.main-content > article.article > section > h2"
    position?: {
      x: number;
      y: number;
      width: number;
      height: number;
      percentageFromLeft: number; // percentage from left edge of viewport
      pixelsFromTop: number; // pixels from top of document
    };
    context?: string; // Text content of the element
    computedStyles?: Record<string, string>; // Comprehensive computed styles
    nearbyElements?: string[]; // Tag names of nearby sibling elements
    
    // Legacy fields (kept for backward compatibility)
    elementPath?: string;
    textRange?: { start: number; end: number };
    
    // User feedback
    feedbackText?: string;
  };
  timestamp: string;
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
  context: {
    url: string;
    userAgent: string;
    viewport: { width: number; height: number };
    userId?: string;
    sessionId: string;
    appVersion?: string;
    customContext?: Record<string, any>;
  };
  contactPreference: boolean;
}

export type JiraAuthMethod = 'basic' | 'oauth2' | 'token' | 'custom';

export interface JiraOAuth2Config {
  clientId: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenUrl?: string;
}

export interface JiraConfig {
  projectKey: string;
  apiEndpoint: string;
  issueType?: string; // default: 'Task'
  customFields?: Record<string, any>;
  // Authentication options
  authMethod?: JiraAuthMethod; // default: 'token'
  authToken?: string; // For 'token' or 'basic' method (format: email:token or token)
  oauth2?: JiraOAuth2Config; // For 'oauth2' method
  headers?: Record<string, string>;
}

export interface ElasticConfig {
  indexName: string;
  endpoint: string;
  apiKey?: string;
  mappingTemplate?: string | Record<string, any>; // custom index mapping (JSON string or object)
  headers?: Record<string, string>;
  createIndexIfNotExists?: boolean; // default: false
}

export interface FeedbackComponentProps {
  // Backend Integration
  jiraConfig?: JiraConfig;
  elasticConfig?: ElasticConfig;

  // Behavioral Configuration
  enableNPS?: boolean; // default: true
  enableAnnotations?: boolean; // default: true
  requireCategory?: boolean; // default: false
  enableAnimationPause?: boolean; // default: true
  enableTextSelection?: boolean; // default: true
  enableAreaSelection?: boolean; // default: true

  // UI Configuration
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'light' | 'dark' | 'auto';
  accentColor?: string; // primary brand color
  locale?: string; // i18n support

  // Context
  appVersion?: string;
  customContext?: Record<string, any>;
  getUserId?: () => string | null;
  getSessionId?: () => string;

  // Callbacks
  onSubmit?: (feedback: FeedbackData) => void;
  onError?: (error: Error) => void;
  onAnnotationCreate?: (annotation: Annotation) => void;

  // Advanced
  selectorPriority?: string[]; // selector generation strategy
  screenshotQuality?: number; // 0-1, default 0.8
  maxAnnotations?: number; // default: 10
  debounceMs?: number; // auto-save debounce, default: 500
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
