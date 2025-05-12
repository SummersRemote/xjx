# Getting Started with XJX

XJX is a flexible XML/JSON transformation library with a fluent API. It provides powerful features for bidirectional conversion between XML and JSON formats with support for custom transformations, namespace handling, and extensive configuration options.

## Installation

### Node.js

```bash
npm install xjx
```

### Browser

```html
<!-- Via CDN -->
<script type="module">
  import { XJX } from 'https://cdn.jsdelivr.net/npm/xjx/dist/index.js';
</script>
```

Or when using a bundler (webpack, rollup, etc.):

```javascript
import { XJX } from 'xjx';
```

## Basic Usage

### XML to JSON

```javascript
import { XJX } from 'xjx';

const xml = `
<users>
  <user id="1">
    <name>John Doe</name>
    <email>john@example.com</email>
    <active>true</active>
  </user>
</users>
`;

// Simple conversion with default settings
const json = XJX.fromXml(xml).toJson();
console.log(json);
```

The resulting JSON preserves the XML structure:

```javascript
{
  "users": {
    "$children": [
      {
        "user": {
          "$attr": [
            { "id": { "$val": "1" } }
          ],
          "$children": [
            { "name": { "$val": "John Doe" } },
            { "email": { "$val": "john@example.com" } },
            { "active": { "$val": "true" } }
          ]
        }
      }
    ]
  }
}
```

### JSON to XML

```javascript
import { XJX } from 'xjx';

const json = {
  "users": {
    "$children": [
      {
        "user": {
          "$attr": [
            { "id": { "$val": "1" } }
          ],
          "$children": [
            { "name": { "$val": "John Doe" } },
            { "email": { "$val": "john@example.com" } },
            { "active": { "$val": "true" } }
          ]
        }
      }
    ]
  }
};

// Convert JSON back to XML
const xml = XJX.fromJson(json).toXml();
console.log(xml);
```

This produces:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<users>
  <user id="1">
    <name>John Doe</name>
    <email>john@example.com</email>
    <active>true</active>
  </user>
</users>
```

## The Fluent API

XJX uses a fluent API that makes transformations clear and chainable:

```javascript
// XML to JSON with transformations and custom configuration
const result = XJX.fromXml(xmlString)
  .withConfig({
    preserveWhitespace: false,
    outputOptions: {
      prettyPrint: true,
      indent: 2
    }
  })
  .toJson();
```

### Converting Data Types

By default, all values in XML are converted to strings in JSON. XJX provides transformers to convert these to appropriate types:

```javascript
import { XJX, BooleanTransform, NumberTransform } from 'xjx';

const xml = `
<data>
  <active>true</active>
  <count>42</count>
  <price>19.99</price>
</data>
`;

const json = XJX.fromXml(xml)
  .withTransforms(
    new BooleanTransform(), // Converts "true"/"false" to boolean
    new NumberTransform()   // Converts numeric strings to numbers
  )
  .toJson();

console.log(json);
// The resulting JSON will have properly typed values:
// active: true (boolean)
// count: 42 (number)
// price: 19.99 (number)
```

## Configuration Options

XJX provides extensive configuration options:

```javascript
const config = {
  // Features to preserve during transformation
  preserveNamespaces: true,    // Keep namespace information
  preserveComments: true,      // Keep XML comments
  preserveProcessingInstr: true, // Keep processing instructions
  preserveCDATA: true,         // Keep CDATA sections
  preserveTextNodes: true,     // Keep text nodes
  preserveWhitespace: false,   // Normalize whitespace
  preserveAttributes: true,    // Keep attributes

  // Output options
  outputOptions: {
    prettyPrint: true,         // Format XML output
    indent: 2,                 // Indentation spaces
    compact: true,             // Use compact JSON format
    xml: {
      declaration: true,       // Include XML declaration
    },
  },

  // Property names in the JSON representation
  propNames: {
    namespace: "$ns",          // Namespace URI
    prefix: "$pre",            // Namespace prefix
    attributes: "$attr",       // Element attributes
    value: "$val",             // Node value
    cdata: "$cdata",           // CDATA content
    comments: "$cmnt",         // Comment content
    instruction: "$pi",        // Processing instruction
    target: "$trgt",           // PI target
    children: "$children",     // Child nodes
  },
};

