/**
 * XJX Full Bundle
 * 
 * Comprehensive bundle that includes the core library plus all extensions.
 * This is the "batteries included" version of XJX.
 */

// Export all core functionality
export * from './index';

// Ensure all core extensions are registered
import './core/commands';

// Export transform-specific functionality from transforms barrel
export * from './core/transforms';

// Export utility-specific functionality from utils barrel
export * from './core/utils';

// Register all individual extensions
import './core/commands/terminal/GetPathExtension';
import './core/commands/terminal/GetJsonSchemaExtension';

// Note: Any additional extensions should be added here