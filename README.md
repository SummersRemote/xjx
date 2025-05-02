# XJX - XML/JSON Transformation Library

XJX is a powerful, bidirectional XML-to-JSON and JSON-to-XML transformation library that focuses on high-fidelity conversion with customizable transformations. It works in both browser and Node.js environments.

[![npm version](https://img.shields.io/npm/v/xjx.svg)](https://www.npmjs.com/package/xjx)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

- 🔄 **Bidirectional Conversion** - Convert XML to JSON and back with high fidelity
- 🔧 **Customizable Transformations** - Add custom transformers to modify data during conversion
- 🌳 **Preserves Structure** - Maintains namespaces, CDATA, comments, and processing instructions
- 🔍 **Type Safety** - Written in TypeScript with comprehensive type definitions
- 🌐 **Universal** - Works in both browser and Node.js environments
- 📦 **Lightweight** - Core library is small and focused

## Installation

### NPM (Node.js or webpack/Rollup/etc.)

```bash
npm install xjx
```

### Browser (UMD)

```html
<script src="https://unpkg.com/xjx/dist/xjx.min.js"></script>
<!-- Now available as global variable 'XJX' -->
```

### Browser (ES Module)

```html
<script type="module">
  import { XJX } from 'https://unpkg.com/xjx/dist/index.js';
  // Use XJX here
</script>
```

## Quick Start

```javascript
import { XJX } from 'xjx';

// Create a new XJX instance
const xjx = new XJX();

// XML to JSON
const xml = `
<person>
  <name>John Doe</name>
  <age>30</age>
  <active>true</active>
</person>
`;
const json = xjx.xmlToJson(xml);
console.log(json);
// Output: { "person": { "$children": [{ "name": { "$val": "John Doe" } }, ...] } }

// JSON to XML
const newXml = xjx.jsonToXml(json);
console.log(newXml);
// Output: <person>...</person>
```

## Configuration

Customize the conversion process to your needs:

```javascript
const xjx = new XJX({
  preserveWhitespace: false,   // Ignore whitespace-only text nodes
  preserveComments: true,      // Keep comments
  outputOptions: {
    prettyPrint: true,         // Format XML output
    indent: 2                  // Indentation spaces
  }
});
```

## JSON Structure

To maintain full XML fidelity in JSON, XJX uses a structured JSON format that preserves all XML features:

```javascript
// XML: <person id="123"><name>John</name></person>

// JSON:
{
  "person": {
    "$attr": [
      { "id": { "$val": "123" } }
    ],
    "$children": [
      { "name": { "$val": "John" } }
    ]
  }
}
```

This structure allows round-trip conversion without loss of information.

## Transformer System

Transform data during conversion with the built-in transformer system:

```javascript
import { XJX, TransformDirection } from 'xjx';
import { BooleanTransformer, NumberTransformer } from 'xjx/transformers';

const xjx = new XJX();

// Convert "true"/"false" strings to booleans
const boolTransformer = new BooleanTransformer();

// Convert numeric strings to numbers
const numberTransformer = new NumberTransformer();

// Add transformers for XML to JSON direction
xjx.addValueTransformer(TransformDirection.XML_TO_JSON, boolTransformer);
xjx.addValueTransformer(TransformDirection.XML_TO_JSON, numberTransformer);

// Convert XML to JSON with transformations applied
const json = xjx.xmlToJson(xml);
console.log(json.person.active.$val); // true (boolean)
console.log(json.person.age.$val);    // 30 (number)
```

## Built-in Transformers

XJX includes several built-in transformers:

### BooleanTransformer

Converts strings like "true", "yes", "1" to boolean values.

```javascript
const boolTransformer = new BooleanTransformer({
  trueValues: ['true', 'yes', '1', 'on', 'active'],
  falseValues: ['false', 'no', '0', 'off', 'inactive']
});
```

### NumberTransformer

Converts numeric strings to JavaScript numbers.

```javascript
const numberTransformer = new NumberTransformer({
  integers: true,   // Convert integers
  decimals: true,   // Convert decimals
  strictParsing: true  // Only convert strings that look exactly like numbers
});
```

### StringReplaceTransformer

Performs string replacements using regular expressions.

```javascript
const urlLinkifier = new StringReplaceTransformer({
  pattern: /(https?:\/\/[\w-]+(\.[\w-]+)+[\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])/g,
  replacement: '<a href="$1">$1</a>'
});
```

## Creating Custom Transformers

You can create custom transformers by extending the base classes:

### Value Transformer Example

```javascript
import { BaseValueTransformer, transformResult } from 'xjx';

class UppercaseTransformer extends BaseValueTransformer {
  protected transformValue(value, node, context) {
    // Skip non-string values
    if (typeof value !== 'string') {
      return transformResult(value);
    }
    
    // Return uppercase string
    return transformResult(value.toUpperCase());
  }
}

const uppercaseTransformer = new UppercaseTransformer();
xjx.addValueTransformer(TransformDirection.XML_TO_JSON, uppercaseTransformer);
```

### Attribute Transformer Example

```javascript
import { BaseAttributeTransformer, transformResult } from 'xjx';

class UnitAttributeTransformer extends BaseAttributeTransformer {
  protected transformAttribute(name, value, node, context) {
    // Add unit suffix to specific attributes
    if (name === 'width' || name === 'height') {
      if (typeof value === 'string' && !value.match(/\d+\s*(px|em|rem|%)/)) {
        return transformResult([name, `${value}px`]);
      }
    }
    
    // Default: return unchanged
    return transformResult([name, value]);
  }
}
```

## Additional Features

### Converting Standard JSON Objects

Use the `objectToXJX` method to convert standard JSON objects to the XJX format:

```javascript
const standardJson = {
  name: "John Doe",
  age: 30,
  contact: {
    email: "john@example.com",
    phone: "555-1234"
  }
};

// Convert to XJX format with "person" as the root element
const xjxJson = xjx.objectToXJX(standardJson, "person");
const xml = xjx.jsonToXml(xjxJson);
```

### Extensions

XJX supports extensions to add extra functionality:

#### GetPath Extension

```javascript
import { XJX } from 'xjx';
import 'xjx/extensions/GetPathExtension';

const xjx = new XJX();
const json = xjx.xmlToJson(xml);

// Get a value safely with fallback
const name = xjx.getPath(json, 'person.name.$val', 'Unknown');
```

#### GetJsonSchema Extension

```javascript
import { XJX } from 'xjx';
import 'xjx/extensions/GetJsonSchemaExtension';

const xjx = new XJX();
const schema = xjx.getJsonSchema();
```

## API Reference

### XJX Class

The main class for XML-JSON conversion and transformation.

#### Constructor

```javascript
const xjx = new XJX(config?: Partial<Configuration>);
```

#### Core Methods

| Method | Description |
|--------|-------------|
| `xmlToJson(xmlString: string): Record<string, any>` | Convert XML string to JSON |
| `jsonToXml(jsonObj: Record<string, any>): string` | Convert JSON object to XML string |
| `prettyPrintXml(xmlString: string): string` | Format XML string for readability |
| `validateXML(xmlString: string): { isValid: boolean; message?: string }` | Validate XML string |
| `objectToXJX(obj: any, root?: string \| object): Record<string, any>` | Convert standard JSON to XJX format |

#### Transformer Methods

| Method | Description |
|--------|-------------|
| `addValueTransformer(direction: TransformDirection, transformer: ValueTransformer): this` | Add a value transformer |
| `addAttributeTransformer(direction: TransformDirection, transformer: AttributeTransformer): this` | Add an attribute transformer |
| `addChildrenTransformer(direction: TransformDirection, transformer: ChildrenTransformer): this` | Add a children transformer |
| `addNodeTransformer(direction: TransformDirection, transformer: NodeTransformer): this` | Add a node transformer |
| `clearTransformers(direction?: TransformDirection): this` | Clear all transformers |

## Browser Compatibility

XJX works in all modern browsers and Node.js. For older browsers, you may need polyfills for:

- `Promise`
- `Map` and `Set`
- ES6 features

## Node.js Requirements

- Node.js 14.x or higher
- For DOM support, XJX will try to use:
  1. `jsdom` (preferred)
  2. `@xmldom/xmldom` (fallback)

Install one of these as an optional dependency:

```bash
npm install jsdom
# or
npm install @xmldom/xmldom
```

## License

MIT License - See LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request