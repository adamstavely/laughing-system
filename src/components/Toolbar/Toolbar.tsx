/**
 * Toolbar Component - Matches screenshot design
 */

import React, { useEffect, useRef } from 'react';
import { useFeedback } from '../../context/FeedbackContext';
import { MessageSquareDiff, MessageSquareText, Bug, Sparkles } from 'lucide-react';
import styles from './Toolbar.module.css';

interface ToolbarProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  onGeneralFeedbackClick?: () => void;
  onBugReportClick?: () => void;
  onFeatureRequestClick?: () => void;
}

export function Toolbar({
  position = 'bottom-right',
  onGeneralFeedbackClick,
  onBugReportClick,
  onFeatureRequestClick,
}: ToolbarProps) {
  const { state, setToolbarExpanded, setNPSScore } = useFeedback();
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: Cmd/Ctrl+Shift+F
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        e.key === 'F' &&
        !e.defaultPrevented
      ) {
        e.preventDefault();
        toggleExpand();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleExpand = () => {
    const willExpand = !state.isToolbarExpanded;
    setToolbarExpanded(willExpand);
    // Don't auto-activate selection mode - user must click select button or start a feedback flow
  };


  const positionClass = styles[`position-${position}`];
  const annotationCount = state.annotations.length;

  return (
    <>
      {/* Collapsed state - circular button with badge */}
      {!state.isToolbarExpanded && (
        <div className={`${styles.collapsedWrapper} ${positionClass}`}>
          <button
            ref={toolbarRef}
            className={styles.collapsedButton}
            onClick={toggleExpand}
            aria-label="Open feedback toolbar"
            aria-expanded="false"
            type="button"
            title="Provide feedback"
          >
            <MessageSquareDiff size={24} />
            {annotationCount > 0 && (
              <span className={styles.badge}>{annotationCount}</span>
            )}
          </button>
          <div className={styles.tooltip}>Provide feedback</div>
        </div>
      )}

      {/* Expanded state - horizontal bar with icons */}
      {state.isToolbarExpanded && (
        <div
          ref={toolbarRef}
          className={`${styles.expandedContainer} ${positionClass}`}
          role="toolbar"
          aria-label="Feedback toolbar"
          aria-expanded="true"
        >
          <div className={styles.header}>
            <div className={styles.headerTop}>
              <div className={styles.headerLeft}>
                <MessageSquareDiff size={20} className={styles.titleIcon} />
                <h3 className={styles.title}>Provide Feedback</h3>
              </div>
              <button
                className={styles.closeButton}
                onClick={toggleExpand}
                aria-label="Close toolbar"
                type="button"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <p className={styles.helpText}>
              We want to hear from you! Share your thoughts, report issues, or suggest improvements.
            </p>
          </div>
          <div className={styles.expandedBar}>
            {onGeneralFeedbackClick && (
              <button
                className={styles.iconButtonWithLabel}
                onClick={onGeneralFeedbackClick}
                aria-label="General Feedback"
                type="button"
                title="General Feedback"
              >
                <MessageSquareText size={20} />
                <span className={styles.iconLabel}>General Feedback</span>
              </button>
            )}

          {onBugReportClick && (
            <button
              className={styles.iconButtonWithLabel}
              onClick={onBugReportClick}
              aria-label="Bug Report"
              type="button"
              title="Bug Report"
            >
              <Bug size={20} />
              <span className={styles.iconLabel}>Bug<br />Report</span>
            </button>
          )}

          {onFeatureRequestClick && (
            <button
              className={styles.iconButtonWithLabel}
              onClick={onFeatureRequestClick}
              aria-label="Feature Request"
              type="button"
              title="Feature Request"
            >
              <Sparkles size={20} />
              <span className={styles.iconLabel}>Feature Request</span>
            </button>
          )}
          </div>
          
          {/* NPS Rating Section */}
          <div className={styles.npsSection}>
            {state.npsScore !== null ? (
              <p className={styles.npsThankYou}>
                Thanks for your feedback!
              </p>
            ) : (
              <>
                <p className={styles.npsQuestion}>
                  How satisfied are you with this application?
                </p>
                <div className={styles.npsScale} role="radiogroup" aria-label="NPS rating scale">
                  {Array.from({ length: 11 }, (_, i) => (
                    <button
                      key={i}
                      className={`${styles.npsButton} ${
                        state.npsScore === i ? styles.npsSelected : ''
                      }`}
                      onClick={() => setNPSScore(i)}
                      aria-label={`Rate ${i} out of 10`}
                      type="button"
                      role="radio"
                      aria-checked={state.npsScore === i}
                    >
                      {i}
                    </button>
                  ))}
                </div>
                <div className={styles.npsLabels}>
                  <span>Not likely</span>
                  <span>Very likely</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </>
  );
}
