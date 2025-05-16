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
- ✨ Multiple JSON formats (XJX format with full fidelity or standard format for natural usage)

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

### XML to JSON (XJX format)

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

### XML to Standard JSON

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

// Convert XML to Standard JSON format
const standardJson = new XJX()
  .fromXml(xml)
  .withTransforms(
    new XJX.BooleanTransform(),
    new XJX.NumberTransform()
  )
  .toStandardJson();

console.log(standardJson);
// Output:
// {
//   "user": {
//     "id": "123",
//     "name": "John Doe",
//     "email": "john@example.com",
//     "active": true,
//     "score": 85.5
//   }
// }
```

### Standard JSON to XML

```javascript
import { XJX } from 'xjx';

const standardJson = {
  "user": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com",
    "active": true,
    "score": 85.5
  }
};

// Convert Standard JSON to XML
const xml = new XJX()
  .fromObjJson(standardJson)  // Use fromObjJson for standard JSON objects
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

### XJX-formatted JSON to XML

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

// Convert XJX-formatted JSON to XML
const xml = new XJX()
  .fromJson(json)  // Automatically detects XJX format
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

### Preservation Settings

XJX uses a boundary-based approach to enforce preservation settings. This architectural design ensures consistent behavior across all conversion paths:

1. **Filtering at Input Boundaries**: All preservation settings (`preserveNamespaces`, `preserveComments`, etc.) are applied when data first enters the system - during conversion to the XNode model.

2. **XNode as Source of Truth**: The XNode model only contains features that match the user's preservation settings. For example, if `preserveComments: false`, comments won't appear in the XNode model at all.

3. **Consistent Output Conversion**: Output converters simply convert what's in the XNode model without additional filtering, resulting in consistent behavior regardless of input format.

```javascript
// Configure what to preserve
new XJX()
  .withConfig({
    preserveComments: false,    // Comments will be filtered during parsing
    preserveNamespaces: true,   // Namespaces will be preserved
    preserveAttributes: true,   // Attributes will be preserved
    preserveProcessingInstr: false // Processing instructions will be filtered
  })
  .fromXml(xmlWithComments)
  // Comments are already filtered out, so any output format
  // will consistently exclude them:
  .toXml();                    // No comments in output XML
  // OR
  .toJson();                   // No comments in output JSON
  // OR
  .toStandardJson();           // No comments in output Standard JSON
```

This approach ensures that once data is in the XNode model, its representation is consistent regardless of which output format you choose. It also simplifies the architecture by centralizing filtering logic at the system boundaries.

### JSON Formats

XJX supports two JSON formats:

1. **XJX Format**: Full-fidelity representation with preserved namespaces, CDATA, comments, etc.
2. **Standard Format**: Natural JavaScript object structure for easier integration with other libraries

You can choose the format that best suits your use case:
- Use XJX Format when you need full round-trip preservation of XML features
- Use Standard Format when working with typical JavaScript data structures

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

