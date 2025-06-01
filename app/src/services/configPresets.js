// services/configPresets.js - Simplified and updated presets
export const configPresets = [
  {
    name: "Default",
    description: "Balanced configuration for most XML/JSON conversion needs",
    config: {
      preserveNamespaces: true,
      preserveComments: true,
      preserveProcessingInstr: true,
      preserveCDATA: true,
      preserveTextNodes: true,
      preserveWhitespace: false,
      preserveAttributes: true,
      preservePrefixedNames: false,
      strategies: {
        highFidelity: false,
        attributeStrategy: "merge",
        textStrategy: "direct",
        namespaceStrategy: "prefix",
        arrayStrategy: "multiple",
        emptyElementStrategy: "object",
        mixedContentStrategy: "preserve"
      },
      properties: {
        attribute: "$attr",
        value: "$val",
        namespace: "$ns",
        prefix: "$pre",
        cdata: "$cdata",
        comment: "$cmnt",
        processingInstr: "$pi",
        target: "$trgt",
        children: "$children"
      },
      prefixes: {
        attribute: "@",
        namespace: "xmlns:",
        comment: "#",
        cdata: "!",
        pi: "?"
      },
      arrays: {
        forceArrays: [],
        defaultItemName: "item",
        itemNames: {}
      },
      formatting: {
        indent: 2,
        declaration: true,
        pretty: true
      },
      fragmentRoot: "results"
    }
  },
  {
    name: "High-Fidelity",
    description: "Perfect round-trip conversion preserving all XML information",
    config: {
      preserveNamespaces: true,
      preserveComments: true,
      preserveProcessingInstr: true,
      preserveCDATA: true,
      preserveTextNodes: true,
      preserveWhitespace: true,
      preserveAttributes: true,
      preservePrefixedNames: true,
      strategies: {
        highFidelity: true,
        attributeStrategy: "property",
        textStrategy: "property",
        namespaceStrategy: "property",
        arrayStrategy: "multiple",
        emptyElementStrategy: "object",
        mixedContentStrategy: "preserve"
      },
      properties: {
        attribute: "$attr",
        value: "$val",
        namespace: "$ns",
        prefix: "$pre",
        cdata: "$cdata",
        comment: "$cmnt",
        processingInstr: "$pi",
        target: "$trgt",
        children: "$children"
      },
      prefixes: {
        attribute: "@",
        namespace: "xmlns:",
        comment: "#",
        cdata: "!",
        pi: "?"
      },
      arrays: {
        forceArrays: [],
        defaultItemName: "item",
        itemNames: {}
      },
      formatting: {
        indent: 2,
        declaration: true,
        pretty: true
      },
      fragmentRoot: "results"
    }
  },
  {
    name: "Badgerfish",
    description: "Popular XML-to-JSON convention using $ for text content and @ for attributes",
    config: {
      preserveNamespaces: false,
      preserveComments: false,
      preserveProcessingInstr: false,
      preserveCDATA: false,
      preserveTextNodes: true,
      preserveWhitespace: false,
      preserveAttributes: true,
      preservePrefixedNames: false,
      strategies: {
        highFidelity: false,
        attributeStrategy: "prefix",
        textStrategy: "property",
        namespaceStrategy: "prefix",
        arrayStrategy: "multiple",
        emptyElementStrategy: "null",
        mixedContentStrategy: "preserve"
      },
      properties: {
        attribute: "$attr",
        value: "$",
        namespace: "$ns",
        prefix: "$pre",
        cdata: "$cdata",
        comment: "$cmnt",
        processingInstr: "$pi",
        target: "$trgt",
        children: "$children"
      },
      prefixes: {
        attribute: "@",
        namespace: "xmlns:",
        comment: "#",
        cdata: "!",
        pi: "?"
      },
      arrays: {
        forceArrays: [],
        defaultItemName: "item",
        itemNames: {}
      },
      formatting: {
        indent: 2,
        declaration: false,
        pretty: true
      },
      fragmentRoot: "results"
    }
  },
  {
    name: "Minimal",
    description: "Compact conversion with minimal metadata overhead",
    config: {
      preserveNamespaces: false,
      preserveComments: false,
      preserveProcessingInstr: false,
      preserveCDATA: false,
      preserveTextNodes: true,
      preserveWhitespace: false,
      preserveAttributes: true,
      preservePrefixedNames: false,
      strategies: {
        highFidelity: false,
        attributeStrategy: "merge",
        textStrategy: "direct",
        namespaceStrategy: "prefix",
        arrayStrategy: "multiple",
        emptyElementStrategy: "remove",
        mixedContentStrategy: "merge"
      },
      properties: {
        attribute: "$attr",
        value: "$val",
        namespace: "$ns",
        prefix: "$pre",
        cdata: "$cdata",
        comment: "$cmnt",
        processingInstr: "$pi",
        target: "$trgt",
        children: "$children"
      },
      prefixes: {
        attribute: "@",
        namespace: "xmlns:",
        comment: "#",
        cdata: "!",
        pi: "?"
      },
      arrays: {
        forceArrays: [],
        defaultItemName: "item",
        itemNames: {}
      },
      formatting: {
        indent: 0,
        declaration: false,
        pretty: false
      },
      fragmentRoot: "results"
    }
  },
  {
    name: "Namespace Focused",
    description: "Optimized for XML documents with complex namespace usage",
    config: {
      preserveNamespaces: true,
      preserveComments: true,
      preserveProcessingInstr: true,
      preserveCDATA: true,
      preserveTextNodes: true,
      preserveWhitespace: true,
      preserveAttributes: true,
      preservePrefixedNames: true,
      strategies: {
        highFidelity: false,
        attributeStrategy: "property",
        textStrategy: "property",
        namespaceStrategy: "property",
        arrayStrategy: "multiple",
        emptyElementStrategy: "object",
        mixedContentStrategy: "preserve"
      },
      properties: {
        attribute: "attributes",
        value: "value",
        namespace: "namespaceURI",
        prefix: "namespacePrefix",
        cdata: "cdata",
        comment: "comment",
        processingInstr: "processingInstruction",
        target: "target",
        children: "children"
      },
      prefixes: {
        attribute: "@",
        namespace: "xmlns:",
        comment: "#",
        cdata: "!",
        pi: "?"
      },
      arrays: {
        forceArrays: [],
        defaultItemName: "element",
        itemNames: {}
      },
      formatting: {
        indent: 2,
        declaration: true,
        pretty: true
      },
      fragmentRoot: "elements"
    }
  }
];

export default {
  configPresets
};