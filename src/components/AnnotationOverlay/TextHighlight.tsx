/**
 * Text Highlight Component
 */

import React, { useEffect, useState } from 'react';
import type { Annotation } from '../../types';
import styles from './TextHighlight.module.css';

interface TextHighlightProps {
  annotation: Annotation;
  index: number;
}

export function TextHighlight({
  annotation,
  index,
}: TextHighlightProps) {
  const [position, setPosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    // For text selections, we use the stored coordinates
    if (annotation.coordinates) {
      setPosition({
        x: annotation.coordinates.x,
        y: annotation.coordinates.y,
        width: annotation.coordinates.width,
        height: annotation.coordinates.height,
      });
    }
  }, [annotation]);

  if (!position) return null;

  return (
    <div
      className={styles.highlight}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${position.width}px`,
        height: `${position.height}px`,
      }}
    >
      <div className={styles.badge}>{index + 1}</div>
      {annotation.textContent && (
        <div className={styles.tooltip}>
          <span>{annotation.textContent.substring(0, 50)}</span>
          {annotation.textContent.length > 50 && '...'}
        </div>
      )}
    </div>
  );
}
