// services/index.js
// Export all services from a single entry point

import XJXService from './xjxService.js';
import ConfigService from './configService.js';
import LoggingService from './loggingService.js';
import TransformerService from './transformerService.js';
import PipelineService from './pipelineService.js';
import ConversionService from './conversionService.js';
import CodeGenerationService from './codeGenerationService.js';

// Main service (default export)
export default XJXService;

// Individual services
export {
  ConfigService,
  LoggingService,
  TransformerService,
  PipelineService,
  ConversionService,
  CodeGenerationService
};