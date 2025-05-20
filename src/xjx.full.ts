/**
 * XJX Full Bundle Entry Point
 * 
 * This file imports and re-exports everything needed for the full bundle.
 * It includes all features, extensions, and transforms.
 */

// Import all extensions to register them with XJX
import './extensions/from-xml';
import './extensions/from-json';
import './extensions/to-xml';
import './extensions/to-json';
import './extensions/config-extensions';
import './extensions/with-transforms';

// Import transform classes directly to ensure they're available
import { BooleanTransform } from './transforms/boolean-transform';
import { NumberTransform } from './transforms/number-transform';
import { RegexTransform } from './transforms/regex-transform';
import { MetadataTransform } from './transforms/metadata-transform';

// Export the main class (for instantiation)
import { XJX } from './XJX';
export { XJX };
export { default } from './XJX';

// Export everything else from the main index
export * from './index';

// Export a marker to make it clear this is the full bundle
export const __FULL_BUNDLE__ = true;