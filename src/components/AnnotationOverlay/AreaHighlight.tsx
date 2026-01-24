/**
 * Area Highlight Component
 */

import React from 'react';
import type { Annotation } from '../../types';
import styles from './AreaHighlight.module.css';

interface AreaHighlightProps {
  annotation: Annotation;
  index: number;
}

export function AreaHighlight({
  annotation,
  index,
}: AreaHighlightProps) {
  const { coordinates } = annotation;

  return (
    <div
      className={styles.highlight}
      style={{
        left: `${coordinates.x}px`,
        top: `${coordinates.y}px`,
        width: `${coordinates.width}px`,
        height: `${coordinates.height}px`,
      }}
    >
      <div className={styles.badge}>{index + 1}</div>
      <div className={styles.tooltip}>
        Area Selection ({Math.round(coordinates.width)} × {Math.round(coordinates.height)}px)
      </div>
    </div>
  );
}