- **Terminal extensions** - Return a value (e.g., `toXml()`, `toJson()`, `toStandardJson()`)
- **Non-terminal extensions** - Return the XJX instance for chaining (e.g., `fromXml()`, `fromJson()`, `fromObjJson()`)

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
  .toStandardJson();      // Terminal extension
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

    // Converters section with format-specific settings
    converters: {
      // Standard JSON converter settings
      stdJson: {
        options: {
          // How to handle attributes in standard JSON
          // - 'ignore': Discard all attributes
          // - 'merge': Merge attributes with element content
          // - 'prefix': Add attributes with a prefix (e.g., '@name')
          // - 'property': Add attributes under a property (e.g., '_attrs')
          attributeHandling: 'merge',
          
          // Prefix for attributes when using 'prefix' mode
          attributePrefix: '@',
          
          // Property name for attributes when using 'property' mode
          attributePropertyName: '_attrs',
          
          // Property name for text content when there are also attributes
          textPropertyName: '_text',
          
          // Whether to always create arrays for elements with the same name
          alwaysCreateArrays: false,
          
          // Whether to preserve mixed content (text + elements)
          preserveMixedContent: true,
          
          // Whether to represent empty elements as null
          emptyElementsAsNull: false
        },
        naming: {
          // Name to use for array items when converting from JSON to XML
          arrayItem: "item"
        }
      },
      
      // XJX JSON converter settings
      xjxJson: {
        options: {
          // Remove empty nodes and properties
          compact: true
        },
        naming: {
          // Property names for XJX format
          namespace: "$ns",
          prefix: "$pre",
          attribute: "$attr",
          value: "$val",
          cdata: "$cdata",
          comment: "$cmnt",
          processingInstr: "$pi",
          target: "$trgt",
          children: "$children"
        }
      },
      
      // XML converter settings
      xml: {
        options: {
          // Include XML declaration
          declaration: true,
          
          // Format output with indentation
          prettyPrint: true,
          
          // Number of spaces for indentation
          indent: 2
        }
      }
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
- `fromJson(json)` - Set JSON object as source (auto-detects format)
- `fromXjxJson(json)` - Set XJX-formatted JSON as source
- `fromObjJson(json)` - Set standard JavaScript object as source
- `withConfig(config)` - Set configuration options
- `withTransforms(...transforms)` - Add transforms to the pipeline
- `setLogLevel(level)` - Set logger level (debug, info, warn, error, suppress)

### Terminal Extensions (Return a value)

- `toXml()` - Convert to XML string
- `toJson()` - Convert to XJX-formatted JSON
- `toStandardJson()` - Convert to standard JavaScript object
- `toJsonString()` - Convert to JSON string (using XJX format)

## Advanced Usage

### Working with Standard JSON

The standard JSON format provides a more natural JavaScript object structure:

```javascript
import { XJX } from 'xjx';

// Convert XML to standard JSON
const standardJson = new XJX()
  .fromXml(`
    <library>
      <book category="fiction">
        <title>The Hobbit</title>
        <author>J.R.R. Tolkien</author>
        <year>1937</year>
      </book>
      <book category="non-fiction">
        <title>A Brief History of Time</title>
        <author>Stephen Hawking</author>
        <year>1988</year>
      </book>
    </library>
  `)
  .withTransforms(new XJX.NumberTransform())
  .toStandardJson();

console.log(standardJson);
// Output:
// {
//   "library": {
//     "book": [
//       {
//         "category": "fiction",
//         "title": "The Hobbit",
//         "author": "J.R.R. Tolkien",
//         "year": 1937
//       },
//       {
//         "category": "non-fiction",
//         "title": "A Brief History of Time",
//         "author": "Stephen Hawking",
//         "year": 1988
//       }
//     ]
//   }
// }

// Convert standard JSON back to XML
const backToXml = new XJX()
  .fromObjJson(standardJson)
  .toXml();
```

### Configuring Standard JSON Behavior

You can customize how attributes, text and arrays are handled in standard JSON:

```javascript
import { XJX } from 'xjx';

const xml = `
<product id="123" sku="ABC-123">
  <name>Smartphone</name>
  <description>A high-end smartphone with great features</description>
  <price currency="USD">799.99</price>
</product>
`;

// Configure attribute handling
const result = new XJX()
  .withConfig({
    converters: {
      stdJson: {
        options: {
          // Use 'property' mode for attributes
          attributeHandling: 'property',
          attributePropertyName: '_attrs',
          textPropertyName: '_value'
        }
      }
    }
  })
  .fromXml(xml)
  .toStandardJson();

console.log(result);
// Output:
// {
//   "product": {
//     "_attrs": {
//       "id": "123",
//       "sku": "ABC-123"
//     },
//     "name": "Smartphone",
//     "description": "A high-end smartphone with great features",
//     "price": {
//       "_attrs": {
//         "currency": "USD"
//       },
//       "_value": "799.99"
//     }
//   }
// }

// Or use prefix mode
const prefixResult = new XJX()
  .withConfig({
    converters: {
      stdJson: {
        options: {
          attributeHandling: 'prefix',
          attributePrefix: '@'
        }
      }
    }
  })
  .fromXml(xml)
  .toStandardJson();

console.log(prefixResult);
// Output:
// {
//   "product": {
//     "@id": "123",
//     "@sku": "ABC-123",
//     "name": "Smartphone",
//     "description": "A high-end smartphone with great features",
//     "price": {
//       "@currency": "USD",
//       "_text": "799.99"
//     }
//   }
// }
```

### Custom Configuration

```javascript
import { XJX } from 'xjx';

// Create a custom configuration
const config = {
  preserveComments: true,
  preserveWhitespace: true,
  
  converters: {
    xml: {
      options: {
        prettyPrint: true,
        indent: 4
      }
    },
    xjxJson: {
      naming: {
        // Custom property names for XJX JSON representation
        value: "_value",
        children: "_children"
      }
    },
    stdJson: {
      options: {
        // Always group same-named elements into arrays
        alwaysCreateArrays: true,
        // Convert empty elements to null
        emptyElementsAsNull: true
      }
    }
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
  .toStandardJson();
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
  .toStandardJson();
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
        .toStandardJson(); // Use standard JSON for easier DOM manipulation
      
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
    .toStandardJson();
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
  converters: {
    stdJson: {
      options: {
        attributeHandling: 'merge',
        // ...
      },
      naming: {
        arrayItem: 'item'
      }
    },
    // ...
  }
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
  .toStandardJson();
```

## Documentation

- [Extensions Guide](./EXTENSIONS.md) - Learn about the extension system and how to create custom extensions
- [Transforms Guide](./TRANSFORMS.md) - Learn about the transform system and how to create custom transforms

## License

MIT