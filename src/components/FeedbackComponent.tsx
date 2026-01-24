/**
 * Main Feedback Component
 */

import React, { useEffect, memo, useState, lazy, Suspense } from 'react';
import { FeedbackProvider, useFeedback } from '../context/FeedbackContext';
import { Toolbar } from './Toolbar';
import { AnnotationOverlay } from './AnnotationOverlay';
import { InlineFeedbackTooltip } from './InlineFeedbackTooltip';
import { ErrorBoundary } from './ErrorBoundary';

// Lazy load modal components for better bundle splitting
const FeedbackModal = lazy(() => 
  import('./FeedbackModal').then(module => ({ default: module.FeedbackModal }))
);
const BugReportModal = lazy(() => 
  import('./BugReportModal').then(module => ({ default: module.BugReportModal }))
);
const FeatureRequestModal = lazy(() => 
  import('./FeatureRequestModal').then(module => ({ default: module.FeatureRequestModal }))
);
const GeneralFeedbackModal = lazy(() => 
  import('./GeneralFeedbackModal').then(module => ({ default: module.GeneralFeedbackModal }))
);
import type { FeedbackComponentProps, Annotation } from '../types';
import { pauseAnimations, resumeAnimations } from '../utils/animationPause';
import { validateConfig } from '../utils/configValidation';
import { validateCustomContext } from '../utils/customContext';
import '../styles/variables.css';
import '../styles/reset.css';

