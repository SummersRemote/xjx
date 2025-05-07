/**
 * Core extensions index
 * 
 * This barrel file imports all core extensions to ensure they're registered with XJX.
 * The imports are organized by extension type for better maintainability.
 */

// Non-terminal extensions (methods that return the builder for chaining)
import './nonterminal/FromXmlExtension';
import './nonterminal/FromJsonExtension';
import './nonterminal/WithConfigExtension';
import './nonterminal/WithTransformsExtension';
import './nonterminal/ConfigManagementExtensions';

// Terminal extensions (methods that return a value)
import './terminal/ToXmlExtension';
import './terminal/ToJsonExtension';
import './terminal/ToJsonStringExtension';
import './terminal/GetJsonSchemaExtension';
import './terminal/GetPathExtension';

// This file only imports extensions for their side effects (registration)
// It doesn't export anything
export {};