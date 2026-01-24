/**
 * ToolButton Component
 */

import React, { memo } from 'react';
import styles from './ToolButton.module.css';

interface ToolButtonProps {
  icon: 'element' | 'text' | 'area' | 'pause' | 'feedback';
  label: string;
  active?: boolean;
  onClick: () => void;
}

const iconPaths: Record<ToolButtonProps['icon'], string> = {
  element: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  text: 'M4 7h16M4 12h16M4 17h16',
  area: 'M3 3h18v18H3z',
  pause: 'M6 4h4v16H6zM14 4h4v16h-4z',
  feedback: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
};

export const ToolButton = memo(function ToolButton({
  icon,
  label,
  active = false,
  onClick,
}: ToolButtonProps) {
  return (
    <button
      className={`${styles.toolButton} ${active ? styles.active : ''}`}
      onClick={onClick}
      aria-label={label}
      title={label}
      type="button"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={iconPaths[icon]} />
      </svg>
      <span className={styles.label}>{label}</span>
    </button>
  );
});
