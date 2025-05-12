# XJX Core Concepts

XJX is built around several key architectural components that work together to provide powerful XML/JSON transformation capabilities. This document explains the core concepts and architecture of XJX.

## Architectural Overview

At a high level, XJX follows a pipeline-based architecture with clear separation of concerns:

```
┌─────────────┐    ┌───────────┐    ┌────────────┐    ┌─────────────┐
│ XML/JSON    │    │ XNode     │    │ Transform  │    │ JSON/XML    │
│ Input       │───▶│ Converter │───▶│ Pipeline   │───▶│ Converter   │───▶ Output
└─────────────┘    └───────────┘    └────────────┘    └─────────────┘
```

The key components in this architecture are:

1. **XNode** - The central data model
2. **Converters** - Transform between external formats and XNode
3. **Transforms** - Process XNode during conversion
4. **Configuration** - Configure behavior
5. **Extensions** - Add functionality

Let's explore each of these components in detail.

## XNode: The Unified Data Model

The heart of XJX is the `XNode` class, a unified representation that bridges XML and JSON. This normalized model makes transformations simpler by providing a consistent API regardless of the source or target format.

### Key Properties

```typescript
class XNode {
  // Core node properties
  public name: string;                 // Element name
  public type: number;                 // Node type (element, text, etc.)
  public value?: any;                  // Node value
  public attributes?: Record<string, any>; // Element attributes
  public children?: XNode[];           // Child nodes
  public namespace?: string;           // Namespace URI
  public prefix?: string;              // Namespace prefix
  public parent?: XNode;               // Parent node reference
  public namespaceDeclarations?: Record<string, string>; // Namespace declarations
  public isDefaultNamespace?: boolean; // Has default namespace
  
  // Metadata container
  public metadata?: Record<string, any>; // Processing metadata
  
  // Methods
  // ...
}
```

### Node Types

XNode supports various node types, defined in the `NodeType` enum:

```typescript
enum NodeType {
  ELEMENT_NODE = 1,           // Regular XML element
  ATTRIBUTE_NODE = 2,         // Attribute (rarely used directly)
  TEXT_NODE = 3,              // Text content
  CDATA_SECTION_NODE = 4,     // CDATA section
  PROCESSING_INSTRUCTION_NODE = 7, // Processing instruction
  COMMENT_NODE = 8,           // Comment
  DOCUMENT_NODE = 9           // Root document
}
```

### XNode Methods

XNode provides a rich set of methods for traversal and manipulation:

```typescript
// Finding and navigation
findChild(name: string): XNode | undefined;
findChildren(name: string): XNode[];
findByPath(path: string): XNode | undefined;
getPath(): string;

// Node manipulation
addChild(child: XNode): XNode;
removeChild(child: XNode): boolean;
setAttribute(name: string, value: any): XNode;
getAttribute(name: string): any;
removeAttribute(name: string): boolean;

// Content manipulation
getTextContent(): string;
setTextContent(text: string): XNode;
appendText(text: string): XNode;
appendCDATA(data: string): XNode;
appendComment(comment: string): XNode;

// Metadata handling
setMetadata(key: string, value: any): XNode;
getMetadata<T>(key: string, defaultValue?: T): T | undefined;
hasMetadata(key: string): boolean;
removeMetadata(key: string): boolean;

// Utilities
clone(deep: boolean = false): XNode;
getQualifiedName(): string;
```

### Example: Working with XNode

```javascript
// Create a new element node
const rootNode = XNode.createElement('root');

// Add attributes
rootNode.setAttribute('id', '1234');
rootNode.setAttribute('version', '1.0');

// Add a child element with text
const childNode = XNode.createElement('child');
childNode.setTextContent('Hello World');
rootNode.addChild(childNode);

// Add metadata
rootNode.setMetadata('processing', { timestamp: new Date().toISOString() });

// Access data
const id = rootNode.getAttribute('id'); // "1234"
const text = childNode.getTextContent(); // "Hello World"
```

## Converters: Format Transformation

Converters transform between external formats (XML, JSON) and the internal XNode model:

### Core Converter Interfaces

```typescript
// Base converter interface
interface Converter<TInput, TOutput> {
  convert(input: TInput): TOutput;
}

// Specific converter interfaces
interface XmlToXNodeConverter extends Converter<string, XNode> {}
interface JsonToXNodeConverter extends Converter<Record<string, any>, XNode> {}
interface XNodeToXmlConverter extends Converter<XNode, string> {}
interface XNodeToJsonConverter extends Converter<XNode, Record<string, any>> {}
```

### Default Implementations

XJX provides default implementations for all required converters:

- `DefaultXmlToXNodeConverter`: Parses XML into XNode
- `DefaultJsonToXNodeConverter`: Converts JSON to XNode
- `DefaultXNodeToXmlConverter`: Serializes XNode to XML
- `DefaultXNodeToJsonConverter`: Converts XNode to JSON

These converters handle all the details of format conversion, including:

