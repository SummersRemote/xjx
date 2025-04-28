/**
 * Error classes for the XJX library
 */
/**
 * Base error class
 */
export declare class XJXError extends Error {
    constructor(message: string);
}
/**
 * Error for XML parsing issues
 */
export declare class XmlToJsonError extends XJXError {
    constructor(message: string);
}
/**
 * Error for XML serialization issues
 */
export declare class JsonToXmlError extends XJXError {
    constructor(message: string);
}
/**
 * Error for environment incompatibility
 */
export declare class EnvironmentError extends XJXError {
    constructor(message: string);
}
/**
 * Error for invalid configuration
 */
export declare class ConfigurationError extends XJXError {
    constructor(message: string);
}
