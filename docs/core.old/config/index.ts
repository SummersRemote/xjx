/**
 * Configuration module exports
 * 
 * This file provides a convenient way to access all configuration-related
 * functionality in one place. It re-exports the simplified config management
 * system along with necessary types and defaults.
 */

// Export configuration types
export { Configuration } from '../types/config-types';

// Export configuration manager
export { ConfigManager } from './config-manager';

// Export default configuration
export { DEFAULT_CONFIG } from './config';