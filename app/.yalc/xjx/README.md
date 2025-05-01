# XJX - XML/JSON Transformation Library

XJX is a powerful, bidirectional XML-to-JSON and JSON-to-XML transformation library that focuses on high-fidelity conversion with customizable transformations. It works in both browser and Node.js environments.

[![npm version](https://img.shields.io/npm/v/xjx.svg)](https://www.npmjs.com/package/xjx)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

- 🔄 **Bidirectional Conversion** - Convert XML to JSON and back with high fidelity
- 🔧 **Customizable Transformations** - Add custom transformers to modify data during conversion
- 🌳 **Preserves Structure** - Maintains namespaces, CDATA, comments, and processing instructions
- 🔍 **Path-Based Targeting** - Apply transformations only to specific parts of the document
- 🧩 **Extensible** - Add functionality through a clean extension system
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
// Output: { "person": { "$val": "John Doe", "$children": [...] } }

// JSON to XML
const newXml = xjx.jsonToXml(json);
console.log(newXml);
// Output: <person>...</person>
```

## Core Features

### High-Fidelity Conversion

XJX preserves all aspects of XML, including:

- Namespaces & prefixes
- CDATA sections
- Comments
- Processing instructions
- Mixed content
- Attributes

### Configurable

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

### Transformer System

Transform data during conversion with the built-in transformer system:

```javascript
import { XJX, TransformDirection } from 'xjx';
import { BooleanTransformer, NumberTransformer } from 'xjx/transformers';

const xjx = new XJX();

// Convert "true"/"false" strings to booleans
const boolTransformer = new BooleanTransformer({
  paths: ['person.active']
});

// Convert numeric strings to numbers
const numberTransformer = new NumberTransformer({
  paths: ['person.age']
});

// Add transformers for XML to JSON direction
xjx.addValueTransformer(TransformDirection.XML_TO_JSON, boolTransformer);
xjx.addValueTransformer(TransformDirection.XML_TO_JSON, numberTransformer);

// Convert XML to JSON with transformations applied
const json = xjx.xmlToJson(xml);
console.log(json.person.active.$val); // true (boolean)
console.log(json.person.age.$val);    // 30 (number)
```

## Design Rationale

### JSON Structure

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

### Transformer API

The transformer system follows these design principles:

1. **Direction-Aware** - Each transformer can be applied in a specific direction (XML→JSON or JSON→XML)
2. **Path-Based** - Target specific nodes using path patterns
3. **Pipeline-Based** - Multiple transformers can be chained together
4. **Type-Safe** - Strong TypeScript typing for safety and better IDE support

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

### Configuration

```typescript
interface Configuration {
  // Features to preserve during transformation
  preserveNamespaces: boolean;      // Keep namespace information
  preserveComments: boolean;        // Keep comments
  preserveProcessingInstr: boolean; // Keep processing instructions
  preserveCDATA: boolean;           // Keep CDATA sections
  preserveTextNodes: boolean;       // Keep text nodes
  preserveWhitespace: boolean;      // Keep whitespace-only text nodes
  preserveAttributes: boolean;      // Keep attributes

  // Output options
  outputOptions: {
    prettyPrint: boolean;           // Format XML output
    indent: number;                 // Indentation size
    compact: boolean;               // Remove empty properties in JSON
    json: Record<string, any>;      // JSON-specific options
    xml: {
      declaration: boolean;         // Include XML declaration
    };
  };

  // Property names in the JSON representation
  propNames: {
    namespace: string;              // Default: "$ns"
    prefix: string;                 // Default: "$pre"
    attributes: string;             // Default: "$attr"
    value: string;                  // Default: "$val"
    cdata: string;                  // Default: "$cdata"
    comments: string;               // Default: "$cmnt"
    instruction: string;            // Default: "$pi"
    target: string;                 // Default: "$trgt"
    children: string;               // Default: "$children"
  };
}
```

## Transformer Examples

XJX provides four types of transformers, each focused on a specific aspect of the document structure. Here's an example of each type:

### 1. Value Transformer Example

Value transformers modify primitive values (strings, numbers, etc.) in both elements and attributes:

```javascript
import { XJX, TransformDirection } from 'xjx';
import { BaseValueTransformer, transformResult } from 'xjx/transformers';

// XML input
const xml = `
<product>
  <code>PRD-01234</code>
  <dimensions unit="cm">10x5x2</dimensions>
</product>
`;

// Custom transformer that extracts numbers from strings
class NumberExtractorTransformer extends BaseValueTransformer {
  protected transformValue(value, node, context) {
    // Only process string values
    if (typeof value !== 'string') {
      return transformResult(value);
    }
    
    // Extract numbers using a regular expression
    const numberMatch = value.match(/(\d+)/);
    if (numberMatch) {
      // Convert to number and return
      return transformResult(parseInt(numberMatch[1], 10));
    }
    
    // Return original value if no match
    return transformResult(value);
  }
}

// Create and use the transformer
const xjx = new XJX();
const numberExtractor = new NumberExtractorTransformer({
  paths: ['product.code'] // Only apply to the code element
});

// Add transformer for XML to JSON direction
xjx.addValueTransformer(TransformDirection.XML_TO_JSON, numberExtractor);

// Convert with transformation
const json = xjx.xmlToJson(xml);
console.log(json.product.code.$val); // Output: 1234 (as number)
```

**Expected Output (JSON):**
```json
{
  "product": {
    "$children": [
      {
        "code": {
          "$val": 1234  // Note: This is a number, not a string
        }
      },
      {
        "dimensions": {
          "$val": "10x5x2",
          "$attr": [
            {
              "unit": {
                "$val": "cm"
              }
            }
          ]
        }
      }
    ]
  }
}
```

**When converted back to XML:**
```xml
<product>
  <code>1234</code>
  <dimensions unit="cm">10x5x2</dimensions>
</product>
```

### 2. Attribute Transformer Example

Attribute transformers can modify, add, or remove attributes:

```javascript
import { XJX, TransformDirection } from 'xjx';
import { BaseAttributeTransformer, transformResult } from 'xjx/transformers';

// XML input
const xml = `
<product>
  <dimensions unit="cm" precision="high">10x5x2</dimensions>
  <material type="plastic" recycled="false" />
</product>
`;

// Custom transformer that standardizes units
class UnitStandardizerTransformer extends BaseAttributeTransformer {
  protected transformAttribute(name, value, node, context) {
    // Only process the "unit" attribute
    if (name !== 'unit') {
      return transformResult([name, value]);
    }
    
    // Convert to standard units
    const unitMap = {
      'cm': 'centimeters',
      'mm': 'millimeters',
      'in': 'inches',
      'ft': 'feet'
    };
    
    if (unitMap[value]) {
      // Return the standardized unit
      return transformResult([name, unitMap[value]]);
    }
    
    // Remove attributes marked as "deprecated"
    if (name === 'precision' && value === 'deprecated') {
      return transformResult([name, value], true); // true = remove attribute
    }
    
    // Return unchanged if no mapping exists
    return transformResult([name, value]);
  }
}

// Create and use the transformer
const xjx = new XJX();
const unitStandardizer = new UnitStandardizerTransformer({
  paths: ['product.dimensions']
});

// Add transformer for both directions
xjx.addAttributeTransformer(TransformDirection.XML_TO_JSON, unitStandardizer);

// Convert with transformation
const json = xjx.xmlToJson(xml);
console.log(json.product.dimensions.$attr[0].unit.$val); // Output: "centimeters"
```

**Expected Output (JSON):**
```json
{
  "product": {
    "$children": [
      {
        "dimensions": {
          "$val": "10x5x2",
          "$attr": [
            {
              "unit": {
                "$val": "centimeters"
              }
            },
            {
              "precision": {
                "$val": "high"
              }
            }
          ]
        }
      },
      {
        "material": {
          "$attr": [
            {
              "type": {
                "$val": "plastic"
              }
            },
            {
              "recycled": {
                "$val": "false"
              }
            }
          ]
        }
      }
    ]
  }
}
```

**When converted back to XML:**
```xml
<product>
  <dimensions unit="centimeters" precision="high">10x5x2</dimensions>
  <material type="plastic" recycled="false" />
</product>
```

### 3. Node Transformer Example

Node transformers work on entire elements and can transform any aspect of a node:

```javascript
import { XJX, TransformDirection } from 'xjx';
import { BaseNodeTransformer, transformResult } from 'xjx/transformers';

// XML input
const xml = `
<product>
  <title>Premium Headphones</title>
  <description>High-quality audio experience</description>
  <price>99.99</price>
  <stock>43</stock>
  <discontinued>false</discontinued>
</product>
`;

// Node transformer that restructures elements
class ProductNodeTransformer extends BaseNodeTransformer {
  protected transformNode(node, context) {
    // Copy node to avoid modifying the original
    const modifiedNode = { ...node };
    
    // Rename the "title" element to "name"
    if (node.name === 'title' && context.path.includes('product')) {
      modifiedNode.name = 'name';
    }
    
    // Add attributes to price elements
    if (node.name === 'price') {
      if (!modifiedNode.attributes) {
        modifiedNode.attributes = {};
      }
      modifiedNode.attributes.currency = 'USD';
    }
    
    // Remove discontinued products with no stock
    if (node.name === 'product') {
      // Find relevant child nodes
      const discontinued = node.children?.find(child => child.name === 'discontinued');
      const stock = node.children?.find(child => child.name === 'stock');
      
      if (discontinued?.value === 'true' && stock?.value === '0') {
        // Return with remove flag to remove this product
        return transformResult(modifiedNode, true);
      }
    }
    
    return transformResult(modifiedNode);
  }
}

// Create and use the transformer
const xjx = new XJX();
const productTransformer = new ProductNodeTransformer();

// Add transformer for XML to JSON direction
xjx.addNodeTransformer(TransformDirection.XML_TO_JSON, productTransformer);

// Convert with transformation
const json = xjx.xmlToJson(xml);
// Node "title" is now "name"
// Price element has currency="USD" attribute
```

**Expected Output (JSON):**
```json
{
  "product": {
    "$children": [
      {
        "name": {  // Note: This was renamed from "title"
          "$val": "Premium Headphones"
        }
      },
      {
        "description": {
          "$val": "High-quality audio experience"
        }
      },
      {
        "price": {
          "$val": "99.99",
          "$attr": [  // Note: This attribute was added
            {
              "currency": {
                "$val": "USD"
              }
            }
          ]
        }
      },
      {
        "stock": {
          "$val": "43"
        }
      },
      {
        "discontinued": {
          "$val": "false"
        }
      }
    ]
  }
}
```

**When converted back to XML:**
```xml
<product>
  <name>Premium Headphones</name>
  <description>High-quality audio experience</description>
  <price currency="USD">99.99</price>
  <stock>43</stock>
  <discontinued>false</discontinued>
</product>
```

Note: If the product had been discontinued with zero stock, it would have been removed entirely from the output.

### 4. Children Transformer Example

Children transformers process collections of child nodes, allowing filtering, sorting, or reorganizing:

```javascript
import { XJX, TransformDirection } from 'xjx';
import { BaseChildrenTransformer, transformResult } from 'xjx/transformers';

// XML input
const xml = `
<catalog>
  <items>
    <item id="3">Keyboard</item>
    <item id="1">Monitor</item>
    <item id="2">Mouse</item>
    <item id="5">Speakers</item>
    <item id="4">Headphones</item>
  </items>
</catalog>
`;

// Children transformer that sorts and filters
class ItemSorterTransformer extends BaseChildrenTransformer {
  protected transformChildren(children, node, context) {
    // Only process children of the "items" element
    if (node.name !== 'items') {
      return transformResult(children);
    }
    
    // Filter out items with IDs greater than 4
    const filteredChildren = children.filter(child => {
      const id = child.attributes?.id;
      if (!id) return true;
      return parseInt(id, 10) <= 4;
    });
    
    // Sort items by ID
    const sortedChildren = filteredChildren.sort((a, b) => {
      const idA = parseInt(a.attributes?.id || '0', 10);
      const idB = parseInt(b.attributes?.id || '0', 10);
      return idA - idB;
    });
    
    // For demonstration, add a new summary child
    const summaryNode = {
      name: 'summary',
      type: 1, // ELEMENT_NODE
      value: `Total items: ${sortedChildren.length}`
    };
    
    return transformResult([...sortedChildren, summaryNode]);
  }
}

// Create and use the transformer
const xjx = new XJX();
const itemSorter = new ItemSorterTransformer();

// Add transformer for XML to JSON direction
xjx.addChildrenTransformer(TransformDirection.XML_TO_JSON, itemSorter);

// Convert with transformation
const json = xjx.xmlToJson(xml);
// Items are sorted by ID (1,2,3,4)
// Item with ID 5 is filtered out
// A new summary node is added
```

**Expected Output (JSON):**
```json
{
  "catalog": {
    "$children": [
      {
        "items": {
          "$children": [
            {
              "item": {
                "$val": "Monitor",
                "$attr": [
                  {
                    "id": {
                      "$val": "1"
                    }
                  }
                ]
              }
            },
            {
              "item": {
                "$val": "Mouse",
                "$attr": [
                  {
                    "id": {
                      "$val": "2"
                    }
                  }
                ]
              }
            },
            {
              "item": {
                "$val": "Keyboard",
                "$attr": [
                  {
                    "id": {
                      "$val": "3"
                    }
                  }
                ]
              }
            },
            {
              "item": {
                "$val": "Headphones",
                "$attr": [
                  {
                    "id": {
                      "$val": "4"
                    }
                  }
                ]
              }
            },
            {
              "summary": {
                "$val": "Total items: 4"
              }
            }
          ]
        }
      }
    ]
  }
}
```

**When converted back to XML:**
```xml
<catalog>
  <items>
    <item id="1">Monitor</item>
    <item id="2">Mouse</item>
    <item id="3">Keyboard</item>
    <item id="4">Headphones</item>
    <summary>Total items: 4</summary>
  </items>
</catalog>
```

Note: The item with id="5" (Speakers) has been filtered out, the remaining items are sorted by ID, and a new summary element has been added.

### Multiple Transformers Working Together

In practice, you'll often use multiple transformers together to create complex transformations:

```javascript
// Apply multiple transformers in a specific order
xjx.addNodeTransformer(TransformDirection.XML_TO_JSON, productTransformer)
   .addAttributeTransformer(TransformDirection.XML_TO_JSON, unitStandardizer)
   .addValueTransformer(TransformDirection.XML_TO_JSON, numberExtractor)
   .addChildrenTransformer(TransformDirection.XML_TO_JSON, itemSorter);
```

The order of adding transformers matters:
1. Node transformers first (high-level structure changes)
2. Attribute transformers (attribute modifications)
3. Value transformers (data type conversions)
4. Children transformers (collection operations)

This sequence ensures that structural changes happen before detail processing.

### Creating Custom Transformers

You can create custom transformers by extending the base classes. Each transformer type works with a specific aspect of the document structure and receives relevant context information.

#### Understanding the Transform Context

All transformers receive a `TransformContext` object that provides valuable information about the current state:

```typescript
interface TransformContext {
  direction: TransformDirection;  // XML_TO_JSON or JSON_TO_XML
  nodeName: string;               // Name of the current node
  nodeType: number;               // Element, text, CDATA, etc.
  namespace?: string;             // Namespace URI if available
  prefix?: string;                // Namespace prefix if available
  path: string;                   // Dot-notation path to current node (e.g., "root.items.item[0]")
  isAttribute: boolean;           // Whether processing an attribute
  attributeName?: string;         // Name of attribute if isAttribute is true
  parent?: TransformContext;      // Reference to parent context (for traversal)
  config: Configuration;          // Reference to XJX configuration
}
```

#### Value Transformer Example

Value transformers modify primitive values like strings, numbers, and booleans:

```javascript
import { BaseValueTransformer, transformResult, TransformDirection } from 'xjx';

class UppercaseTransformer extends BaseValueTransformer {
  protected transformValue(value, node, context) {
    // Skip non-string values
    if (typeof value !== 'string') {
      return transformResult(value);
    }
    
    // Access context information
    console.log(`Processing node: ${context.nodeName}`);
    console.log(`Full path: ${context.path}`);
    console.log(`Direction: ${context.direction}`);
    
    // Handle different directions
    if (context.direction === TransformDirection.XML_TO_JSON) {
      // For XML to JSON, convert to uppercase
      return transformResult(value.toUpperCase());
    } else {
      // For JSON to XML, leave as is
      return transformResult(value);
    }
  }
}

// Usage
const uppercaseTransformer = new UppercaseTransformer({
  paths: ['person.name']
});
xjx.addValueTransformer(TransformDirection.XML_TO_JSON, uppercaseTransformer);
```

#### Attribute Transformer Example

Attribute transformers modify attribute names and values:

```javascript
import { BaseAttributeTransformer, transformResult, TransformDirection } from 'xjx';

class UnitAttributeTransformer extends BaseAttributeTransformer {
  protected transformAttribute(name, value, node, context) {
    // Add unit suffix to specific attributes
    if (name === 'width' || name === 'height') {
      // Check if value already has a unit
      if (typeof value === 'string' && !value.match(/\d+\s*(px|em|rem|%)/)) {
        // Add default unit (px)
        return transformResult([name, `${value}px`]);
      }
    }
    
    // For removing an attribute, return with the remove flag:
    if (name === 'obsolete') {
      return transformResult([name, value], true); // Will be removed
    }
    
    // For renaming an attribute:
    if (name === 'class') {
      return transformResult(['className', value]);
    }
    
    // Default: return unchanged
    return transformResult([name, value]);
  }
}
```

#### Node Transformer Example

Node transformers can modify entire nodes, including their properties:

```javascript
import { BaseNodeTransformer, transformResult, TransformDirection } from 'xjx';

class ElementRenameTransformer extends BaseNodeTransformer {
  protected transformNode(node, context) {
    // Create a copy of the node to modify
    const modifiedNode = { ...node };
    
    // Rename specific elements
    if (node.name === 'b') {
      modifiedNode.name = 'strong';
    } else if (node.name === 'i') {
      modifiedNode.name = 'em';
    }
    
    // Add/modify properties
    if (node.name === 'a' && node.attributes && node.attributes.href) {
      // Add a target attribute if it's an external link
      if (node.attributes.href.startsWith('http')) {
        if (!modifiedNode.attributes) {
          modifiedNode.attributes = {};
        }
        modifiedNode.attributes.target = '_blank';
        modifiedNode.attributes.rel = 'noopener';
      }
    }
    
    // For removing a node, return with the remove flag:
    if (node.name === 'script') {
      return transformResult(modifiedNode, true); // Will be removed
    }
    
    return transformResult(modifiedNode);
  }
}
```

#### Children Transformer Example

Children transformers work with collections of child nodes:

```javascript
import { BaseChildrenTransformer, transformResult, NodeType, TransformDirection } from 'xjx';

class ChildSortTransformer extends BaseChildrenTransformer {
  protected transformChildren(children, node, context) {
    // Only process specific elements
    if (node.name !== 'items') {
      return transformResult(children);
    }
    
    // Sort children by a specific criterion (e.g., name)
    const sortedChildren = [...children].sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });
    
    // Filter out specific node types
    const filteredChildren = sortedChildren.filter(child => 
      child.type !== NodeType.COMMENT_NODE
    );
    
    return transformResult(filteredChildren);
  }
}
```

#### The Transformer Pipeline

When a transformer is added to XJX, it becomes part of the transformation pipeline:

1. XJX parses XML into an internal `XNode` structure
2. For each node, attribute, value, or children collection:
   - The corresponding context is created
   - Each applicable transformer is called in the order it was added
   - Transformers can modify, add, or remove elements
3. The transformed structure is serialized back to XML or JSON

This pipeline approach allows for powerful, composable transformations where each transformer focuses on a specific aspect of the document.

### Path Patterns

XJX provides a powerful path syntax for targeting specific parts of the document:

#### Basic Path Patterns

- `root.items.item` - Exact path match
- `root.*.item` - Wildcard match (single level)
- `root.**.item` - Deep wildcard match (any levels)
- `root.@id` - Attribute match
- `root.items[0]` - Array index match

#### Advanced Path Examples

```javascript
// Match all paragraphs directly under description
"product.description.paragraph"

