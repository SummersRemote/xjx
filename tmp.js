const config = {
  preserveNamespaces: true,
  preserveComments: true,
  preserveProcessingInstr: true,
  preserveCDATA: true,
  preserveTextNodes: true,
  preserveWhitespace: false,
  preserveAttributes: true,

  converters: {
    stdJson: {
      options: {
        attributeHandling: "ignore", // Options: 'ignore', 'merge', 'prefix', 'property'
        attributePrefix: "@",
        attributePropertyName: "_attrs",
        textPropertyName: "_text",
        alwaysCreateArrays: false,
        preserveMixedContent: true,
        emptyElementsAsNull: false,
      },
      naming: {
        arrayItem: "item", // Name for array items when converting standard JSON arrays to XML
      },
    },
    xjxJson: {
      options: {
        compact: true, // Remove empty nodes and properties
      },
      naming: {
        namespace: "$ns", // Namespace URI
        prefix: "$pre", // Namespace prefix
        attribute: "$attr", // Attributes collection
        value: "$val", // Node value
        cdata: "$cdata", // CDATA section content
        comment: "$cmnt", // Comment content
        processingInstr: "$pi", // Processing instruction
        target: "$trgt", // Processing instruction target
        children: "$children", // Child nodes collection
      },
    },
    xml: {
      options: {
        declaration: true, // Include XML declaration
        prettyPrint: true, // Format output with indentation
        indent: 2, // Number of spaces for indentation
      },
    },
  },

  // Transform and extensions continue to handle their own properties locally
};
