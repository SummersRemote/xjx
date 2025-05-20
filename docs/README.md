# XJX - XML/JSON Transformation Library

XJX is a powerful and flexible library for converting and transforming between XML and JSON formats with a clean, fluent API. It preserves structural information during conversion and provides fine-grained control over the transformation process.

## Features

- **Bidirectional Conversion**: Transform from XML to JSON and back with high fidelity
- **Fluent API**: Clean, chainable methods for intuitive use
- **Customizable**: Extensive configuration options for controlling conversion behavior
- **Transformation Pipeline**: Apply transformations during conversion (types, formatting, etc.)
- **Cross-Platform**: Works in both browser and Node.js environments
- **Extensible**: Add custom extensions and transformations
- **TypeScript Support**: Full TypeScript definitions included

## Installation

### Node.js

```bash
npm install xjx
```

### Browser via CDN

```html
<!-- Development version -->
<script src="https://unpkg.com/xjx/dist/umd/xjx.js"></script>

<!-- Production version -->
<script src="https://unpkg.com/xjx/dist/umd/xjx.min.js"></script>
```

## Quick Start

```javascript
// Import the library
import { XJX } from 'xjx';

// Convert XML to JSON
const result = new XJX()
  .fromXml('<user id="123"><name>John Doe</name><active>true</active></user>')
  .withTransforms(
    // Convert boolean strings to actual booleans
    XJX.createBooleanTransform()
  )
  .toJson();

console.log(result);
// Output: { "user": { "@id": "123", "name": "John Doe", "active": true } }

// Convert back to XML
const xml = new XJX()
  .fromJson(result)
  .toXmlString({ prettyPrint: true });

console.log(xml);
/* Output:
<?xml version="1.0" encoding="UTF-8"?>
<user id="123">
  <name>John Doe</name>
  <active>true</active>
</user>
*/
```

## Core Concepts

XJX works by converting data into a universal intermediate format (`XNode`), applying transformations, and then outputting to the desired format. This approach provides maximum flexibility and control over the transformation process.

### Basic Flow

1. **Source**: Set the input data with `fromXml()` or `fromJson()`
2. **Transform**: Apply transformations with `withTransforms()`
3. **Output**: Get the result with `toXml()`, `toXmlString()`, `toJson()`, or `toJsonString()`

## Configuration Options

XJX provides extensive configuration options to control how conversions behave.

### Basic Configuration

```javascript
const xjx = new XJX({
  // Preservation options
  preserveNamespaces: true,    // Preserve XML namespaces
  preserveComments: true,      // Preserve XML comments
  preserveProcessingInstr: true, // Preserve XML processing instructions
  preserveCDATA: true,         // Preserve CDATA sections
  preserveTextNodes: true,     // Preserve text nodes
  preserveWhitespace: false,   // Preserve whitespace in text nodes
  preserveAttributes: true,    // Preserve XML attributes

  // High-level strategies
  highFidelity: false,         // Use high-fidelity mode (more verbose JSON)
  attributeStrategy: 'merge',  // How to handle attributes ('merge', 'prefix', 'property')
  textStrategy: 'direct',      // How to handle text content ('direct', 'property')
  namespaceStrategy: 'prefix', // How to handle namespaces ('prefix', 'property')
  arrayStrategy: 'multiple',   // When to create arrays ('multiple', 'always', 'never')
  
  // Output formatting
  formatting: {
    indent: 2,                 // Indentation spaces
    declaration: true,         // Include XML declaration
    pretty: true               // Pretty print output
  }
});
```

You can also set configuration after creating the instance:

```javascript
new XJX()
  .withConfig({
    preserveComments: false,
    attributeStrategy: 'prefix',
    formatting: { indent: 4 }
  })
  .fromXml(xmlString)
  .toJson();
```

### Configuration Details

#### JSON Attribute Strategies

- **merge**: Attributes become properties in the same object as the element's content
- **prefix**: Attributes are prefixed (default: `@`) and added to the element's object
- **property**: Attributes are grouped in a separate property (default: `$attr`)

```javascript
// XML: <user id="123">John</user>

// merge strategy
{ "user": { "id": "123", "_text": "John" } }

// prefix strategy
{ "user": { "@id": "123", "_text": "John" } }

// property strategy
{ "user": { "$attr": { "id": "123" }, "_text": "John" } }
```

#### JSON Text Strategies

- **direct**: Text content is the value of the property when there are no attributes
- **property**: Text content is always in a property (default: `_text`)

```javascript
// XML: <user>John</user>

// direct strategy
{ "user": "John" }

// property strategy
{ "user": { "_text": "John" } }
```

#### Array Strategies

- **multiple**: Create arrays only when multiple elements have the same name
- **always**: Always create arrays even for single elements
- **never**: Never create arrays, last element with same name wins

```javascript
// XML: <users><user>John</user><user>Jane</user></users>

// multiple strategy (default)
{ "users": { "user": ["John", "Jane"] } }

// always strategy
{ "users": { "user": ["John", "Jane"] } }

// never strategy
{ "users": { "user": "Jane" } } // Only last user is kept
```

## High-Fidelity Mode

For more exact round-trip conversion, use high-fidelity mode:

```javascript
const result = new XJX({ highFidelity: true })
  .fromXml(xmlString)
  .toJson();
```

High-fidelity mode preserves more information about the XML structure but produces more verbose JSON:

```javascript
// Standard mode (simple)
{
  "book": {
    "@id": "123",
    "title": "JSON Essentials",
    "author": "John Smith"
  }
}

// High-fidelity mode (verbose but preserves more structure)
{
  "book": {
    "$attr": [
      { "id": { "$val": "123" } }
    ],
    "$children": [
      { "title": { "$val": "JSON Essentials" } },
      { "author": { "$val": "John Smith" } }
    ]
  }
}
```