// Match any child of ratings regardless of name
"product.ratings.*"

// Match any element named "price" at any nesting level
"**.price"

// Match the "id" attribute of any item element
"product.items.item.@id"

// Match specific array indices
"product.relatedItems.item[0]" // First item only
"product.relatedItems.item[1]" // Second item only

// Combining patterns
"product.**.@id"        // Any id attribute under product
"**.item.*.@*"          // Any attribute of any child of any item

// Multiple paths
const transformer = new BooleanTransformer({
  paths: [
    "product.inStock",
    "product.options.*.available",
    "product.relatedItems.**.inStock"
  ]
});
```

#### Path Matching Implementation

The path matcher efficiently processes these patterns by breaking them into segments and using a dynamic programming approach for deep wildcards. This allows for precise targeting of transformations while maintaining good performance even with large documents.

## Extensions

XJX supports extensions to add extra functionality. Extensions are automatically loaded when imported.

### GetPath Extension

Adds a `getPath` method to safely access nested JSON properties.

```javascript
import { XJX } from 'xjx';
import 'xjx/extensions/GetPathExtension';

const xjx = new XJX();
const json = xjx.xmlToJson(xml);

// Get a value safely with fallback
const name = xjx.getPath(json, 'person.name.$val', 'Unknown');
```

### GetJsonSchema Extension

Adds a `getJsonSchema` method to generate a JSON Schema for the XML-JSON format.

```javascript
import { XJX } from 'xjx';
import 'xjx/extensions/GetJsonSchemaExtension';

