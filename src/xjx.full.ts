/**
 * XJX Full Bundle
 * 
 * Exports core functionality plus all extensions
 */

// Export core components
export * from './index';

// Ensure all core extensions are registered
import './core/commands';

// Register additional extensions

// This file creates the "full" bundle with core functionality, converters, and all extensions