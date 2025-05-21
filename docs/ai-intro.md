# XJX Library: AI Introduction

XJX is a JavaScript/TypeScript library for converting and transforming between XML and JSON formats with high fidelity. This document provides key information about XJX's design, capabilities, and usage patterns to help AI assistants reason about and generate code for this library.

## Core Concepts

- **Bidirectional Conversion**: XJX converts XML to JSON and back, with configurable fidelity.
- **Fluent API**: Operations are chained using method calls (`fromXml().withTransforms().toJson()`).
- **Intermediate Representation**: All conversions use an internal `XNode` format that preserves structure.
- **Transformation Pipeline**: Customizable transforms modify data during conversion.
- **Extensions System**: The API can be extended with custom methods.

## Basic Usage Pattern

```javascript
// Convert XML to JSON
const result = new XJX()
  .fromXml(xmlString)              // Set XML source
  .withTransforms(                 // Apply transformations (optional)
    createBooleanTransform(),      // Convert boolean strings to actual booleans
    createNumberTransform()        // Convert number strings to actual numbers
  )
  .toJson();                       // Output as JSON

// Convert JSON to XML
const xml = new XJX()
  .fromJson(jsonObject)            // Set JSON source
  .toXmlString({ prettyPrint: true }); // Output as XML string with pretty printing
```

## Key Components

### XNode Model

The `XNode` interface is the central data structure:

```typescript
interface XNode {
  name: string;                     // Element name
  type: number;                     // Node type (element, text, etc.)
  value?: any;                      // Node value
  attributes?: Record<string, any>; // Element attributes
  children?: XNode[];               // Child nodes
  namespace?: string;               // Namespace URI
  prefix?: string;                  // Namespace prefix
  namespaceDeclarations?: Record<string, string>; // Namespace declarations
  metadata?: Record<string, any>;   // User-defined metadata
  parent?: XNode;                   // Parent node reference
}
```

### Configuration Options

XJX offers extensive configuration options:

```javascript
const xjx = new XJX({
  // Preservation options
  preserveNamespaces: true,     // Keep XML namespaces
  preserveComments: true,       // Keep XML comments
  preserveCDATA: true,          // Keep CDATA sections
  preserveTextNodes: true,      // Keep text nodes

  // JSON conversion strategies
  highFidelity: false,          // Use verbose but lossless JSON format
  attributeStrategy: 'merge',   // How to handle attributes ('merge', 'prefix', 'property')
  textStrategy: 'direct',       // How to handle text ('direct', 'property')
  arrayStrategy: 'multiple',    // When to create arrays ('multiple', 'always', 'never')

  // Output formatting
  formatting: {
    indent: 2,                  // Indentation spaces
    declaration: true,          // Include XML declaration
    pretty: true                // Pretty-print output
  }
});
```

### Transform System

Transforms modify data during conversion:

```javascript
// Built-in transforms
createBooleanTransform()        // Convert strings to booleans
createNumberTransform()         // Convert strings to numbers
createRegexTransform({          // Apply regex replacements
  pattern: /pattern/,
  replacement: 'replacement'
})
createMetadataTransform({       // Add metadata to nodes
  selector: 'nodeName',
  metadata: { /* custom data */ }
})

// Custom transforms implement the Transform interface
interface Transform {
  targets: TransformTarget[];   // What this transform targets (values, attributes, elements)
  transform(value: any, context: TransformContext): TransformResult<any>;
}
```

## XML/JSON Conversion Modes

### Standard Mode (Default)

XML:
```xml
<user id="123">
  <name>John</name>
  <active>true</active>
</user>
```

JSON (with attribute prefixing):
```json
{
  "user": {
    "@id": "123",
    "name": "John",
    "active": "true"
  }
}
```

### High-Fidelity Mode

Same XML input results in more verbose but lossless JSON:

```json
{
  "user": {
    "$attr": [
      { "id": { "$val": "123" } }
    ],
    "$children": [
      { "name": { "$val": "John" } },
      { "active": { "$val": "true" } }
    ]
  }
}
```

## Common Scenarios

### Type Conversion

Convert string values to appropriate types:

```javascript
new XJX()
  .fromXml('<user><active>true</active><count>5</count></user>')
  .withTransforms(
    createBooleanTransform(),
    createNumberTransform()
  )
  .toJson();

// Result: { "user": { "active": true, "count": 5 } }
```

### Date Format Conversion

Convert between date formats:

```javascript
new XJX()
  .fromXml('<user><date>2023-04-15</date></user>')
  .withTransforms(
    createRegexTransform({
      pattern: /(\d{4})-(\d{2})-(\d{2})/,
      replacement: '$2/$3/$1'
    })
  )
  .toJson();

// Result: { "user": { "date": "04/15/2023" } }
```

### Custom Transforms

Create custom data transformations:

```javascript
class TitleCaseTransform implements Transform {
  public readonly targets = [TransformTarget.Value];
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    if (typeof value !== 'string') return createTransformResult(value);
    
    const transformed = value.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
    });
    
    return createTransformResult(transformed);
  }
}

// Using the custom transform
new XJX()
  .fromXml('<user><name>john doe</name></user>')
  .withTransforms(new TitleCaseTransform())
  .toJson();

// Result: { "user": { "name": "John Doe" } }
```

## Error Handling

XJX provides specific error types:

```javascript
try {
  const result = new XJX().fromXml(malformedXml).toJson();
} catch (err) {
  if (err instanceof ValidationError) {
    // Input validation error
  } else if (err instanceof ProcessingError) {
    // Processing error during conversion
  } else {
    // Other error
  }
}
```

## Key API Methods

- **Source Methods**: `fromXml()`, `fromJson()`, `fromJsonString()`
- **Transform Methods**: `withTransforms()`
- **Configuration Methods**: `withConfig()`, `setLogLevel()`
- **Output Methods**: `toXml()`, `toXmlString()`, `toJson()`, `toJsonString()`

## Memory and Performance Considerations

- XJX creates an in-memory representation of the entire document
- For very large documents, memory usage can be significant
- Transforms are applied to the entire document, which can impact performance

## Technical Limitations

- XJX is designed for document conversion, not streaming
- XML Schema validation is not built-in
- XPath querying is not supported natively

This guide provides the key information needed to understand XJX's capabilities and generate correct code examples. For more details, refer to the README, ARCHITECTURE, and EXTENSIONS-AND-TRANSFORMS documents.