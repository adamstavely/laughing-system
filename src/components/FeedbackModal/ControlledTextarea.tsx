/**
 * Controlled Textarea Component
 * Uses local state to prevent focus loss during typing
 */

import React, { useState, useEffect, useRef } from 'react';
import sharedStyles from '../../styles/modal.shared.module.css';

interface ControlledTextareaProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  required?: boolean;
  label?: React.ReactNode;
  showCharCount?: boolean;
}

export function ControlledTextarea({
  id,
  value: controlledValue,
  onChange,
  placeholder,
  rows = 4,
  maxLength = 5000,
  required = false,
  label,
  showCharCount = true,
}: ControlledTextareaProps) {
  // Use local state to prevent focus loss
  const [localValue, setLocalValue] = useState(controlledValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync local state when controlled value changes externally
  useEffect(() => {
    if (controlledValue !== localValue) {
      setLocalValue(controlledValue);
    }
  }, [controlledValue]);

  // Sync to parent on blur
  const handleBlur = () => {
    if (localValue !== controlledValue) {
      onChange(localValue);
    }
  };

  // Sync to parent with debounce while typing
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Debounce sync to parent (500ms)
    syncTimeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, 500);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  const remaining = maxLength - localValue.length;
  const isNearLimit = remaining < 100;

  const content = (
    <>
      <textarea
        ref={textareaRef}
        id={id}
        className={sharedStyles.modalTextarea}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        required={required}
      />
      {showCharCount && (
        <div className={sharedStyles.modalCharCount}>
          <span style={isNearLimit ? { color: 'var(--color-warning, #f59e0b)' } : undefined}>
            {remaining} characters remaining
          </span>
        </div>
      )}
    </>
  );

  // If label is provided, wrap in modalSection, otherwise return just the textarea
  if (label) {
    return (
      <div className={sharedStyles.modalSection}>
        <label className={sharedStyles.modalLabel} htmlFor={id}>
          {label}
        </label>
        {content}
      </div>
    );
  }

  return content;
}
