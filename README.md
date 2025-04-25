# XJX

A modern ESM library for bidirectional XML to JSON conversion with comprehensive support for namespaces, CDATA sections, comments, processing instructions, and more.

[![npm version](https://img.shields.io/npm/v/xjx.svg)](https://www.npmjs.com/package/xjx)
[![Downloads](https://img.shields.io/npm/dm/xjx.svg)](https://www.npmjs.com/package/xjx)
[![License](https://img.shields.io/npm/l/xjx.svg)](https://github.com/yourusername/xjx/blob/main/LICENSE)

## Features

- **Bidirectional Conversion**: Convert XML to JSON and back with high fidelity
- **Complete Node Type Support**:
  - Elements with text content
  - Attributes
  - Namespaces and prefixes
  - CDATA sections
  - Comments
  - Processing instructions
- **Configurable Output**: Customize JSON property names and output options
- **Value Transformers**: Apply type conversions (string → number, boolean, etc.)
- **Path Navigation**: Extract values using simple dot-notation paths
- **Cross-Platform**: Works in both browser and Node.js environments
- **No Dependencies**: Zero production dependencies by default
- **TypeScript**: Full TypeScript support with comprehensive type definitions
- **ESM & UMD**: Modern ESM modules with UMD fallback for wider compatibility

## Installation

### Browser Installation

You can install XJX via npm and bundle it with your application:

```bash
npm install xjx
```

Or use a CDN for direct browser usage:

```html
<!-- UMD build (for browsers with global XJX variable) -->
<script src="https://unpkg.com/xjx@3.0.0/dist/xjx.umd.js"></script>

<!-- Or minified version -->
<script src="https://unpkg.com/xjx@3.0.0/dist/xjx.min.js"></script>
```

### Node.js Installation (with JSDOM)

XJX uses DOM APIs and requires a DOM implementation in Node.js environments. By default, it uses JSDOM:

```bash
npm install xjx jsdom
```

JSDOM is a peer dependency that is marked as optional. You'll need to install it separately for Node.js usage.

### Custom DOM Configuration with Node

If you prefer to use an alternative DOM implementation, you can use `@xmldom/xmldom`:

```bash
npm install xjx @xmldom/xmldom
```

XJX will automatically detect and use one of these DOM implementations in Node.js environments.

## Basic Usage Example

Converting between XML and JSON is straightforward:

```javascript
import { XJX } from 'xjx';

// Create an instance of XJX with default configuration
const xjx = new XJX();

// Sample XML string
const xmlString = `
<library>
  <book id="b1" available="true">
    <title>The Great Gatsby</title>
    <author>F. Scott Fitzgerald</author>
    <year>1925</year>
    <description><![CDATA[A novel set in the Jazz Age]]></description>
  </book>
</library>`;

// Convert XML to JSON
const jsonObj = xjx.xmlToJson(xmlString);
console.log(JSON.stringify(jsonObj, null, 2));

// Extract specific values using path navigation
const bookTitle = xjx.getPath(jsonObj, 'library.book.title.$val');
console.log(`Book title: ${bookTitle}`); // "The Great Gatsby"

// Convert JSON back to XML
const newXml = xjx.jsonToXml(jsonObj);
console.log(newXml);

// Clean up when done (important for Node.js environments)
xjx.cleanup();
```

## Configuration Options

XJX is highly configurable. Here's an overview of the available configuration options:

```javascript
const config = {
  // Features to preserve during transformation
  preserveNamespaces: true,      // Preserve namespace information
  preserveComments: true,        // Preserve XML comments
  preserveProcessingInstr: true, // Preserve processing instructions
  preserveCDATA: true,           // Preserve CDATA sections
  preserveTextNodes: true,       // Preserve text nodes
  preserveWhitespace: false,     // Preserve whitespace-only text nodes
  preserveAttributes: true,      // Preserve element attributes

  // Output options
  outputOptions: {
    prettyPrint: true,          // Format XML output with indentation
    indent: 2,                  // Indentation spaces for pretty printing
    compact: true,              // Remove empty/undefined properties
    json: {},                   // Custom JSON serialization options
    xml: {
      declaration: true,        // Include XML declaration in output
    },
  },

  // Property names in the JSON representation
  propNames: {
    namespace: "$ns",           // Namespace URI property
    prefix: "$pre",             // Namespace prefix property
    attributes: "$attr",        // Attributes collection property
    value: "$val",              // Text value property
    cdata: "$cdata",            // CDATA content property
    comments: "$cmnt",          // Comments property
    instruction: "$pi",         // Processing instruction property
    target: "$trgt",            // PI target property
    children: "$children",      // Child nodes collection property
  },

  // Optional value transformers
  valueTransforms: [
    // Array of transformer instances (see Value Transformers section)
  ]
};

// Create an instance with custom configuration
const xjx = new XJX(config);
```

You can pass a partial configuration to override just the options you need:

```javascript
// Override only specific options
const xjx = new XJX({
  preserveWhitespace: true,
  outputOptions: {
    prettyPrint: false,
  }
});
```

## Namespace Handling

XJX provides comprehensive support for XML namespaces:

```xml
<root xmlns="http://default-ns.com" xmlns:ns="http://example.org">
  <ns:item id="123">Content</ns:item>
</root>
```

The resulting JSON maintains namespace information:

```javascript
{
  "root": {
    "$ns": "http://default-ns.com",
    "$children": [
      {
        "item": {
          "$ns": "http://example.org",
          "$pre": "ns",
          "$attr": [
            { "id": { "$val": "123" } }
          ],
          "$val": "Content"
        }
      }
    ]
  }
}
```

When converting back to XML, namespace declarations and prefixes are preserved.

## Value Transformers

Value transformers allow automatic conversion between string values in XML and typed values in JSON. For example, you can convert numeric strings to actual numbers or boolean strings to boolean values.

### Included Transformers

XJX comes with several built-in transformers:

#### BooleanTransformer

Converts strings like "true" and "false" to actual boolean values.

```javascript
import { XJX, BooleanTransformer } from 'xjx';

const xjx = new XJX();
xjx.addTransformer(new BooleanTransformer({
  trueValues: ['true', 'yes', '1'],
  falseValues: ['false', 'no', '0']
}));
```

#### NumberTransformer

Converts numeric strings to actual number values.

```javascript
import { XJX, NumberTransformer } from 'xjx';

const xjx = new XJX();
xjx.addTransformer(new NumberTransformer({
  parseIntegers: true,
  parseFloats: true,
  integerFormat: /^-?\d+$/,
  floatFormat: /^-?\d*\.\d+$/
}));
```

#### StringReplaceTransformer

Applies regex-based string replacements.

```javascript
import { XJX, StringReplaceTransformer } from 'xjx';

const xjx = new XJX();
xjx.addTransformer(new StringReplaceTransformer({
  pattern: '/\\s+/g', // Remove whitespace
  replacement: ''
}));
```

### Creating Custom Transformers

You can create custom transformers by extending the `ValueTransformer` base class:

```javascript
import { XJX, ValueTransformer, TransformContext } from 'xjx';

class DateTransformer extends ValueTransformer {
  // XML to JSON transformation
  protected xmlToJson(value, context) {
    if (typeof value !== 'string') return value;
    
    // Convert ISO date strings to Date objects
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(value);
    }
    
    return value;
  }
  
  // JSON to XML transformation
  protected jsonToXml(value, context) {
    if (value instanceof Date) {
      // Format date as ISO string
      return value.toISOString().split('T')[0];
    }
    
    return value;
  }
}

const xjx = new XJX();
xjx.addTransformer(new DateTransformer());
```

## XJX API Reference

### Constructor

```javascript
const xjx = new XJX(config);
```

Creates a new XJX instance with optional configuration.

### Core Methods

#### xmlToJson(xmlString)

Converts an XML string to a JSON object.

```javascript
const jsonObj = xjx.xmlToJson(xmlString);
```

#### jsonToXml(jsonObj)

Converts a JSON object (in XJX format) to an XML string.

```javascript
const xmlString = xjx.jsonToXml(jsonObj);
```

#### getPath(obj, path, fallback)

Retrieves a value from a JSON object using dot notation path.

```javascript
const value = xjx.getPath(jsonObj, 'root.item.title.$val', 'Default');
```

#### prettyPrintXml(xmlString)

Formats an XML string with proper indentation.

```javascript
const formattedXml = xjx.prettyPrintXml(xmlString);
```

#### validateXML(xmlString)

Checks if an XML string is well-formed.

```javascript
const result = xjx.validateXML(xmlString);
if (result.isValid) {
  console.log('XML is valid');
} else {
  console.error(`XML is invalid: ${result.message}`);
}
```

### Transformer Methods

#### addTransformer(transformer)

Adds a value transformer to the configuration.

```javascript
xjx.addTransformer(new NumberTransformer());
```

#### clearTransformers()

Removes all value transformers from the configuration.

```javascript
xjx.clearTransformers();
```

### Cleanup

#### cleanup()

Releases any resources, especially important in Node.js environments.

```javascript
xjx.cleanup();
```

## Detailed Method Explanations

### getPath Method

The `getPath` method provides a powerful way to extract values from the XML-JSON structure using dot notation. It handles array traversal and special XML structures automatically:

```javascript
xjx.getPath(jsonObj, 'path.to.value', defaultValue);
```

Key features:

1. **Dot Notation**: Navigate through nested objects using dot notation (e.g., `library.book.title.$val`)
2. **Array Traversal**: Automatically traverses arrays and collects matching values
3. **Index Access**: Access specific array elements with numeric indices (e.g., `library.book.0.title.$val`)
4. **Special XML Properties**: Access XML-specific properties using configured property names (`$val`, `$attr`, etc.)
5. **Default Values**: Specify a fallback value if the path doesn't exist

Examples:

```javascript
// Get a simple text value
const title = xjx.getPath(jsonObj, 'library.book.title.$val');

// Get an attribute value
const id = xjx.getPath(jsonObj, 'library.book.$attr.0.id.$val');

// Get values from all books in an array
const authors = xjx.getPath(jsonObj, 'library.book.author.$val');
// Result: ['F. Scott Fitzgerald', 'Harper Lee', ...]

// Get a specific book by index
const secondBook = xjx.getPath(jsonObj, 'library.book.1');

// Provide a default value if path doesn't exist
const publisher = xjx.getPath(jsonObj, 'library.book.publisher.$val', 'Unknown');
```

### generateSchema Method

The JSONUtil class includes a `generateJsonSchema` method that creates a JSON Schema for the XJX JSON format based on the current configuration:

```javascript
const jsonUtil = new JSONUtil(config);
const schema = jsonUtil.generateJsonSchema();
```

The generated schema:

1. Reflects current configuration settings (property names, preserved features)
2. Includes proper type information for all properties
3. Supports recursive element structures
4. Documents the purpose of each property
5. Can be used for validation with standard JSON Schema validators

This is useful for:
- Validating XJX JSON structures
- Generating documentation
- Providing hints in IDEs that support JSON Schema
- Data validation in applications

### jsonToXJX Method

The library provides a utility method to convert standard JSON objects to the XJX format:

```javascript
const jsonUtil = new JSONUtil(config);
const xjxJson = jsonUtil.fromJsonObject(standardJson, rootElementName);
```

This transforms a standard JSON object:

```javascript
{
  "name": "John",
  "age": 30,
  "roles": ["admin", "user"]
}
```

Into the XJX format:

```javascript
{
  "user": {
    "$children": [
      { "name": { "$val": "John" } },
      { "age": { "$val": 30 } },
      { 
        "roles": { 
          "$children": [
            { "$val": "admin" },
            { "$val": "user" }
          ]
        } 
      }
    ]
  }
}
```

This is useful when you want to convert arbitrary JSON data to XML. The second parameter allows you to specify the root element name (in this example, "user").

## License

MIT