import { NodeType } from '../types/dom-types';
export declare const DOMAdapter: {
    createParser: () => any;
    createSerializer: () => any;
    NodeType: typeof NodeType;
    parseFromString: (xmlString: string, contentType?: string) => any;
    serializeToString: (node: Node) => any;
    createDocument: () => any;
    createElement: (tagName: string) => any;
    createElementNS: (namespaceURI: string, qualifiedName: string) => any;
    createTextNode: (data: string) => any;
    createCDATASection: (data: string) => any;
    createComment: (data: string) => any;
    createProcessingInstruction: (target: string, data: string) => any;
    /**
     * Creates a proper namespace qualified attribute
     */
    setNamespacedAttribute: (element: Element, namespaceURI: string | null, qualifiedName: string, value: string) => void;
    /**
     * Check if an object is a DOM node
     */
    isNode: (obj: any) => boolean;
    /**
     * Get DOM node type as string for debugging
     */
    getNodeTypeName: (nodeType: number) => string;
    /**
     * Get all node attributes as an object
     */
    getNodeAttributes: (node: Element) => Record<string, string>;
    cleanup: () => void;
};
