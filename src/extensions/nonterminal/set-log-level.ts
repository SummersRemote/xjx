/**
 * Core extension that implements the setLogLevel method
 */
import { XJX } from "../../XJX";
import { logger, LogLevel, validate, handleError, ErrorType } from "../../core/error";

// Type augmentation - add method to XJX interface
declare module '../../XJX' {
  interface XJX {
    /**
     * Set the log level for the XJX library
     * @param level Log level (debug, info, warn, error, suppress)
     * @returns This instance for chaining
     */
    setLogLevel(level: LogLevel | string): XJX;
  }
}

/**
 * Set the log level for the XJX library
 * @param level Log level (debug, info, warn, error, suppress)
 */
function setLogLevel(this: XJX, level: LogLevel | string): void {
  try {
    // API boundary validation - validate parameters
    validate(level !== undefined && level !== null, "Log level must be provided");
    
    // Handle string input for level
    let logLevel: LogLevel;
    
    if (typeof level === 'string') {
      // Convert string to LogLevel enum
      const normalizedLevel = level.toLowerCase();
      
      switch (normalizedLevel) {
        case 'debug':
          logLevel = LogLevel.DEBUG;
          break;
        case 'info':
          logLevel = LogLevel.INFO;
          break;
        case 'warn':
          logLevel = LogLevel.WARN;
          break;
        case 'error':
          logLevel = LogLevel.ERROR;
          break;
        case 'suppress':
          logLevel = LogLevel.SUPPRESS;
          break;
        default:
          throw new Error(`Invalid log level: ${level}. Valid values are: debug, info, warn, error, suppress`);
      }
    } else {
      // Level is already a LogLevel enum value
      logLevel = level;
    }
    
    // Set log level in the logger
    logger.setLevel(logLevel);
    
    logger.info(`Log level set to ${logLevel}`);
  } catch (err) {
    handleError(err, "set log level", {
      data: { level },
      errorType: ErrorType.CONFIGURATION
    });
  }
}

// Register the extension
XJX.registerNonTerminalExtension("setLogLevel", setLogLevel);