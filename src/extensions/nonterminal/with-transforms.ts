/**
 * Core extension that implements the withTransforms method
 */
import { XJX } from "../../XJX";
import { Transform } from "../../core/transform";
import { NonTerminalExtensionContext } from "../../core/extension";
import { logger, validate, ValidationError, TransformError } from "../../core/error";

/**
 * Add transformers to the pipeline
 * @param transforms One or more transformers
 */
function withTransforms(this: NonTerminalExtensionContext, ...transforms: Transform[]) {
  try {
    // API boundary validation - validate parameters
    validate(Array.isArray(transforms), "Transforms must be an array");
    
    // Skip if no transforms provided
    if (transforms.length === 0) {
      logger.debug('No transforms provided, skipping');
      return this;
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
    
    return this;
  } catch (err) {
    // At API boundary, we handle different error types appropriately
    if (err instanceof ValidationError) {
      logger.error('Invalid transform', err);
      throw err;
    } else {
      const error = new TransformError('Failed to add transforms', {
        transformCount: transforms.length
      });
      logger.error('Failed to add transforms', error);
      throw error;
    }
  }
}

// Register the extension
XJX.registerNonTerminalExtension("withTransforms", withTransforms);