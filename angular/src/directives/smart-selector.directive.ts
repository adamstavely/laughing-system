import { Directive, effect, inject, input, output, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { generateSelector } from '../utils/selector';
import {
  getFullDOMPath,
  getComprehensiveComputedStyles,
  getNearbyElements,
  getPositionDetails,
  getElementContext,
} from '../utils/annotation-context';
import type { Annotation } from '../models/feedback.model';

@Directive({
  selector: '[fbSmartSelector]',
})
export class SmartSelectorDirective implements OnDestroy {
  private readonly doc = inject(DOCUMENT);
  readonly fbSmartSelector = input.required<boolean>();
  readonly selectorPriority = input<string[]>();
  readonly annotationCreated = output<Annotation>();

  private mouseDownPos: { x: number; y: number } | null = null;
  private isDragging = false;
  private dragOverlay: HTMLDivElement | null = null;

  private boundHandleMouseDown = this.handleMouseDown.bind(this);
  private boundHandleTextSelection = this.handleTextSelection.bind(this);
  private currentMoveHandler: ((e: MouseEvent) => void) | null = null;
  private currentUpHandler: ((e: MouseEvent) => void) | null = null;

  constructor() {
    effect(() => {
      if (this.fbSmartSelector()) {
        this.enable();
      } else {
        this.disable();
      }
    });
  }

  ngOnDestroy(): void {
    this.disable();
  }

  private enable(): void {
    this.doc.addEventListener('mousedown', this.boundHandleMouseDown, true);
    this.doc.addEventListener('mouseup', this.boundHandleTextSelection);
    this.doc.body.style.cursor = 'crosshair';
  }

  private disable(): void {
    this.doc.removeEventListener('mousedown', this.boundHandleMouseDown, true);
    this.doc.removeEventListener('mouseup', this.boundHandleTextSelection);
    this.doc.body.style.cursor = '';
    if (this.dragOverlay) {
      this.dragOverlay.remove();
      this.dragOverlay = null;
    }
    if (this.currentMoveHandler) {
      this.doc.removeEventListener('mousemove', this.currentMoveHandler);
      this.currentMoveHandler = null;
    }
    if (this.currentUpHandler) {
      this.doc.removeEventListener('mouseup', this.currentUpHandler);
      this.currentUpHandler = null;
    }
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private generateId(): string {
    return `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleTextSelection(): void {
    if (!this.fbSmartSelector() || this.isDragging || this.mouseDownPos) return;

    const selection = this.doc.defaultView?.getSelection() ?? null;
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    const container = range.commonAncestorContainer;
    const element =
      container.nodeType === Node.TEXT_NODE
        ? (container.parentElement as HTMLElement)
        : (container as HTMLElement);

    if (!element || element.closest('.feedback-component-container')) return;

    try {
      const priority = this.selectorPriority();
      const selector = generateSelector(element, priority);
      const selectedText = selection.toString().trim();
      if (!selectedText) return;

      const rects = range.getClientRects();
      if (rects.length === 0) return;

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      Array.from(rects).forEach((rect) => {
        minX = Math.min(minX, rect.left);
        minY = Math.min(minY, rect.top);
        maxX = Math.max(maxX, rect.right);
        maxY = Math.max(maxY, rect.bottom);
      });

      const fullDOMPath = getFullDOMPath(element);
      const computedStyles = getComprehensiveComputedStyles(element);
      const nearbyElements = getNearbyElements(element, 3);
      const rect = element.getBoundingClientRect();
      const position = getPositionDetails(rect, (this.doc.defaultView?.scrollX ?? 0), (this.doc.defaultView?.scrollY ?? 0));

      const annotation: Annotation = {
        id: this.generateId(),
        type: 'text',
        selector,
        textContent: selectedText,
        coordinates: {
          x: minX + (this.doc.defaultView?.scrollX ?? 0),
          y: minY + (this.doc.defaultView?.scrollY ?? 0),
          width: maxX - minX,
          height: maxY - minY,
        },
        metadata: {
          elementCount: 1,
          elementDescription: `text: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`,
          fullDOMPath,
          position: {
            x: position.x,
            y: position.y,
            width: position.width,
            height: position.height,
            percentageFromLeft: position.percentageFromLeft,
            pixelsFromTop: position.pixelsFromTop,
          },
          context: selectedText,
          computedStyles,
          nearbyElements,
          textRange: { start: range.startOffset, end: range.endOffset },
          elementPath: element.tagName.toLowerCase(),
        },
        timestamp: this.getTimestamp(),
      };

      this.annotationCreated.emit(annotation);
      selection.removeAllRanges();
    } catch (error) {
      console.error('Failed to create text annotation:', error);
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    if (!this.fbSmartSelector()) return;

    const target = e.target as HTMLElement;
    if (target.closest('.feedback-component-container')) return;

    this.mouseDownPos = {
      x: e.clientX + (this.doc.defaultView?.scrollX ?? 0),
      y: e.clientY + (this.doc.defaultView?.scrollY ?? 0),
    };
    this.isDragging = false;

    const overlay = this.doc.createElement('div');
    overlay.className = 'feedback-smart-select-overlay';
    overlay.style.position = 'absolute';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '99999';
    overlay.style.border = '2px dashed oklch(0.6 0.17 258 / 0.6)';
    overlay.style.backgroundColor = 'oklch(0.6 0.17 258 / 0.1)';
    overlay.style.borderRadius = '4px';
    this.doc.body.appendChild(overlay);
    this.dragOverlay = overlay;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!this.mouseDownPos) return;

      const currentX = moveEvent.clientX + (this.doc.defaultView?.scrollX ?? 0);
      const currentY = moveEvent.clientY + (this.doc.defaultView?.scrollY ?? 0);
      const distance = Math.sqrt(
        Math.pow(currentX - this.mouseDownPos.x, 2) +
        Math.pow(currentY - this.mouseDownPos.y, 2),
      );

      if (distance > 5) {
        this.isDragging = true;
      }

      if (this.isDragging && overlay) {
        const left = Math.min(this.mouseDownPos.x, currentX);
        const top = Math.min(this.mouseDownPos.y, currentY);
        const width = Math.abs(currentX - this.mouseDownPos.x);
        const height = Math.abs(currentY - this.mouseDownPos.y);

        overlay.style.left = `${left}px`;
        overlay.style.top = `${top}px`;
        overlay.style.width = `${width}px`;
        overlay.style.height = `${height}px`;
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      if (!this.mouseDownPos) return;

      const endX = upEvent.clientX + (this.doc.defaultView?.scrollX ?? 0);
      const endY = upEvent.clientY + (this.doc.defaultView?.scrollY ?? 0);
      const distance = Math.sqrt(
        Math.pow(endX - this.mouseDownPos.x, 2) +
        Math.pow(endY - this.mouseDownPos.y, 2),
      );

      if (this.dragOverlay) {
        this.dragOverlay.remove();
        this.dragOverlay = null;
      }

      if (this.isDragging && distance > 10) {
        this.createAreaAnnotation(this.mouseDownPos, endX, endY);
      } else if (!this.isDragging) {
        this.createElementAnnotation(upEvent);
      }

      this.mouseDownPos = null;
      this.isDragging = false;
      this.doc.removeEventListener('mousemove', handleMouseMove);
      this.doc.removeEventListener('mouseup', handleMouseUp);
      this.currentMoveHandler = null;
      this.currentUpHandler = null;
    };

    this.currentMoveHandler = handleMouseMove;
    this.currentUpHandler = handleMouseUp;
    this.doc.addEventListener('mousemove', handleMouseMove);
    this.doc.addEventListener('mouseup', handleMouseUp, { once: true });
  }

  private createAreaAnnotation(
    startPos: { x: number; y: number },
    endX: number,
    endY: number,
  ): void {
    const left = Math.min(startPos.x, endX);
    const top = Math.min(startPos.y, endY);
    const width = Math.abs(endX - startPos.x);
    const height = Math.abs(endY - startPos.y);

    if (width <= 10 || height <= 10) return;

    const elementsInArea = this.doc.elementsFromPoint(
      left + width / 2 - (this.doc.defaultView?.scrollX ?? 0),
      top + height / 2 - (this.doc.defaultView?.scrollY ?? 0),
    ) as HTMLElement[];

    const primaryElement = elementsInArea.find(
      (el) => !el.closest('.feedback-component-container'),
    );

    let metadata: Annotation['metadata'] = { elementCount: 0 };

    if (primaryElement) {
      const rect = primaryElement.getBoundingClientRect();
      const fullDOMPath = getFullDOMPath(primaryElement);
      const computedStyles = getComprehensiveComputedStyles(primaryElement);
      const nearbyElements = getNearbyElements(primaryElement, 3);
      const position = getPositionDetails(rect, (this.doc.defaultView?.scrollX ?? 0), (this.doc.defaultView?.scrollY ?? 0));
      const context = getElementContext(primaryElement);

      metadata = {
        elementCount: elementsInArea.length,
        fullDOMPath,
        position: {
          x: position.x,
          y: position.y,
          width: position.width,
          height: position.height,
          percentageFromLeft: position.percentageFromLeft,
          pixelsFromTop: position.pixelsFromTop,
        },
        context,
        computedStyles,
        nearbyElements,
      };
    }

    const annotation: Annotation = {
      id: this.generateId(),
      type: 'area',
      coordinates: { x: left, y: top, width, height },
      metadata,
      timestamp: this.getTimestamp(),
    };

    this.annotationCreated.emit(annotation);
  }

  private createElementAnnotation(upEvent: MouseEvent): void {
    const target = upEvent.target as HTMLElement;
    if (!target || target.closest('.feedback-component-container')) return;

    try {
      const priority = this.selectorPriority();
      const selector = generateSelector(target, priority);
      const rect = target.getBoundingClientRect();

      const fullDOMPath = getFullDOMPath(target);
      const computedStyles = getComprehensiveComputedStyles(target);
      const nearbyElements = getNearbyElements(target, 3);
      const position = getPositionDetails(rect, (this.doc.defaultView?.scrollX ?? 0), (this.doc.defaultView?.scrollY ?? 0));
      const context = getElementContext(target);

      const elementPath: string[] = [];
      let current: HTMLElement | null = target;
      while (current && current !== this.doc.body) {
        elementPath.unshift(current.tagName.toLowerCase());
        current = current.parentElement;
      }

      const annotation: Annotation = {
        id: this.generateId(),
        type: 'element',
        selector,
        textContent: target.textContent?.substring(0, 200) || undefined,
        coordinates: {
          x: position.x,
          y: position.y,
          width: position.width,
          height: position.height,
        },
        metadata: {
          elementCount: 1,
          elementDescription: `${target.tagName.toLowerCase()}${context ? ` "${context.substring(0, 50)}${context.length > 50 ? '...' : ''}"` : ''}`,
          fullDOMPath,
          position: {
            x: position.x,
            y: position.y,
            width: position.width,
            height: position.height,
            percentageFromLeft: position.percentageFromLeft,
            pixelsFromTop: position.pixelsFromTop,
          },
          context,
          computedStyles,
          nearbyElements,
          elementPath: elementPath.join(' > '),
        },
        timestamp: this.getTimestamp(),
      };

      this.annotationCreated.emit(annotation);
    } catch (error) {
      console.error('Failed to create element annotation:', error);
    }
  }
}
