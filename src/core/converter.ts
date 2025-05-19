/**
 * Base converter interface
 */
import { Configuration } from './config';
import { validate } from './error';

/**
 * Basic converter interface
 */
export interface Converter<TInput, TOutput> {
  /**
   * Convert from input to output format
   * @param input Input to convert
   * @returns Converted output
   */
  convert(input: TInput): TOutput;
}

/**
 * Create a converter with configuration
 * @param config Configuration for the converter
 * @param convertFn Implementation function
 * @returns Converter implementation
 */
export function createConverter<TInput, TOutput>(
  config: Configuration,
  convertFn: (input: TInput, config: Configuration) => TOutput
): Converter<TInput, TOutput> {
  return {
    convert(input: TInput): TOutput {
      return convertFn(input, config);
    }
  };
}

/**
 * Validate input at API boundary
 * @param input Input to validate
 * @param message Error message if validation fails
 * @param validator Optional custom validator function
 */
export function validateInput<T>(
  input: T, 
  message: string,
  validator?: (value: T) => boolean
): void {
  const isValid = validator ? validator(input) : input !== null && input !== undefined;
  validate(isValid, message);
}