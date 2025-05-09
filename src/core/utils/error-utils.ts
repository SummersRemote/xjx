/**
 * ErrorUtils - Static utilities for consistent error handling
 * 
 * Centralizes error creation and handling throughout the library to ensure
 * consistent error messages, types, and behavior.
 */
import { 
  XJXError, 
  XmlToJsonError, 
  JsonToXmlError, 
  EnvironmentError, 
  ConfigurationError 
} from '../types/error-types';

/**
 * Error utility type for try/catch
 */
export type ErrorType = 'xml-to-json' | 'json-to-xml' | 'configuration' | 'environment' | 'general';

export class ErrorUtils {
  /**
   * Create a standardized XmlToJsonError
   * @param message Primary error message
   * @param cause Original error that caused this (optional)
   * @returns Properly formatted error
   */
  public static xmlToJson(message: string, cause?: unknown): XmlToJsonError {
    return new XmlToJsonError(ErrorUtils.formatMessage(message, cause));
  }
  
  /**
   * Create a standardized JsonToXmlError
   * @param message Primary error message
   * @param cause Original error that caused this (optional)
   * @returns Properly formatted error
   */
  public static jsonToXml(message: string, cause?: unknown): JsonToXmlError {
    return new JsonToXmlError(ErrorUtils.formatMessage(message, cause));
  }
  
  /**
   * Create a standardized ConfigurationError
   * @param message Primary error message
   * @param cause Original error that caused this (optional)
   * @returns Properly formatted error
   */
  public static configuration(message: string, cause?: unknown): ConfigurationError {
    return new ConfigurationError(ErrorUtils.formatMessage(message, cause));
  }
  
  /**
   * Create a standardized EnvironmentError
   * @param message Primary error message
   * @param cause Original error that caused this (optional)
   * @returns Properly formatted error
   */
  public static environment(message: string, cause?: unknown): EnvironmentError {
    return new EnvironmentError(ErrorUtils.formatMessage(message, cause));
  }
  
  /**
   * Create a standardized general XJXError
   * @param message Primary error message
   * @param cause Original error that caused this (optional)
   * @returns Properly formatted error
   */
  public static general(message: string, cause?: unknown): XJXError {
    return new XJXError(ErrorUtils.formatMessage(message, cause));
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
  public static try<T>(
    fn: () => T, 
    errorMessage: string, 
    errorType: ErrorType = 'general'
  ): T {
    try {
      return fn();
    } catch (error) {
      switch (errorType) {
        case 'xml-to-json':
          throw ErrorUtils.xmlToJson(errorMessage, error);
        case 'json-to-xml':
          throw ErrorUtils.jsonToXml(errorMessage, error);
        case 'configuration':
          throw ErrorUtils.configuration(errorMessage, error);
        case 'environment':
          throw ErrorUtils.environment(errorMessage, error);
        default:
          throw ErrorUtils.general(errorMessage, error);
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
  public static validate(
    condition: boolean,
    errorMessage: string,
    errorType: ErrorType = 'general'
  ): void {
    if (!condition) {
      switch (errorType) {
        case 'xml-to-json':
          throw ErrorUtils.xmlToJson(errorMessage);
        case 'json-to-xml':
          throw ErrorUtils.jsonToXml(errorMessage);
        case 'configuration':
          throw ErrorUtils.configuration(errorMessage);
        case 'environment':
          throw ErrorUtils.environment(errorMessage);
        default:
          throw ErrorUtils.general(errorMessage);
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
  public static assertExists<T>(
    value: T | null | undefined,
    errorMessage: string,
    errorType: ErrorType = 'general'
  ): T {
    if (value === null || value === undefined) {
      switch (errorType) {
        case 'xml-to-json':
          throw ErrorUtils.xmlToJson(errorMessage);
        case 'json-to-xml':
          throw ErrorUtils.jsonToXml(errorMessage);
        case 'configuration':
          throw ErrorUtils.configuration(errorMessage);
        case 'environment':
          throw ErrorUtils.environment(errorMessage);
        default:
          throw ErrorUtils.general(errorMessage);
      }
    }
    return value;
  }
}