/**
 * Screenshot generation utilities
 */

/**
 * Lazy-load html2canvas library
 */
let html2canvasModule: any = null;

async function loadHtml2Canvas() {
  if (!html2canvasModule) {
    try {
      // Dynamic import for code splitting
      html2canvasModule = await import('html2canvas');
      return html2canvasModule.default || html2canvasModule;
    } catch (error) {
      console.error('Failed to load html2canvas:', error);
      throw new Error('Screenshot library not available');
    }
  }
  return html2canvasModule.default || html2canvasModule;
}

export interface ScreenshotOptions {
  quality?: number; // 0-1, default 0.8
  maxWidth?: number; // default 1200px
  element?: HTMLElement;
  coordinates?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Generate screenshot of an element or region
 */
export async function generateScreenshot(
  options: ScreenshotOptions = {}
): Promise<string> {
  const {
    quality = 0.8,
    maxWidth = 1200,
    element,
    coordinates,
  } = options;

  const html2canvas = await loadHtml2Canvas();

  let targetElement: HTMLElement;
  let cropArea: { x: number; y: number; width: number; height: number } | undefined;

  if (element) {
    targetElement = element;
  } else if (coordinates) {
    // For coordinate-based screenshots, capture the entire viewport
    // and crop it later
    targetElement = document.body;
    cropArea = {
      x: coordinates.x - window.scrollX,
      y: coordinates.y - window.scrollY,
      width: coordinates.width,
      height: coordinates.height,
    };
  } else {
    // Capture entire viewport
    targetElement = document.body;
  }

  // Hide modals and loading indicators during screenshot capture
  const modals = document.querySelectorAll('[role="dialog"], .modalBackdrop, .backdrop, [class*="modal"], [class*="Modal"]');
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
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      ignoreElements: (element) => {
        // Exclude modals, loading indicators, and feedback component UI
        return (
          element.closest('[role="dialog"]') !== null ||
          element.closest('.modalBackdrop') !== null ||
          element.closest('.backdrop') !== null ||
          element.closest('.feedback-component-container') !== null ||
          element.classList.contains('screenshotLoading') ||
          element.classList.contains('modal') ||
          element.getAttribute('aria-modal') === 'true'
        );
      },
    });

    // Crop if needed
    let finalCanvas = canvas;
    if (cropArea) {
      const croppedCanvas = document.createElement('canvas');
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
          cropArea.height
        );
        finalCanvas = croppedCanvas;
      }
    }

    // Resize if needed
    if (finalCanvas.width > maxWidth) {
      const ratio = maxWidth / finalCanvas.width;
      const resizedCanvas = document.createElement('canvas');
      resizedCanvas.width = maxWidth;
      resizedCanvas.height = finalCanvas.height * ratio;
      const ctx = resizedCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(finalCanvas, 0, 0, resizedCanvas.width, resizedCanvas.height);
        finalCanvas = resizedCanvas;
      }
    }

    // Convert to base64 JPEG
    const base64 = finalCanvas.toDataURL('image/jpeg', quality);
    return base64;
  } catch (error) {
    console.error('Failed to generate screenshot:', error);
    throw new Error('Screenshot generation failed');
  } finally {
    // Restore modal visibility
    hiddenModals.forEach(({ element, originalDisplay }) => {
      const htmlElement = element as HTMLElement;
      htmlElement.style.display = originalDisplay || '';
    });
  }
}

/**
 * Generate screenshot for an annotation
 */
export async function generateAnnotationScreenshot(
  annotation: {
    type: 'element' | 'text' | 'area';
    selector?: string;
    coordinates: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  },
  options: { quality?: number; maxWidth?: number } = {}
): Promise<string> {
  const { quality = 0.8, maxWidth = 1200 } = options;

  if (annotation.type === 'element' && annotation.selector) {
    try {
      const element = document.querySelector(annotation.selector) as HTMLElement;
      if (element) {
        return generateScreenshot({ element, quality, maxWidth });
      }
    } catch (error) {
      console.warn('Failed to find element for screenshot, using coordinates:', error);
    }
  }

  // Fallback to coordinate-based screenshot
  return generateScreenshot({
    coordinates: annotation.coordinates,
    quality,
    maxWidth,
  });
}
