# XJX Library Documentation

## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Configuration](#configuration)
- [XJX API Reference](#xjx-api-reference)
- [Transformers](#transformers)
  - [Built-in Transformers](#built-in-transformers)
  - [Creating Custom Transformers](#creating-custom-transformers)
- [Working with Namespaces](#working-with-namespaces)
- [JSON Format](#json-format)
- [Extensions](#extensions)
- [Error Handling](#error-handling)

## Introduction

XJX is a flexible XML-JSON transformation library that provides bidirectional conversion between XML and JSON with support for namespaces, CDATA, comments, processing instructions, and more. The library's transformation pipeline allows you to customize the conversion process with value transformers.

## Installation

### Node.js

Install using npm:

```bash
npm install xjx
```

XJX requires one of these DOM implementations:

- **jsdom** (preferred for Node.js environment)
- **@xmldom/xmldom** (lightweight alternative)

Install with one of these dependencies:

```bash
# With jsdom (recommended)
npm install xjx jsdom

# OR with xmldom
npm install xjx @xmldom/xmldom
```

### Browser

XJX can be used directly in the browser:

```html
<!-- ESM module (recommended) -->
<script type="module">
  import { XJX } from 'https://unpkg.com/xjx/dist/index.js';
  // Your code here
</script>

<!-- Or UMD bundle -->
<script src="https://unpkg.com/xjx/dist/xjx.umd.js"></script>
<script>
  const xjx = new XJX.XJX(); 
  // Your code here
</script>

<!-- Or minified bundle -->
<script src="https://unpkg.com/xjx/dist/xjx.min.js"></script>
```

## Basic Usage

### Converting XML to JSON

```javascript
import { XJX } from 'xjx';

// Create a new instance with default configuration
const xjx = new XJX();

// Convert XML to JSON
const xmlString = `
  <root>
    <element attribute="value">
      <child>content</child>
    </element>
  </root>
`;

const jsonObj = xjx.xmlToJson(xmlString);
console.log(JSON.stringify(jsonObj, null, 2));
```

Output:

```json
{
  "root": {
    "$children": [
      {
        "element": {
          "$attr": [
            {
              "attribute": {
                "$val": "value"
              }
            }
          ],
          "$children": [
            {
              "child": {
                "$val": "content"
              }
            }
          ]
        }
      }
    ]
  }
}
```

### Converting JSON to XML

```javascript
import { XJX } from 'xjx';

const xjx = new XJX();

const jsonObj = {
  "root": {
    "$children": [
      {
        "element": {
          "$attr": [
            {
              "attribute": {
                "$val": "value"
              }
            }
          ],
          "$children": [
            {
              "child": {
                "$val": "content"
              }
            }
          ]
        }
      }
    ]
  }
};

const xmlString = xjx.jsonToXml(jsonObj);
console.log(xmlString);
```

Output:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<root>
  <element attribute="value">
    <child>content</child>
  </element>
</root>
```

### Converting Plain Objects to XJX Format

You can convert plain JavaScript objects to the XJX JSON format:

```javascript
import { XJX } from 'xjx';

const xjx = new XJX();

const plainObj = {
  name: "John",
  age: 30,
  address: {
    street: "123 Main St",
    city: "Anytown"
  },
  hobbies: ["reading", "coding", "hiking"]
};

// Convert to XJX format with "person" as the root element
const xjxObj = xjx.objectToXJX(plainObj, "person");
console.log(JSON.stringify(xjxObj, null, 2));

// Convert to XML
const xmlString = xjx.jsonToXml(xjxObj);
console.log(xmlString);
```

Output:

```json
{
  "person": {
    "$children": [
      {
        "name": {
          "$val": "John"
        }
      },
      {
        "age": {
          "$val": 30
        }
      },
      {
        "address": {
          "$children": [
            {
              "street": {
                "$val": "123 Main St"
              }
            },
            {
              "city": {
                "$val": "Anytown"
              }
            }
          ]
        }
      },
      {
        "hobbies": {
          "$children": [
            {
              "$val": "reading"
            },
            {
              "$val": "coding"
            },
            {
              "$val": "hiking"
            }
          ]
        }
      }
    ]
  }
}
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<person>
  <name>John</name>
  <age>30</age>
  <address>
    <street>123 Main St</street>
    <city>Anytown</city>
  </address>
  <hobbies>reading</hobbies>
  <hobbies>coding</hobbies>
  <hobbies>hiking</hobbies>
</person>
```

## Configuration

XJX provides many configuration options to control the conversion process:

```javascript
import { XJX } from 'xjx';

// Create a new instance with custom configuration
const xjx = new XJX({
  // Preservation options
  preserveNamespaces: true,     // Preserve namespace information
  preserveComments: true,       // Preserve comments
  preserveProcessingInstr: true, // Preserve processing instructions
  preserveCDATA: true,          // Preserve CDATA sections
  preserveTextNodes: true,      // Preserve text nodes
  preserveWhitespace: false,    // Strip whitespace
  preserveAttributes: true,     // Preserve attributes
  
  // Output options
  outputOptions: {
    prettyPrint: true,          // Format XML output
    indent: 2,                  // Indentation level (spaces)
    compact: true,              // Remove empty properties
    json: {},                   // JSON-specific options
    xml: {
      declaration: true         // Include XML declaration
    }
  },
  
  // Custom property names for JSON representation
  propNames: {
    namespace: "$ns",           // Namespace URI
    prefix: "$pre",             // Namespace prefix
    attributes: "$attr",        // Element attributes
    value: "$val",              // Text content
    cdata: "$cdata",            // CDATA content
    comments: "$cmnt",          // Comment content
    instruction: "$pi",         // Processing instruction
    target: "$trgt",            // Processing instruction target
    children: "$children"       // Child elements
  }
});
```

You can also update the configuration after creating an instance:

```javascript
xjx.setConfig({
  preserveWhitespace: true,
  outputOptions: {
    indent: 4
  }
});
```

## XJX API Reference

### Constructor

```typescript
new XJX(config?: Partial<Configuration>)
```

Creates a new XJX instance with optional configuration.

### Core Methods

#### XML to JSON Conversion

```typescript
xmlToJson(xmlString: string): Record<string, any>
```

Converts an XML string to a JSON object.

#### JSON to XML Conversion

```typescript
jsonToXml(jsonObj: Record<string, any>): string
```

Converts a JSON object to an XML string.

#### Plain Object to XJX Format

```typescript
objectToXJX(obj: any, root?: string | Record<string, any>): Record<string, any>
```

Converts a standard JavaScript object to the XJX JSON format.

### Helper Methods

#### Pretty Print XML

```typescript
prettyPrintXml(xmlString: string): string
```

Formats an XML string with indentation and line breaks.

#### Validate XML

```typescript
validateXML(xmlString: string): { isValid: boolean; message?: string }
```

Validates an XML string and returns a result object.

### Configuration Methods

#### Get Configuration

```typescript
getConfig(): Configuration
```

Returns a copy of the current configuration.

#### Set Configuration

```typescript
setConfig(options: Partial<Configuration>): XJX
```

Updates the configuration with new options.

### Resource Management

```typescript
cleanup(): void
```

Releases resources used by the library (especially important when using jsdom in Node.js).

## Transformers

Transformers allow you to modify values during the conversion process. They can be applied in either direction: XML to JSON, JSON to XML, or both.

### Adding Transformers

```typescript
// Add a value transformer
xjx.addValueTransformer(
  TransformDirection.XML_TO_JSON, 
  new BooleanTransformer()
);

// Add an attribute transformer
xjx.addAttributeTransformer(
  TransformDirection.JSON_TO_XML,
  myAttributeTransformer
);

// Add a children transformer
xjx.addChildrenTransformer(
  TransformDirection.XML_TO_JSON,
  myChildrenTransformer
);

// Add a node transformer
xjx.addNodeTransformer(
  TransformDirection.JSON_TO_XML,
  myNodeTransformer
);
```

### Clearing Transformers

```typescript
// Clear all transformers
xjx.clearTransformers();

// Clear transformers for a specific direction
xjx.clearTransformers(TransformDirection.XML_TO_JSON);
```

### Built-in Transformers

XJX comes with several built-in transformers:

#### BooleanTransformer

Converts string values like "true", "yes", "1", or "on" to boolean `true`, and values like "false", "no", "0", or "off" to boolean `false`.

```javascript
import { XJX, TransformDirection, BooleanTransformer } from 'xjx';

const xjx = new XJX();
xjx.addValueTransformer(
  TransformDirection.XML_TO_JSON, 
  new BooleanTransformer({
    // Optional custom true/false values
    trueValues: ['true', 'yes', '1', 'on', 'active'],
    falseValues: ['false', 'no', '0', 'off', 'inactive'],
    ignoreCase: true  // Case-insensitive matching (default: true)
  })
);

// Example usage
const xmlString = `
<settings>
  <featureEnabled>yes</featureEnabled>
  <debugMode>no</debugMode>
  <verboseLogging>true</verboseLogging>
</settings>
`;

const jsonObj = xjx.xmlToJson(xmlString);
console.log(jsonObj.settings.$children[0].featureEnabled.$val);  // true (boolean)
console.log(jsonObj.settings.$children[1].debugMode.$val);       // false (boolean)
console.log(jsonObj.settings.$children[2].verboseLogging.$val);  // true (boolean)
```

#### NumberTransformer

Converts string values to numbers.

```javascript
import { XJX, TransformDirection, NumberTransformer } from 'xjx';

const xjx = new XJX();
xjx.addValueTransformer(
  TransformDirection.XML_TO_JSON, 
  new NumberTransformer({
    integers: true,              // Convert integers (default: true)
    decimals: true,              // Convert decimals (default: true)
    scientific: true,            // Convert scientific notation (default: true)
    strictParsing: true,         // Only convert exact number strings (default: true)
    decimalSeparator: '.',       // Decimal separator (default: '.')
    thousandsSeparator: ','      // Thousands separator (default: ',')
  })
);

// Example usage
const xmlString = `
<data>
  <int>42</int>
  <float>3.14</float>
  <formattedNumber>1,234.56</formattedNumber>
  <scientific>2.5e-3</scientific>
</data>
`;

const jsonObj = xjx.xmlToJson(xmlString);
console.log(jsonObj.data.$children[0].int.$val);                // 42 (number)
console.log(jsonObj.data.$children[1].float.$val);              // 3.14 (number)
console.log(jsonObj.data.$children[2].formattedNumber.$val);    // 1234.56 (number)
console.log(jsonObj.data.$children[3].scientific.$val);         // 0.0025 (number)
```

#### StringReplaceTransformer

Performs string replacements on text values.

```javascript
import { XJX, TransformDirection, StringReplaceTransformer } from 'xjx';

const xjx = new XJX();

// URL linkifier transformer
xjx.addValueTransformer(
  TransformDirection.XML_TO_JSON, 
  new StringReplaceTransformer({
    pattern: /(https?:\/\/[\w-]+(\.[\w-]+)+[\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])/g,
    replacement: '<a href="$1">$1</a>',
    replaceAll: true  // Replace all occurrences (default: true)
  })
);

// Example usage
const xmlString = `
<post>
  <content>Check out our website at https://example.com for more information.</content>
</post>
`;

const jsonObj = xjx.xmlToJson(xmlString);
console.log(jsonObj.post.$children[0].content.$val);
// "Check out our website at <a href="https://example.com">https://example.com</a> for more information."
```

### Creating Custom Transformers

You can create custom transformers by extending the base classes:

#### Creating a Custom Value Transformer

```javascript
import { BaseValueTransformer, TransformContext, XNode, TransformResult, transformResult } from 'xjx';

// Create a transformer that capitalizes text values
class CapitalizeTransformer extends BaseValueTransformer {
  constructor() {
    super();
  }
  
  // Implement the transformValue method
  protected transformValue(value: any, node: XNode, context: TransformContext): TransformResult<any> {
    // Only transform string values
    if (typeof value !== 'string') {
      return transformResult(value);
    }
    
    // Capitalize the first letter of each word
    const transformed = value.replace(/\b\w/g, char => char.toUpperCase());
    
    // Return the transformed value
    return transformResult(transformed);
  }
}

// Usage
const xjx = new XJX();
xjx.addValueTransformer(TransformDirection.XML_TO_JSON, new CapitalizeTransformer());
```

#### Creating a Custom Attribute Transformer

```javascript
import { BaseAttributeTransformer, TransformContext, XNode, TransformResult, transformResult } from 'xjx';

// Create a transformer that prefixes attribute names
class AttributePrefixTransformer extends BaseAttributeTransformer {
  private prefix: string;
  
  constructor(prefix: string) {
    super();
    this.prefix = prefix;
  }
  
  // Implement the transformAttribute method
  protected transformAttribute(name: string, value: any, node: XNode, context: TransformContext): TransformResult<[string, any]> {
    // Skip attributes that already have the prefix
    if (name.startsWith(this.prefix)) {
      return transformResult([name, value]);
    }
    
    // Add the prefix to the attribute name
    return transformResult([`${this.prefix}${name}`, value]);
  }
}

// Usage
const xjx = new XJX();
xjx.addAttributeTransformer(TransformDirection.JSON_TO_XML, new AttributePrefixTransformer('data-'));
```

## Working with Namespaces

XJX preserves namespace information by default:

```javascript
// XML with namespaces
const xmlString = `
<root xmlns="http://example.com/default" xmlns:ns1="http://example.com/ns1">
  <element>Default namespace</element>
  <ns1:element>Custom namespace</ns1:element>
</root>
`;

const xjx = new XJX();
const jsonObj = xjx.xmlToJson(xmlString);

// Namespace information is preserved
console.log(jsonObj.root.$ns);  // "http://example.com/default"
console.log(jsonObj.root.$children[1]['ns1:element'].$ns);  // "http://example.com/ns1"
console.log(jsonObj.root.$children[1]['ns1:element'].$pre);  // "ns1"

// Convert back to XML
const xmlResult = xjx.jsonToXml(jsonObj);
// Namespaces are preserved in the output
```

## JSON Format

The JSON format used by XJX is designed to represent all aspects of XML, including:

- Element structure
- Attributes
- Text content
- Namespaces
- CDATA sections
- Comments
- Processing instructions

The default property names can be customized through the configuration:

```javascript
const xjx = new XJX({
  propNames: {
    namespace: "_ns",       // Change from "$ns"
    prefix: "_prefix",      // Change from "$pre"
    attributes: "_attrs",   // Change from "$attr"
    value: "_content",      // Change from "$val"
    cdata: "_cdata",        // Change from "$cdata"
    comments: "_comment",   // Change from "$cmnt"
    instruction: "_pi",     // Change from "$pi"
    target: "_target",      // Change from "$trgt"
    children: "_children"   // Change from "$children"
  }
});
```

## Extensions

### getPath Extension

Retrieve values from the JSON structure using a dot-separated path:

```javascript
import { XJX } from 'xjx/full';  // Import the full bundle with extensions

const xjx = new XJX();

const xmlString = `
<library>
  <book id="1">
    <title>The Hobbit</title>
    <author>J.R.R. Tolkien</author>
  </book>
</library>
`;

const jsonObj = xjx.xmlToJson(xmlString);

// Get values using dot notation
const bookId = xjx.getPath(jsonObj, 'library.$children.0.book.$attr.0.id.$val');
console.log(bookId);  // "1"

const title = xjx.getPath(jsonObj, 'library.$children.0.book.$children.0.title.$val');
console.log(title);  // "The Hobbit"

// With a fallback value
const publisher = xjx.getPath(jsonObj, 'library.$children.0.book.$children.2.publisher.$val', 'Unknown');
console.log(publisher);  // "Unknown"
```

### getJsonSchema Extension

Generate a JSON Schema for the XML-JSON structure:

```javascript
import { XJX } from 'xjx/full';  // Import the full bundle with extensions

const xjx = new XJX();
const schema = xjx.getJsonSchema();

console.log(JSON.stringify(schema, null, 2));
```

## Error Handling

XJX provides several error classes for specific error types:

```javascript
import { XJX, XJXError, XmlToJsonError, JsonToXmlError } from 'xjx';

try {
  const xjx = new XJX();
  const jsonObj = xjx.xmlToJson('<invalid>xml</invalid>');
} catch (error) {
  if (error instanceof XmlToJsonError) {
    console.error('XML parsing error:', error.message);
  } else if (error instanceof JsonToXmlError) {
    console.error('JSON serialization error:', error.message);
  } else if (error instanceof XJXError) {
    console.error('XJX error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Error Types

- `XJXError` - Base error class
- `XmlToJsonError` - XML parsing issues
- `JsonToXmlError` - XML serialization issues
- `EnvironmentError` - Environment incompatibility (e.g., missing DOM implementation)
- `ConfigurationError` - Invalid configuration