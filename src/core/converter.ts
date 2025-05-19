/**
 * Base converter abstract class with common functionality for all converters
 */
import { Configuration, Config } from './config';
import { validate, handleError, ErrorType } from './error';

/**
 * Base converter interface
 */
export interface Converter<TInput, TOutput> {
  /**
   * Convert from input to output format
   * @param input Input data
   * @returns Converted output
   */
  convert(input: TInput): TOutput;
}

/**
 * Abstract base converter with common functionality for all converters
 */
export abstract class BaseConverter<TInput, TOutput> implements Converter<TInput, TOutput> {
  protected config: Configuration;
  
  /**
   * Create a new converter
   * @param config Configuration
   */
  constructor(config: Configuration) {
    this.config = this.validateConfig(config);
  }
  
  /**
   * Convert from input to output format - abstract method to be implemented by subclasses
   * @param input Input to convert
   * @returns Converted output
   */
  abstract convert(input: TInput): TOutput;
  
  /**
   * Validate and normalize configuration
   * @param config Configuration to validate
   * @returns Validated configuration
   * @protected
   */
  protected validateConfig(config: Configuration): Configuration {
    try {
      return Config.isValid(config) ? config : Config.createOrUpdate({}, config);
    } catch (err) {
      return handleError(err, `initialize ${this.constructor.name}`, {
        errorType: ErrorType.CONFIGURATION,
        fallback: Config.getDefault()
      });
    }
  }
  
  /**
   * Validate input value with optional custom validator
   * @param input Input to validate
   * @param errorMessage Error message if validation fails
   * @param validator Optional custom validator function
   * @returns Validated input
   * @protected
   */
  protected validateInput<T>(input: T, errorMessage: string, validator?: (value: T) => boolean): T {
    try {
      const isValid = validator ? validator(input) : input !== null && input !== undefined;
      validate(isValid, errorMessage);
      return input;
    } catch (err) {
      throw handleError(err, "validate input", { errorType: ErrorType.VALIDATION });
    }
  }
  
  /**
   * Create context object with additional properties
   * @param additionalContext Additional context properties
   * @returns Context object
   * @protected
   */
  protected createContext(additionalContext?: Record<string, any>): Record<string, any> {
    return {
      config: this.config,
      ...additionalContext
    };
  }
}