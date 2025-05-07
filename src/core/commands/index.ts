/**
 * Core extensions index - imports all core extensions to ensure they're registered
 */

// Import all core extensions
import './nonterminal/FromXmlExtension';
import './nonterminal/FromJsonExtension';
import './terminal/ToXmlExtension';
import './terminal/ToJsonExtension';
import './terminal/ToJsonStringExtension';
import './nonterminal/WithConfigExtension';
import './nonterminal/WithTransformsExtension';
import './nonterminal/ConfigManagementExtensions';
import './terminal/GetJsonSchemaExtension';
import './terminal/GetPathExtension';

// This file only imports extensions for their side effects (registration)
// It doesn't export anything
export {};