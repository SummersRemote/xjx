/**
 * XJX Full Bundle
 * 
 * Comprehensive bundle that includes the core library plus all extensions and addons.
 * This is the "batteries included" version of XJX.
 */

// Export all core functionality
export * from './index';

// Ensure all core extensions are registered
import './core/commands';

// Export all addons (non-essential functionality)
export * from './addons';

// Register all individual extensions
import './core/commands/terminal/GetPathExtension';
import './core/commands/terminal/GetJsonSchemaExtension';

// Note: Any additional extensions should be added here