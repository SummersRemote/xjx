/**
 * Simplified error handling and logging for the XJX library
 */

// --- Simplified Error Types ---

/**
 * Base XJX error class that other errors extend
 */
export class XJXError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'XJXError';
    // Fix prototype chain for instanceof
    Object.setPrototypeOf(this, XJXError.prototype);
  }
}

/**
 * Error for validation failures
 */
export class ValidationError extends XJXError {
  constructor(message: string, details?: any) {
    super(message, details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error for parsing or serialization failures
 */
export class ProcessingError extends XJXError {
  constructor(message: string, public source?: any) {
    super(message, { source });
    this.name = 'ProcessingError';
    Object.setPrototypeOf(this, ProcessingError.prototype);
  }
}

// --- Simple Logger ---

/**
 * Log levels supported by the logger
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  NONE = 'none'
}

/**
 * Simple logger for the library
 */
export class Logger {
  /**
   * Create a new logger
   * @param level Minimum log level to output
   */
  constructor(private level: LogLevel = LogLevel.ERROR) {}

  /**
   * Log a message at debug level
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log a message at info level
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log a message at warn level
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log a message at error level
   */
  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }

  /**
   * Set the logger level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Log a message at the specified level
   */
  private log(level: LogLevel, message: string, data?: any): void {
    if (this.shouldLog(level)) {
      const output = `[XJX:${level.toUpperCase()}] ${message}`;
      if (data !== undefined) {
        console.log(output, data);
      } else {
        console.log(output);
      }
    }
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return this.level !== LogLevel.NONE && levels.indexOf(level) >= levels.indexOf(this.level);
  }
}

// Default exportable logger instance
export const logger = new Logger(LogLevel.ERROR);

/**
 * Validate a condition and throw a ValidationError if it fails.
 * Only use at API boundaries, not for internal validation.
 * 
 * @param condition Condition to check
 * @param message Error message if condition fails
 * @param details Optional details to include in the error
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

/**
 * Handle an error with consistent logging and optional fallback value
 * 
 * @param err The caught error
 * @param context String describing where the error occurred
 * @param options Additional options for error handling
 * @returns A fallback value if provided, otherwise throws the error
 */
export function handleError<T>(
  err: unknown, 
  context: string, 
  options: {
    fallback?: T;
    data?: Record<string, any>;
  } = {}
): T {
  // Log the error
  if (err instanceof Error) {
    logger.error(`Error in ${context}`, {
      error: err,
      ...(options.data || {})
    });
  } else {
    logger.error(`Error in ${context}`, {
      error: String(err),
      ...(options.data || {})
    });
  }
  
  // Return fallback or throw
  if (options.fallback !== undefined) {
    return options.fallback;
  }
  
  // Just throw the original error
  if (err instanceof Error) {
    throw err;
  }
  
  // Convert to Error if it's not already
  throw new Error(`${context}: ${String(err)}`);
}