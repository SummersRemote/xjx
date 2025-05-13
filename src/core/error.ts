/**
 * Simplified error handling system for the XJX library
 * 
 * Provides structured errors and centralized error handling functionality
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
 * Base structured error class for XJX
 * Provides consistent error structure with type and context information
 */
export class XJXError extends Error {
  /** Error type for categorization */
  public readonly type: ErrorType;
  
  /** Additional context information */
  public readonly context?: any;
  
  /**
   * Create a new XJX error
   * @param message Error message
   * @param type Error type from ErrorType enum
   * @param context Optional context data for debugging
   */
  constructor(
    message: string, 
    type: ErrorType = ErrorType.GENERAL,
    context?: any
  ) {
    // Pass message to parent Error class
    super(message);
    
    // Set name for better stack traces
    this.name = 'XJXError';
    
    // Store error type and context
    this.type = type;
    this.context = context;
    
    // Capture stack trace
    Error.captureStackTrace?.(this, XJXError);
  }
}

/**
 * Type guard to check if an error is a XJXError
 */
export function isXJXError(err: unknown): err is XJXError {
  return err instanceof XJXError;
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
 * Logs the error and returns a fallback value or rethrows.
 * 
 * Behavior:
 * 1. If rethrow=true: Always rethrows the error (after logging)
 * 2. If defaultValue is provided: Returns the default value  
 * 3. Otherwise: Rethrows the error (maintains backward compatibility)
 *
 * @param err - The error caught in a try/catch block
 * @param message - Description of what failed
 * @param options - Optional: default return value, log level, context data
 * @returns The provided defaultValue if not rethrowing
 * @throws The original error if rethrowing or no defaultValue
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

  // Extract information from XJXError if available
  let processedError: Error;
  let errorTypeToUse = errorType;
  let contextData = data;
  
  if (isXJXError(err)) {
    processedError = err;
    errorTypeToUse = err.type;
    
    // Merge explicit data with error context if both exist
    if (data !== undefined && err.context !== undefined) {
      contextData = { ...err.context, ...data };
    } else if (err.context !== undefined) {
      contextData = err.context;
    }
  } else if (err instanceof Error) {
    processedError = err;
  } else {
    processedError = new Error(String(err));
  }

  // Handle logging unless suppressed
  if (level !== LogLevel.SUPPRESS) {
    const logMethod = level.toLowerCase() as keyof Console;
    // Use type assertion to fix the TypeScript error
    const logFn = (console[logMethod] || console.error) as (...args: any[]) => void;
    
    // Describe the action that will be taken
    let action;
    if (rethrow) {
      action = "Rethrowing error.";
    } else if (defaultValue !== undefined) {
      action = "Returning default value.";
    } else {
      action = "Rethrowing (no default provided).";
    }
    
    // Use the enum value directly (it's already a string) and convert to uppercase
    const errorTypeLabel = errorTypeToUse.toUpperCase();
    
    logFn(`[${errorTypeLabel}] ${message} - ${action}`, {
      error: processedError.message,
      stack: processedError.stack,
      context: contextData,
    });
  }

  // Handle based on options:
  if (defaultValue !== undefined && !rethrow) {
    // Default value exists and not rethrowing - return default
    return defaultValue;
  }
  
  // Either explicitly rethrowing or no default value
  throw processedError;
}

/**
 * Validate a condition and throw an error if it fails
 * @param condition Condition to check
 * @param errorMessage Error message if condition fails
 * @param errorType Optional error type (defaults to VALIDATION)
 * @param context Optional context data
 * @throws XJXError with the specified message if condition is false
 */
export function validate(
  condition: boolean,
  errorMessage: string,
  errorType: ErrorType = ErrorType.VALIDATION,
  context?: any
): void {
  if (!condition) {
    throw new XJXError(errorMessage, errorType, context);
  }
}