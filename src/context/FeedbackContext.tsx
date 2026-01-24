/**
 * Feedback Context for global state management
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type {
  FeedbackState,
  Annotation,
  FeedbackData,
  ToolMode,
} from '../types';
import { saveDraft, clearDraft, shouldResetNPS, clearLastNPSSubmission } from '../utils/storage';

interface FeedbackContextValue {
  state: FeedbackState;
  dispatch: React.Dispatch<FeedbackAction>;
  addAnnotation: (annotation: Annotation) => void;
  removeAnnotation: (id: string) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  clearAnnotations: () => void;
  setNPSScore: (score: number | null) => void;
  setFeedbackText: (text: string) => void;
  setCategory: (category: FeedbackData['category']) => void;
  setSeverity: (severity: FeedbackData['severity']) => void;
  setContactPreference: (preference: boolean) => void;
  setToolMode: (mode: ToolMode) => void;
  setAnimationPaused: (paused: boolean) => void;
  setModalOpen: (open: boolean) => void;
  setToolbarExpanded: (expanded: boolean) => void;
  setCurrentStep: (step: number) => void;
  reset: () => void;
  resetNPS: () => void;
}

type FeedbackAction =
  | { type: 'ADD_ANNOTATION'; payload: Annotation }
  | { type: 'REMOVE_ANNOTATION'; payload: string }
  | { type: 'UPDATE_ANNOTATION'; payload: { id: string; updates: Partial<Annotation> } }
  | { type: 'CLEAR_ANNOTATIONS' }
  | { type: 'SET_NPS_SCORE'; payload: number | null }
  | { type: 'SET_FEEDBACK_TEXT'; payload: string }
  | { type: 'SET_CATEGORY'; payload: FeedbackData['category'] }
  | { type: 'SET_SEVERITY'; payload: FeedbackData['severity'] }
  | { type: 'SET_CONTACT_PREFERENCE'; payload: boolean }
  | { type: 'SET_TOOL_MODE'; payload: ToolMode }
  | { type: 'SET_ANIMATION_PAUSED'; payload: boolean }
  | { type: 'SET_MODAL_OPEN'; payload: boolean }
  | { type: 'SET_TOOLBAR_EXPANDED'; payload: boolean }
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'RESET' };

const initialState: FeedbackState = {
  annotations: [],
  npsScore: null,
  feedbackText: '',
  category: undefined,
  severity: undefined,
  contactPreference: false,
  isSubmitting: false,
  currentStep: 1,
  toolMode: 'none',
  isAnimationPaused: false,
  isModalOpen: false,
  isToolbarExpanded: false,
};

function feedbackReducer(
  state: FeedbackState,
  action: FeedbackAction
): FeedbackState {
  switch (action.type) {
    case 'ADD_ANNOTATION':
      return {
        ...state,
        annotations: [...state.annotations, action.payload],
      };
    case 'REMOVE_ANNOTATION':
      return {
        ...state,
        annotations: state.annotations.filter(
          (a) => a.id !== action.payload
        ),
      };
    case 'UPDATE_ANNOTATION':
      return {
        ...state,
        annotations: state.annotations.map((a) =>
          a.id === action.payload.id
            ? { ...a, ...action.payload.updates }
            : a
        ),
      };
    case 'CLEAR_ANNOTATIONS':
      return {
        ...state,
        annotations: [],
      };
    case 'SET_NPS_SCORE':
      return {
        ...state,
        npsScore: action.payload,
      };
    case 'SET_FEEDBACK_TEXT':
      return {
        ...state,
        feedbackText: action.payload,
      };
    case 'SET_CATEGORY':
      return {
        ...state,
        category: action.payload,
      };
    case 'SET_SEVERITY':
      return {
        ...state,
        severity: action.payload,
      };
    case 'SET_CONTACT_PREFERENCE':
      return {
        ...state,
        contactPreference: action.payload,
      };
    case 'SET_TOOL_MODE':
      return {
        ...state,
        toolMode: action.payload,
      };
    case 'SET_ANIMATION_PAUSED':
      return {
        ...state,
        isAnimationPaused: action.payload,
      };
    case 'SET_MODAL_OPEN':
      return {
        ...state,
        isModalOpen: action.payload,
      };
    case 'SET_TOOLBAR_EXPANDED':
      return {
        ...state,
        isToolbarExpanded: action.payload,
      };
    case 'SET_CURRENT_STEP':
      return {
        ...state,
        currentStep: action.payload,
      };
    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.payload,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const FeedbackContext = createContext<FeedbackContextValue | undefined>(
  undefined
);

export function FeedbackProvider({
  children,
  debounceMs = 500,
}: {
  children: React.ReactNode;
  debounceMs?: number;
}) {
  const [state, dispatch] = useReducer(feedbackReducer, initialState);

  // Check if NPS should be reset (90 days have passed)
  useEffect(() => {
    if (shouldResetNPS() && state.npsScore !== null) {
      // Reset NPS score if 90 days have passed
      dispatch({ type: 'SET_NPS_SCORE', payload: null });
    }
  }, []); // Only run on mount

  // Debounce draft saving - use refs to avoid recreating callback on every state change
  const saveTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>();
  const stateRef = React.useRef(state);
  
  // Keep stateRef in sync with current state - but only update ref, don't cause re-renders
  // Use a layout effect to update ref synchronously without triggering re-renders
  React.useLayoutEffect(() => {
    stateRef.current = state;
  });

  const saveDraftDebounced = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      // Access state directly from ref to get latest value without dependencies
      const currentState = stateRef.current;
      saveDraft({
        npsScore: currentState.npsScore,
        feedbackText: currentState.feedbackText,
        category: currentState.category,
        severity: currentState.severity,
        annotations: currentState.annotations,
      });
    }, debounceMs);
  }, [debounceMs]);

  // Auto-save on state changes - use a ref to track if we should save
  // This prevents the effect from running on every keystroke
  const lastSavedRef = React.useRef({ feedbackText: '', npsScore: null as number | null });
  
  React.useEffect(() => {
    const shouldSave = 
      (state.feedbackText !== lastSavedRef.current.feedbackText) ||
      (state.npsScore !== lastSavedRef.current.npsScore);
    
    if (shouldSave && (state.feedbackText || state.npsScore !== null)) {
      lastSavedRef.current = {
        feedbackText: state.feedbackText,
        npsScore: state.npsScore,
      };
      saveDraftDebounced();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.feedbackText, state.npsScore]); // Only depend on the values, not the callback

  const addAnnotation = useCallback((annotation: Annotation) => {
    dispatch({ type: 'ADD_ANNOTATION', payload: annotation });
  }, []);

  const removeAnnotation = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ANNOTATION', payload: id });
  }, []);

  const updateAnnotation = useCallback((id: string, updates: Partial<Annotation>) => {
    dispatch({ type: 'UPDATE_ANNOTATION', payload: { id, updates } });
  }, []);

  const clearAnnotations = useCallback(() => {
    dispatch({ type: 'CLEAR_ANNOTATIONS' });
  }, []);

  const setNPSScore = useCallback((score: number | null) => {
    dispatch({ type: 'SET_NPS_SCORE', payload: score });
  }, []);

  const setFeedbackText = useCallback((text: string) => {
    dispatch({ type: 'SET_FEEDBACK_TEXT', payload: text });
  }, []);

  const setCategory = useCallback((category: FeedbackData['category']) => {
    dispatch({ type: 'SET_CATEGORY', payload: category });
  }, []);

  const setSeverity = useCallback((severity: FeedbackData['severity']) => {
    dispatch({ type: 'SET_SEVERITY', payload: severity });
  }, []);

  const setContactPreference = useCallback((preference: boolean) => {
    dispatch({ type: 'SET_CONTACT_PREFERENCE', payload: preference });
  }, []);

  const setToolMode = useCallback((mode: ToolMode) => {
    dispatch({ type: 'SET_TOOL_MODE', payload: mode });
  }, []);

  const setAnimationPaused = useCallback((paused: boolean) => {
    dispatch({ type: 'SET_ANIMATION_PAUSED', payload: paused });
  }, []);

  const setModalOpen = useCallback((open: boolean) => {
    dispatch({ type: 'SET_MODAL_OPEN', payload: open });
  }, []);

  const setToolbarExpanded = useCallback((expanded: boolean) => {
    dispatch({ type: 'SET_TOOLBAR_EXPANDED', payload: expanded });
  }, []);

  const setCurrentStep = useCallback((step: number) => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: step });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
    clearDraft();
  }, []);

  const resetNPS = useCallback(() => {
    dispatch({ type: 'SET_NPS_SCORE', payload: null });
    clearLastNPSSubmission();
  }, []);

  const value: FeedbackContextValue = {
    state,
    dispatch,
    addAnnotation,
    removeAnnotation,
    updateAnnotation,
    clearAnnotations,
    setNPSScore,
    setFeedbackText,
    setCategory,
    setSeverity,
    setContactPreference,
    setToolMode,
    setAnimationPaused,
    setModalOpen,
    setToolbarExpanded,
    setCurrentStep,
    reset,
    resetNPS,
  };

  return (
    <FeedbackContext.Provider value={value}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackContextValue {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}