const xjx = new XJX();
const schema = xjx.getJsonSchema();
```

### Creating Custom Extensions

You can create your own extensions by using the extension registry:

```javascript
import { XJX, ExtensionRegistry } from 'xjx';

// Create an extension method
function countNodes(this: XJX, json: Record<string, any>): number {
  // Implementation...
}

// Register the extension
ExtensionRegistry.registerMethod('countNodes', countNodes);

// Use TypeScript module augmentation to add type definitions
declare module 'xjx' {
  interface XJX {
    countNodes(json: Record<string, any>): number;
  }
}

// Now the method is available on XJX instances
const xjx = new XJX();
const count = xjx.countNodes(json);
```

## Advanced Usage

### Complex Transformation Example

```javascript
import { XJX, TransformDirection } from 'xjx';
import { 
  BooleanTransformer, 
  NumberTransformer, 
  StringReplaceTransformer 
} from 'xjx/transformers';

// Sample XML
const xml = `
<product>
  <id>12345</id>
  <name>Smart Watch Pro</name>
  <price>299.99</price>
  <inStock>true</inStock>
  <description>
    <paragraph>The Smart Watch Pro is our premium smartwatch offering.</paragraph>
    <paragraph>Visit https://example.com/smartwatch for more details.</paragraph>
  </description>
  <ratings>
    <quality>4.8</quality>
    <features>4.5</features>
    <value>4.2</value>
  </ratings>
</product>
`;

