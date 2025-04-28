import { Configuration } from "../types/config-types";
/**
 * Interface for XML validation result
 */
export interface ValidationResult {
    isValid: boolean;
    message?: string;
}
export declare class XmlUtil {
    private config;
    /**
     * Constructor for XMLUtil
     * @param config Configuration options
     */
    constructor(config: Configuration);
    /**
     * Pretty print an XML string
     * @param xmlString XML string to format
     * @returns Formatted XML string
     */
    prettyPrintXml(xmlString: string): string;
    /**
     * Check if XML string is well-formed
     * @param xmlString XML string to validate
     * @returns Object with validation result and any error messages
     */
    validateXML(xmlString: string): ValidationResult;
    /**
     * Add XML declaration to a string if missing
     * @param xmlString XML string
     * @returns XML string with declaration
     */
    ensureXMLDeclaration(xmlString: string): string;
    /**
     * Escapes special characters in text for safe XML usage.
     * @param text Text to escape.
     * @returns Escaped XML string.
     */
    escapeXML(text: string): string;
    /**
     * Unescapes XML entities back to their character equivalents.
     * @param text Text with XML entities.
     * @returns Unescaped text.
     */
    unescapeXML(text: string): string;
    /**
     * Extract the namespace prefix from a qualified name
     * @param qualifiedName Qualified name (e.g., "ns:element")
     * @returns Prefix or null if no prefix
     */
    extractPrefix(qualifiedName: string): string | null;
    /**
     * Extract the local name from a qualified name
     * @param qualifiedName Qualified name (e.g., "ns:element")
     * @returns Local name
     */
    extractLocalName(qualifiedName: string): string;
    /**
     * Create a qualified name from prefix and local name
     * @param prefix Namespace prefix (can be null)
     * @param localName Local name
     * @returns Qualified name
     */
    createQualifiedName(prefix: string | null, localName: string): string;
}
