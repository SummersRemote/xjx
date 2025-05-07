/**
 * Core extension that implements the withTransforms method
 */
import { XJX } from "../../XJX";
import { Transform } from "../../types/transform-interfaces";
import { XJXError } from "../../types/error-types";
import { NonTerminalExtensionContext } from "../../types/extension-types";

/**
 * Add transformers to the pipeline
 * @param transforms One or more transformers
 */
function withTransforms(this: NonTerminalExtensionContext, ...transforms: Transform[]) {
  if (!transforms || transforms.length === 0) {
    return this;
  }
  
  // Validate transforms
  for (const transform of transforms) {
    if (!transform || !transform.targets || !transform.transform) {
      throw new XJXError('Invalid transform: must implement the Transform interface');
    }
  }
  
  // Initialize transforms array if it doesn't exist
  if (!this.transforms) {
    this.transforms = [];
  }
  
  // Add transforms to the pipeline
  this.transforms.push(...transforms);
  return this;
}

// Register the extension
XJX.registerNonTerminalExtension("withTransforms", withTransforms);