// Create XJX instance
const xjx = new XJX();

// 1. Boolean transformer
const boolTransformer = new BooleanTransformer({
  paths: ['product.inStock']
});

// 2. Number transformer
const numberTransformer = new NumberTransformer({
  paths: [
    'product.id', 
    'product.price',
    'product.ratings.*' 
  ]
});

// 3. URL linkifier
const urlLinkifier = new StringReplaceTransformer({
  paths: ['product.description.paragraph'],
  pattern: /(https?:\/\/[\w-]+(\.[\w-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+)/g,
  replacement: '<a href="$1">$1</a>'
});

// Add transformers
xjx.addValueTransformer(TransformDirection.XML_TO_JSON, boolTransformer)
   .addValueTransformer(TransformDirection.XML_TO_JSON, numberTransformer)
   .addValueTransformer(TransformDirection.XML_TO_JSON, urlLinkifier);

// Convert XML to JSON
const json = xjx.xmlToJson(xml);
console.log(json);

// Convert back to XML
const newXml = xjx.jsonToXml(json);
console.log(newXml);
```

### Custom Conversion Pipeline

For more advanced use cases, you can create a custom conversion pipeline:

```javascript
import { XJX, TransformDirection } from 'xjx';
import * as customTransformers from './my-transformers';

function processXmlDocument(xml, options = {}) {
  // Create XJX instance with custom config
  const xjx = new XJX({
    preserveComments: options.preserveComments || false,
    outputOptions: {
      prettyPrint: options.prettyPrint || true
    }
  });
  
  // Add transformers based on options
  if (options.convertBooleans) {
    xjx.addValueTransformer(
      TransformDirection.XML_TO_JSON, 
      new customTransformers.EnhancedBooleanTransformer()
    );
  }
  
  if (options.convertDates) {
    xjx.addValueTransformer(
      TransformDirection.XML_TO_JSON,
      new customTransformers.DateTransformer()
    );
  }
  
  // Perform conversion
  const json = xjx.xmlToJson(xml);
  
  // Additional processing
  if (options.postProcess) {
    return options.postProcess(json);
  }
  
  return json;
}
```

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

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request