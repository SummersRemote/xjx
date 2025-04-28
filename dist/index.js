/**
 * Error classes for the XJX library
 */
/**
 * Base error class
 */
class XJXError extends Error {
    constructor(message) {
        super(message);
        this.name = 'XMLToJSONError';
    }
}

/**
 * DOM node types as an enum for better type safety
 */
var NodeType;
(function (NodeType) {
    NodeType[NodeType["ELEMENT_NODE"] = 1] = "ELEMENT_NODE";
    NodeType[NodeType["ATTRIBUTE_NODE"] = 2] = "ATTRIBUTE_NODE";
    NodeType[NodeType["TEXT_NODE"] = 3] = "TEXT_NODE";
    NodeType[NodeType["CDATA_SECTION_NODE"] = 4] = "CDATA_SECTION_NODE";
    NodeType[NodeType["PROCESSING_INSTRUCTION_NODE"] = 7] = "PROCESSING_INSTRUCTION_NODE";
    NodeType[NodeType["COMMENT_NODE"] = 8] = "COMMENT_NODE";
    NodeType[NodeType["DOCUMENT_NODE"] = 9] = "DOCUMENT_NODE";
})(NodeType || (NodeType = {}));

/**
 * DOM Environment provider with unified interface for browser and Node.js
 */
