/**
 * Error handling system for the XJX library
 * 
 * Provides a centralized approach for error handling, logging, and recovery
 */

/**
 * Log levels supported by console
 */
export enum LogLevel {
  SUPPRESS = 'suppress',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

/**
 * Common error types for categorization
 */
export enum ErrorType {
  PARSE = 'parse',
  SERIALIZE = 'serialize',
  CONFIG = 'config',
  ENV = 'env',
  TRANSFORM = 'transform',
  VALIDATION = 'validation',
  GENERAL = 'general'
}

/**
 * Options for handling errors with optional fallback value and logging.
 */
interface CatchOptions<T> {
  data?: any;                      // Optional context data for debugging
  defaultValue?: T;                // Optional fallback return value
  level?: LogLevel;                // Logging level; defaults to ERROR
  errorType?: ErrorType;           // Error type - enum only
  rethrow?: boolean;               // Should the error bubble? defaults to false
}

/**
 * Type guard to check if a value is an Error instance
 */
function isError(err: unknown): err is Error {
  return err instanceof Error;
}

/**
 * Logs the error and returns an optional fallback value.
 *
 * @param err - The error caught in a try/catch block
 * @param message - Description of what failed
 * @param options - Optional: default return value, log level, context data
 * @returns The provided defaultValue or throws
 */
export function catchAndRelease<T>(
  err: unknown,
  message: string,
  options: CatchOptions<T> = {}
): T {
  const {
    data,
    defaultValue,
    level = LogLevel.ERROR,
    errorType = ErrorType.GENERAL,
    rethrow = false
  } = options;

  // Normalize the error
  let processedError: Error;
  if (isError(err)) {
    processedError = err;
  } else {
    processedError = new Error(String(err));
    (processedError as any).originalValue = err;
  }
  
  // Add error type for filtering/grouping
  (processedError as any).errorType = errorType;

  // Handle logging unless suppressed
  if (level !== LogLevel.SUPPRESS) {
    const logMethod = level.toLowerCase() as keyof Console;
    // Use type assertion to fix the TypeScript error
    const logFn = (console[logMethod] || console.error) as (...args: any[]) => void;
    const action = defaultValue !== undefined ? `Returning default value.` : `Continuing...`;
    
    // Use the enum value directly (it's already a string) and convert to uppercase
    const errorTypeLabel = errorType.toUpperCase();
    
    logFn(`[${errorTypeLabel}] ${message} - ${action}`, {
      error: processedError.message,
      stack: processedError.stack,
      context: data,
    });
  }

  // Either return fallback or rethrow
    if (defaultValue !== undefined && !rethrow) {
      return defaultValue;
    } 

    // Throw the error if we reach this point
    throw processedError;

}

 /**
   * Validate a condition and throw an error if it fails
   * @param condition Condition to check
   * @param errorMessage Error message if condition fails
   * @param errorType Type of error to create
   * @throws Appropriate error if condition is false
   */
 export function validate(
  condition: boolean,
  errorMessage: string
): void {
  if (!condition) {
    let error = new Error(errorMessage);
    catchAndRelease(error, "Failed to add namespace declarations", {
      errorType: ErrorType.VALIDATION,
      rethrow: true
    });
  }
}