- DOM parsing and serialization
- Namespace management
- Entity handling
- Attribute processing
- Special node types (CDATA, comments, processing instructions)

## Configuration System

XJX provides a comprehensive configuration system that controls conversion behavior:

### Configuration Interface

```typescript
interface Configuration {
  // Features to preserve during transformation
  preserveNamespaces: boolean;
  preserveComments: boolean;
  preserveProcessingInstr: boolean;
  preserveCDATA: boolean;
  preserveTextNodes: boolean;
  preserveWhitespace: boolean;
  preserveAttributes: boolean;

  // Output options
  outputOptions: {
    prettyPrint: boolean;
    indent: number;
    compact: boolean;
    json: Record<string, any>;
    xml: {
      declaration: boolean;
    };
  };

  // Property names in the JSON representation
  propNames: {
    namespace: string;
    prefix: string;
    attributes: string;
    value: string;
    cdata: string;
    comments: string;
    instruction: string;
    target: string;
    children: string;
  };
}
```

### Default Configuration

XJX provides sensible defaults:

```javascript
const DEFAULT_CONFIG = {
  preserveNamespaces: true,
  preserveComments: true,
  preserveProcessingInstr: true,
  preserveCDATA: true,
  preserveTextNodes: true,
  preserveWhitespace: false,
  preserveAttributes: true,

  outputOptions: {
    prettyPrint: true,
    indent: 2,
    compact: true,
    json: {},
    xml: {
      declaration: true,
    },
  },

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
```

### Configuration Management

XJX now uses a simplified configuration management approach through the `ConfigManager`:

```javascript
// Global configuration update
XJX.updateConfig({
  preserveWhitespace: true,
  outputOptions: {
    indent: 4
  }
});

// Reset global config to defaults
XJX.resetConfig();

// Instance-specific configuration
XJX.fromXml(xml)
  .withConfig({
    preserveComments: false,
    preserveWhitespace: true
  })
  .toJson();
```

The `ConfigManager` provides functions to:
1. Get default configurations
2. Merge configurations
3. Validate configurations
4. Access configuration values

## The XJX Builder

The `XjxBuilder` class implements the fluent API and coordinates the transformation pipeline:

```typescript
class XjxBuilder {
  // Builder state
  public xnode: XNode | null;
  public transforms: Transform[];
  public config: Configuration;
  public sourceFormat: FormatId | null;
  
  // Core fluent methods
  fromXml(source: string): XjxBuilder;
  fromJson(source: Record<string, any>): XjxBuilder;
  withConfig(config: Partial<Configuration>): XjxBuilder;
  withTransforms(...transforms: Transform[]): XjxBuilder;
  toXml(): string;
  toJson(): Record<string, any>;
  toJsonString(indent: number = 2): string;
  
  // Utility methods
  validateSource(): void;
  deepClone<T>(obj: T): T;
  deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T;
}
```

The builder handles:

1. Initial source parsing (XML or JSON)
2. Configuration management
3. Transform pipeline execution
4. Output generation

## Transform Pipeline

When executing transforms, XJX follows a specific pipeline:

1. Parse input (XML or JSON) into XNode
2. For each registered transform:
   - Apply transform to matching nodes
   - Update XNode structure as needed
3. Convert XNode to output format (XML or JSON)

During this process, transforms can:
- Modify node values
- Change node types
- Add or remove nodes
- Add metadata
- Filter content

XJX now uses a format-based transformation approach rather than direction-based. This means transforms receive a `targetFormat` (e.g., `FORMATS.XML` or `FORMATS.JSON`) instead of a direction, allowing for more flexible and extensible transformations.

## Error Handling

XJX includes a robust error handling system with specific error types:

```typescript
// Base error class
export class XJXError extends Error {}

// Specific error types
export class XmlToJsonError extends XJXError {}
export class JsonToXmlError extends XJXError {}
export class EnvironmentError extends XJXError {}
export class ConfigurationError extends XJXError {}
```

The `ErrorUtils` class provides standardized error creation and handling:

```typescript
// Try/catch with proper error type
ErrorUtils.try(
  () => someFunction(),
  'Error message',
  'error-type'
);

// Validation
ErrorUtils.validate(
  condition,
  'Validation failed message',
  'error-type'
);
```

## Utilities

XJX includes several utility classes:

- `DomUtils`: Cross-platform DOM operations
- `XmlUtils`: XML parsing and serialization
- `JsonUtils`: JSON manipulation
- `EntityUtils`: XML entity handling
- `NamespaceUtils`: XML namespace management
- `CommonUtils`: General utilities (deep clone, merge, etc.)
- `TransformUtils`: Transform composition and utilities

These utilities abstract platform-specific operations and provide consistent behavior across environments.

## Next Steps

Now that you understand the core concepts of XJX, learn more about:

- [The Transformation System](transformation-system.md) - How transforms work
- [Extension System](extension-system.md) - How to extend XJX
- [Metadata System](metadata-system.md) - Working with metadata
- [API Reference](api-reference.md) - Detailed API information