import { inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import type { Annotation, ScreenshotOptions } from '../models/feedback.model';

@Injectable()
export class ScreenshotService {
  private readonly doc = inject(DOCUMENT);
  private html2canvasModule: any = null;

  async generateScreenshot(options: ScreenshotOptions = {}): Promise<string> {
    const { quality = 0.8, maxWidth = 1200, element, coordinates } = options;
    const win = this.doc.defaultView;

    const html2canvas = await this.loadHtml2Canvas();

    let targetElement: HTMLElement;
    let cropArea: { x: number; y: number; width: number; height: number } | undefined;

    if (element) {
      targetElement = element;
    } else if (coordinates) {
      targetElement = this.doc.body;
      cropArea = {
        x: coordinates.x - (win?.scrollX ?? 0),
        y: coordinates.y - (win?.scrollY ?? 0),
        width: coordinates.width,
        height: coordinates.height,
      };
    } else {
      targetElement = this.doc.body;
    }

    const modals = this.doc.querySelectorAll(
      '[role="dialog"], .modalBackdrop, .backdrop, [class*="modal"], [class*="Modal"]',
    );
    const hiddenModals: Array<{ element: Element; originalDisplay: string }> = [];

    modals.forEach((modal) => {
      const htmlElement = modal as HTMLElement;
      const originalDisplay = htmlElement.style.display;
      htmlElement.style.display = 'none';
      hiddenModals.push({ element: modal, originalDisplay });
    });

    try {
      const canvas = await html2canvas(targetElement, {
        useCORS: true,
        logging: false,
        scale: 1,
        windowWidth: win?.innerWidth ?? 0,
        windowHeight: win?.innerHeight ?? 0,
        ignoreElements: (el: Element) => {
          return (
            el.closest('[role="dialog"]') !== null ||
            el.closest('.modalBackdrop') !== null ||
            el.closest('.backdrop') !== null ||
            el.closest('.feedback-component-container') !== null ||
            el.classList.contains('screenshotLoading') ||
            el.classList.contains('modal') ||
            el.getAttribute('aria-modal') === 'true'
          );
        },
      });

      let finalCanvas = canvas;
      if (cropArea) {
        const croppedCanvas = this.doc.createElement('canvas');
        croppedCanvas.width = cropArea.width;
        croppedCanvas.height = cropArea.height;
        const ctx = croppedCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            canvas,
            cropArea.x,
            cropArea.y,
            cropArea.width,
            cropArea.height,
            0,
            0,
            cropArea.width,
            cropArea.height,
          );
          finalCanvas = croppedCanvas;
        }
      }

      if (finalCanvas.width > maxWidth) {
        const ratio = maxWidth / finalCanvas.width;
        const resizedCanvas = this.doc.createElement('canvas');
        resizedCanvas.width = maxWidth;
        resizedCanvas.height = finalCanvas.height * ratio;
        const ctx = resizedCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(finalCanvas, 0, 0, resizedCanvas.width, resizedCanvas.height);
          finalCanvas = resizedCanvas;
        }
      }

      return finalCanvas.toDataURL('image/jpeg', quality);
    } catch (error) {
      console.error('Failed to generate screenshot:', error);
      throw new Error('Screenshot generation failed');
    } finally {
      hiddenModals.forEach(({ element, originalDisplay }) => {
        const htmlElement = element as HTMLElement;
        htmlElement.style.display = originalDisplay || '';
      });
    }
  }

  async generateAnnotationScreenshot(
    annotation: Pick<Annotation, 'type' | 'selector' | 'coordinates'>,
    options: { quality?: number; maxWidth?: number } = {},
  ): Promise<string> {
    const { quality = 0.8, maxWidth = 1200 } = options;

    if (annotation.type === 'element' && annotation.selector) {
      try {
        const element = this.doc.querySelector(annotation.selector) as HTMLElement;
        if (element) {
          return this.generateScreenshot({ element, quality, maxWidth });
        }
      } catch (error) {
        console.warn('Failed to find element for screenshot, using coordinates:', error);
      }
    }

    return this.generateScreenshot({
      coordinates: annotation.coordinates,
      quality,
      maxWidth,
    });
  }

  private async loadHtml2Canvas(): Promise<any> {
    if (!this.html2canvasModule) {
      try {
        this.html2canvasModule = await import('html2canvas');
        return this.html2canvasModule.default || this.html2canvasModule;
      } catch (error) {
        console.error('Failed to load html2canvas:', error);
        throw new Error('Screenshot library not available');
      }
    }
    return this.html2canvasModule.default || this.html2canvasModule;
  }
}