const DOMAdapter = (() => {
    // Environment-specific DOM implementation
    let domParser;
    let xmlSerializer;
    // let nodeTypes: NodeTypes;
    let docImplementation;
    let jsdomInstance = null;
    try {
        if (typeof window === "undefined") {
            // Node.js environment - try JSDOM first
            try {
                const { JSDOM } = require("jsdom");
                jsdomInstance = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
                    contentType: "text/xml",
                });
                domParser = jsdomInstance.window.DOMParser;
                xmlSerializer = jsdomInstance.window.XMLSerializer;
                // nodeTypes = {
                //   ELEMENT_NODE: jsdomInstance.window.Node.ELEMENT_NODE,
                //   TEXT_NODE: jsdomInstance.window.Node.TEXT_NODE,
                //   CDATA_SECTION_NODE: jsdomInstance.window.Node.CDATA_SECTION_NODE,
                //   COMMENT_NODE: jsdomInstance.window.Node.COMMENT_NODE,
                //   PROCESSING_INSTRUCTION_NODE: jsdomInstance.window.Node.PROCESSING_INSTRUCTION_NODE,
                //   DOCUMENT_NODE: jsdomInstance.window.Node.DOCUMENT_NODE, // Add this line
                // };
                docImplementation = jsdomInstance.window.document.implementation;
            }
            catch (jsdomError) {
                // Fall back to xmldom if JSDOM isn't available
                try {
                    const { DOMParser, XMLSerializer, DOMImplementation } = require('@xmldom/xmldom');
                    domParser = DOMParser;
                    xmlSerializer = XMLSerializer;
                    // Standard DOM node types
                    // nodeTypes = {
                    //   ELEMENT_NODE: 1,
                    //   TEXT_NODE: 3,
                    //   CDATA_SECTION_NODE: 4,
                    //   COMMENT_NODE: 8,
                    //   PROCESSING_INSTRUCTION_NODE: 7,
                    //   DOCUMENT_NODE: 9, 
                    // };
                    const implementation = new DOMImplementation();
                    docImplementation = implementation;
                }
                catch (xmldomError) {
                    throw new XJXError(`Node.js environment detected but neither 'jsdom' nor '@xmldom/xmldom' are available.`);
                }
            }
        }
        else {
            // Browser environment
            if (!window.DOMParser) {
                throw new XJXError("DOMParser is not available in this environment");
            }
            if (!window.XMLSerializer) {
                throw new XJXError("XMLSerializer is not available in this environment");
            }
            domParser = window.DOMParser;
            xmlSerializer = window.XMLSerializer;
            // nodeTypes = {
            //   ELEMENT_NODE: Node.ELEMENT_NODE,
            //   TEXT_NODE: Node.TEXT_NODE,
            //   CDATA_SECTION_NODE: Node.CDATA_SECTION_NODE,
            //   COMMENT_NODE: Node.COMMENT_NODE,
            //   PROCESSING_INSTRUCTION_NODE: Node.PROCESSING_INSTRUCTION_NODE,
            //   DOCUMENT_NODE: Node.DOCUMENT_NODE, 
            // };
            docImplementation = document.implementation;
        }
    }
    catch (error) {
        throw new XJXError(`DOM environment initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    return {
        createParser: () => {
            try {
                return new domParser();
            }
            catch (error) {
                throw new XJXError(`Failed to create DOM parser: ${error instanceof Error ? error.message : String(error)}`);
            }
        },
        createSerializer: () => {
            try {
                return new xmlSerializer();
            }
            catch (error) {
                throw new XJXError(`Failed to create XML serializer: ${error instanceof Error ? error.message : String(error)}`);
            }
        },
        NodeType,
        parseFromString: (xmlString, contentType = 'text/xml') => {
            try {
                const parser = new domParser();
                return parser.parseFromString(xmlString, contentType);
            }
            catch (error) {
                throw new XJXError(`Failed to parse XML: ${error instanceof Error ? error.message : String(error)}`);
            }
        },
        serializeToString: (node) => {
            try {
                const serializer = new xmlSerializer();
                return serializer.serializeToString(node);
            }
            catch (error) {
                throw new XJXError(`Failed to serialize XML: ${error instanceof Error ? error.message : String(error)}`);
            }
        },
        createDocument: () => {
            try {
                // For browsers, create a document with a root element to avoid issues
                if (typeof window !== "undefined") {
                    const parser = new domParser();
                    return parser.parseFromString('<temp></temp>', 'text/xml');
                }
                else {
                    return docImplementation.createDocument(null, null, null);
                }
            }
            catch (error) {
                throw new XJXError(`Failed to create document: ${error instanceof Error ? error.message : String(error)}`);
            }
        },
        createElement: (tagName) => {
            try {
                if (typeof window !== "undefined") {
                    return document.createElement(tagName);
                }
                else {
                    const doc = docImplementation.createDocument(null, null, null);
                    return doc.createElement(tagName);
                }
            }
            catch (error) {
                throw new XJXError(`Failed to create element: ${error instanceof Error ? error.message : String(error)}`);
            }
        },
        createElementNS: (namespaceURI, qualifiedName) => {
            try {
                if (typeof window !== "undefined") {
                    return document.createElementNS(namespaceURI, qualifiedName);
                }
                else {
                    const doc = docImplementation.createDocument(null, null, null);
                    return doc.createElementNS(namespaceURI, qualifiedName);
                }
            }
            catch (error) {
                throw new XJXError(`Failed to create element with namespace: ${error instanceof Error ? error.message : String(error)}`);
            }
        },
        createTextNode: (data) => {
            try {
                if (typeof window !== "undefined") {
                    return document.createTextNode(data);
                }
                else {
                    const doc = docImplementation.createDocument(null, null, null);
                    return doc.createTextNode(data);
                }
            }
            catch (error) {
                throw new XJXError(`Failed to create text node: ${error instanceof Error ? error.message : String(error)}`);
            }
        },
        createCDATASection: (data) => {
            try {
                // For browser compatibility, use document.implementation to create CDATA
                if (typeof window !== "undefined") {
                    const doc = document.implementation.createDocument(null, null, null);
                    return doc.createCDATASection(data);
                }
                else {
                    const doc = docImplementation.createDocument(null, null, null);
                    return doc.createCDATASection(data);
                }
            }
            catch (error) {
                throw new XJXError(`Failed to create CDATA section: ${error instanceof Error ? error.message : String(error)}`);
            }
        },
        createComment: (data) => {
            try {
                if (typeof window !== "undefined") {
                    return document.createComment(data);
                }
                else {
                    const doc = docImplementation.createDocument(null, null, null);
                    return doc.createComment(data);
                }
            }
            catch (error) {
                throw new XJXError(`Failed to create comment: ${error instanceof Error ? error.message : String(error)}`);
            }
        },
        createProcessingInstruction: (target, data) => {
            try {
                if (typeof window !== "undefined") {
                    const doc = document.implementation.createDocument(null, null, null);
                    return doc.createProcessingInstruction(target, data);
                }
                else {
                    const doc = docImplementation.createDocument(null, null, null);
                    return doc.createProcessingInstruction(target, data);
                }
            }
            catch (error) {
                throw new XJXError(`Failed to create processing instruction: ${error instanceof Error ? error.message : String(error)}`);
            }
        },
        // New helper methods
        /**
         * Creates a proper namespace qualified attribute
         */
        setNamespacedAttribute: (element, namespaceURI, qualifiedName, value) => {
            try {
                if (namespaceURI) {
                    element.setAttributeNS(namespaceURI, qualifiedName, value);
                }
                else {
                    element.setAttribute(qualifiedName, value);
                }
            }
            catch (error) {
                throw new XJXError(`Failed to set attribute: ${error instanceof Error ? error.message : String(error)}`);
            }
        },
        /**
         * Check if an object is a DOM node
         */
        isNode: (obj) => {
            try {
                return obj && typeof obj === 'object' && typeof obj.nodeType === 'number';
            }
            catch (error) {
                return false;
            }
        },
        /**
         * Get DOM node type as string for debugging
         */
        getNodeTypeName: (nodeType) => {
            switch (nodeType) {
                case NodeType.ELEMENT_NODE: return 'ELEMENT_NODE';
                case NodeType.TEXT_NODE: return 'TEXT_NODE';
                case NodeType.CDATA_SECTION_NODE: return 'CDATA_SECTION_NODE';
                case NodeType.COMMENT_NODE: return 'COMMENT_NODE';
                case NodeType.PROCESSING_INSTRUCTION_NODE: return 'PROCESSING_INSTRUCTION_NODE';
                default: return `UNKNOWN_NODE_TYPE(${nodeType})`;
            }
        },
        /**
         * Get all node attributes as an object
         */
        getNodeAttributes: (node) => {
            const result = {};
            for (let i = 0; i < node.attributes.length; i++) {
                const attr = node.attributes[i];
                result[attr.name] = attr.value;
            }
            return result;
        },
        // Cleanup method (mainly for JSDOM)
        cleanup: () => {
            if (jsdomInstance && typeof jsdomInstance.window.close === 'function') {
                jsdomInstance.window.close();
            }
        }
    };
})();

class JsonUtil {
    /**
     * Constructor for JSONUtil
     * @param config Configuration options
     */
    constructor(config) {
        this.config = config;
    }
    /**
     * Safely retrieves a value from a JSON object using a dot-separated path.
     * Automatically traverses into children arrays and flattens results.
     *
     * @param obj The input JSON object
     * @param path The dot-separated path string (e.g., "root.item.description.$val")
     * @param fallback Value to return if the path does not resolve
     * @returns Retrieved value or fallback
     */
    getPath(obj, path, fallback) {
        const segments = path.split(".");
        let current = obj;
        for (const segment of segments) {
            if (Array.isArray(current)) {
                // Apply the segment to each array element and flatten results
                const results = current
                    .map((item) => this.resolveSegment(item, segment))
                    .flat()
                    .filter((v) => v !== undefined);
                current = results.length > 0 ? results : undefined;
            }
            else {
                current = this.resolveSegment(current, segment);
            }
            if (current === undefined)
                return fallback;
        }
        // Collapse singleton arrays
        if (Array.isArray(current) && current.length === 1) {
            return current[0];
        }
        return current !== undefined ? current : fallback;
    }
    /**
     * Resolves a single path segment in the context of a JSON object.
     * Falls back to searching children for matching keys.
     *
     * @param obj The current object
     * @param segment The path segment to resolve
     * @returns Resolved value or undefined
     */
    resolveSegment(obj, segment) {
        if (obj == null || typeof obj !== "object")
            return undefined;
        // Direct property access
        if (segment in obj) {
            return obj[segment];
        }
        // Check if this is a special property name that matches the config
        if (segment === this.config.propNames.value ||
            segment === this.config.propNames.children ||
            segment === this.config.propNames.attributes ||
            segment === this.config.propNames.namespace ||
            segment === this.config.propNames.prefix ||
            segment === this.config.propNames.cdata ||
            segment === this.config.propNames.comments ||
            segment === this.config.propNames.instruction ||
            segment === this.config.propNames.target) {
            const configKey = Object.entries(this.config.propNames).find(([_, value]) => value === segment)?.[0];
            if (configKey && obj[segment] !== undefined) {
                return obj[segment];
            }
        }
        // Check children for objects that contain the segment
        const childrenKey = this.config.propNames.children;
        const children = obj[childrenKey];
        if (Array.isArray(children)) {
            const matches = children
                .map((child) => (segment in child ? child[segment] : undefined))
                .filter((v) => v !== undefined);
            return matches.length > 0 ? matches : undefined;
        }
        return undefined;
    }
    /**
     * Converts a plain JSON object to the XML-like JSON structure.
     * Optionally wraps the result in a root element with attributes and namespaces.
     *
     * @param obj Standard JSON object
     * @param root Optional root element configuration (either a string or object with $ keys)
     * @returns XML-like JSON object
     */
    objectToXJX(obj, root) {
        const wrappedObject = this.wrapObject(obj);
        if (typeof root === "string") {
            // Root is a simple string: wrap result with this root tag
            return { [root]: wrappedObject };
        }
        if (root && typeof root === "object") {
            // Handle root with config-based keys
            const elementName = root.name || "root"; // Default to "root" if no name is provided
            const prefix = root[this.config.propNames.prefix] || "";
            const qualifiedName = prefix ? `${prefix}:${elementName}` : elementName;
            const result = {
                [qualifiedName]: {},
            };
            // Add attributes to the root element if defined
            const attrsKey = this.config.propNames.attributes;
            if (root[attrsKey] && Array.isArray(root[attrsKey])) {
                result[qualifiedName][attrsKey] = root[attrsKey];
            }
            // Merge existing children with the new generated children
            const childrenKey = this.config.propNames.children;
            const children = root[childrenKey] ? root[childrenKey] : [];
            result[qualifiedName][childrenKey] = [
                ...children,
                { [elementName]: wrappedObject },
            ];
            // Add namespace and prefix if defined
            const nsKey = this.config.propNames.namespace;
            if (root[nsKey]) {
                result[qualifiedName][nsKey] = root[nsKey];
            }
            if (prefix && root[nsKey]) {
                result[qualifiedName][`xmlns:${prefix}`] = root[nsKey];
            }
            return result;
        }
        // Default behavior if no root is provided
        return wrappedObject;
    }
    /**
     * Wraps a standard JSON value in the XML-like JSON structure
     * @param value Value to wrap
     * @returns Wrapped value
     */
    wrapObject(value) {
        const valKey = this.config.propNames.value;
        const childrenKey = this.config.propNames.children;
        if (value === null ||
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean") {
            return { [valKey]: value };
        }
        if (Array.isArray(value)) {
            // For arrays, wrap each item and return as a children-style array of repeated elements
            return {
                [childrenKey]: value.map((item) => {
                    return this.wrapObject(item);
                }),
            };
        }
        if (typeof value === "object") {
            // It's an object: wrap its properties in children
            const children = Object.entries(value).map(([key, val]) => ({
                [key]: this.wrapObject(val),
            }));
            return { [childrenKey]: children };
        }
        return undefined; // Fallback for unhandled types
    }
    /**
     * Check if an object is empty
     * @param value Value to check
     * @returns true if empty
     */
    isEmpty(value) {
        if (value == null)
            return true;
        if (Array.isArray(value))
            return value.length === 0;
        if (typeof value === "object")
            return Object.keys(value).length === 0;
        return false;
    }
    /**
     * Safely stringify JSON for debugging
     * @param obj Object to stringify
     * @param indent Optional indentation level
     * @returns JSON string representation
     */
    safeStringify(obj, indent = 2) {
        try {
            return JSON.stringify(obj, null, indent);
        }
        catch (error) {
            return "[Cannot stringify object]";
        }
    }
    /**
     * Deep clone an object
     * @param obj Object to clone
     * @returns Cloned object
     */
    deepClone(obj) {
        try {
            return JSON.parse(JSON.stringify(obj));
        }
        catch (error) {
            throw new Error(`Failed to deep clone object: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Deep merge two objects with proper type handling
     * @param target Target object
     * @param source Source object
     * @returns Merged object (target is modified)
     */
    deepMerge(target, source) {
        if (!source || typeof source !== "object" || source === null) {
            return target;
        }
        if (!target || typeof target !== "object" || target === null) {
            return source;
        }
        Object.keys(source).forEach((key) => {
            const sourceValue = source[key];
            const targetValue = target[key];
            // If both source and target values are objects, recursively merge them
            if (sourceValue !== null &&
                targetValue !== null &&
                typeof sourceValue === "object" &&
                typeof targetValue === "object" &&
                !Array.isArray(sourceValue) &&
                !Array.isArray(targetValue)) {
                // Recursively merge the nested objects
                target[key] = this.deepMerge(targetValue, sourceValue);
            }
            else {
                // Otherwise just replace the value
                target[key] = sourceValue;
            }
        });
        return target;
    }
    /**
     * Generates a JSON schema that matches the current configuration
     * @returns JSON schema object
     */
    generateJsonSchema() {
        try {
            const propNames = this.config.propNames;
            const compact = this.config.outputOptions.compact || false;
            const preserveNamespaces = this.config.preserveNamespaces;
            const preserveComments = this.config.preserveComments;
            const preserveCDATA = this.config.preserveCDATA;
            const preserveProcessingInstr = this.config.preserveProcessingInstr;
            const preserveTextNodes = this.config.preserveTextNodes;
            const preserveWhitespace = this.config.preserveWhitespace;
            const preserveAttributes = this.config.preserveAttributes;
            // Determine which properties are required based on the configuration
            const requiredProps = [];
            if (!compact) {
                // Only add collections as required if they're preserved in the config
                if (preserveAttributes)
                    requiredProps.push(propNames.attributes);
                if (preserveCDATA)
                    requiredProps.push(propNames.cdata);
                if (preserveComments)
                    requiredProps.push(propNames.comments);
                if (preserveProcessingInstr)
                    requiredProps.push(propNames.instruction);
                requiredProps.push(propNames.children);
                if (preserveTextNodes) {
                    requiredProps.push(propNames.value);
                    if (preserveNamespaces) {
                        requiredProps.push(propNames.namespace);
                        // Note: prefix is not required as it may not be present for all elements
                    }
                }
            }
            // Create schema for element properties
            const elementProperties = {};
            // Add namespace property if preserving namespaces
            if (preserveNamespaces) {
                elementProperties[propNames.namespace] = {
                    description: "Namespace URI of the element",
                    type: "string",
                };
                // Add prefix property if preserving namespaces
                elementProperties[propNames.prefix] = {
                    description: "Namespace prefix of the element",
                    type: "string",
                };
            }
            // Add value property if preserving text nodes
            if (preserveTextNodes) {
                elementProperties[propNames.value] = {
                    description: "Text content of the element",
                    type: "string",
                };
            }
            // Add attributes property
            if (preserveAttributes) {
                elementProperties[propNames.attributes] = {
                    description: "Element attributes",
                    type: "array",
                    items: {
                        type: "object",
                        patternProperties: {
                            "^.*$": {
                                type: "object",
                                properties: {
                                    [propNames.value]: {
                                        description: "Attribute value",
                                        type: "string",
                                    },
                                },
                                required: [propNames.value],
                            },
                        },
                        additionalProperties: false,
                    },
                };
                // If preserving namespaces, add namespace properties to attribute schema
                if (preserveNamespaces) {
                    const attrProps = elementProperties[propNames.attributes].items.patternProperties["^.*$"].properties;
                    attrProps[propNames.namespace] = {
                        description: "Namespace URI of the attribute",
                        type: "string",
                    };
                    attrProps[propNames.prefix] = {
                        description: "Namespace prefix of the attribute",
                        type: "string",
                    };
                }
            }
            // Add CDATA property if preserving CDATA
            if (preserveCDATA) {
                elementProperties[propNames.cdata] = {
                    description: "CDATA section content",
                    type: "string",
                };
            }
            // Add comments property if preserving comments
            if (preserveComments) {
                elementProperties[propNames.comments] = {
                    description: "Comment content",
                    type: "string",
                };
            }
            // Add processing instructions property if preserving them
            if (preserveProcessingInstr) {
                elementProperties[propNames.instruction] = {
                    description: "Processing instruction",
                    type: "object",
                    properties: {
                        [propNames.target]: {
                            description: "Processing instruction target",
                            type: "string",
                        },
                        [propNames.value]: {
                            description: "Processing instruction content",
                            type: "string",
                        },
                    },
                    required: [propNames.target],
                };
            }
            // Add children property with recursive schema
            elementProperties[propNames.children] = {
                description: "Child elements",
                type: "array",
                items: {
                    type: "object",
                    patternProperties: {
                        "^.*$": {
                            $ref: "#/definitions/element",
                        },
                    },
                    additionalProperties: false,
                },
            };
            // Create element definition (will be referenced recursively)
            const elementDefinition = {
                type: "object",
                properties: elementProperties,
                required: requiredProps,
                additionalProperties: false,
            };
            // Build the complete schema
            const schema = {
                $schema: "https://json-schema.org/draft/2020-12/schema",
                title: "XJX JSON Schema",
                description: "Schema for JSON representation of XML documents using the XJX library",
                type: "object",
                patternProperties: {
                    "^.*$": {
                        $ref: "#/definitions/element",
                    },
                },
                additionalProperties: false,
                definitions: {
                    element: elementDefinition,
                },
            };
            return schema;
        }
        catch (error) {
            throw new Error(`Schema generation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Generate an example JSON object based on the schema
     * @param {string} rootName - Name of the root element
     * @returns {Record<string, any>} - Example JSON object
     */
    generateExample(rootName = "root") {
        const propNames = this.config.propNames;
        const preserveNamespaces = this.config.preserveNamespaces;
        const preserveComments = this.config.preserveComments;
        const preserveCDATA = this.config.preserveCDATA;
        const preserveProcessingInstr = this.config.preserveProcessingInstr;
        const preserveAttributes = this.config.preserveAttributes;
        // Simple example with common features
        const example = {
            [rootName]: {
                [propNames.value]: "Root content",
                [propNames.children]: [
                    {
                        child: {
                            [propNames.value]: "Child content",
                        },
                    },
                ],
            },
        };
        // Add namespace properties if enabled
        if (preserveNamespaces) {
            example[rootName][propNames.namespace] = "http://example.org/ns";
            example[rootName][propNames.prefix] = "ex";
            example[rootName][propNames.children][0].child[propNames.namespace] =
                "http://example.org/ns";
            example[rootName][propNames.children][0].child[propNames.prefix] = "ex";
        }
        // Add attributes if enabled
        if (preserveAttributes) {
            example[rootName][propNames.attributes] = [
                { id: { [propNames.value]: "root-1" } },
                { lang: { [propNames.value]: "en" } },
            ];
            if (preserveNamespaces) {
                example[rootName][propNames.attributes][1].lang[propNames.prefix] =
                    "xml";
            }
            example[rootName][propNames.children][0].child[propNames.attributes] = [
                { id: { [propNames.value]: "child-1" } },
            ];
        }
        // Add CDATA if enabled
        if (preserveCDATA) {
            example[rootName][propNames.children][0].child[propNames.children] = [
                { [propNames.cdata]: "<data>Raw content</data>" },
            ];
        }
        // Add comments if enabled
        if (preserveComments) {
            if (!example[rootName][propNames.children][0].child[propNames.children]) {
                example[rootName][propNames.children][0].child[propNames.children] = [];
            }
            example[rootName][propNames.children][0].child[propNames.children].push({
                [propNames.comments]: "Comment about the child",
            });
        }
        // Add processing instruction if enabled
        if (preserveProcessingInstr) {
            if (!example[rootName][propNames.children]) {
                example[rootName][propNames.children] = [];
            }
            example[rootName][propNames.children].unshift({
                [propNames.instruction]: {
                    [propNames.target]: "xml-stylesheet",
                    [propNames.value]: 'type="text/css" href="style.css"',
                },
            });
        }
        return example;
    }
}

/**
 * Utility for applying value transformations
 */
class TransformUtil {
    /**
     * Create a new TransformUtil
     * @param config Configuration
     */
    constructor(config) {
        this.config = config;
    }
    /**
     * Apply transforms to a value
     * @param value Value to transform
     * @param context Transformation context
     * @returns Transformed value
     */
    applyTransforms(value, context) {
        // Skip transformation if no transformers are configured
        if (!this.config.valueTransforms || this.config.valueTransforms.length === 0) {
            return value;
        }
        // Apply each transformer in sequence
        let transformedValue = value;
        for (const transformer of this.config.valueTransforms) {
            transformedValue = transformer.process(transformedValue, context);
        }
        return transformedValue;
    }
    /**
     * Create a transform context
     * @param direction Direction of transformation
     * @param nodeName Name of the current node
     * @param nodeType DOM node type
     * @param options Additional context options
     * @returns Transform context
     */
    createContext(direction, nodeName, nodeType, options = {}) {
        return {
            direction,
            nodeName,
            nodeType,
            path: options.path || nodeName,
            namespace: options.namespace,
            prefix: options.prefix,
            isAttribute: options.isAttribute || false,
            attributeName: options.attributeName,
            parent: options.parent,
            config: this.config,
        };
    }
    /**
     * Get a user-friendly node type name for debugging
     * @param nodeType DOM node type
     * @returns String representation of node type
     */
    getNodeTypeName(nodeType) {
        return DOMAdapter.getNodeTypeName(nodeType);
    }
}

/**
 * XmlToJsonConverter Parser for converting XML to JSON
 */
class XmlToJsonConverter {
    /**
     * Constructor for XmlToJsonConverter
     * @param config Configuration options
     */
    constructor(config) {
        this.config = config;
        this.jsonUtil = new JsonUtil(this.config);
        this.transformUtil = new TransformUtil(this.config);
    }
    /**
     * Convert XML string to JSON
     * @param xmlString XML content as string
     * @returns JSON object representing the XML content
     */
    convert(xmlString) {
        try {
            const xmlDoc = DOMAdapter.parseFromString(xmlString, "text/xml");
            // Check for parsing errors
            const errors = xmlDoc.getElementsByTagName("parsererror");
            if (errors.length > 0) {
                throw new XJXError(`XML parsing error: ${errors[0].textContent}`);
            }
            return this.nodeToJson(xmlDoc.documentElement);
        }
        catch (error) {
            throw new XJXError(`Failed to convert XML to JSON: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Convert a DOM node to JSON representation
     * @param node DOM node to convert
     * @param parentContext Optional parent context for transformation chain
     * @param path Current path in the XML tree
     * @returns JSON representation of the node
     */
    nodeToJson(node, parentContext, path = "") {
        const result = {};
        // Handle element nodes
        if (node.nodeType === DOMAdapter.NodeType.ELEMENT_NODE) {
            const element = node;
            // Use localName instead of nodeName to strip namespace prefix
            const nodeName = element.localName ||
                element.nodeName.split(":").pop() ||
                element.nodeName;
            // Update the current path
            const currentPath = path ? `${path}.${nodeName}` : nodeName;
            const nodeObj = {};
            // Create context for this node
            const context = this.transformUtil.createContext('xml-to-json', nodeName, node.nodeType, {
                path: currentPath,
                namespace: element.namespaceURI || undefined,
                prefix: element.prefix || undefined,
                parent: parentContext
            });
            // Process namespaces if enabled
            if (this.config.preserveNamespaces) {
                const ns = element.namespaceURI;
                if (ns) {
                    nodeObj[this.config.propNames.namespace] = ns;
                }
                const prefix = element.prefix;
                if (prefix) {
                    nodeObj[this.config.propNames.prefix] = prefix;
                }
            }
            // Process attributes if enabled
            if (this.config.preserveAttributes && element.attributes.length > 0) {
                const attrs = [];
                for (let i = 0; i < element.attributes.length; i++) {
                    const attr = element.attributes[i];
                    // Strip namespace prefix from attribute name
                    const attrLocalName = attr.localName || attr.name.split(":").pop() || attr.name;
                    // Create attribute context
                    const attrContext = this.transformUtil.createContext('xml-to-json', nodeName, node.nodeType, {
                        path: `${currentPath}.${attrLocalName}`,
                        namespace: attr.namespaceURI || undefined,
                        prefix: attr.prefix || undefined,
                        isAttribute: true,
                        attributeName: attrLocalName,
                        parent: context
                    });
                    // Apply transformations to attribute value
                    const transformedValue = this.transformUtil.applyTransforms(attr.value, attrContext);
                    // Create attribute object with consistent structure
                    const attrObj = {
                        [attrLocalName]: {
                            [this.config.propNames.value]: transformedValue,
                        },
                    };
                    // Add namespace info for attribute if present and enabled
                    if (this.config.preserveNamespaces) {
                        // Handle attribute namespace
                        if (attr.namespaceURI) {
                            attrObj[attrLocalName][this.config.propNames.namespace] =
                                attr.namespaceURI;
                        }
                        // Handle attribute prefix
                        if (attr.prefix) {
                            attrObj[attrLocalName][this.config.propNames.prefix] =
                                attr.prefix;
                        }
                    }
                    attrs.push(attrObj);
                }
                if (attrs.length > 0) {
                    nodeObj[this.config.propNames.attributes] = attrs;
                }
            }
            // Process child nodes
            if (element.childNodes.length > 0) {
                const children = [];
                const childrenKey = this.config.propNames.children;
                const valueKey = this.config.propNames.value;
                const cdataKey = this.config.propNames.cdata;
                const commentsKey = this.config.propNames.comments;
                const instructionKey = this.config.propNames.instruction;
                const targetKey = this.config.propNames.target;
                for (let i = 0; i < element.childNodes.length; i++) {
                    const child = element.childNodes[i];
                    // Text nodes - only process if preserveTextNodes is true
                    if (child.nodeType === DOMAdapter.NodeType.TEXT_NODE) {
                        if (this.config.preserveTextNodes) {
                            let text = child.nodeValue || "";
                            // Skip whitespace-only text nodes if whitespace preservation is disabled
                            if (!this.config.preserveWhitespace) {
                                if (text.trim() === "") {
                                    continue;
                                }
                                // Trim the text when preserveWhitespace is false
                                text = text.trim();
                            }
                            // Create text node context
                            const textContext = this.transformUtil.createContext('xml-to-json', '#text', child.nodeType, {
                                path: `${currentPath}.#text`,
                                parent: context
                            });
                            // Apply transformations to text value
                            const transformedText = this.transformUtil.applyTransforms(text, textContext);
                            children.push({ [valueKey]: transformedText });
                        }
                    }
                    // CDATA sections
                    else if (child.nodeType === DOMAdapter.NodeType.CDATA_SECTION_NODE &&
                        this.config.preserveCDATA) {
                        // Create CDATA context
                        const cdataContext = this.transformUtil.createContext('xml-to-json', '#cdata', child.nodeType, {
                            path: `${currentPath}.#cdata`,
                            parent: context
                        });
                        // Apply transformations to CDATA value
                        const transformedCData = this.transformUtil.applyTransforms(child.nodeValue || "", cdataContext);
                        children.push({
                            [cdataKey]: transformedCData,
                        });
                    }
                    // Comments
                    else if (child.nodeType === DOMAdapter.NodeType.COMMENT_NODE &&
                        this.config.preserveComments) {
                        children.push({
                            [commentsKey]: child.nodeValue || "",
                        });
                    }
                    // Processing instructions
                    else if (child.nodeType ===
                        DOMAdapter.NodeType.PROCESSING_INSTRUCTION_NODE &&
                        this.config.preserveProcessingInstr) {
                        children.push({
                            [instructionKey]: {
                                [targetKey]: child.nodeName,
                                [valueKey]: child.nodeValue || "",
                            },
                        });
                    }
                    // Element nodes (recursive)
                    else if (child.nodeType === DOMAdapter.NodeType.ELEMENT_NODE) {
                        children.push(this.nodeToJson(child, context, currentPath));
                    }
                }
                if (children.length > 0) {
                    nodeObj[childrenKey] = children;
                }
            }
            // Apply compact option - remove empty properties if enabled
            if (this.config.outputOptions.compact) {
                Object.keys(nodeObj).forEach((key) => {
                    const cleaned = this.cleanNode(nodeObj[key]);
                    if (cleaned === undefined) {
                        delete nodeObj[key];
                    }
                    else {
                        nodeObj[key] = cleaned;
                    }
                });
            }
            result[nodeName] = nodeObj;
        }
        return result;
    }
    cleanNode(node) {
        if (Array.isArray(node)) {
            // Clean each item in the array and filter out empty ones
            const cleanedArray = node
                .map((item) => this.cleanNode(item))
                .filter((item) => {
                return !(item === null ||
                    item === undefined ||
                    (typeof item === "object" && Object.keys(item).length === 0));
            });
            return cleanedArray.length > 0 ? cleanedArray : undefined;
        }
        else if (typeof node === "object" && node !== null) {
            // Clean properties recursively
            Object.keys(node).forEach((key) => {
                const cleanedChild = this.cleanNode(node[key]);
                if (cleanedChild === null ||
                    cleanedChild === undefined ||
                    (Array.isArray(cleanedChild) && cleanedChild.length === 0) ||
                    (typeof cleanedChild === "object" &&
                        Object.keys(cleanedChild).length === 0)) {
                    delete node[key];
                }
                else {
                    node[key] = cleanedChild;
                }
            });
            // Handle the special case for nodes with only empty children/attributes
            const childrenKey = this.config.propNames.children;
            const attrsKey = this.config.propNames.attributes;
            const keys = Object.keys(node);
            if (keys.every((key) => key === childrenKey || key === attrsKey) &&
                (node[childrenKey] === undefined ||
                    this.jsonUtil.isEmpty(node[childrenKey])) &&
                (node[attrsKey] === undefined || this.jsonUtil.isEmpty(node[attrsKey]))) {
                return undefined;
            }
            return Object.keys(node).length > 0 ? node : undefined;
        }
        return node;
    }
}

/**
 * XMLUtil - Utility functions for XML processing
 */
class XmlUtil {
    /**
     * Constructor for XMLUtil
     * @param config Configuration options
     */
    constructor(config) {
        this.config = config;
    }
    /**
     * Pretty print an XML string
     * @param xmlString XML string to format
     * @returns Formatted XML string
     */
    prettyPrintXml(xmlString) {
        const indent = this.config.outputOptions.indent;
        const INDENT = " ".repeat(indent);
        try {
            const doc = DOMAdapter.parseFromString(xmlString, "text/xml");
            const serializer = (node, level = 0) => {
                const pad = INDENT.repeat(level);
                switch (node.nodeType) {
                    case DOMAdapter.NodeType.ELEMENT_NODE: {
                        const el = node;
                        const tagName = el.tagName;
                        const attrs = Array.from(el.attributes)
                            .map((a) => `${a.name}="${a.value}"`)
                            .join(" ");
                        const openTag = attrs ? `<${tagName} ${attrs}>` : `<${tagName}>`;
                        const children = Array.from(el.childNodes);
                        if (children.length === 0) {
                            return `${pad}${openTag.replace(/>$/, " />")}\n`;
                        }
                        // Single text node: print inline
                        if (children.length === 0 ||
                            (children.length === 1 &&
                                children[0].nodeType === DOMAdapter.NodeType.TEXT_NODE &&
                                children[0].textContent?.trim() === "")) {
                            // Empty or whitespace-only
                            return `${pad}<${tagName}${attrs ? " " + attrs : ""}></${tagName}>\n`;
                        }
                        const inner = children
                            .map((child) => serializer(child, level + 1))
                            .join("");
                        return `${pad}${openTag}\n${inner}${pad}</${tagName}>\n`;
                    }
                    case DOMAdapter.NodeType.TEXT_NODE: {
                        const text = node.textContent?.trim();
                        return text ? `${pad}${text}\n` : "";
                    }
                    case DOMAdapter.NodeType.CDATA_SECTION_NODE:
                        return `${pad}<![CDATA[${node.nodeValue}]]>\n`;
                    case DOMAdapter.NodeType.COMMENT_NODE:
                        return `${pad}<!--${node.nodeValue}-->\n`;
                    case DOMAdapter.NodeType.PROCESSING_INSTRUCTION_NODE:
                        const pi = node;
                        return `${pad}<?${pi.target} ${pi.data}?>\n`;
                    case DOMAdapter.NodeType.DOCUMENT_NODE:
                        return Array.from(node.childNodes)
                            .map((child) => serializer(child, level))
                            .join("");
                    default:
                        return "";
                }
            };
            return serializer(doc).trim();
        }
        catch (error) {
            throw new XJXError(`Failed to pretty print XML: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Check if XML string is well-formed
     * @param xmlString XML string to validate
     * @returns Object with validation result and any error messages
     */
    validateXML(xmlString) {
        try {
            const doc = DOMAdapter.parseFromString(xmlString, "text/xml");
            const errors = doc.getElementsByTagName("parsererror");
            if (errors.length > 0) {
                return {
                    isValid: false,
                    message: errors[0].textContent || "Unknown parsing error",
                };
            }
            return { isValid: true };
        }
        catch (error) {
            return {
                isValid: false,
                message: error instanceof Error ? error.message : String(error),
            };
        }
    }
    /**
     * Add XML declaration to a string if missing
     * @param xmlString XML string
     * @returns XML string with declaration
     */
    ensureXMLDeclaration(xmlString) {
        if (!xmlString.trim().startsWith("<?xml")) {
            return '<?xml version="1.0" encoding="UTF-8"?>\n' + xmlString;
        }
        return xmlString;
    }
    /**
     * Escapes special characters in text for safe XML usage.
     * @param text Text to escape.
     * @returns Escaped XML string.
     */
    escapeXML(text) {
        if (typeof text !== "string" || text.length === 0) {
            return "";
        }
        return text.replace(/[&<>"']/g, (char) => {
            switch (char) {
                case "&":
                    return "&amp;";
                case "<":
                    return "&lt;";
                case ">":
                    return "&gt;";
                case '"':
                    return "&quot;";
                case "'":
                    return "&apos;";
                default:
                    return char;
            }
        });
    }
    /**
     * Unescapes XML entities back to their character equivalents.
     * @param text Text with XML entities.
     * @returns Unescaped text.
     */
    unescapeXML(text) {
        if (typeof text !== "string" || text.length === 0) {
            return "";
        }
        return text.replace(/&(amp|lt|gt|quot|apos);/g, (match, entity) => {
            switch (entity) {
                case "amp":
                    return "&";
                case "lt":
                    return "<";
                case "gt":
                    return ">";
                case "quot":
                    return '"';
                case "apos":
                    return "'";
                default:
                    return match;
            }
        });
    }
    /**
     * Extract the namespace prefix from a qualified name
     * @param qualifiedName Qualified name (e.g., "ns:element")
     * @returns Prefix or null if no prefix
     */
    extractPrefix(qualifiedName) {
        const colonIndex = qualifiedName.indexOf(":");
        return colonIndex > 0 ? qualifiedName.substring(0, colonIndex) : null;
    }
    /**
     * Extract the local name from a qualified name
     * @param qualifiedName Qualified name (e.g., "ns:element")
     * @returns Local name
     */
    extractLocalName(qualifiedName) {
        const colonIndex = qualifiedName.indexOf(":");
        return colonIndex > 0
            ? qualifiedName.substring(colonIndex + 1)
            : qualifiedName;
    }
    /**
     * Create a qualified name from prefix and local name
     * @param prefix Namespace prefix (can be null)
     * @param localName Local name
     * @returns Qualified name
     */
    createQualifiedName(prefix, localName) {
        return prefix ? `${prefix}:${localName}` : localName;
    }
}

/**
 * JsonToXmlConverter for converting JSON to XML
 */
class JsonToXmlConverter {
    /**
     * Constructor for JsonToXmlConverter
     * @param config Configuration options
     */
    constructor(config) {
        this.config = config;
        this.xmlUtil = new XmlUtil(this.config);
        this.transformUtil = new TransformUtil(this.config);
    }
    /**
     * Convert JSON object to XML string
     * @param jsonObj JSON object to convert
     * @returns XML string
     */
    convert(jsonObj) {
        try {
            const doc = DOMAdapter.createDocument();
            const rootElement = this.jsonToNode(jsonObj, doc);
            if (rootElement) {
                // Handle the temporary root element if it exists
                if (doc.documentElement && doc.documentElement.nodeName === "temp") {
                    doc.replaceChild(rootElement, doc.documentElement);
                }
                else {
                    doc.appendChild(rootElement);
                }
            }
            // Add XML declaration if specified
            let xmlString = DOMAdapter.serializeToString(doc);
            // remove xhtml decl inserted by dom
            xmlString = xmlString.replace(' xmlns="http://www.w3.org/1999/xhtml"', '');
            if (this.config.outputOptions.xml.declaration) {
                xmlString = this.xmlUtil.ensureXMLDeclaration(xmlString);
            }
            // Apply pretty printing if enabled
            if (this.config.outputOptions.prettyPrint) {
                xmlString = this.xmlUtil.prettyPrintXml(xmlString);
            }
            return xmlString;
        }
        catch (error) {
            throw new XJXError(`Failed to convert JSON to XML: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Convert JSON object to DOM node
     * @param jsonObj JSON object to convert
     * @param doc Document for creating elements
     * @param parentContext Optional parent context for transformation chain
     * @param path Current path in the JSON object
     * @returns DOM Element
     */
    jsonToNode(jsonObj, doc, parentContext, path = "") {
        if (!jsonObj || typeof jsonObj !== "object") {
            return null;
        }
        // Get the node name (first key in the object)
        const nodeName = Object.keys(jsonObj)[0];
        if (!nodeName) {
            return null;
        }
        const nodeData = jsonObj[nodeName];
        // Update the current path
        const currentPath = path ? `${path}.${nodeName}` : nodeName;
        // Create element with namespace if available
        let element;
        const namespaceKey = this.config.propNames.namespace;
        const prefixKey = this.config.propNames.prefix;
        const ns = nodeData[namespaceKey];
        const prefix = nodeData[prefixKey];
        // Create context for this node
        const context = this.transformUtil.createContext('json-to-xml', nodeName, DOMAdapter.NodeType.ELEMENT_NODE, {
            path: currentPath,
            namespace: ns,
            prefix: prefix,
            parent: parentContext
        });
        if (ns && this.config.preserveNamespaces) {
            if (prefix) {
                // Create element with namespace and prefix
                element = DOMAdapter.createElementNS(ns, `${prefix}:${nodeName}`);
            }
            else {
                // Create element with namespace but no prefix
                element = DOMAdapter.createElementNS(ns, nodeName);
            }
        }
        else {
            // Create element without namespace
            element = DOMAdapter.createElement(nodeName);
        }
        // Process attributes if enabled
        const attributesKey = this.config.propNames.attributes;
        const valueKey = this.config.propNames.value;
        if (this.config.preserveAttributes &&
            nodeData[attributesKey] &&
            Array.isArray(nodeData[attributesKey])) {
            nodeData[attributesKey].forEach((attrObj) => {
                const attrName = Object.keys(attrObj)[0];
                if (!attrName)
                    return;
                const attrData = attrObj[attrName];
                // Create attribute context
                const attrContext = this.transformUtil.createContext('json-to-xml', nodeName, DOMAdapter.NodeType.ELEMENT_NODE, {
                    path: `${currentPath}.${attrName}`,
                    namespace: attrData[namespaceKey],
                    prefix: attrData[prefixKey],
                    isAttribute: true,
                    attributeName: attrName,
                    parent: context
                });
                // Apply transformations to attribute value
                const transformedValue = this.transformUtil.applyTransforms(attrData[valueKey] || "", attrContext);
                const attrNs = attrData[namespaceKey];
                const attrPrefix = attrData[prefixKey];
                // Form qualified name for attribute if it has a prefix
                let qualifiedName = attrName;
                if (attrPrefix && this.config.preserveNamespaces) {
                    qualifiedName = `${attrPrefix}:${attrName}`;
                }
                DOMAdapter.setNamespacedAttribute(element, (attrNs && this.config.preserveNamespaces) ? attrNs : null, qualifiedName, transformedValue);
            });
        }
        // Process simple text value
        if (nodeData[valueKey] !== undefined) {
            // Apply transformations to text value
            const textContext = this.transformUtil.createContext('json-to-xml', nodeName, DOMAdapter.NodeType.TEXT_NODE, {
                path: `${currentPath}.#text`,
                namespace: ns,
                prefix: prefix,
                parent: context
            });
            const transformedValue = this.transformUtil.applyTransforms(nodeData[valueKey], textContext);
            element.textContent = transformedValue;
        }
        // Process children
        const childrenKey = this.config.propNames.children;
        const cdataKey = this.config.propNames.cdata;
        const commentsKey = this.config.propNames.comments;
        const instructionKey = this.config.propNames.instruction;
        const targetKey = this.config.propNames.target;
        if (nodeData[childrenKey] &&
            Array.isArray(nodeData[childrenKey])) {
            nodeData[childrenKey].forEach((child) => {
                // Text nodes
                if (child[valueKey] !== undefined &&
                    this.config.preserveTextNodes) {
                    // Apply transformations to text node
                    const textContext = this.transformUtil.createContext('json-to-xml', '#text', DOMAdapter.NodeType.TEXT_NODE, {
                        path: `${currentPath}.#text`,
                        parent: context
                    });
                    const transformedText = this.transformUtil.applyTransforms(child[valueKey], textContext);
                    element.appendChild(DOMAdapter.createTextNode(this.xmlUtil.escapeXML(transformedText)));
                }
                // CDATA sections
                else if (child[cdataKey] !== undefined &&
                    this.config.preserveCDATA) {
                    // Apply transformations to CDATA
                    const cdataContext = this.transformUtil.createContext('json-to-xml', '#cdata', DOMAdapter.NodeType.CDATA_SECTION_NODE, {
                        path: `${currentPath}.#cdata`,
                        parent: context
                    });
                    const transformedCData = this.transformUtil.applyTransforms(child[cdataKey], cdataContext);
                    element.appendChild(DOMAdapter.createCDATASection(transformedCData));
                }
                // Comments
                else if (child[commentsKey] !== undefined &&
                    this.config.preserveComments) {
                    element.appendChild(DOMAdapter.createComment(child[commentsKey]));
                }
                // Processing instructions
                else if (child[instructionKey] !== undefined &&
                    this.config.preserveProcessingInstr) {
                    const piData = child[instructionKey];
                    const target = piData[targetKey];
                    const data = piData[valueKey] || "";
                    if (target) {
                        element.appendChild(DOMAdapter.createProcessingInstruction(target, data));
                    }
                }
                // Element nodes (recursive)
                else {
                    const childElement = this.jsonToNode(child, doc, context, currentPath);
                    if (childElement) {
                        element.appendChild(childElement);
                    }
                }
            });
        }
        return element;
    }
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
    preserveNamespaces: true,
    preserveComments: true,
    preserveProcessingInstr: true,
    preserveCDATA: true,
    preserveTextNodes: true,
    preserveWhitespace: false,
    preserveAttributes: true,
    outputOptions: {
        prettyPrint: true,
        indent: 2,
        compact: true,
        json: {},
        xml: {
            declaration: true,
        },
    },
    propNames: {
        namespace: "$ns",
        prefix: "$pre",
        attributes: "$attr",
        value: "$val",
        cdata: "$cdata",
        comments: "$cmnt",
        instruction: "$pi",
        target: "$trgt",
        children: "$children",
    },
};

/**
 * XJX - Facade class for XML-JSON conversion operations
 */
class XJX {
    /**
     * Constructor for XJX utility
     * @param config Configuration options
     */
    constructor(config = {}) {
        // First create a jsonUtil instance with default config to use its methods
        this.jsonUtil = new JsonUtil(DEFAULT_CONFIG);
        // Create a deep clone of the default config
        const defaultClone = this.jsonUtil.deepClone(DEFAULT_CONFIG);
        // Deep merge with the provided config
        this.config = this.jsonUtil.deepMerge(defaultClone, config);
        // Re-initialize jsonUtil with the merged config
        this.jsonUtil = new JsonUtil(this.config);
        // Initialize other components
        this.xmlUtil = new XmlUtil(this.config);
        this.xmlToJsonConverter = new XmlToJsonConverter(this.config);
        this.jsonToXmlConverter = new JsonToXmlConverter(this.config);
    }
    /**
     * Convert XML string to JSON
     * @param xmlString XML content as string
     * @returns JSON object representing the XML content
     */
    xmlToJson(xmlString) {
        return this.xmlToJsonConverter.convert(xmlString);
    }
    /**
     * Convert JSON object back to XML string
     * @param jsonObj JSON object to convert
     * @returns XML string
     */
    jsonToXml(jsonObj) {
        return this.jsonToXmlConverter.convert(jsonObj);
    }
    /**
     * Pretty print an XML string
     * @param xmlString XML string to format
     * @returns Formatted XML string
     */
    prettyPrintXml(xmlString) {
        return this.xmlUtil.prettyPrintXml(xmlString);
    }
    /**
     * Safely retrieves a value from a JSON object using a dot-separated path.
     * @param obj The input JSON object
     * @param path The dot-separated path string (e.g., "root.item.description.$val")
     * @param fallback Value to return if the path does not resolve
     * @returns The value at the specified path or the fallback value
     */
    getPath(obj, path, fallback = undefined) {
        return this.jsonUtil.getPath(obj, path, fallback);
    }
    /**
     * Validate XML string
     * @param xmlString XML string to validate
     * @returns Validation result
     */
    validateXML(xmlString) {
        return this.xmlUtil.validateXML(xmlString);
    }
    /**
     * Generate a JSON schema based on the current configuration
     * @returns JSON schema object for validating XML-JSON documents
     */
    generateJsonSchema() {
        return this.jsonUtil.generateJsonSchema();
    }
    /**
     * Convert a standard JSON object to the XML-like JSON structure
     * @param obj Standard JSON object
     * @param root Optional root element configuration (string or object with properties)
     * @returns XML-like JSON object ready for conversion to XML
     */
    objectToXJX(obj, root) {
        return this.jsonUtil.objectToXJX(obj, root);
    }
    /**
     * Generate an example JSON object that matches the current configuration
     * @param rootName Name of the root element
     * @returns Example JSON object
     */
    generateJsonExample(rootName = "root") {
        return this.jsonUtil.generateExample(rootName);
    }
    /**
     * Add a value transformer to the configuration
     * @param transformer Value transformer to add
     * @returns This XJX instance for chaining
     */
    addTransformer(transformer) {
        if (!this.config.valueTransforms) {
            this.config.valueTransforms = [];
        }
        this.config.valueTransforms.push(transformer);
        return this;
    }
    /**
     * Removes all value transformers from the configuration
     * @returns This XJX instance for chaining
     */
    clearTransformers() {
        this.config.valueTransforms = [];
        return this;
    }
    /**
     * Clean up any resources
     */
    cleanup() {
        DOMAdapter.cleanup();
    }
}

/**
 * Abstract base class for value transformers
 */
class ValueTransformer {
    /**
     * Process a value, transforming it if applicable
     * @param value Value to potentially transform
     * @param context Context including direction and other information
     * @returns Transformed value or original if not applicable
     */
    process(value, context) {
        if (context.direction === 'xml-to-json') {
            return this.xmlToJson(value, context);
        }
        else {
            return this.jsonToXml(value, context);
        }
    }
    /**
     * Transform a value from XML to JSON representation
     * @param value Value from XML
     * @param context Transformation context
     * @returns Transformed value for JSON
     */
    xmlToJson(value, context) {
        // Default implementation returns original value
        return value;
    }
    /**
     * Transform a value from JSON to XML representation
     * @param value Value from JSON
     * @param context Transformation context
     * @returns Transformed value for XML
     */
    jsonToXml(value, context) {
        // Default implementation returns original value
        return value;
    }
}

// Import locally so you can use it below

export { DEFAULT_CONFIG, ValueTransformer, XJX, XJXError, XJX as default };
//# sourceMappingURL=index.js.map
