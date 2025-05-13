/**
 * Error handling system for the XJX library
 */

export type ErrorType = 'xml-to-json' | 'json-to-xml' | 'configuration' | 'environment' | 'general';

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

/**
 * Error utilities for standardized error handling
 */
export class ErrorHandler {
  /**
   * Create a standardized XmlToJsonError
   * @param message Primary error message
   * @param cause Original error that caused this (optional)
   * @returns Properly formatted error
   */
  static xmlToJson(message: string, cause?: unknown): XmlToJsonError {
    return new XmlToJsonError(ErrorHandler.formatMessage(message, cause));
  }
  
  /**
   * Create a standardized JsonToXmlError
   * @param message Primary error message
   * @param cause Original error that caused this (optional)
   * @returns Properly formatted error
   */
  static jsonToXml(message: string, cause?: unknown): JsonToXmlError {
    return new JsonToXmlError(ErrorHandler.formatMessage(message, cause));
  }
  
  /**
   * Create a standardized ConfigurationError
   * @param message Primary error message
   * @param cause Original error that caused this (optional)
   * @returns Properly formatted error
   */
  static configuration(message: string, cause?: unknown): ConfigurationError {
    return new ConfigurationError(ErrorHandler.formatMessage(message, cause));
  }
  
  /**
   * Create a standardized EnvironmentError
   * @param message Primary error message
   * @param cause Original error that caused this (optional)
   * @returns Properly formatted error
   */
  static environment(message: string, cause?: unknown): EnvironmentError {
    return new EnvironmentError(ErrorHandler.formatMessage(message, cause));
  }
  
  /**
   * Create a standardized general XJXError
   * @param message Primary error message
   * @param cause Original error that caused this (optional)
   * @returns Properly formatted error
   */
  static general(message: string, cause?: unknown): XJXError {
    return new XJXError(ErrorHandler.formatMessage(message, cause));
  }
  
  /**
   * Standardized error message formatting
   * @private
   * @param message Primary message
   * @param cause Cause of the error
   * @returns Formatted message
   */
  private static formatMessage(message: string, cause?: unknown): string {
    if (!cause) return message;
    
    let causeMessage: string;
    if (cause instanceof Error) {
      causeMessage = cause.message;
    } else {
      causeMessage = String(cause);
    }
    
    return `${message}: ${causeMessage}`;
  }
  
  /**
   * Execute a function with standardized try/catch
   * @param fn Function to execute
   * @param errorMessage Message if it fails
   * @param errorType Type of error to create
   * @returns Result of function
   */
  static try<T>(
    fn: () => T, 
    errorMessage: string, 
    errorType: ErrorType = 'general'
  ): T {
    try {
      return fn();
    } catch (error) {
      switch (errorType) {
        case 'xml-to-json':
          throw ErrorHandler.xmlToJson(errorMessage, error);
        case 'json-to-xml':
          throw ErrorHandler.jsonToXml(errorMessage, error);
        case 'configuration':
          throw ErrorHandler.configuration(errorMessage, error);
        case 'environment':
          throw ErrorHandler.environment(errorMessage, error);
        default:
          throw ErrorHandler.general(errorMessage, error);
      }
    }
  }

  /**
   * Validate a condition and throw an error if it fails
   * @param condition Condition to check
   * @param errorMessage Error message if condition fails
   * @param errorType Type of error to create
   * @throws Appropriate error if condition is false
   */
  static validate(
    condition: boolean,
    errorMessage: string,
    errorType: ErrorType = 'general'
  ): void {
    if (!condition) {
      switch (errorType) {
        case 'xml-to-json':
          throw ErrorHandler.xmlToJson(errorMessage);
        case 'json-to-xml':
          throw ErrorHandler.jsonToXml(errorMessage);
        case 'configuration':
          throw ErrorHandler.configuration(errorMessage);
        case 'environment':
          throw ErrorHandler.environment(errorMessage);
        default:
          throw ErrorHandler.general(errorMessage);
      }
    }
  }

  /**
   * Assert that a value is not null or undefined
   * @param value Value to check
   * @param errorMessage Error message if value is null/undefined
   * @param errorType Type of error to create
   * @returns The value (for chaining)
   * @throws Appropriate error if value is null or undefined
   */
  static assertExists<T>(
    value: T | null | undefined,
    errorMessage: string,
    errorType: ErrorType = 'general'
  ): T {
    if (value === null || value === undefined) {
      switch (errorType) {
        case 'xml-to-json':
          throw ErrorHandler.xmlToJson(errorMessage);
        case 'json-to-xml':
          throw ErrorHandler.jsonToXml(errorMessage);
        case 'configuration':
          throw ErrorHandler.configuration(errorMessage);
        case 'environment':
          throw ErrorHandler.environment(errorMessage);
        default:
          throw ErrorHandler.general(errorMessage);
      }
    }
    return value;
  }
}