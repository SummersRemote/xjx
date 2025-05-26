/**
 * XJX Library - XML/JSON transformation with fluent API
 */

// IMPORTANT: Register all extensions by importing their files
// These imports MUST be kept as they register methods on the XJX prototype
import './extensions/from-xml';
import './extensions/from-json';
import './extensions/to-xml';
import './extensions/to-json';
import './extensions/config-extensions';
import './extensions/to-xnode';
import './extensions/from-xnode';
import './extensions/functional-extensions';
import './extensions/axis-extensions';
import './extensions/transform-extension';

// Export the main class (for instantiation)
export { XJX } from './XJX';
export { default } from './XJX';

// Export core interfaces and types
export {
  // Configuration
  Configuration,
} from './core/config';

export {
  // Transform system
  Transform,
  TransformOptions,
  TransformIntent,
  compose,
  createTransform,
  FORMAT
} from './core/transform';

// Export error handling
export {
  ValidationError,
  ProcessingError,
  XJXError,
  validate,
  logger,
  LogLevel,
} from './core/error';

// Export model interfaces
export { XNode } from './core/xnode';

// Export extension context interfaces
export {
  TerminalExtensionContext,
  NonTerminalExtensionContext
} from './core/extension';

// Export JSON conversion types
export {
  JsonOptions,
  JsonValue,
  JsonObject,
  JsonArray,
} from './core/converter';

// Export transform functions and creators
export {
  // Transform Factories
  toNumber,
  toBoolean,
  regex,
  
  // Options interfaces
  NumberOptions,
  BooleanOptions,
  RegexOptions,
} from './transforms';

// Manual registration verification - this function does nothing at runtime
// but ensures that tree-shaking doesn't remove our extension imports
function ensureExtensionsRegistered() {
  // The mere existence of this function with references prevents tree-shaking
  return [
    './extensions/from-xml',
    './extensions/from-json',
    './extensions/to-xml',
    './extensions/to-json',
    './extensions/config-extensions',
    './extensions/to-xnode',
    './extensions/from-xnode',
    './extensions/functional/functional-extensions',
    './extensions/functional/axis-extensions',
    './extensions/functional/transform-extension'
  ];
}

// This will be removed in production builds but helps ensure extensions are loaded
ensureExtensionsRegistered();