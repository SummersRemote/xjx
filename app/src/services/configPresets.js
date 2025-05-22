// services/configPresets.js
import XJXService from './xjxService.js';

// Get the default configuration from the XJX library
const defaultConfig = XJXService.getDefaultConfig();

export const configPresets = [
  {
    name: "Default",
    description: "Default XJX configuration - automatically updated with library changes",
    config: defaultConfig
  },
  {
    name: "XJX High-Fidelity",
    description: "Lossless conversion preserving all XML information for perfect round-trip conversion",
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
        text: "_text",
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
      }
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
        value: "$val",
        text: "$",
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
      }
    }
  },
  {
    name: "Parker",
    description: "Compact format focusing on content over structure, minimal metadata",
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
        arrayStrategy: "always",
        emptyElementStrategy: "remove",  // Use remove strategy for Parker
        mixedContentStrategy: "merge"
      },
      properties: {
        attribute: "$attr",
        value: "$val",
        text: "_text",
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
      }
    }
  },
  {
    name: "JsonML",
    description: "JSON Markup Language representation using arrays for structure",
    config: {
      preserveNamespaces: true,
      preserveComments: false,
      preserveProcessingInstr: false,
      preserveCDATA: false,
      preserveTextNodes: true,
      preserveWhitespace: false,
      preserveAttributes: true,
      preservePrefixedNames: true,
      strategies: {
        highFidelity: false,
        attributeStrategy: "property",
        textStrategy: "property",
        namespaceStrategy: "property",
        arrayStrategy: "always",
        emptyElementStrategy: "object",
        mixedContentStrategy: "preserve"
      },
      properties: {
        attribute: "$attr",
        value: "$val",
        text: "_text",
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
      }
    }
  },
  {
    name: "Structure Only",
    description: "Preserves XML structure while removing text content - useful for creating templates",
    config: {
      preserveNamespaces: true,
      preserveComments: false,
      preserveProcessingInstr: false,
      preserveCDATA: false,
      preserveTextNodes: false,
      preserveWhitespace: false,
      preserveAttributes: true,
      preservePrefixedNames: true,
      strategies: {
        highFidelity: false,
        attributeStrategy: "merge",
        textStrategy: "direct",
        namespaceStrategy: "prefix",
        arrayStrategy: "multiple",
        emptyElementStrategy: "remove",  // Use remove strategy for structure-only
        mixedContentStrategy: "preserve"
      },
      properties: {
        attribute: "$attr",
        value: "$val",
        text: "_text",
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
      }
    }
  },
  {
    name: "Minimal",
    description: "Basic conversion with minimal metadata and processing overhead",
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
        emptyElementStrategy: "string",
        mixedContentStrategy: "merge"
      },
      properties: {
        attribute: "$attr",
        value: "$val",
        text: "_text",
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
      }
    }
  },
  {
    name: "Namespace Focused",
    description: "Optimized for XML documents with heavy namespace usage",
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
        text: "textContent",
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
      }
    }
  },
  {
    name: "Compact",
    description: "Focused on minimal output size with aggressive compacting and empty element removal",
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
        arrayStrategy: "never",
        emptyElementStrategy: "remove",  // Use remove strategy for compact output
        mixedContentStrategy: "merge"
      },
      properties: {
        attribute: "$attr",
        value: "$val",
        text: "_text",
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
      }
    }
  }
];

export default {
  configPresets
};