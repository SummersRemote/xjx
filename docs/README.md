# XJX - XML/JSON Transformation Library

XJX is a modular, extensible library for converting between XML and JSON formats with precise control over the transformation process. It features a fluent API, customizable transformations, and an extensible architecture.

[![npm version](https://img.shields.io/npm/v/xjx.svg)](https://www.npmjs.com/package/xjx)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

- 🔄 Bidirectional conversion between XML and JSON
- 🔌 Extensible plugin architecture
- 🔧 Customizable transformations
- ⚡ Support for XML namespaces, CDATA, comments, and processing instructions
- 🧩 Modular design for tree-shaking
- 💻 Works in both Node.js and browser environments
- 📝 TypeScript definitions included

## Installation

### Node.js

```bash
# Using npm
npm install xjx

# Using yarn
yarn add xjx

# Using pnpm
pnpm add xjx
```

### Browser

```html
<!-- UMD build (development) -->
<script src="https://unpkg.com/xjx/dist/umd/xjx.js"></script>

<!-- UMD build (production, minified) -->
<script src="https://unpkg.com/xjx/dist/umd/xjx.min.js"></script>

<!-- ESM build (for modern browsers with ES modules support) -->
<script type="module">
  import { XJX } from 'https://unpkg.com/xjx/dist/esm/index.js';
  // Your code here
</script>
```

## Basic Usage

### XML to JSON

```javascript
import { XJX } from 'xjx';

const xml = `
<user id="123">
  <name>John Doe</name>
  <email>john@example.com</email>
  <active>true</active>
  <score>85.5</score>
</user>
`;

// Convert XML to JSON with automatic type conversion
const json = new XJX()
  .fromXml(xml)
  .withTransforms(
    new XJX.BooleanTransform(),
    new XJX.NumberTransform()
  )
  .toJson();

console.log(json);
// Output:
// {
//   "user": {
//     "$attr": [
//       { "id": { "$val": "123" } }
//     ],
//     "$children": [
//       { "name": { "$val": "John Doe" } },
//       { "email": { "$val": "john@example.com" } },
//       { "active": { "$val": true } },
//       { "score": { "$val": 85.5 } }
//     ]
//   }
// }
```

### JSON to XML

```javascript
import { XJX } from 'xjx';

const json = {
  "user": {
    "$attr": [
      { "id": { "$val": "123" } }
    ],
    "$children": [
      { "name": { "$val": "John Doe" } },
      { "email": { "$val": "john@example.com" } },
      { "active": { "$val": true } },
      { "score": { "$val": 85.5 } }
    ]
  }
};

// Convert JSON to XML with type conversion
const xml = new XJX()
  .fromJson(json)
  .withTransforms(
    new XJX.BooleanTransform(),
    new XJX.NumberTransform()
  )
  .toXml();

console.log(xml);
// Output:
// <?xml version="1.0" encoding="UTF-8"?>
// <user id="123">
//   <name>John Doe</name>
//   <email>john@example.com</email>
//   <active>true</active>
//   <score>85.5</score>
// </user>
```

## Core Concepts

### XNode

XNode is the central data model in XJX. It represents an XML node with its properties, attributes, and children. All XML and JSON data is converted to XNode before transformation.

```javascript
// Create an XNode manually
const node = new XJX.XNode('user');
node.setAttribute('id', '123');
node.addChild(new XJX.XNode('name').setTextContent('John Doe'));
```

### Transforms

Transforms are operations applied to XNode during the conversion process. They can modify values, attributes, element names, or structure.

```javascript
// Apply transforms to convert string values to appropriate types
new XJX()
  .fromXml(xml)
  .withTransforms(
    new XJX.BooleanTransform(),
    new XJX.NumberTransform(),
    new XJX.RegexTransform({
      pattern: /(\d{4})-(\d{2})-(\d{2})/,
      replacement: '$2/$3/$1'
    })
  )
  .toJson();
```

### Extensions

Extensions enhance the XJX API with additional functionality. There are two types of extensions:

- **Terminal extensions** - Return a value (e.g., `toXml()`, `toJson()`)
- **Non-terminal extensions** - Return the XJX instance for chaining (e.g., `fromXml()`, `withTransforms()`)

```javascript
// Using the built-in extensions
new XJX()
  .fromXml(xml)           // Non-terminal extension
  .withConfig({           // Non-terminal extension
    preserveComments: true
  })
  .withTransforms(        // Non-terminal extension
    new XJX.BooleanTransform()
  )
  .toJson();              // Terminal extension
```

## Configuration Options

XJX can be configured with various options to control the transformation process:

```javascript
new XJX()
  .withConfig({
    // Preservation options
    preserveNamespaces: true,       // Preserve XML namespaces
    preserveComments: true,         // Preserve XML comments
    preserveProcessingInstr: true,  // Preserve XML processing instructions
    preserveCDATA: true,            // Preserve CDATA sections
    preserveTextNodes: true,        // Preserve text nodes
    preserveWhitespace: false,      // Preserve whitespace in text nodes
    preserveAttributes: true,       // Preserve XML attributes

    // Output options
    outputOptions: {
      prettyPrint: true,            // Format output with indentation
      indent: 2,                    // Indentation spaces
      compact: true,                // Remove empty nodes/attributes
      json: {},                     // JSON-specific options
      xml: {
        declaration: true           // Include XML declaration
      }
    },

    // Property names in JSON representation
    propNames: {
      namespace: "$ns",             // Namespace URI
      prefix: "$pre",               // Namespace prefix
      attributes: "$attr",          // Attributes array
      value: "$val",                // Node value
      cdata: "$cdata",              // CDATA content
      comments: "$cmnt",            // Comment content
      instruction: "$pi",           // Processing instruction
      target: "$trgt",              // Processing instruction target
      children: "$children"         // Child nodes
    }
  });
```

## Built-in Transforms

XJX includes several built-in transforms:

### BooleanTransform

Converts string values to booleans and vice versa.

```javascript
new XJX.BooleanTransform({
  trueValues: ['true', 'yes', '1', 'on'],    // Values considered as true
  falseValues: ['false', 'no', '0', 'off'],  // Values considered as false
  ignoreCase: true                           // Ignore case when matching
})
```

### NumberTransform

Converts string values to numbers and vice versa.

```javascript
new XJX.NumberTransform({
  integers: true,                // Convert integers
  decimals: true,                // Convert decimals
  scientific: true,              // Convert scientific notation
  decimalSeparator: '.',         // Decimal separator character
  thousandsSeparator: ','        // Thousands separator character
})
```

### RegexTransform

Performs regex replacements on text values.

```javascript
new XJX.RegexTransform({
  pattern: /foo/g,          // Pattern to search for (RegExp or string)
  replacement: 'bar',       // Replacement string
  format: 'xml'             // Optional format to apply to (xml or json)
})
```

### MetadataTransform

Manages metadata on XNode objects.

```javascript
new XJX.MetadataTransform({
  selector: 'user',                // Node selector (string, RegExp, or function)
  applyToRoot: true,               // Apply to root node
  applyToAll: false,               // Apply to all nodes
  metadata: { validation: true },  // Metadata to apply
  replace: false,                  // Replace existing metadata
  removeKeys: ['temp'],            // Keys to remove
  maxDepth: 3                      // Maximum depth to apply
})
```

## Built-in Extensions (Fluent API)

XJX provides several built-in extensions for its fluent API:

### Non-terminal Extensions (Return XJX instance)

- `fromXml(xml)` - Set XML string as the source
- `fromJson(json)` - Set JSON object as the source
- `withConfig(config)` - Set configuration options
- `withTransforms(...transforms)` - Add transforms to the pipeline
- `setLogLevel(level)` - Set logger level (debug, info, warn, error, suppress)

### Terminal Extensions (Return a value)

- `toXml()` - Convert to XML string
- `toJson()` - Convert to JSON object
- `toJsonString()` - Convert to JSON string

## Advanced Usage

### Custom Configuration

```javascript
import { XJX } from 'xjx';

// Create a custom configuration
const config = {
  preserveComments: true,
  preserveWhitespace: true,
  outputOptions: {
    prettyPrint: true,
    indent: 4
  },
  propNames: {
    // Custom property names for JSON representation
    value: "_value",
    children: "_children"
  }
};

// Apply the configuration
const result = new XJX()
  .withConfig(config)
  .fromXml(xml)
  .toJson();
```

### Combining Multiple Transforms

```javascript
import { XJX, BooleanTransform, NumberTransform, RegexTransform } from 'xjx';

// Apply multiple transforms in sequence
const result = new XJX()
  .fromXml(xml)
  .withTransforms(
    // Convert boolean values
    new BooleanTransform(),
    
    // Convert numeric values
    new NumberTransform(),
    
    // Format date strings
    new RegexTransform({
      pattern: /(\d{4})-(\d{2})-(\d{2})/,
      replacement: '$2/$3/$1'
    }),
    
    // Add metadata for validation
    new MetadataTransform({
      selector: 'user',
      metadata: {
        validation: { required: ['name', 'email'] }
      }
    })
  )
  .toJson();
```

### Full Bundle

For applications that need all features, you can import the full bundle:

```javascript
// Import the full bundle with all extensions and transforms
import { XJX } from 'xjx/full';

// Now you have access to all features
const result = new XJX()
  .fromXml(xml)
  .withTransforms(
    new XJX.BooleanTransform(),
    new XJX.NumberTransform(),
    new XJX.RegexTransform({ /* ... */ }),
    new XJX.MetadataTransform({ /* ... */ })
  )
  .toJson();
```

## Browser Environment

XJX automatically detects the browser environment and uses the browser's DOM APIs. For Node.js, it will use either JSDOM (if installed) or xmldom as a fallback.

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/xjx/dist/umd/xjx.min.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const xml = document.getElementById('xml-input').value;
      
      const result = new XJX()
        .fromXml(xml)
        .withTransforms(
          new XJX.BooleanTransform(),
          new XJX.NumberTransform()
        )
        .toJson();
      
      document.getElementById('json-output').textContent = 
        JSON.stringify(result, null, 2);
    });
  </script>
