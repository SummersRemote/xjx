/**
 * XmlToJsonConverter class for converting XML to JSON with consistent namespace handling
 */
import { Configuration } from "../types/config-types";
/**
 * XmlToJsonConverter Parser for converting XML to JSON
 */
export declare class XmlToJsonConverter {
    private config;
    private jsonUtil;
    private transformUtil;
    /**
     * Constructor for XmlToJsonConverter
     * @param config Configuration options
     */
    constructor(config: Configuration);
    /**
     * Convert XML string to JSON
     * @param xmlString XML content as string
     * @returns JSON object representing the XML content
     */
    convert(xmlString: string): Record<string, any>;
    /**
     * Convert a DOM node to JSON representation
     * @param node DOM node to convert
     * @param parentContext Optional parent context for transformation chain
     * @param path Current path in the XML tree
     * @returns JSON representation of the node
     */
    private nodeToJson;
    private cleanNode;
}
