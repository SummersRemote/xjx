
// Export core components
export * from './index';

// Export and auto-apply extensions
import './extensions/GetPathExtension';
import './extensions/GetJsonSchemaExtension';

// Note: This file is used to create the "full" bundle 
// that includes both core functionality and extensions