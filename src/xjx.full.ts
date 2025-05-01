// Export core components
export * from './index';

// Export all transformers
export * from './core/transformers';

// Export and auto-apply extensions
import './extensions/GetPathExtension';
import './extensions/GetJsonSchemaExtension';

// This file creates the "full" bundle with core functionality, transformers, and extensions