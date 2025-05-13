/**
 * Core extension that implements the withTransforms method
 */
import { XJX } from "../../XJX";
import { Transform } from "../../core/transform";
import { catchAndRelease, validate, ErrorType } from "../../core/error";
import { NonTerminalExtensionContext } from "../../core/extension";

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
      let msg = "Invalid transform: must implement the Transform interface"
      catchAndRelease(new Error(msg), msg, {
        errorType: ErrorType.VALIDATION,
      });
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