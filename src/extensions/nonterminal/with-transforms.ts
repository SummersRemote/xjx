/**
 * Core extension that implements the withTransforms method
 */
import { XJX } from "../../XJX";
import { Transform } from "../../core/transform";
import { logger, validate, ValidationError, TransformError, handleError, ErrorType } from "../../core/error";

// Type augmentation - add method to XJX interface
declare module '../../XJX' {
  interface XJX {
    /**
     * Add transformers to the pipeline
     * @param transforms One or more transformers
     * @returns This instance for chaining
     */
    withTransforms(...transforms: Transform[]): XJX;
  }
}

/**
 * Add transformers to the pipeline
 * @param transforms One or more transformers
 */
function withTransforms(this: XJX, ...transforms: Transform[]): void {
  try {
    // API boundary validation - validate parameters
    validate(Array.isArray(transforms), "Transforms must be an array");
    
    // Skip if no transforms provided
    if (transforms.length === 0) {
      logger.debug('No transforms provided, skipping');
      return;
    }
    
    logger.debug('Adding transforms to pipeline', {
      transformCount: transforms.length
    });
    
    // Validate each transform
    for (let i = 0; i < transforms.length; i++) {
      const transform = transforms[i];
      
      // Validate transform interface requirements
      validate(
        transform !== null && typeof transform === 'object',
        `Transform at index ${i} must be an object`
      );
      
      validate(
        Array.isArray(transform.targets) && transform.targets.length > 0,
        `Transform at index ${i} must have a targets array`
      );
      
      validate(
        typeof transform.transform === 'function',
        `Transform at index ${i} must have a transform method`
      );
      
      logger.debug('Validated transform', {
        index: i,
        targets: transform.targets
      });
    }
    
    // Initialize transforms array if it doesn't exist
    if (!this.transforms) {
      this.transforms = [];
    }
    
    // Add transforms to the pipeline
    this.transforms.push(...transforms);
    
    logger.debug('Successfully added transforms', {
      totalTransforms: this.transforms.length
    });
  } catch (err) {
    // At API boundary, use handleError to ensure consistent error handling
    handleError(err, "add transforms", {
      data: { 
        transformCount: transforms?.length || 0
      },
      errorType: ErrorType.TRANSFORM
    });
  }
}

// Register the extension
XJX.registerNonTerminalExtension("withTransforms", withTransforms);