# XJX

[![npm version](https://badge.fury.io/js/xjx.svg)](https://badge.fury.io/js/xjx)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

XJX is a flexible XML/JSON transformation library with a fluent API. It provides robust features for converting between XML and JSON formats with support for custom transformations, preserving XML structure, and extensive configuration options.

## Features

- **Bidirectional Conversion**: Transform XML to JSON and JSON to XML
- **Fluent Builder API**: Intuitive method chaining for clean, readable code
- **Extensible Transformation System**: Create custom transformers to modify content during conversion
- **Comprehensive Node Support**: Handle elements, attributes, text, CDATA, comments, and processing instructions
- **Namespace Support**: Preserve and manipulate XML namespaces
- **Type Transformations**: Convert string values to appropriate JavaScript types (boolean, number, etc.)
- **Format Preservation**: Keep XML structure, comments, CDATA, and more in JSON
- **Extensive Configuration**: Customize output format, indentation, and more

## Installation

### Node.js

```bash
npm install xjx
```

### Browser

#### Via CDN

```html
<script type="module">
  import { XJX } from 'https://cdn.jsdelivr.net/npm/xjx/dist/index.js';
</script>
```

#### Via npm and bundlers (webpack, rollup, etc.)

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

const json = XJX.fromXml(xml).toJson();
console.log(json);
```

### JSON to XML

```javascript
import { XJX } from 'xjx';

const json = {
  users: {
    $children: [
      {
        user: {
          $attr: [
            { id: { $val: 1 } }
          ],
          $children: [
            { name: { $val: "John Doe" } },
            { email: { $val: "john@example.com" } },
            { active: { $val: true } }
          ]
        }
      }
    ]
  }
};

const xml = XJX.fromJson(json).toXml();
console.log(xml);
```

### Converting Data Types

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
    new BooleanTransform(),
    new NumberTransform()
  )
  .toJson();

console.log(json);
// Output will have "active" as boolean and "count"/"price" as numbers
```

## Fluent API

XJX provides a fluent builder API that makes transformations clear and easy to understand:

```javascript
// XML to JSON with transformations and custom configuration
const result = XJX.fromXml(xmlString)
  .withConfig({
    preserveWhitespace: false,
    outputOptions: {
      compact: true,
      prettyPrint: true
    }
  })
  .withTransforms(
    new BooleanTransform(),
    new NumberTransform(),
    new AttributeTransform({
      renameMap: { 'old-name': 'newName' }
    })
  )
  .toJson();

// JSON to XML
const xml = XJX.fromJson(jsonObject)
  .withConfig({
    outputOptions: {
      prettyPrint: true,
      indent: 2,
      xml: {
        declaration: true
      }
    }
  })
  .toXml();

// XML to XML (roundtrip with transformations)
const transformedXml = XJX.fromXml(xmlString)
  .withTransforms(/* ... */)
  .toXml();

// JSON to JSON (roundtrip with transformations)
const transformedJson = XJX.fromJson(jsonObject)
  .withTransforms(/* ... */)
  .toJson();

// Get JSON as string with custom indentation
const jsonString = XJX.fromXml(xmlString)
  .toJsonString(4);
```

## Configuration Options

XJX provides extensive configuration options:

```javascript
const config = {
  // Features to preserve during transformation
  preserveNamespaces: true,
  preserveComments: true,
  preserveProcessingInstr: true,
  preserveCDATA: true,
  preserveTextNodes: true,
  preserveWhitespace: false,
  preserveAttributes: true,

  // Output options
  outputOptions: {
    prettyPrint: true,
    indent: 2,
    compact: true,
    json: {},
    xml: {
      declaration: true,
    },
  },

  // Property names in the JSON representation
  propNames: {
    namespace: "$ns",
    prefix: "$pre",
    attributes: "$attr",
    value: "$val",
    cdata: "$cdata",
    comments: "$cmnt",
    instruction: "$pi", 
    target: "$trgt",  
    children: "$children",
  },
};

// Apply configuration
const result = XJX.fromXml(xml)
  .withConfig(config)
  .toJson();
```

## Transformers

Transformers allow you to modify content during the conversion process. XJX comes with several built-in transformers and supports custom transformers.

### Built-in Transformers

#### BooleanTransform

Converts string values to booleans.

```javascript
import { XJX, BooleanTransform } from 'xjx';

const result = XJX.fromXml(xml)
  .withTransforms(
    new BooleanTransform({
      trueValues: ['true', 'yes', '1', 'on'],
      falseValues: ['false', 'no', '0', 'off'],
      ignoreCase: true
    })
  )
  .toJson();
```

#### NumberTransform

Converts string values to numbers.

```javascript
import { XJX, NumberTransform } from 'xjx';

const result = XJX.fromXml(xml)
  .withTransforms(
    new NumberTransform({
      integers: true,
      decimals: true,
      scientific: true,
      strictParsing: true
    })
  )
  .toJson();
```

#### StringReplaceTransform

Performs string replacements using regular expressions.

```javascript
import { XJX, StringReplaceTransform } from 'xjx';

const result = XJX.fromXml(xml)
  .withTransforms(
    new StringReplaceTransform({
      pattern: /https?:\/\/\S+/g,
      replacement: '<a href="$&">$&</a>'
    })
  )
  .toXml();
```

#### AttributeTransform

Manipulates XML attributes.

```javascript
import { XJX, AttributeTransform } from 'xjx';

const result = XJX.fromXml(xml)
  .withTransforms(
    new AttributeTransform({
      renameMap: { 'old-attr': 'newAttr' },
      removeAttributes: ['internal-id', 'temp']
    })
  )
  .toXml();
```


### Creating Custom Transformers

You can create your own transformers by implementing the `Transform` interface:

```javascript
import { XJX, TransformTarget, transformResult } from 'xjx';

// Custom transformer that capitalizes text
class CapitalizeTransform {
  // Specify which node types to target
  targets = [TransformTarget.Value];
  
  transform(value, context) {
    // Only transform string values
    if (typeof value !== 'string') {
      return transformResult(value);
    }
    
    // Return capitalized value
    return transformResult(value.toUpperCase());
  }
}

// Use the custom transformer
const result = XJX.fromXml(xml)
  .withTransforms(new CapitalizeTransform())
  .toXml();
```

## Namespace Handling

XJX preserves XML namespaces in the JSON representation:

```javascript
const xml = `
<root xmlns="http://default.namespace.com" xmlns:ns="http://example.namespace.com">
  <ns:element>Content</ns:element>
</root>
`;

const json = XJX.fromXml(xml)
  .withConfig({
    preserveNamespaces: true
  })
  .toJson();

console.log(json);
```

The resulting JSON will include namespace information:

```javascript
{
  "root": {
    "$ns": "http://default.namespace.com",
    "$children": [
      {
        "element": {
          "$ns": "http://example.namespace.com",
          "$pre": "ns",
          "$val": "Content"
        }
      }
    ]
  }
}
```

When converting back to XML, namespaces are properly restored.

## Advanced Features

### Transform Utility Functions

XJX provides utility functions for working with transformers:

```javascript
import { TransformUtils, BooleanTransform, NumberTransform } from 'xjx';

// Compose multiple transforms into one
const dataTypeTransform = TransformUtils.composeTransforms(
  new BooleanTransform(),
  new NumberTransform()
);

// Create conditional transforms
const userElementTransform = TransformUtils.conditionalTransform(
  (node, context) => node.name === 'user',
  new ElementTransform({
    // Only applied to user elements
  })
);

// Create named transforms for debugging
const namedTransform = TransformUtils.namedTransform(
  'MyTransform',
  new CustomTransform()
);
```

### XML Validation

Validate XML before processing:

```javascript
const validationResult = XJX.validateXml(xmlString);
if (validationResult.isValid) {
  // Process valid XML
} else {
  console.error('Invalid XML:', validationResult.message);
}
```

### Pretty-Printing XML

Format XML with proper indentation:

```javascript
const formattedXml = XJX.prettyPrintXml(xmlString);
console.log(formattedXml);
```

## Browser Support

XJX supports modern browsers with ES6/ES2015 features:

- Chrome
- Firefox
- Safari
- Edge
- Opera

For older browsers, use a transpiler like Babel along with your bundler.

## TypeScript Support

XJX is written in TypeScript and includes complete type definitions.

```typescript
import { XJX, Transform, TransformTarget, TransformContext, TransformResult } from 'xjx';

// TypeScript interfaces for creating custom transformers
class MyTransform implements Transform {
  targets: TransformTarget[] = [TransformTarget.Value];
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Implementation
    return { value: transformedValue, remove: false };
  }
}
```


## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.