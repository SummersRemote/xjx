/**
 * Extension implementation for transform methods
 */
import { XJX } from "../../XJX";
import { Transform } from "../../core/transform";
import { logger, validate } from "../../core/error";

/**
 * Implementation for adding transformers to the pipeline
 */
export function implementWithTransforms(xjx: XJX, ...transforms: Transform[]): void {
  try {
    // API boundary validation
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
    if (!xjx.transforms) {
      xjx.transforms = [];
    }
    
    // Add transforms to the pipeline
    xjx.transforms.push(...transforms);
    
    logger.debug('Successfully added transforms', {
      totalTransforms: xjx.transforms.length
    });
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to add transforms: ${String(err)}`);
  }
}

// Register the implementation with XJX
XJX.prototype.withTransforms = function(...transforms: Transform[]): XJX {
  implementWithTransforms(this, ...transforms);
  return this;
};