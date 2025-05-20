/**
 * Extension implementation for transform methods
 */
import { XJX } from "../XJX";
import { Transform } from "../core/transform";
import { logger, validate } from "../core/error";
import { NonTerminalExtensionContext } from "../core/extension";

/**
 * Implementation for adding transformers to the pipeline
 */
export function withTransforms(this: NonTerminalExtensionContext, ...transforms: Transform[]): void {
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
    
    // Basic validation of each transform
    for (const transform of transforms) {
      validate(
        transform && Array.isArray(transform.targets) && transform.targets.length > 0,
        "Each transform must have a targets array"
      );
      
      validate(
        typeof transform.transform === 'function',
        "Each transform must have a transform method"
      );
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
    throw new Error(`Failed to add transforms: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// Register the extension with XJX
XJX.registerNonTerminalExtension("withTransforms", withTransforms);