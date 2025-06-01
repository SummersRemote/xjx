# XJX API Reference

Complete API reference for the XJX library's methods, interfaces, and configuration options.

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [XNode Interface](#xnode-interface)
3. [Source Methods](#source-methods)
4. [Processing Methods](#processing-methods)
5. [Output Methods](#output-methods)
6. [Configuration Methods](#configuration-methods)
7. [Transform Functions](#transform-functions)
8. [Configuration Interface](#configuration-interface)
9. [Error Types](#error-types)

## Core Concepts

### XJX Class

The main class providing the fluent API for XML/JSON transformations.

```typescript
class XJX {
  constructor(config?: Partial<Configuration>)
}
```

### Method Types

- **Non-Terminal Methods**: Return `XJX` instance for chaining
- **Terminal Methods**: Return processed values and end the chain

### XNode

Internal tree representation used for all document processing. Provides a unified interface for XML and JSON data.

## XNode Interface

```typescript
interface XNode {
  name: string;                               // Element/node name
  type: number;                              // NodeType enum value
  value?: any;                              // Node content/value
  attributes?: Record<string, any>;         // Element attributes
  children?: XNode[];                       // Child nodes
  parent?: XNode;                          // Parent reference
  namespace?: string;                       // Namespace URI
  prefix?: string;                         // Namespace prefix
  namespaceDeclarations?: Record<string, string>; // xmlns declarations
  isDefaultNamespace?: boolean;            // Default namespace flag
  metadata?: Record<string, any>;          // Custom metadata
}
```

### NodeType Enum

```typescript
enum NodeType {
  ELEMENT_NODE = 1,
  TEXT_NODE = 3,
  CDATA_SECTION_NODE = 4,
  PROCESSING_INSTRUCTION_NODE = 7,
  COMMENT_NODE = 8,
  DOCUMENT_NODE = 9
}
```

## Source Methods

Methods that set the source document for processing. All source methods are non-terminal.

### fromXml()

Parse XML string as the source document.

**Signature:**
```typescript
fromXml(xml: string, beforeFn?: NodeCallback, afterFn?: NodeCallback): XJX
```

**Parameters:**
- `xml` (string): XML string to parse
- `beforeFn` (optional): Callback function called before processing each node
- `afterFn` (optional): Callback function called after processing each node

**Returns:** XJX instance for chaining

**Example:**
```javascript
const result = new XJX()
  .fromXml('<book><title>Guide</title></book>')
  .toJson();

// With callbacks
new XJX()
  .fromXml(
    xml,
    node => console.log('Processing:', node.name),
    node => console.log('Processed:', node.name)
  )
  .toJson();
```

### fromJson()

Parse JSON object as the source document.

**Signature:**
```typescript
fromJson(json: JsonValue, options?: JsonOptions, beforeFn?: NodeCallback, afterFn?: NodeCallback): XJX
```

**Parameters:**
- `json` (JsonValue): JSON object or array to parse
- `options` (optional): JSON conversion options
- `beforeFn` (optional): Callback function called before processing each node
- `afterFn` (optional): Callback function called after processing each node

**JsonOptions:**
```typescript
interface JsonOptions {
  highFidelity?: boolean;
  formatting?: Partial<Configuration['formatting']>;
}
```

**Returns:** XJX instance for chaining

**Example:**
```javascript
const json = { book: { title: "Guide", id: "123" } };

const result = new XJX()
  .fromJson(json)
  .toXmlString();

// Force high-fidelity format
new XJX()
  .fromJson(json, { highFidelity: true })
  .toXmlString();
```

### fromXnode()

Use XNode array as the source document.

**Signature:**
```typescript
fromXnode(nodes: XNode | XNode[], beforeFn?: NodeCallback, afterFn?: NodeCallback): XJX
```

**Parameters:**
- `nodes` (XNode | XNode[]): Single XNode or array of XNodes
- `beforeFn` (optional): Callback function called before processing each node
- `afterFn` (optional): Callback function called after processing each node

**Returns:** XJX instance for chaining

**Example:**
```javascript
import { createElement, createTextNode, addChild } from 'xjx';

const node = createElement('title');
addChild(node, createTextNode('Guide'));

const result = new XJX()
  .fromXnode([node])
  .toJson();
```

## Processing Methods

Methods that transform or filter the document tree. All processing methods are non-terminal.

### filter()

Keep nodes that match the predicate while preserving document hierarchy.

**Signature:**
```typescript
filter(predicate: (node: XNode) => boolean): XJX
```

**Parameters:**
- `predicate` (function): Function that returns true for nodes to keep

**Returns:** XJX instance for chaining

**Example:**
```javascript
// Keep only items with price > 50
const result = new XJX()
  .fromXml(xml)
  .filter(node => {
    if (node.name === 'item' && node.attributes?.price) {
      return parseInt(node.attributes.price) > 50;
    }
    return true; // Keep non-item nodes for structure
  })
  .toJson();
```

### map()

Transform every node in the document tree.

**Signature:**
```typescript
map(transformer: (node: XNode) => XNode | null): XJX
```

**Parameters:**
- `transformer` (function): Function that transforms each node. Return null to remove nodes.

**Returns:** XJX instance for chaining

**Example:**
```javascript
import { toNumber } from 'xjx';

// Convert price values to numbers
const result = new XJX()
  .fromXml(xml)
  .map(node => {
    if (node.name === 'price' && node.value) {
      node.value = toNumber()(node.value);
    }
    return node;
  })
  .toJson();

// Remove comment nodes
new XJX()
  .fromXml(xml)
  .map(node => node.type === NodeType.COMMENT_NODE ? null : node)
  .toXmlString();
```

### select()

Collect nodes that match the predicate into a flat list (no hierarchy).

**Signature:**
```typescript
select(predicate: (node: XNode) => boolean): XJX
```

**Parameters:**
- `predicate` (function): Function that returns true for nodes to collect

**Returns:** XJX instance for chaining

**Example:**
```javascript
// Select all available books (flattened)
const result = new XJX()
  .fromXml(xml)
  .select(node => 
    node.name === 'book' && 
    node.attributes?.available === 'true'
  )
  .toJson();
// Result: { results: [book1, book2, ...] } - no section structure
```

## Output Methods

Methods that convert the processed document to output formats. All output methods are terminal.

### toXml()

Convert to XML DOM Document.

**Signature:**
```typescript
toXml(): Document
```

**Returns:** DOM Document object

**Example:**
```javascript
const doc = new XJX()
  .fromJson(json)
  .toXml();

console.log(doc.documentElement.nodeName);
```

### toXmlString()

Convert to XML string.

**Signature:**
```typescript
toXmlString(options?: XmlSerializationOptions): string
```

**XmlSerializationOptions:**
```typescript
interface XmlSerializationOptions {
  prettyPrint?: boolean;
  indent?: number;
  declaration?: boolean;
}
```

**Returns:** XML string

**Example:**
```javascript
const xml = new XJX()
  .fromJson(json)
  .toXmlString();

// With custom formatting
const formatted = new XJX()
  .fromJson(json)
  .toXmlString({
    prettyPrint: true,
    indent: 4,
    declaration: true
  });
```

### toJson()

Convert to JSON object.

**Signature:**
```typescript
toJson(options?: JsonOptions): JsonValue
```

**Parameters:**
- `options` (optional): JSON conversion options

**Returns:** JSON object or array

**Example:**
```javascript
const json = new XJX()
  .fromXml(xml)
  .toJson();

// High-fidelity conversion
const hiFiJson = new XJX()
  .fromXml(xml)
  .toJson({ highFidelity: true });
```

### toJsonString()

Convert to JSON string.

**Signature:**
```typescript
toJsonString(options?: JsonOptions & { indent?: number }): string
```

**Parameters:**
- `options` (optional): JSON conversion options plus indent setting

**Returns:** JSON string

**Example:**
```javascript
const jsonString = new XJX()
  .fromXml(xml)
  .toJsonString({ indent: 2 });
```

### toXnode()

Convert to XNode array for further processing.

**Signature:**
```typescript
toXnode(): XNode[]
```

**Returns:** Array of XNode objects

**Example:**
```javascript
const nodes = new XJX()
  .fromXml(xml)
  .filter(node => node.name === 'item')
  .toXnode();

// Continue processing
const result = new XJX()
  .fromXnode(nodes)
  .map(node => ({ ...node, processed: true }))
  .toJson();
```

### reduce()

Aggregate all nodes in the document to a single value.

**Signature:**
```typescript
reduce<T>(reducer: (accumulator: T, node: XNode) => T, initialValue: T): T
```

**Parameters:**
- `reducer` (function): Function that accumulates values from nodes
- `initialValue` (T): Initial value for the accumulator

**Returns:** Final accumulated value of type T

**Example:**
```javascript
// Count all elements
const elementCount = new XJX()
  .fromXml(xml)
  .reduce((count, node) => {
    return node.type === NodeType.ELEMENT_NODE ? count + 1 : count;
  }, 0);

// Sum all prices
const totalPrice = new XJX()
  .fromXml(xml)
  .reduce((total, node) => {
    if (node.name === 'price' && node.value) {
      return total + parseFloat(node.value);
    }
    return total;
  }, 0);
```

## Configuration Methods

Methods that modify processing behavior. All configuration methods are non-terminal.

### withConfig()

Apply configuration settings.

**Signature:**
```typescript
withConfig(config: Partial<Configuration>): XJX
```

**Parameters:**
- `config` (Partial<Configuration>): Configuration options to apply

**Returns:** XJX instance for chaining

**Example:**
```javascript
const result = new XJX()
  .withConfig({
    preserveComments: false,
    strategies: { attributeStrategy: 'prefix' }
  })
  .fromXml(xml)
  .toJson();
```

### withLogLevel()

Set logging level for debugging.

**Signature:**
```typescript
withLogLevel(level: LogLevel | string): XJX
```

**Parameters:**
- `level` (LogLevel | string): Log level ('debug', 'info', 'warn', 'error', 'none')

**Returns:** XJX instance for chaining

**Example:**
```javascript
import { LogLevel } from 'xjx';

const result = new XJX()
  .withLogLevel(LogLevel.DEBUG)
  .fromXml(xml)
  .toJson();

// Or with string
new XJX().withLogLevel('debug');
```

### withRoot()

Replace the current root element with a new one.

**Signature:**
```typescript
withRoot(root: string | XNode): XJX
```

**Parameters:**
- `root` (string | XNode): New root element name or XNode object

**Returns:** XJX instance for chaining

**Example:**
```javascript
// Create new root with string name
const result = new XJX()
  .withRoot('newRoot')
  .fromXml(xml)
  .toJson();

// Use existing XNode as root
const customRoot = createElement('customRoot');
new XJX()
  .withRoot(customRoot)
  .fromXml(xml)
  .toJson();
```

### flatten()

Flatten the structure under the current root element.

**Signature:**
```typescript
flatten(options?: FlattenOptions): XJX
```

**FlattenOptions:**
```typescript
interface FlattenOptions {
  selectChild?: (node: XNode) => boolean;
  extractValues?: boolean;
}
```

**Parameters:**
- `options` (optional): Flattening options

**Returns:** XJX instance for chaining

**Example:**
```javascript
// Flatten all children
const result = new XJX()
  .fromXml(xml)
  .flatten()
  .toJson();

// Flatten specific children and extract values
new XJX()
  .fromXml(xml)
  .flatten({
    selectChild: node => node.name === 'item',
    extractValues: true
  })
  .toJson();
```

## Transform Functions

Functions for transforming values within `map()` operations.

### toNumber()

Convert string values to numbers.

**Signature:**
```typescript
toNumber(options?: NumberOptions): (value: any) => any
```

**NumberOptions:**
```typescript
interface NumberOptions {
  precision?: number;
  decimalSeparator?: string;
  thousandsSeparator?: string;
  integers?: boolean;
  decimals?: boolean;
  scientific?: boolean;
}
```

**Returns:** Transform function

**Example:**
```javascript
import { toNumber } from 'xjx';

new XJX()
  .fromXml(xml)
  .map(node => {
    if (node.name === 'price' && node.value) {
      node.value = toNumber({ precision: 2 })(node.value);
    }
    return node;
  })
  .toJson();
```

### toBoolean()

Convert string values to booleans.

**Signature:**
```typescript
toBoolean(options?: BooleanOptions): (value: any) => any
```

**BooleanOptions:**
```typescript
interface BooleanOptions {
  trueValues?: string[];
  falseValues?: string[];
  ignoreCase?: boolean;
  trueString?: string;
  falseString?: string;
}
```

**Returns:** Transform function

**Example:**
```javascript
import { toBoolean } from 'xjx';

const boolTransform = toBoolean({
  trueValues: ['yes', 'Y', '1'],
  falseValues: ['no', 'N', '0']
});

new XJX()
  .fromXml(xml)
  .map(node => {
    if (node.name === 'active' && node.value) {
      node.value = boolTransform(node.value);
    }
    return node;
  })
  .toJson();
```

### regex()

Apply regular expression transformations.

**Signature:**
```typescript
regex(pattern: RegExp | string, replacement: string, options?: RegexOptions): (value: any) => any
```

**Parameters:**
- `pattern` (RegExp | string): Regular expression pattern or string pattern
- `replacement` (string): Replacement string (can use capture groups)
- `options` (optional): Transform options

**Returns:** Transform function

**Example:**
```javascript
import { regex } from 'xjx';

// Remove non-digits
const digitsOnly = regex(/[^\d]/g, '');

// Use string pattern with flags
const normalize = regex('/\\s+/g', ' ');

new XJX()
  .fromXml(xml)
  .map(node => {
    if (node.name === 'phone' && node.value) {
      node.value = digitsOnly(node.value);
    }
    return node;
  })
  .toJson();
```

### compose()

Combine multiple transforms into a single function.

**Signature:**
```typescript
compose(...transforms: Transform[]): Transform
```

**Parameters:**
- `...transforms` (Transform[]): Transform functions to compose

**Returns:** Composed transform function

**Example:**
```javascript
import { compose, regex, toNumber } from 'xjx';

const processPrice = compose(
  regex(/[^\d.]/g, ''),     // Remove currency symbols
  toNumber({ precision: 2 }) // Convert to number with 2 decimals
);

new XJX()
  .fromXml(xml)
  .map(node => {
    if (node.name === 'price' && node.value) {
      node.value = processPrice(node.value);
    }
    return node;
  })
  .toJson();
```

## Configuration Interface

```typescript
interface Configuration {
  // Preservation settings
  preserveNamespaces: boolean;
  preserveComments: boolean;
  preserveProcessingInstr: boolean;
  preserveCDATA: boolean;
  preserveTextNodes: boolean;
  preserveWhitespace: boolean;
  preserveAttributes: boolean;
  preservePrefixedNames: boolean;

  // Transformation strategies
  strategies: {
    highFidelity: boolean;
    attributeStrategy: 'merge' | 'prefix' | 'property';
    textStrategy: 'direct' | 'property';
    namespaceStrategy: 'prefix' | 'property';
    arrayStrategy: 'multiple' | 'always' | 'never';
    emptyElementStrategy: 'object' | 'null' | 'string' | 'remove';
    mixedContentStrategy: 'preserve' | 'merge';
  };

  // Property names (for high-fidelity format)
  properties: {
    attribute: string;      // Default: "$attr"
    value: string;         // Default: "$val"
    namespace: string;     // Default: "$ns"
    prefix: string;        // Default: "$pre"
    cdata: string;         // Default: "$cdata"
    comment: string;       // Default: "$cmnt"
    processingInstr: string; // Default: "$pi"
    target: string;        // Default: "$trgt"
    children: string;      // Default: "$children"
  };

  // Array configuration
  arrays: {
    forceArrays: string[];
    defaultItemName: string;
    itemNames: Record<string, string>;
  };

  // Output formatting
  formatting: {
    indent: number;
    declaration: boolean;
    pretty: boolean;
  };

  // Functional operations
  fragmentRoot: string | XNode;
}
```

## Error Types

```typescript
class XJXError extends Error {
  constructor(message: string, details?: any);
}

class ValidationError extends XJXError {
  constructor(message: string, details?: any);
}

class ProcessingError extends XJXError {
  constructor(message: string, source?: any);
}
```

**Example:**
```javascript
import { ValidationError, ProcessingError } from 'xjx';

try {
  const result = new XJX().fromXml('<invalid>').toJson();
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Validation failed:', error.message);
  } else if (error instanceof ProcessingError) {
    console.log('Processing failed:', error.message);
  }
}
```