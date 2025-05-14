/**
 * Error handling and logging for the XJX library
 */

// --- Error Types ---

/**
 * Error for validation failures
 */
export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
    // Fix prototype chain for instanceof
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error for parsing failures
 */
export class ParseError extends Error {
  constructor(message: string, public source?: any) {
    super(message);
    this.name = 'ParseError';
    Object.setPrototypeOf(this, ParseError.prototype);
  }
}

/**
 * Error for serialization failures
 */
export class SerializeError extends Error {
  constructor(message: string, public target?: any) {
    super(message);
    this.name = 'SerializeError';
    Object.setPrototypeOf(this, SerializeError.prototype);
  }
}

/**
 * Error for transformation failures
 */
export class TransformError extends Error {
  constructor(message: string, public context?: any) {
    super(message);
    this.name = 'TransformError';
    Object.setPrototypeOf(this, TransformError.prototype);
  }
}

/**
 * Error for configuration issues
 */
export class ConfigurationError extends Error {
  constructor(message: string, public config?: any) {
    super(message);
    this.name = 'ConfigurationError';
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

/**
 * Error for environment issues
 */
export class EnvironmentError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'EnvironmentError';
    Object.setPrototypeOf(this, EnvironmentError.prototype);
  }
}

// --- Logger ---

/**
 * Log levels supported by the logger
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  SUPPRESS = 'suppress'
}

/**
 * Logger class for consistent output
 */
export class Logger {
  /**
   * Create a new logger
   * @param level Minimum log level to output
   */
  constructor(private level: LogLevel = LogLevel.ERROR) {}

  /**
   * Log a message at the specified level
   */
  log(level: LogLevel, message: string, data?: any): void {
    if (this.shouldLog(level)) {
      const output = `[${level.toUpperCase()}] ${message}`;
      if (data !== undefined) {
        console.log(output, data);
      } else {
        console.log(output);
      }
    }
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return this.level !== LogLevel.SUPPRESS && levels.indexOf(level) >= levels.indexOf(this.level);
  }
}

// Default exportable logger instance
export const logger = new Logger(LogLevel.DEBUG);

/**
 * Type of error to be created by error handler
 */
export enum ErrorType {
  VALIDATION = 'validation',
  PARSE = 'parse',
  SERIALIZE = 'serialize',
  TRANSFORM = 'transform',
  CONFIGURATION = 'configuration',
  ENVIRONMENT = 'environment',
  GENERAL = 'general'
}

/**
 * Central error handling utility
 * 
 * @param err The caught error
 * @param context String describing where the error occurred
 * @param options Additional options for error handling
 * @returns A fallback value if provided, otherwise throws the transformed error
 */
export function handleError<T>(
  err: unknown, 
  context: string, 
  options: {
    // Optional fallback value to return instead of throwing
    fallback?: T;
    // Additional data to include in the error
    data?: Record<string, any>;
    // Error type to transform to
    errorType?: ErrorType;
  } = {}
): T {
  // Skip logging if already logged
  if (err instanceof Error && (err as any).__logged) {
    // Error was already logged, just transform if needed
  } else {
    // Log the error
    if (err instanceof Error) {
      logger.error(`Error in ${context}`, {
        error: err,
        ...(options.data || {})
      });
      (err as any).__logged = true;
    } else {
      // For non-Error objects, log what we can
      logger.error(`Error in ${context}`, {
        error: String(err),
        ...(options.data || {})
      });
    }
  }
  
  // Create appropriate error object if type transformation requested
  let finalError: Error;
  
  // Check if we need to transform the error type
  if (options.errorType && (
    // Skip transformation if error already has the requested type
    !(err instanceof Error) ||
    (options.errorType === ErrorType.VALIDATION && !(err instanceof ValidationError)) ||
    (options.errorType === ErrorType.PARSE && !(err instanceof ParseError)) ||
    (options.errorType === ErrorType.SERIALIZE && !(err instanceof SerializeError)) ||
    (options.errorType === ErrorType.TRANSFORM && !(err instanceof TransformError)) ||
    (options.errorType === ErrorType.CONFIGURATION && !(err instanceof ConfigurationError)) ||
    (options.errorType === ErrorType.ENVIRONMENT && !(err instanceof EnvironmentError))
  )) {
    // Get message from original error or convert to string
    const originalMessage = err instanceof Error ? err.message : String(err);
    const errorMessage = `${context}: ${originalMessage}`;
    const errorData = options.data || {};
    
    // Create new error of the requested type
    switch (options.errorType) {
      case ErrorType.VALIDATION:
        finalError = new ValidationError(errorMessage, errorData);
        break;
      case ErrorType.PARSE:
        finalError = new ParseError(errorMessage, errorData);
        break;
      case ErrorType.SERIALIZE:
        finalError = new SerializeError(errorMessage, errorData);
        break;
      case ErrorType.TRANSFORM:
        finalError = new TransformError(errorMessage, errorData);
        break;
      case ErrorType.CONFIGURATION:
        finalError = new ConfigurationError(errorMessage, errorData);
        break;
      case ErrorType.ENVIRONMENT:
        finalError = new EnvironmentError(errorMessage, errorData);
        break;
      default:
        finalError = new Error(errorMessage);
    }
    
    // Preserve stack trace if available
    if (err instanceof Error && err.stack) {
      finalError.stack = err.stack;
    }
    
    // Mark as logged
    (finalError as any).__logged = true;
  } else {
    // Use original error
    finalError = err instanceof Error ? err : new Error(String(err));
    
    // Ensure it's marked as logged
    (finalError as any).__logged = true;
  }
  
  // Return fallback or throw
  if (options.fallback !== undefined) {
    return options.fallback;
  }
  
  throw finalError;
}

/**
 * Validates a condition and throws an error if it fails
 * 
 * @param condition Condition to check
 * @param message Error message if condition fails
 * @param details Optional details about the validation
 * @throws ValidationError if condition is false
 */
export function validate(
  condition: boolean,
  message: string,
  details?: any
): void {
  if (!condition) {
    throw new ValidationError(message, details);
  }
}