const FeedbackComponentInner = memo(function FeedbackComponentInner(props: FeedbackComponentProps) {
  const {
    enableAnnotations = true,
    enableAnimationPause = true,
    position = 'bottom-right',
    theme = 'dark',
    accentColor,
    jiraConfig,
    elasticConfig,
    onSubmit,
    onError,
    onAnnotationCreate,
    maxAnnotations = 10,
    debounceMs = 500,
  } = props;

  const { state, setModalOpen, setAnimationPaused, addAnnotation, setToolMode, clearAnnotations, setCategory } = useFeedback();
  const [quickFeedbackAnnotation, setQuickFeedbackAnnotation] = useState<Annotation | null>(null);
  const [showGeneralFeedbackModal, setShowGeneralFeedbackModal] = useState(false);
  const [pendingModal, setPendingModal] = useState<'bug' | 'feature' | 'general' | null>(null);
  const [showBugModal, setShowBugModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);

  // Apply theme
  useEffect(() => {
    const container = document.documentElement;
    if (theme === 'auto') {
      container.setAttribute('data-theme', 'auto');
    } else {
      container.setAttribute('data-theme', theme);
    }
  }, [theme]);

  // Apply accent color
  useEffect(() => {
    if (accentColor) {
      document.documentElement.style.setProperty(
        '--feedback-accent',
        accentColor
      );
      document.documentElement.style.setProperty(
        '--feedback-primary',
        accentColor
      );
    }
  }, [accentColor]);

  // Handle animation pause
  useEffect(() => {
    if (state.isAnimationPaused) {
      pauseAnimations();
    } else {
      resumeAnimations();
    }
  }, [state.isAnimationPaused]);

  const handleGeneralFeedbackClick = () => {
    setCategory('other');
    setShowGeneralFeedbackModal(true);
  };

  const handleBugReportClick = () => {
    setCategory('bug');
    setShowBugModal(true);
  };

  const handleFeatureRequestClick = () => {
    setCategory('feature');
    setShowFeatureModal(true);
  };

  const handleQuickFeedbackSubmit = (feedbackText: string) => {
    if (quickFeedbackAnnotation) {
      // Add feedback text to annotation metadata
      const updatedAnnotation = {
        ...quickFeedbackAnnotation,
        metadata: {
          ...quickFeedbackAnnotation.metadata,
          feedbackText,
        },
      };
      addAnnotation(updatedAnnotation);
      onAnnotationCreate?.(updatedAnnotation);
      setQuickFeedbackAnnotation(null);
      
      // Reopen the pending modal if one exists
      if (pendingModal) {
        setToolMode('none'); // Turn off selection mode
        if (pendingModal === 'bug') {
          setShowBugModal(true);
        } else if (pendingModal === 'feature') {
          setShowFeatureModal(true);
        } else if (pendingModal === 'general') {
          setShowGeneralFeedbackModal(true);
        }
        setPendingModal(null);
      } else {
        // Keep selection mode active if no pending modal
        setToolMode('element');
      }
    }
  };

  const handleAnnotationCreate = (annotation: Annotation) => {
    // Show inline feedback tooltip immediately - don't add to state yet
    setQuickFeedbackAnnotation(annotation);
    
    // Determine which modal should reopen based on current state
    if (showBugModal) {
      setPendingModal('bug');
      setShowBugModal(false);
    } else if (showFeatureModal) {
      setPendingModal('feature');
      setShowFeatureModal(false);
    } else if (showGeneralFeedbackModal) {
      setPendingModal('general');
      setShowGeneralFeedbackModal(false);
    }
  };

  // Calculate tooltip position based on annotation coordinates
  const getTooltipPosition = (annotation: Annotation | null): { x: number; y: number } => {
    if (!annotation) return { x: 0, y: 0 };
    
    // Position tooltip near the center of the annotation
    const x = annotation.coordinates.x + annotation.coordinates.width / 2;
    const y = annotation.coordinates.y + annotation.coordinates.height / 2;
    
    return { x, y };
  };

  return (
    <div className="feedback-component-container">
      <Toolbar
        position={position}
        onGeneralFeedbackClick={handleGeneralFeedbackClick}
        onBugReportClick={handleBugReportClick}
        onFeatureRequestClick={handleFeatureRequestClick}
      />
      {state.isModalOpen && (
        <Suspense fallback={null}>
          <FeedbackModal
            jiraConfig={jiraConfig}
            elasticConfig={elasticConfig}
            onSubmit={onSubmit}
            onError={onError}
            requireCategory={props.requireCategory}
            enableNPS={props.enableNPS ?? true}
            getUserId={props.getUserId}
            appVersion={props.appVersion}
            customContext={props.customContext}
            screenshotQuality={props.screenshotQuality}
          />
        </Suspense>
      )}
      {showBugModal && (
        <Suspense fallback={null}>
          <BugReportModal
            jiraConfig={jiraConfig}
            elasticConfig={elasticConfig}
            onSubmit={onSubmit}
            onError={onError}
            getUserId={props.getUserId}
            appVersion={props.appVersion}
            customContext={props.customContext}
            screenshotQuality={props.screenshotQuality}
            onClose={() => setShowBugModal(false)}
            onAddAnnotation={() => setPendingModal('bug')}
          />
        </Suspense>
      )}
      {showFeatureModal && (
        <Suspense fallback={null}>
          <FeatureRequestModal
            jiraConfig={jiraConfig}
            elasticConfig={elasticConfig}
            onSubmit={onSubmit}
            onError={onError}
            getUserId={props.getUserId}
            appVersion={props.appVersion}
            customContext={props.customContext}
            screenshotQuality={props.screenshotQuality}
            onClose={() => setShowFeatureModal(false)}
            onAddAnnotation={() => setPendingModal('feature')}
          />
        </Suspense>
      )}
      {showGeneralFeedbackModal && (
        <Suspense fallback={null}>
          <GeneralFeedbackModal
            jiraConfig={jiraConfig}
            elasticConfig={elasticConfig}
            onSubmit={onSubmit}
            onError={onError}
            getUserId={props.getUserId}
            appVersion={props.appVersion}
            customContext={props.customContext}
            screenshotQuality={props.screenshotQuality}
            onClose={() => setShowGeneralFeedbackModal(false)}
            onAddAnnotation={() => setPendingModal('general')}
          />
        </Suspense>
      )}
      {enableAnnotations && (
        <AnnotationOverlay
          toolMode={state.toolMode}
          maxAnnotations={maxAnnotations}
          onAnnotationCreate={handleAnnotationCreate}
          selectorPriority={props.selectorPriority}
        />
      )}
      {quickFeedbackAnnotation && (
        <InlineFeedbackTooltip
          annotation={quickFeedbackAnnotation}
          position={getTooltipPosition(quickFeedbackAnnotation)}
          onClose={() => setQuickFeedbackAnnotation(null)}
          onSubmit={handleQuickFeedbackSubmit}
        />
      )}
    </div>
  );
});

export function FeedbackComponent(props: FeedbackComponentProps) {
  // Validate configuration on mount
  useEffect(() => {
    const validation = validateConfig(props);
    
    if (!validation.valid) {
      console.error('FeedbackComponent configuration errors:', validation.errors);
      if (props.onError) {
        props.onError(new Error(validation.errors.join('; ')));
      }
    }

    if (validation.warnings.length > 0) {
      console.warn('FeedbackComponent configuration warnings:', validation.warnings);
    }

    // Validate custom context
    if (props.customContext) {
      const contextValidation = validateCustomContext(props.customContext);
      if (!contextValidation.valid) {
        console.warn('Custom context validation warnings:', contextValidation.errors);
      }
    }
  }, [props]);

  return (
    <ErrorBoundary onError={props.onError}>
      <FeedbackProvider debounceMs={props.debounceMs ?? 500}>
        <FeedbackComponentInner {...props} />
      </FeedbackProvider>
    </ErrorBoundary>
  );
}
