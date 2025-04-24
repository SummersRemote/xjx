/**
 * XMLToJSON Library - Main entry point
 */
import { XMLToJSON } from './XMLToJSON';
import { XMLParser } from './XMLParser';
import { XMLSerializerUtil } from './XMLSerializer';
import { DOMAdapter, DOMImplementation } from './dom-adapter';
import { XMLToJSONConfig } from './types';
import { DEFAULT_CONFIG } from './config';
import * as helpers from './helpers';
import * as errors from './errors';

// Re-export all classes and types
export {
  XMLToJSON,
  XMLParser,
  XMLSerializerUtil,
  DOMAdapter,
  DOMImplementation,
  XMLToJSONConfig,
  DEFAULT_CONFIG,
  helpers,
  errors
};