// Apply configuration
const result = XJX.fromXml(xml)
  .withConfig(config)
  .toJson();
```

## Configuration Management

XJX uses a simplified configuration management system:

```javascript
// Get a fresh copy of the default configuration
const defaultConfig = XJX.getConfig();

// Update the global configuration
XJX.updateConfig({
  preserveWhitespace: true,
  outputOptions: {
    indent: 4
  }
});

// Reset the global configuration to defaults
XJX.resetConfig();

// Apply configuration to a specific builder instance
const json = XJX.fromXml(xml)
  .withConfig({
    preserveComments: false
  })
  .toJson();
```

## Format-Aware Transformations

XJX now uses a format-based approach instead of direction-based:

```javascript
import { XJX, RegexTransform, FORMATS } from 'xjx';

// This transform will only apply when converting to XML
const result = XJX.fromJson(json)
  .withTransforms(
    new RegexTransform({
      pattern: /<(\w+)>/g,
      replacement: '<$1 xmlns="http://example.com">',
      format: FORMATS.XML  // Only apply when converting to XML
    })
  )
  .toXml();
```

## Quick Examples

### Pretty-Printed XML

```javascript
// Pretty-print XML with 4-space indentation
const prettyXml = XJX.fromXml(xmlString)
  .withConfig({
    outputOptions: {
      prettyPrint: true,
      indent: 4
    }
  })
  .toXml();
```

### JSON String with Custom Indentation

```javascript
// Get JSON as a formatted string with custom indentation
const jsonString = XJX.fromXml(xmlString)
  .toJsonString(4);
```

### Validating XML

```javascript
// Validate XML before processing
const validationResult = XJX.validateXml(xmlString);
if (validationResult.isValid) {
  // Process valid XML
} else {
  console.error('Invalid XML:', validationResult.message);
}
```

### Roundtrip Transformations

```javascript
// XML to XML (transformation roundtrip)
const transformedXml = XJX.fromXml(xmlString)
  .withTransforms(/* ... */)
  .toXml();

// JSON to JSON (transformation roundtrip)
const transformedJson = XJX.fromJson(jsonObject)
  .withTransforms(/* ... */)
  .toJson();
```

### Using the Improved RegexTransform

The RegexTransform has been enhanced with more flexible pattern specification and format-specific transformations:

```javascript
import { XJX, RegexTransform } from 'xjx';

// Using string-based pattern with embedded flags
const formatted = XJX.fromXml(xml)
  .withTransforms(
    new RegexTransform({
      pattern: "/world/i",  // String pattern with flags
      replacement: "World"
    })
  )
  .toXml();

// Format-specific replacement
const camelCased = XJX.fromXml(xml)
  .withTransforms(
    new RegexTransform({
      pattern: /-([a-z])/g,
      replacement: (_, letter) => letter.toUpperCase(),
      format: 'json'  // Only apply when converting to JSON
    })
  )
  .toJson();
```

### Using the Improved NumberTransform

The NumberTransform now has better support for different number formats:

```javascript
import { XJX, NumberTransform } from 'xjx';

const json = XJX.fromXml(xml)
  .withTransforms(
    new NumberTransform({
      integers: true,
      decimals: true,
      scientific: true,
      decimalSeparator: '.',
      thousandsSeparator: ','
    })
  )
  .toJson();
```

## Next Steps

- Learn about the [Core Concepts](core-concepts.md) of XJX
- Explore the [Transformation System](transformation-system.md)
- Understand how to [Extend XJX](extension-system.md)
- Discover the [Metadata System](metadata-system.md)
- Check the [API Reference](api-reference.md) for detailed information