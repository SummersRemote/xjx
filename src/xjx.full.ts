// Export core components
export * from './index';

// Export and auto-apply extensions
import './extensions/GetPathExtension';
import './extensions/GetJsonSchemaExtension';

// This file creates the "full" bundle with core functionality, transformers, and extensions