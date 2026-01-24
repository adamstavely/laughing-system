/**
 * Category Selector Component
 */

import React from 'react';
import { Bug, Sparkles, HelpCircle, Heart, MessageSquare } from 'lucide-react';
import { useFeedback } from '../../context/FeedbackContext';
import type { FeedbackData } from '../../types';
import styles from './CategorySelector.module.css';

interface CategorySelectorProps {
  requireCategory?: boolean;
}

const categories: Array<{
  value: FeedbackData['category'];
  label: string;
  icon: React.ReactNode;
}> = [
  { value: 'bug', label: 'Bug', icon: <Bug size={20} /> },
  { value: 'feature', label: 'Feature Request', icon: <Sparkles size={20} /> },
  { value: 'question', label: 'Question', icon: <HelpCircle size={20} /> },
  { value: 'praise', label: 'Praise', icon: <Heart size={20} /> },
  { value: 'other', label: 'Other', icon: <MessageSquare size={20} /> },
];

const severities: Array<{
  value: FeedbackData['severity'];
  label: string;
}> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export function CategorySelector({
  requireCategory = false,
}: CategorySelectorProps) {
  const { state, setCategory, setSeverity, setContactPreference } =
    useFeedback();

  return (
    <div className={styles.container}>
      <label className={styles.label}>
        Category {requireCategory && <span className={styles.required}>*</span>}
      </label>
      <div className={styles.categories}>
        {categories.map((category) => (
          <button
            key={category.value}
            className={`${styles.categoryButton} ${
              state.category === category.value ? styles.selected : ''
            }`}
            onClick={() => setCategory(category.value)}
            type="button"
          >
            <span className={styles.icon}>{category.icon}</span>
            <span>{category.label}</span>
          </button>
        ))}
      </div>

      {state.category === 'bug' && (
        <div className={styles.severity}>
          <label className={styles.label}>Severity</label>
          <div className={styles.severityButtons}>
            {severities.map((severity) => (
              <button
                key={severity.value}
                className={`${styles.severityButton} ${
                  state.severity === severity.value ? styles.selected : ''
                }`}
                onClick={() => setSeverity(severity.value)}
                type="button"
              >
                {severity.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={state.contactPreference}
          onChange={(e) => setContactPreference(e.target.checked)}
        />
        <span>I'm open to follow-up questions</span>
      </label>
    </div>
  );
}
