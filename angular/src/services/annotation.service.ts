import { Injectable } from '@angular/core';
import { generateSelector, validateSelector } from '../utils/selector';
import {
  getFullDOMPath,
  getComprehensiveComputedStyles,
  getNearbyElements,
  getPositionDetails,
  getElementContext,
  getElementDescription,
} from '../utils/annotation-context';

@Injectable()
export class AnnotationService {
  generateSelector = generateSelector;
  validateSelector = validateSelector;
  getFullDOMPath = getFullDOMPath;
  getComprehensiveComputedStyles = getComprehensiveComputedStyles;
  getNearbyElements = getNearbyElements;
  getPositionDetails = getPositionDetails;
  getElementContext = getElementContext;
  getElementDescription = getElementDescription;
}
