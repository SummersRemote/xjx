/**
 * Core extensions index - imports all core extensions to ensure they're registered
 */

// Import all core extensions
import './FromXmlExtension';
import './FromJsonExtension';
import './ToXmlExtension';
import './ToJsonExtension';
import './ToJsonStringExtension';
import './WithConfigExtension';
import './WithTransformsExtension';
import './ConfigManagementExtensions';

// This file only imports extensions for their side effects (registration)
// It doesn't export anything
export {};