/**
 * Error classes for XMLToJSON
 */

/**
 * Base error class for XMLToJSON
 */
export class XMLToJSONError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'XMLToJSONError';
    }
  }
  
  /**
   * Error for XML parsing issues
   */
  export class XMLParseError extends XMLToJSONError {
    constructor(message: string) {
      super(`XML parse error: ${message}`);
      this.name = 'XMLParseError';
    }
  }
  
  /**
   * Error for XML serialization issues
   */
  export class XMLSerializeError extends XMLToJSONError {
    constructor(message: string) {
      super(`XML serialize error: ${message}`);
      this.name = 'XMLSerializeError';
    }
  }
  
  /**
   * Error for environment incompatibility
   */
  export class EnvironmentError extends XMLToJSONError {
    constructor(message: string) {
      super(`Environment error: ${message}`);
      this.name = 'EnvironmentError';
    }
  }
  
  /**
   * Error for invalid configuration
   */
  export class ConfigurationError extends XMLToJSONError {
    constructor(message: string) {
      super(`Configuration error: ${message}`);
      this.name = 'ConfigurationError';
    }
  }