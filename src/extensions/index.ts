/**
 * XJX Extension Registry
 * 
 * This module imports and registers all built-in extensions.
 * For ESM compatibility, we use explicit file extensions.
 */

// Terminal extensions - always return a value
import './terminal/to-xml.js';
import './terminal/to-json.js';
import './terminal/to-std-json.js';
import './terminal/to-json-string.js';

// Non-terminal extensions - always return the XJX instance for chaining
import './nonterminal/from-xml.js';
import './nonterminal/from-json.js';
import './nonterminal/with-config.js';
import './nonterminal/with-transforms.js';
import './nonterminal/set-log-level.js';


// Export a marker to make side effects explicit
export const __EXTENSION_REGISTRY__ = true;