/**
 * JSONToXML class for converting JSON to XML with consistent namespace handling
 */
import { Configuration } from "./types/types";
/**
 * JSONToXML for converting JSON to XML
 */
export declare class JSONToXML {
    private config;
    private xmlUtil;
    private transformUtil;
    /**
     * Constructor for JSONToXML
     * @param config Configuration options
     */
    constructor(config: Configuration);
    /**
     * Convert JSON object to XML string
     * @param jsonObj JSON object to convert
     * @returns XML string
     */
    serialize(jsonObj: Record<string, any>): string;
    /**
     * Convert JSON object to DOM node
     * @param jsonObj JSON object to convert
     * @param doc Document for creating elements
     * @param parentContext Optional parent context for transformation chain
     * @param path Current path in the JSON object
     * @returns DOM Element
     */
    private jsonToNode;
}
