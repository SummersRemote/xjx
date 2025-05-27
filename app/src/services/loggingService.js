// services/LoggingService.js
import { XJX, LogLevel } from "../../../dist/esm/index.js";

/**
 * Service for managing logging functionality
 */
class LoggingService {
  constructor() {
    // Create a singleton XJX instance for log level management
    this.globalXJX = new XJX();
    this.currentLogLevel = 'error'; // Default log level
  }

  /**
   * Set the log level for the XJX library
   * @param {string} level - Log level ('debug', 'info', 'warn', 'error', 'none')
   */
  setLogLevel(level) {
    // Map string levels to LogLevel enum values
    const logLevelMap = {
      debug: LogLevel.DEBUG,
      info: LogLevel.INFO,
      warn: LogLevel.WARN,
      error: LogLevel.ERROR,
      none: LogLevel.NONE,
    };

    this.currentLogLevel = level;

    // Set log level in the global instance
    this.globalXJX.setLogLevel(logLevelMap[level] || LogLevel.ERROR);

    console.log(`XJX log level set to: ${level}`);
  }

  /**
   * Get the current log level
   * @returns {string} Current log level
   */
  getLogLevel() {
    return this.currentLogLevel;
  }
  
  /**
   * Log a debug message
   * @param {string} message - Message to log
   * @param {Object} data - Optional data to include
   */
  debug(message, data) {
    if (this.currentLogLevel === 'debug') {
      console.debug(`[XJX Debug] ${message}`, data || '');
    }
  }
  
  /**
   * Log an info message
   * @param {string} message - Message to log
   * @param {Object} data - Optional data to include
   */
  info(message, data) {
    if (['debug', 'info'].includes(this.currentLogLevel)) {
      console.info(`[XJX Info] ${message}`, data || '');
    }
  }
  
  /**
   * Log a warning message
   * @param {string} message - Message to log
   * @param {Object} data - Optional data to include
   */
  warn(message, data) {
    if (['debug', 'info', 'warn'].includes(this.currentLogLevel)) {
      console.warn(`[XJX Warning] ${message}`, data || '');
    }
  }
  
  /**
   * Log an error message
   * @param {string} message - Message to log
   * @param {Object} data - Optional data to include
   */
  error(message, data) {
    if (this.currentLogLevel !== 'none') {
      console.error(`[XJX Error] ${message}`, data || '');
    }
  }
}

// Export as a singleton instance
export default new LoggingService();