# XJX API Reference (Updated)

This document provides a comprehensive reference for the XJX library API, including classes, methods, interfaces, and utilities.

## Table of Contents

- [XJX Class](#xjx-class)
- [XjxBuilder Class](#xjxbuilder-class)
- [XNode Class](#xnode-class)
- [Configuration](#configuration)
- [ConfigManager](#configmanager)
- [Transformers](#transformers)
- [Utilities](#utilities)
- [Error Handling](#error-handling)
- [Extension Types](#extension-types)
- [Node Types](#node-types)

## XJX Class

The `XJX` class provides static methods for XML/JSON operations and the entry point to the fluent API.

### Static Methods

#### XML/JSON Operations

```typescript
// Create a builder from XML
static fromXml(xml: string): XjxBuilder;

// Create a builder from JSON
static fromJson(json: Record<string, any>): XjxBuilder;

// Create a builder with custom configuration
static withConfig(config: Partial<Configuration>): XjxBuilder;

// Create a builder with transforms
static withTransforms(...transforms: Transform[]): XjxBuilder;

// Validate XML string
static validateXml(xmlString: string): { isValid: boolean; message?: string };

// Pretty print XML string
static prettyPrintXml(xmlString: string, indent: number = 2): string;
```

#### Configuration Management

```typescript
// Reset global configuration to defaults
static resetConfig(): void;

// Update global configuration
static updateConfig(config: Partial<Configuration>): void;

// Get current global configuration
static getConfig(): Configuration;
```

#### Extension Management

```typescript
// Register a terminal extension method (returns a value)
static registerTerminalExtension(
  name: string, 
  method: (this: TerminalExtensionContext, ...args: any[]) => any
): void;

// Register a non-terminal extension method (returns this for chaining)
static registerNonTerminalExtension(
  name: string, 
  method: (this: NonTerminalExtensionContext, ...args: any[]) => any
): void;
```

#### Cleanup

```typescript
// Cleanup resources (e.g., DOM adapter)
static cleanup(): void;
```

## XjxBuilder Class

The `XjxBuilder` class implements the fluent API for XML/JSON transformations.

### Properties

```typescript
// XNode representation of the source
public xnode: XNode | null;

// Registered transformers
public transforms: Transform[];

// Current configuration
public config: Configuration;

// Source format identifier
public sourceFormat: FormatId | null;
```

### Core Methods

```typescript
// Set XML source for transformation
fromXml(source: string): XjxBuilder;

// Set JSON source for transformation
fromJson(source: Record<string, any>): XjxBuilder;

// Set configuration options
withConfig(config: Partial<Configuration>): XjxBuilder;

// Add transformers to the pipeline
withTransforms(...transforms: Transform[]): XjxBuilder;

// Convert to XML string
toXml(): string;

// Convert to JSON object
toJson(): Record<string, any>;

// Convert to formatted JSON string
toJsonString(indent: number = 2): string;
```

### Utility Methods

```typescript
// Validate that a source has been set
validateSource(): void;

// Deep clone an object
deepClone<T>(obj: T): T;

// Deep merge two objects
deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T;
```

## XNode Class

The `XNode` class represents an XML node in the XJX object model.

### Properties

```typescript
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
```

### Static Factory Methods

```typescript
// Create an element node
static createElement(name: string): XNode;

// Create a text node
static createTextNode(value: string): XNode;

// Create a CDATA node
static createCDATANode(value: string): XNode;

// Create a comment node
static createCommentNode(value: string): XNode;

// Create a processing instruction node
static createProcessingInstructionNode(target: string, data: string): XNode;
```

### Node Manipulation Methods

```typescript
// Add a child node
addChild(child: XNode): XNode;

// Remove a child node
removeChild(child: XNode): boolean;

// Set an attribute
setAttribute(name: string, value: any): XNode;

// Get an attribute value
getAttribute(name: string): any;

// Remove an attribute
removeAttribute(name: string): boolean;

// Add a namespace declaration
addNamespace(prefix: string, uri: string): XNode;
```

### Traversal Methods

```typescript
// Find the first child with the given name
findChild(name: string): XNode | undefined;

// Find all children with the given name
findChildren(name: string): XNode[];

// Get qualified name (with prefix if available)
getQualifiedName(): string;

// Find a node by path
findByPath(path: string): XNode | undefined;

// Find the first matching node
find(
  predicate: (node: XNode) => boolean,
  deep: boolean = true
): XNode | undefined;

// Find all matching nodes
findAll(
  predicate: (node: XNode) => boolean,
  deep: boolean = true
): XNode[];

// Get the node's path from the root
getPath(): string;
```

### Content Methods

```typescript
// Get text content (value or combined text from children)
getTextContent(): string;

// Set text content
setTextContent(text: string): XNode;

// Append a text node
appendText(text: string): XNode;

// Append a CDATA node
appendCDATA(data: string): XNode;

// Append a comment node
appendComment(comment: string): XNode;

// Append a processing instruction node
appendProcessingInstruction(target: string, data: string): XNode;
```

### Metadata Methods

```typescript
// Set metadata value
setMetadata(key: string, value: any): XNode;

// Get metadata value
getMetadata<T>(key: string, defaultValue?: T): T | undefined;

// Check if metadata key exists
hasMetadata(key: string): boolean;

// Remove metadata
removeMetadata(key: string): boolean;

// Set multiple metadata values
setMetadataValues(values: Record<string, any>): XNode;

// Clear all metadata
clearMetadata(): XNode;
```

### Utility Methods

```typescript
// Clone this node with optional deep flag
clone(deep: boolean = false): XNode;

// Check if this node has children
hasChildren(): boolean;

// Get the node type name for debugging
getNodeTypeName(): string;
```

## Configuration

The `Configuration` interface controls how XJX behaves during transformations.

### Configuration Interface

```typescript
interface Configuration {
  // Features to preserve
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

```javascript
const DEFAULT_CONFIG: Configuration = {
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

## ConfigManager

The `ConfigManager` provides static methods for managing configurations. This replaces the previous ConfigService with a simpler approach.

```typescript
// ConfigManager API
const ConfigManager = {
  // Get a fresh copy of the default configuration
  getDefaultConfig(): Configuration;
  
  // Merge configurations
  mergeConfig(
    baseConfig: Configuration, 
    overrideConfig: Partial<Configuration>
  ): Configuration;
  
  // Validate configuration
  isValidConfig(config: any): boolean;
  
  // Create a valid configuration
  createConfig(config: Partial<Configuration>): Configuration;
  
  // Get configuration value by path
  getConfigValue<T>(
    config: Configuration, 
    path: string, 
    defaultValue?: T
  ): T | undefined;
};
```

## Transformers

Transformers modify the XNode structure during conversion.

### Transform Interface

```typescript
interface Transform {
  // Target types this transformer can handle
  targets: TransformTarget[];
  
  // Transform method with context
  transform(value: any, context: TransformContext): TransformResult<any>;
}
```

### TransformTarget Enum

```typescript
enum TransformTarget {
  Value = 'value',              // Primitive values
  Attribute = 'attribute',      // XML attributes
  Element = 'element',          // XML elements
  Text = 'text',                // Text nodes
  CDATA = 'cdata',              // CDATA sections
  Comment = 'comment',          // XML comments
  ProcessingInstruction = 'processingInstruction', // Processing instructions
  Namespace = 'namespace'       // XML namespaces
}
```

### TransformContext Interface

```typescript
interface TransformContext {
  // Node information
  nodeName: string;      // Name of the current node
  nodeType: number;      // DOM node type (element, text, etc.)
  path: string;          // Dot-notation path to current node
  
  // Type-specific flags
  isAttribute?: boolean;
  attributeName?: string;
  isText?: boolean;
  isCDATA?: boolean;
  isComment?: boolean;
  isProcessingInstruction?: boolean;
  
  // Namespace information
  namespace?: string;
  prefix?: string;
  
  // Hierarchical context
  parent?: TransformContext;
  
  // Configuration
  config: Configuration;
  
  // Target format
  targetFormat: FormatId;
}
```

### Format Identifiers

```typescript
// Format identifier type
export type FormatId = string;

// Core format constants
export const FORMATS = {
  XML: 'xml' as FormatId,
  JSON: 'json' as FormatId
};
```

### TransformResult Interface

```typescript
interface TransformResult<T> {
  // The transformed value
  value: T;
  
  // Whether the node/value should be removed
  remove: boolean;
}

// Helper function
function createTransformResult<T>(value: T, remove: boolean = false): TransformResult<T> {
  return { value, remove };
}
```

### Built-in Transformers

#### BooleanTransform

```typescript
interface BooleanTransformOptions {
  // Values to consider as true (default: ["true", "yes", "1", "on"])
  trueValues?: string[];
  
  // Values to consider as false (default: ["false", "no", "0", "off"])
  falseValues?: string[];
  
  // Whether to ignore case when matching (default: true)
  ignoreCase?: boolean;
}

class BooleanTransform implements Transform {
  // Format-aware transformation
  constructor(options?: BooleanTransformOptions);
}
```

#### NumberTransform

The improved NumberTransform with format-aware behavior:

```typescript
interface NumberTransformOptions {
  // Whether to convert integers (default: true)
  integers?: boolean;
  
  // Whether to convert decimals (default: true)
  decimals?: boolean;
  
  // Whether to convert scientific notation (default: true)
  scientific?: boolean;
  
  // Decimal separator character (default: ".")
  decimalSeparator?: string;
  
  // Thousands separator character (default: ",")
  thousandsSeparator?: string;
}

class NumberTransform implements Transform {
  constructor(options?: NumberTransformOptions);
}
```

#### RegexTransform

The improved RegexTransform with format-specific transformations:

```typescript
interface RegexOptions {
  // The pattern to search for (RegExp, string, or "/pattern/flags")
  pattern: RegExp | string;
  
  // The replacement string or function
  replacement: string;
  
  // Optional format this regex applies to
  format?: FormatId;
}

class RegexTransform implements Transform {
  constructor(options: RegexOptions);
}
```

#### MetadataTransform

```typescript
type NodeSelector = string | RegExp | ((node: XNode, context: TransformContext) => boolean);

interface FormatMetadata {
  format: FormatId;
  metadata: Record<string, any>;
}

interface MetadataTransformOptions {
  // Criteria for selecting nodes to apply metadata to
  selector?: NodeSelector;
  
  // Whether to apply to the root node regardless of selector
  applyToRoot?: boolean;
  
  // Whether to apply to all nodes regardless of selector
  applyToAll?: boolean;
  
  // Metadata to apply to matching nodes (general)
  metadata?: Record<string, any>;
  
  // Format-specific metadata
  formatMetadata?: FormatMetadata[];
  
  // Whether to replace existing metadata (true) or merge with it (false)
  replace?: boolean;
  
  // List of metadata keys to remove (if any)
  removeKeys?: string[];
  
  // Maximum depth to apply metadata (undefined = no limit)
  maxDepth?: number;
}

class MetadataTransform implements Transform {
  constructor(options: MetadataTransformOptions);
}
```

## Utilities

XJX includes several utility classes for various operations.

### TransformUtils

```typescript
class TransformUtils {
  // Create a root transformation context
  static createRootContext(
    targetFormat: FormatId,
    rootName: string,
    config: Configuration
  ): TransformContext;
  
  // Create a child context from a parent context
  static createChildContext(
    parentContext: TransformContext,
    childNode: XNode,
    index: number
  ): TransformContext;
  
  // Create an attribute context from a parent context
  static createAttributeContext(
    parentContext: TransformContext,
    attributeName: string
  ): TransformContext;
  
  // Compose multiple transforms into a single transform
  static composeTransforms(...transforms: Transform[]): Transform;
  
  // Create a conditional transform
  static conditionalTransform(
    condition: (value: any, context: TransformContext) => boolean,
    transform: Transform
  ): Transform;
  
  // Create a named transform for better debugging
  static namedTransform(name: string, transform: Transform): Transform & { name: string };
}
```

### DomUtils

```typescript
class DomUtils {
  // DOM node types
  static readonly NodeType = NodeType;
  
  // Create a new DOM parser
  static createParser(): any;
  
  // Create a new XML serializer
  static createSerializer(): any;
  
  // Parse XML string to DOM document
  static parseFromString(xmlString: string, contentType?: string): Document;
  
  // Serialize DOM node to XML string
  static serializeToString(node: Node): string;
  
  // Create a new XML document
  static createDocument(): Document;
  
  // Create a DOM element
  static createElement(tagName: string): Element;
  
  // Create a namespaced DOM element
  static createElementNS(namespaceURI: string, qualifiedName: string): Element;
  
  // Create a text node
  static createTextNode(data: string): Text;
  
  // Create a CDATA section
  static createCDATASection(data: string): CDATASection;
  
  // Create a comment node
  static createComment(data: string): Comment;
  
  // Create a processing instruction
  static createProcessingInstruction(target: string, data: string): ProcessingInstruction;
  
  // Set a namespaced attribute on an element
  static setNamespacedAttribute(
    element: Element, 
    namespaceURI: string | null, 
    qualifiedName: string, 
    value: string
  ): void;
  
  // Check if an object is a DOM node
  static isNode(obj: any): boolean;
  
  // Get DOM node type as string for debugging
  static getNodeTypeName(nodeType: number): string;
  
  // Get all node attributes as an object
  static getNodeAttributes(node: Element): Record<string, string>;
  
  // Cleanup method for releasing resources
  static cleanup(): void;
}
```

### XmlUtils

```typescript
interface ValidationResult {
  isValid: boolean;
  message?: string;
}

class XmlUtils {
  // Parse XML string to DOM document
  static parseXml(xmlString: string, config?: Configuration, contentType?: string): Document;
  
  // Serialize DOM to XML string
  static serializeXml(node: Node): string;
  
  // Format XML string with indentation
  static prettyPrintXml(xmlString: string, indent?: number): string;
  
  // Check if XML string is well-formed
  static validateXML(xmlString: string): ValidationResult;
  
  // Add XML declaration to a string
  static ensureXMLDeclaration(xmlString: string): string;
  
  // Normalize whitespace in text content
  static normalizeTextContent(text: string, preserveWhitespace?: boolean): string;
  
  // Create a DOM document from an XML string
  static createDocumentFromXml(xmlString: string): Document;
  
  // Create an empty DOM document
  static createEmptyDocument(): Document;
  
  // Extract XML fragments from a string
  static extractXmlFragments(text: string): string[];
  
  // Check if a string is valid XML
  static isValidXml(xmlString: string): boolean;
  
  // Get XML element tag name
  static getTagName(element: Element): string;
  
  // Get XML element attributes as an object
  static getAttributes(element: Element): Record<string, string>;
}
```

### JsonUtils

```typescript
class JsonUtils {
  // Converts a plain JSON object to the XML-like JSON structure
  static objectToXJX(obj: JSONValue, config: Configuration, root?: string | JSONObject): XMLJSONNode;
  
  // Recursively compacts a JSON structure
  static compactJson(value: JSONValue): JSONValue | undefined;
  
  // Safely stringify JSON for debugging
  static safeStringify(obj: JSONValue, indent?: number): string;
  
  // Safely parse a JSON string
  static safeParse(text: string): JSONValue | null;
  
  // Validate that a value is a valid JSON object
  static isValidJsonObject(value: any): boolean;
  
  // Validate that a value is a valid JSON array
  static isValidJsonArray(value: any): boolean;
  
  // Validate that a value is a valid JSON primitive
  static isValidJsonPrimitive(value: any): boolean;
  
  // Validate that a value is a valid JSON value
  static isValidJsonValue(value: any): boolean;
  
  // Get a value from a JSON object using a path
  static getPath<T>(obj: JSONValue, path: string, defaultValue?: T): T | undefined;
  
  // Set a value in a JSON object using a path
  static setPath<T extends JSONValue>(obj: T, path: string, value: JSONValue): T;
}
```

### EntityUtils

```typescript
class EntityUtils {
  // Escapes special characters in text for safe XML usage
  static escapeXml(text: string): string;
  
  // Unescapes XML entities back to their character equivalents
  static unescapeXml(text: string): string;
  
  // Safely handles text content for XML parsing
  static safeXmlText(text: string): string;
  
  // Determines if a string contains XML special characters
  static containsSpecialChars(text: string): boolean;
  
  // Pre-processes XML string before parsing
  static preprocessXml(xmlString: string): string;
  
  // Post-processes XML string after serialization
  static postProcessXml(xmlString: string): string;
  
  // Normalize whitespace in text content
  static normalizeWhitespace(text: string, preserveWhitespace?: boolean): string;
  
  // Normalize newlines to consistent format
  static normalizeNewlines(text: string): string;
  
  // Check if a string appears to be an XML fragment
  static isXmlFragment(text: string): boolean;
}
```

### NamespaceUtils

```typescript
class NamespaceUtils {
  // Find namespace URI for a prefix
  static findNamespaceForPrefix(
    node: XNode,
    prefix: string,
    namespaceMap?: Record<string, string>
  ): string | undefined;
  
  // Create a qualified name from namespace prefix and local name
  static createQualifiedName(prefix: string | null | undefined, localName: string): string;
  
  // Parse a qualified name into prefix and local name parts
  static parseQualifiedName(qualifiedName: string): { prefix: string | null, localName: string };
  
  // Get namespace declarations from DOM Element
  static getNamespaceDeclarations(element: Element): Record<string, string>;
  
  // Check if an element declares a default namespace
  static hasDefaultNamespace(element: Element): boolean;
  
  // Add namespace declarations to a DOM element
  static addNamespaceDeclarations(element: Element, declarations: Record<string, string>): void;
  
  // Collect all namespace declarations from an XNode and its ancestors
  static collectNamespaceDeclarations(node: XNode): Record<string, string>;
  
  // Resolve a DOM Element's namespace and prefix
  static resolveElementNamespace(element: Element): { namespace: string | null, prefix: string | null };
  
  // Check if a qualified name has a namespace prefix
  static hasPrefix(qualifiedName: string): boolean;
  
  // Get default namespace URI from a DOM Element
  static getDefaultNamespace(element: Element): string | null;
  
  // Create a namespace-aware DOM element
  static createElementNS(
    doc: Document, 
    qualifiedName: string, 
    namespace: string | null
  ): Element;
}
```

### CommonUtils

```typescript
class CommonUtils {
  // Deep clone an object using JSON serialization
  static deepClone<T>(obj: T): T;
  
  // Deep merge two objects
  static deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T;
  
  // Check if a value is empty
  static isEmpty(value: any): boolean;
  
  // Safely get a value from an object using a dot-notation path
  static getPath<T>(obj: any, path: string, defaultValue?: T): T | undefined;
  
  // Validate that a value exists
  static validateExists(value: any, errorMessage: string): void;
  
  // Create a unique string identifier
  static uniqueId(): string;
  
  // Check if two values are deeply equal
  static isEqual(a: any, b: any): boolean;
  
  // Safely convert a value to number
  static toNumber(value: any, defaultValue?: number): number;
  
  // Safely convert a value to boolean
  static toBoolean(value: any, defaultValue?: boolean): boolean;
}
```

## Error Handling

XJX includes a comprehensive error handling system.

### Error Classes

```typescript
// Base error class
class XJXError extends Error {
  constructor(message: string);
}

// Error for XML parsing issues
class XmlToJsonError extends XJXError {
  constructor(message: string);
}

// Error for XML serialization issues
class JsonToXmlError extends XJXError {
  constructor(message: string);
}

// Error for environment incompatibility
class EnvironmentError extends XJXError {
  constructor(message: string);
}

// Error for invalid configuration
class ConfigurationError extends XJXError {
  constructor(message: string);
}
```

### ErrorUtils

```typescript
type ErrorType = 'xml-to-json' | 'json-to-xml' | 'configuration' | 'environment' | 'general';

class ErrorUtils {
  // Create a standardized XmlToJsonError
  static xmlToJson(message: string, cause?: unknown): XmlToJsonError;
  
  // Create a standardized JsonToXmlError
  static jsonToXml(message: string, cause?: unknown): JsonToXmlError;
  
  // Create a standardized ConfigurationError
  static configuration(message: string, cause?: unknown): ConfigurationError;
  
  // Create a standardized EnvironmentError
  static environment(message: string, cause?: unknown): EnvironmentError;
  
  // Create a standardized general XJXError
  static general(message: string, cause?: unknown): XJXError;
  
  // Execute a function with standardized try/catch
  static try<T>(
    fn: () => T, 
    errorMessage: string, 
    errorType?: ErrorType
  ): T;
  
  // Validate a condition and throw an error if it fails
  static validate(
    condition: boolean,
    errorMessage: string,
    errorType?: ErrorType
  ): void;
  
  // Assert that a value is not null or undefined
  static assertExists<T>(
    value: T | null | undefined,
    errorMessage: string,
    errorType?: ErrorType
  ): T;
}
```

## Extension Types

XJX includes types for extension development.

### XJXContext

```typescript
// Base context interface for extension functions
interface XJXContext {
  // Configuration is available in all contexts
  config: Configuration;
}
```

### TerminalExtensionContext

```typescript
// Context for terminal extensions
interface TerminalExtensionContext extends XJXContext {
  // These properties are available in the builder context
  xnode: XNode | null;
  sourceFormat: FormatId | null;
  transforms: Transform[];
  
  // Common utility methods required by terminal extensions
  validateSource: () => void;
  deepClone: <T>(obj: T) => T;
  deepMerge: <T extends Record<string, any>>(target: T, source: Partial<T>) => T;
}
```

### NonTerminalExtensionContext

```typescript
// Context for non-terminal extensions
interface NonTerminalExtensionContext extends XJXContext {
  // Properties that can be modified by extensions
  xnode: XNode | null;
  sourceFormat: FormatId | null;
  transforms: Transform[];
  
  // Utility methods
  validateSource: () => void;
  deepClone: <T>(obj: T) => T;
  deepMerge: <T extends Record<string, any>>(target: T, source: Partial<T>) => T;
}
```

## Node Types

XJX uses DOM node types to represent different XML node types.

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