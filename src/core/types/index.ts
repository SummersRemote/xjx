/**
 * Types module - exports all type definitions
 * 
 * This barrel file centralizes all type-related exports for easier imports
 * and better type checking capabilities.
 */

// Core interfaces and types
export {
    // Transform related types
    Transform,
    TransformTarget,
    TransformContext,
    TransformResult,
    TransformDirection,
    XNode,
    createTransformResult,
    
    // Configuration types
    Configuration,
  } from './transform-interfaces';
  
  // Configuration types
  export { Configuration as ConfigType } from './config-types';
  
  // JSON types
  export { 
    JSONPrimitive, 
    JSONArray, 
    JSONObject, 
    JSONValue, 
    XMLJSONNode, 
    XMLJSONElement 
  } from './json-types';
  
  // DOM types
  export { NodeType } from './dom-types';
  
  // Error types
  export { 
    XJXError, 
    XmlToJsonError, 
    JsonToXmlError, 
    EnvironmentError, 
    ConfigurationError 
  } from './error-types';
  
  // Extension types
  export {
    XJXContext,
    TerminalExtensionContext,
    NonTerminalExtensionContext
  } from './extension-types';