# XJX Library Design Document

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Core Components](#core-components)
- [API Design](#api-design)
- [Method Call Chains](#method-call-chains)
- [Class Hierarchy](#class-hierarchy)
- [Type System](#type-system)
- [Transformation Pipeline](#transformation-pipeline)
- [Registry System](#registry-system)
- [Extension Mechanism](#extension-mechanism)
- [Error Handling](#error-handling)
- [Implementation Details](#implementation-details)
- [Performance Considerations](#performance-considerations)
- [Browser and Node.js Compatibility](#browser-and-nodejs-compatibility)

## Architecture Overview

XJX implements a modular architecture with the following high-level components:

1. **Core API (XJX class)** - The public API exposed to users
2. **Converters** - Handle the conversion between XML and JSON formats
3. **Transformer System** - Allows customization of the conversion process
4. **Configuration System** - Manages conversion settings
5. **Utilities** - Shared helper functions
6. **Registry System** - Centralized management of components and extensions
7. **Adapters** - Environment-specific implementations (browser/Node.js)

The architecture employs several design patterns:

- **Singleton Pattern** - Used for configuration and utilities
- **Service Locator Pattern** - Implemented through the registry system
- **Strategy Pattern** - Used in the transformer system
- **Builder Pattern** - Used for XJX configuration
- **Adapter Pattern** - For DOM environment abstraction

### Dependency Graph

```
XJX
├── ConfigProvider
├── TransformerManager
├── TransformationService
├── XmlToJsonConverter
│   ├── XmlUtil
│   ├── NamespaceUtil
│   └── XmlEntityHandler
├── JsonToXmlConverter
│   ├── JsonUtil
│   ├── NamespaceUtil
│   └── XmlEntityHandler
├── XmlUtil
├── JsonUtil
└── UnifiedRegistry
```

## Core Components

### XJX Class

The `XJX` class serves as the main entry point for the library. It:

- Initializes the configuration
- Creates instances of services and utilities
- Exposes the public API
- Handles extension registration
- Manages resource cleanup

```typescript
class XJX {
  // Core components
  private config: Configuration;
  private transformerManager: TransformerManager;
  private transformationService: TransformationService;
  private xmlToJsonConverter: XmlToJsonConverter;
  private jsonToXmlConverter: JsonToXmlConverter;
  private xmlUtil: XmlUtil;
  private jsonUtil: JsonUtil;
  
  // Public API methods...
}
```

### Converters

Two main converter classes handle the transformation between formats:

1. **XmlToJsonConverter** - Handles XML to JSON conversion
   - Parses XML to DOM
   - Converts DOM to intermediate XNode
   - Applies transformations
   - Converts XNode to JSON

2. **JsonToXmlConverter** - Handles JSON to XML conversion
   - Converts JSON to intermediate XNode
   - Applies transformations
   - Converts XNode to DOM
   - Serializes DOM to XML string

Both converters inherit from a shared `BaseConverter` class that provides common functionality.

### Transformation System

The transformation system consists of:

1. **TransformationService** - Orchestrates the transformation process
2. **TransformerManager** - Manages transformer registration and execution
3. **Transformer Interfaces** - Define transformer contracts
4. **Base Transformer Classes** - Provide common functionality for custom transformers
5. **Built-in Transformers** - Standard transformers for common use cases

### Configuration System

The configuration system is built around:

1. **Configuration Interface** - Defines the configuration structure
2. **ConfigProvider** - Singleton for centralized configuration management
3. **DEFAULT_CONFIG** - Default configuration values

### Utilities

The library includes several utility classes:

1. **XmlUtil** - XML-related utilities
2. **JsonUtil** - JSON-related utilities
3. **XmlEntityHandler** - XML entity handling
4. **NamespaceUtil** - XML namespace processing
5. **TransformUtil** - Transformation context creation

### DOM Adapter

The `DOMAdapter` abstracts DOM operations for both browser and Node.js environments:

- Browser: Uses the native DOM implementation
- Node.js: Uses either jsdom or xmldom

## API Design

### Public API

The XJX library provides these main API categories:

1. **Core conversion methods**
   - `xmlToJson(xmlString: string): Record<string, any>`
   - `jsonToXml(jsonObj: Record<string, any>): string`
   - `objectToXJX(obj: any, root?: string | Record<string, any>): Record<string, any>`

2. **Configuration methods**
   - `getConfig(): Configuration`
   - `setConfig(options: Partial<Configuration>): this`

3. **Helper methods**
   - `prettyPrintXml(xmlString: string): string`
   - `validateXML(xmlString: string): { isValid: boolean; message?: string }`
   - `cleanup(): void`

4. **Transformer registration methods**
   - `addValueTransformer(direction: TransformDirection, transformer: ValueTransformer): this`
   - `addAttributeTransformer(direction: TransformDirection, transformer: AttributeTransformer): this`
   - `addChildrenTransformer(direction: TransformDirection, transformer: ChildrenTransformer): this`
   - `addNodeTransformer(direction: TransformDirection, transformer: NodeTransformer): this`
   - `clearTransformers(direction?: TransformDirection): this`

5. **Extension methods** (added dynamically)
   - `getPath(obj: Record<string, any>, path: string, fallback?: any): any`
   - `getJsonSchema(): Record<string, any>`

### Internal API

The internal API is organized around these interfaces:

1. **Transformer interfaces**
   - `ValueTransformer` - Transforms primitive values
   - `AttributeTransformer` - Transforms attributes
   - `ChildrenTransformer` - Transforms child nodes
   - `NodeTransformer` - Transforms entire nodes

2. **Configuration**
   - `Configuration` - Complete configuration structure
   - `ConfigProvider` - Configuration management service

3. **Conversion pipeline**
   - `XNode` - Intermediate node representation
   - `TransformContext` - Context for transformation operations
   - `TransformResult` - Result type for transformations

4. **Registry**
   - `UnifiedRegistry` - Registration and retrieval of components

## Method Call Chains

### XML to JSON Conversion

The call chain for the `xmlToJson` method:

```
XJX.xmlToJson(xmlString)
├── XmlToJsonConverter.convert(xmlString)
│   ├── XmlUtil.parseXml(xmlString) -> DOM Document
│   ├── BaseConverter.domToXNode(element) -> XNode
│   ├── BaseConverter.createRootContext() -> TransformContext
│   ├── BaseConverter.applyTransformations(xnode, context) -> TransformContext
│   │   └── TransformationService.applyTransformations(node, context)
│   │       ├── TransformerManager.applyNodeTransformers()
│   │       ├── TransformerManager.applyValueTransformers()
│   │       ├── TransformerManager.applyAttributeTransformers()
│   │       └── TransformerManager.applyChildrenTransformers()
│   └── XmlToJsonConverter.xnodeToJson(transformedNode) -> JSON
└── return jsonObj
```

### JSON to XML Conversion

The call chain for the `jsonToXml` method:

```
XJX.jsonToXml(jsonObj)
├── JsonToXmlConverter.convert(jsonObj)
│   ├── BaseConverter.jsonToXNode(jsonObj) -> XNode
│   ├── BaseConverter.createRootContext() -> TransformContext
│   ├── BaseConverter.applyTransformations(xnode, context) -> TransformContext
│   │   └── TransformationService.applyTransformations(node, context)
│   │       ├── TransformerManager.applyNodeTransformers()
│   │       ├── TransformerManager.applyValueTransformers()
│   │       ├── TransformerManager.applyAttributeTransformers()
│   │       └── TransformerManager.applyChildrenTransformers()
│   ├── JsonToXmlConverter.xnodeToDom(transformedNode) -> DOM Element
│   ├── JsonToXmlConverter.handleRootElement(doc, element)
│   └── JsonToXmlConverter.serializeAndFormatXml(doc) -> XML string
└── return xmlString
```

### Adding a Transformer

The call chain for the `addValueTransformer` method:

```
XJX.addValueTransformer(direction, transformer)
├── TransformerManager.addValueTransformer(direction, transformer)
│   └── Map<TransformDirection, ValueTransformer[]>.get(direction).push(transformer)
└── return this
```

## Class Hierarchy

### Core Classes

```
XJX
  ↑
  ├── ConfigProvider (singleton)
  │
  ├── TransformerManager
  │     ↑
  │     └── ValueTransformer, AttributeTransformer, ChildrenTransformer, NodeTransformer (interfaces)
  │
  ├── TransformationService
  │     ↑
  │     └── TransformUtil
  │
  ├── BaseConverter
  │     ↑
  │     ├── XmlToJsonConverter
  │     └── JsonToXmlConverter
  │
  ├── XmlUtil
  │     ↑
  │     ├── XmlEntityHandler (singleton)
  │     └── NamespaceUtil (singleton)
  │
  └── JsonUtil
```

### Transformer Classes

```
ValueTransformer (interface)
  ↑
  └── BaseValueTransformer (abstract)
        ↑
        ├── BooleanTransformer
        ├── NumberTransformer
        └── StringReplaceTransformer

AttributeTransformer (interface)
  ↑
  └── BaseAttributeTransformer (abstract)

ChildrenTransformer (interface)
  ↑
  └── BaseChildrenTransformer (abstract)

NodeTransformer (interface)
  ↑
  └── BaseNodeTransformer (abstract)
```

### Error Classes

```
Error
  ↑
  └── XJXError
        ↑
        ├── XmlToJsonError
        ├── JsonToXmlError
        ├── EnvironmentError
        └── ConfigurationError
```

## Type System

### Core Types

```typescript
// DOM node types as an enum
export enum NodeType {
    ELEMENT_NODE = 1,
    ATTRIBUTE_NODE = 2,
    TEXT_NODE = 3, 
    CDATA_SECTION_NODE = 4,
    PROCESSING_INSTRUCTION_NODE = 7,
    COMMENT_NODE = 8,
    DOCUMENT_NODE = 9
}

// Direction of transformation
export enum TransformDirection {
  XML_TO_JSON = 'xml-to-json',
  JSON_TO_XML = 'json-to-xml'
}

// Context provided during transformations
export interface TransformContext {
  // Core transformation info
  direction: TransformDirection;
  
  // Node information
  nodeName: string;
  nodeType: number;
  namespace?: string;
  prefix?: string;
  
  // Structure information
  path: string;
  isAttribute: boolean;
  attributeName?: string;
  
  // Parent context (creates a chain)
  parent?: TransformContext;
  
  // Configuration reference
  config: Configuration;
}

// Internal node representation for transformations
export interface XNode {
  name: string;
  type: NodeType;
  value?: any;
  attributes?: Record<string, any>;
  children?: XNode[];
  namespace?: string;
  prefix?: string;
  
  // Enhanced namespace handling
  namespaceDeclarations?: Record<string, string>;
  isDefaultNamespace?: boolean;
  parent?: XNode;
}

// Result of a transformation operation
export interface TransformResult<T> {
  // The transformed value/node/etc.
  value: T;
  
  // Whether the value should be removed
  remove?: boolean;
}
```

### JSON Types

```typescript
// Basic JSON primitive types
export type JSONPrimitive = string | number | boolean | null;

// JSON array type (recursive definition)
export type JSONArray = JSONValue[];

// JSON object type (recursive definition)
export interface JSONObject {
  [key: string]: JSONValue;
}

// Combined JSON value type that can be any valid JSON structure
export type JSONValue = JSONPrimitive | JSONArray | JSONObject;

// Type for XML-in-JSON structure based on the library's configuration
export interface XMLJSONNode {
  [tagName: string]: XMLJSONElement;
}

// Structure of an XML element in JSON representation
export interface XMLJSONElement {
  // These fields will match the propNames in Configuration
  [key: string]: JSONValue | XMLJSONNode[];
}
```

### Configuration Types

```typescript
// Configuration interface for the library
export interface Configuration {
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

### Transformer Types

```typescript
// Value transformer interface for primitive values
export interface ValueTransformer {
  transform(value: any, node: XNode, context: TransformContext): TransformResult<any>;
}

// Attribute transformer interface
export interface AttributeTransformer {
  transform(name: string, value: any, node: XNode, context: TransformContext): TransformResult<[string, any]>;
}

// Children transformer interface
export interface ChildrenTransformer {
  transform(children: XNode[], node: XNode, context: TransformContext): TransformResult<XNode[]>;
}

// Node transformer interface
export interface NodeTransformer {
  transform(node: XNode, context: TransformContext): TransformResult<XNode>;
}
```

## Transformation Pipeline

The transformation pipeline is the core of the XJX library. It consists of several stages:

### 1. Parse Input

- **XML to JSON**: Parse XML string to DOM
- **JSON to XML**: Validate JSON structure

### 2. Convert to Intermediate Format

- **XML to JSON**: DOM to XNode
- **JSON to XML**: JSON to XNode

### 3. Apply Transformations

The transformation process follows this order:

1. **Node transformers** - Applied to the node itself (can replace or remove the node)
2. **Value transformers** - Applied to node values and attribute values
3. **Attribute transformers** - Applied to each attribute name and value
4. **Children transformers** - Applied to the array of child nodes

### 4. Convert to Output Format

- **XML to JSON**: XNode to JSON
- **JSON to XML**: XNode to DOM, then DOM to XML string

### Transformation Context

Each transformation operation receives a context object containing:

- The current transformation direction
- Node information (name, type, namespace, etc.)
- Path to the current node
- Parent context (for navigating up the node hierarchy)
- Reference to the current configuration

### Path Expressions

XJX uses dot notation paths to identify nodes:

- Element paths: `root.element.child`
- Array indices: `root.elements[0]`
- Attribute paths: `root.element.@attribute`

## Registry System

The `UnifiedRegistry` provides a centralized system for registering and accessing various components:

```typescript
export enum RegistryType {
  TRANSFORMER = 'transformer',
  UTILITY = 'utility',
  TRANSFORM_OPERATION = 'transformOperation',
  EXTENSION = 'extension'
}

export class UnifiedRegistry {
  private static registry = new Map<RegistryType, Map<string, Function>>();
  
  // Registration methods
  public static register(type: RegistryType, name: string, implementation: Function): void;
  public static get(type: RegistryType, name: string): Function;
  // ...
}
```

The registry is used for:

1. **Dynamic Extensions** - Adding methods to the XJX class at runtime
2. **Service Location** - Finding the transformation service
3. **Component Registration** - Registering custom components

## Extension Mechanism

Extensions are implemented using TypeScript's module augmentation feature and the UnifiedRegistry:

```typescript
// Extension implementation
function getPath(this: any, obj: Record<string, any>, path: string, fallback: any = undefined): any {
  // Implementation...
}

// Register the utility function with the unified registry
UnifiedRegistry.register(RegistryType.UTILITY, "getPath", getPath);

// TypeScript module augmentation for type definitions
declare module "../core/XJX" {
  interface XJX {
    getPath(obj: Record<string, any>, path: string, fallback?: any): any;
  }
}
```

When an XJX instance is created, it automatically applies all registered extensions:

```typescript
private applyExtensions(): void {
  // Apply all utility methods
  const utilities = UnifiedRegistry.getAll(RegistryType.UTILITY);
  
  for (const [name, method] of utilities.entries()) {
    (this as any)[name] = method.bind(this);
  }
  
  // Apply all transformer factory methods
  const transformers = UnifiedRegistry.getAll(RegistryType.TRANSFORMER);
  
  for (const [name, factory] of transformers.entries()) {
    (this as any)[name] = factory.bind(this);
  }
}
```

## Error Handling

XJX uses a hierarchy of error classes:

- `XJXError` - Base error class for all XJX errors
- `XmlToJsonError` - Specific to XML parsing issues
- `JsonToXmlError` - Specific to XML serialization issues
- `EnvironmentError` - Environment compatibility issues
- `ConfigurationError` - Configuration validation errors

Errors are propagated through the call chain and should be caught by the user.

## Implementation Details

### XML Entity Handling

The `XmlEntityHandler` singleton centralizes entity handling:

- `escapeXML(text: string)` - Escapes XML special characters (`&`, `<`, `>`, `"`, `'`)
- `unescapeXML(text: string)` - Unescapes XML entities (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&apos;`)
- `safeXmlText(text: string)` - Safely handles text content for XML parsing
- `preprocessXml(xmlString: string)` - Pre-processes XML string before parsing
- `postProcessXml(xmlString: string)` - Post-processes XML string after serialization

### Namespace Handling

The `NamespaceUtil` singleton handles XML namespaces:

- `findNamespaceForPrefix(node: XNode, prefix: string)` - Finds namespace URI for a prefix
- `createQualifiedName(prefix: string | null, localName: string)` - Creates qualified name from prefix and local name
- `parseQualifiedName(qualifiedName: string)` - Parses qualified name into prefix and local name parts
- `getNamespaceDeclarations(element: Element)` - Gets namespace declarations from DOM element
- `addNamespaceDeclarations(element: Element, declarations: Record<string, string>)` - Adds namespace declarations to DOM element

### DOM Adaptation

The `DOMAdapter` provides a consistent interface across environments:

```typescript
export const DOMAdapter = (() => {
  // Environment detection and initialization

  return {
    createParser: () => { /* ... */ },
    createSerializer: () => { /* ... */ },
    NodeType,
    parseFromString: (xmlString: string, contentType: string = 'text/xml') => { /* ... */ },
    serializeToString: (node: Node) => { /* ... */ },
    createElement: (tagName: string) => { /* ... */ },
    createElementNS: (namespaceURI: string, qualifiedName: string) => { /* ... */ },
    // ...and more DOM operations
  };
})();
```

### Configuration Management

The `ConfigProvider` singleton handles configuration:

- `getInstance(initialConfig?: Partial<Configuration>)` - Gets the singleton instance
- `getConfig()` - Gets the current configuration
- `updateConfig(partialConfig: Partial<Configuration>)` - Updates configuration with new values
- `resetToDefaults()` - Resets to default configuration
- `getValue<T>(path: string, defaultValue?: T)` - Gets a specific configuration value by path

## Performance Considerations

### Memory Usage

- The XJX library uses intermediate representations (XNode) during conversion
- For very large XML documents, this can consume significant memory
- Consider chunking or streaming for large documents

### Optimization Techniques

1. **Transformer Short-Circuiting** - Transformers can return early if no transformation is needed
2. **Configuration Caching** - The configuration is cached to avoid repeated deep copying
3. **Singleton Patterns** - Utilities and configuration provider use singletons to avoid redundant instances
4. **Lazy DOM Creation** - DOM elements are created only when needed
5. **Builder Pattern** - The XJX class uses a builder pattern for configuration to avoid unnecessary object creation

### Performance Bottlenecks

1. **XML Parsing** - The most time-consuming operation is usually XML parsing
2. **DOM Manipulation** - DOM operations are generally slower than in-memory operations
3. **Deep Object Cloning** - Configuration updates involve deep cloning
4. **Transformer Chain** - Multiple transformers can add overhead

## Browser and Node.js Compatibility

### Environment Detection

The `DOMAdapter` detects the environment:

```typescript
if (typeof window === "undefined") {
  // Node.js environment - try JSDOM first
  try {
    const { JSDOM } = require("jsdom");
    // Use JSDOM
  } catch (jsdomError) {
    // Fall back to xmldom
    try {
      const { DOMParser, XMLSerializer, DOMImplementation } = require('@xmldom/xmldom');
      // Use xmldom
    } catch (xmldomError) {
      throw new Error(/*...*/);
    }
  }
} else {
  // Browser environment
  // Use native DOM implementation
}
```

### Browser Considerations

- Browser environments have built-in DOM support
- No external dependencies are required
- Size is important for browser usage
- UMD and ESM bundles are provided

### Node.js Considerations

- Node.js requires a DOM implementation (jsdom or xmldom)
- Resource cleanup is important (especially for jsdom)
- CommonJS and ESM modules are both supported