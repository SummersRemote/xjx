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
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'suppress';

/**
 * Logger class for consistent output
 */
export class Logger {
  /**
   * Create a new logger
   * @param level Minimum log level to output
   */
  constructor(private level: LogLevel = 'error') {}

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
    this.log('debug', message, data);
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    return this.level !== 'suppress' && levels.indexOf(level) >= levels.indexOf(this.level);
  }
}

// Default exportable logger instance
export const logger = new Logger('error');

/**
 * Validate a condition and throw an error if it fails
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