</head>
<body>
  <textarea id="xml-input"><user><name>John</name></user></textarea>
  <pre id="json-output"></pre>
</body>
</html>
```

## Error Handling

XJX includes comprehensive error handling with different error types and logging:

```javascript
import { XJX, LogLevel } from 'xjx';

try {
  const result = new XJX()
    .setLogLevel(LogLevel.DEBUG)  // Set logging level
    .fromXml(invalidXml)
    .toJson();
} catch (error) {
  console.error('Error type:', error.name);
  console.error('Error message:', error.message);
  
  // Error types: ValidationError, ParseError, SerializeError,
  // TransformError, ConfigurationError, EnvironmentError
}
```

## TypeScript Support

XJX is written in TypeScript and provides comprehensive type definitions:

```typescript
import { XJX, XNode, Configuration, Transform, BooleanTransform } from 'xjx';

// Use TypeScript interfaces
const config: Configuration = {
  preserveNamespaces: true,
  // ...
};

// Create a custom transform
class CustomTransform implements Transform {
  targets = [TransformTarget.Value];
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Custom transformation logic
    return createTransformResult(transformedValue);
  }
}

// Apply transforms with type safety
const result = new XJX()
  .withConfig(config)
  .fromXml(xml)
  .withTransforms(new CustomTransform())
  .toJson();
```

## Documentation

- [Extensions Guide](./EXTENSIONS.md) - Learn about the extension system and how to create custom extensions
- [Transforms Guide](./TRANSFORMS.md) - Learn about the transform system and how to create custom transforms

## License

MIT