### Complex Namespace Handling

High-fidelity mode excels at preserving complex namespace scenarios, which can be critical for many XML applications:

```xml
<!-- XML with multiple namespaces -->
<root xmlns="http://default.namespace.com" 
      xmlns:a="http://a.namespace.com"
      xmlns:b="http://b.namespace.com">
  <element>Default namespace</element>
  <a:element>Namespace A</a:element>
  <b:element b:attr="value">Namespace B</b:element>
</root>
```

In high-fidelity mode, this namespace information is preserved:

```javascript
{
  "root": {
    "$ns": "http://default.namespace.com",
    "namespaceDeclarations": {
      "": "http://default.namespace.com",
      "a": "http://a.namespace.com",
      "b": "http://b.namespace.com"
    },
    "$children": [
      { "element": { "$val": "Default namespace" } },
      { "element": { 
          "$ns": "http://a.namespace.com", 
          "$pre": "a", 
          "$val": "Namespace A" 
        } 
      },
      { "element": { 
          "$ns": "http://b.namespace.com", 
          "$pre": "b", 
          "$attr": [
            { "attr": { 
                "$ns": "http://b.namespace.com", 
                "$pre": "b", 
                "$val": "value" 
              } 
            }
          ],
          "$val": "Namespace B" 
        } 
      }
    ]
  }
}
```

### Mixed Content Preservation

High-fidelity mode accurately preserves mixed content (elements that contain both text and child elements):

```xml
<paragraph>This is <em>emphasized</em> text with <strong>strong</strong> formatting.</paragraph>
```

In standard mode, this structure might be flattened or simplified, but high-fidelity mode preserves the exact sequence:

```javascript
{
  "paragraph": {
    "$children": [
      { "$val": "This is " },
      { "em": { "$val": "emphasized" } },
      { "$val": " text with " },
      { "strong": { "$val": "strong" } },
      { "$val": " formatting." }
    ]
  }
}
```

### Element Order Preservation

The order of elements in XML can be semantically significant. High-fidelity mode preserves this order exactly:

```xml
<document>
  <meta>Document metadata</meta>
  <title>Document Title</title>
  <section>First section</section>
  <section>Second section</section>
  <footnote>Important note</footnote>
</document>
```

In high-fidelity mode, the exact order is maintained in the `$children` array:

```javascript
{
  "document": {
    "$children": [
      { "meta": { "$val": "Document metadata" } },
      { "title": { "$val": "Document Title" } },
      { "section": { "$val": "First section" } },
      { "section": { "$val": "Second section" } },
      { "footnote": { "$val": "Important note" } }
    ]
  }
}
```

This precise ordering preservation is critical for documents where sequence matters, such as books, articles, or technical documentation.
```

## Built-in Transformations

XJX comes with several built-in transformations to modify data during conversion:

### BooleanTransform

Converts string values to boolean:

```javascript
import { XJX, createBooleanTransform } from 'xjx';

const result = new XJX()
  .fromXml('<user><active>true</active></user>')
  .withTransforms(
    createBooleanTransform({
      trueValues: ['true', 'yes', '1', 'on'],
      falseValues: ['false', 'no', '0', 'off'],
      ignoreCase: true
    })
  )
  .toJson();

// Result: { "user": { "active": true } }
```

### NumberTransform

Converts string values to numbers:

```javascript
import { XJX, createNumberTransform } from 'xjx';

const result = new XJX()
  .fromXml('<product><price>19.99</price><quantity>5</quantity></product>')
  .withTransforms(
    createNumberTransform({
      integers: true,      // Convert integers
      decimals: true,      // Convert decimals
      scientific: true,    // Convert scientific notation
      decimalSeparator: '.',
      thousandsSeparator: ','
    })
  )
  .toJson();

// Result: { "product": { "price": 19.99, "quantity": 5 } }
```

### RegexTransform

Applies regular expression replacements to values:

```javascript
import { XJX, createRegexTransform } from 'xjx';

const result = new XJX()
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

### MetadataTransform

Adds metadata to nodes:

```javascript
import { XJX, createMetadataTransform } from 'xjx';

const result = new XJX()
  .fromXml('<user><name>John</name><email>john@example.com</email></user>')
  .withTransforms(
    createMetadataTransform({
      selector: 'user',
      metadata: {
        validation: {
          required: ['name', 'email']
        }
      }
    })
  )
  .toJson({ highFidelity: true });

// Result includes metadata property with validation info
```

## Error Handling

XJX provides detailed error types for handling different kinds of errors:

```javascript
import { XJX, ValidationError, ProcessingError } from 'xjx';

try {
  const result = new XJX()
    .fromXml(malformedXml)
    .toJson();
} catch (err) {
  if (err instanceof ValidationError) {
    console.error('Validation error:', err.message);
  } else if (err instanceof ProcessingError) {
    console.error('Processing error:', err.message);
  } else {
    console.error('Unknown error:', err);
  }
}
```

## Logging

XJX includes a simple logger with configurable log levels:

```javascript
import { XJX, LogLevel } from 'xjx';

const xjx = new XJX()
  .setLogLevel(LogLevel.DEBUG);  // Detailed logging

// Or use string value
xjx.setLogLevel('warn');  // Only warnings and errors
```

## Advanced Usage

For more advanced usage, including creating custom extensions and transforms, see the [TRANSFORMS.md](./TRANSFORMS.md) document or the [EXTENSIONS.md](./EXTENSIONS.md) document.

For details on the architecture and design of XJX, see the [ARCHITECTURE.md](./ARCHITECTURE.md) document.

## License

MIT