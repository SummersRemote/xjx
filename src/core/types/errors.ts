/**
 * Error classes for the XJX library
 */

/**
 * Base error class
 */
export class XJXError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'XMLToJSONError';
  }
}

/**
 * Error for XML parsing issues
 */
export class XmlToJsonError extends XJXError {
  constructor(message: string) {
    super(`XML parse error: ${message}`);
    this.name = 'XmlToJsonError';
  }
}

/**
 * Error for XML serialization issues
 */
export class JsonToXmlError extends XJXError {
  constructor(message: string) {
    super(`XML serialization error: ${message}`);
    this.name = 'JsonToXmlError';
  }
}

/**
 * Error for environment incompatibility
 */
export class EnvironmentError extends XJXError {
  constructor(message: string) {
    super(`Environment error: ${message}`);
    this.name = 'EnvironmentError';
  }
}

/**
 * Error for invalid configuration
 */
export class ConfigurationError extends XJXError {
  constructor(message: string) {
    super(`Configuration error: ${message}`);
    this.name = 'ConfigurationError';
  }
}