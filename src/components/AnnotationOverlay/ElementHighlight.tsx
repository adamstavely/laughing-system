/**
 * Element Highlight Component
 */

import React, { useEffect, useRef, useState } from 'react';
import type { Annotation } from '../../types';
import styles from './ElementHighlight.module.css';

interface ElementHighlightProps {
  annotation: Annotation;
  index: number;
}

export function ElementHighlight({
  annotation,
  index,
}: ElementHighlightProps) {
  const [position, setPosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!annotation.selector) return;

    try {
      const element = document.querySelector(annotation.selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        setPosition({
          x: rect.x + window.scrollX,
          y: rect.y + window.scrollY,
          width: rect.width,
          height: rect.height,
        });
      }
    } catch (error) {
      console.warn('Failed to highlight element:', error);
    }
  }, [annotation.selector]);

  if (!position) return null;

  return (
    <div
      ref={highlightRef}
      className={styles.highlight}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${position.width}px`,
        height: `${position.height}px`,
      }}
    >
      <div className={styles.badge}>{index + 1}</div>
      {annotation.selector && (
        <div className={styles.tooltip}>
          <code>{annotation.selector}</code>
        </div>
      )}
    </div>
  );
}
