# XJX Library Architecture Guide

## Overview

XJX is a flexible, extensible library for transforming between XML and JSON formats with a powerful transformation pipeline. This document provides an overview of the architecture, core components, and extensibility mechanisms in XJX.

## Core Architecture

XJX follows a pipeline-based architecture with clear separation of concerns:

```
┌─────────────┐    ┌───────────┐    ┌────────────┐    ┌─────────────┐
│ XML/JSON    │    │ XNode     │    │ Transform  │    │ JSON/XML    │
│ Input       │───▶│ Converter │───▶│ Pipeline   │───▶│ Converter   │───▶ Output
└─────────────┘    └───────────┘    └────────────┘    └─────────────┘
```

The key architectural components are:

1. **XNode** - The central data model
2. **Converters** - Transform between external formats and XNode
3. **Transforms** - Process XNode during conversion
4. **Configuration** - Configure behavior
5. **Extensions** - Add functionality

This architecture enables a flexible, extensible system with clear boundaries between components.

## Key Components

### XNode: The Unified Data Model

At the core of XJX is the `XNode` class, which provides a unified representation of hierarchical data that bridges XML and JSON. This normalized model makes transformations simpler by providing a consistent API regardless of the source or target format.

Key features of `XNode`:

- **Node Types**: Supports elements, text, CDATA, comments, and processing instructions
- **Hierarchical Structure**: Parent-child relationships with bidirectional navigation
- **Namespace Support**: Handles XML namespaces and prefixes
- **Traversal Methods**: Methods for finding and manipulating nodes
- **Immutable API**: Most operations return new nodes, preserving original data

Example `XNode` structure:

```typescript
class XNode {
  // Core node properties
  public name: string;            // Element name
  public type: number;            // Node type (element, text, etc.)
  public value?: any;             // Node value
  public attributes?: Record<string, any>; // Element attributes
  public children?: XNode[];      // Child nodes
  public namespace?: string;      // Namespace URI
  public prefix?: string;         // Namespace prefix
  public parent?: XNode;          // Parent node reference
  
  // Methods for traversal and manipulation
  public findChild(name: string): XNode | undefined;
  public findChildren(name: string): XNode[];
  public setAttribute(name: string, value: any): XNode;
  public getTextContent(): string;
  // ...many more methods
}
```

### Converters: Format Transformation

The converters are responsible for transforming between external formats (XML, JSON) and the internal `XNode` model:

1. **XML to XNode**: Parses XML and creates the corresponding XNode structure
2. **XNode to XML**: Serializes XNode back to XML
3. **JSON to XNode**: Converts JSON to the XNode model
4. **XNode to JSON**: Serializes XNode to JSON

Converters follow a standard interface:

```typescript
interface Converter<TInput, TOutput> {
  convert(input: TInput): TOutput;
}

interface XmlToXNodeConverter extends Converter<string, XNode> { /* ... */ }
interface XNodeToXmlConverter extends Converter<XNode, string> { /* ... */ }
interface JsonToXNodeConverter extends Converter<Record<string, any>, XNode> { /* ... */ }
interface XNodeToJsonConverter extends Converter<XNode, Record<string, any>> { /* ... */ }
```

### Transforms: Data Modification

Transforms modify the `XNode` structure during conversion. Each transform is a self-contained module that operates on specific types of nodes:

```typescript
interface Transform {
  // Types of nodes this transform can handle
  targets: TransformTarget[];
  
  // Transform method
  transform(value: any, context: TransformContext): TransformResult<any>;
}
```

Transforms have several key design features:

1. **Target-Specific**: Each transform declares which node types it can handle
2. **Contextual**: Transforms receive context about their position in the document
3. **Immutable**: Transforms return new data without modifying inputs
4. **Composable**: Multiple transforms can be combined

The `TransformContext` provides metadata about the current transformation:

```typescript
interface TransformContext {
  nodeName: string;     // Current node name
  nodeType: number;     // Node type (element, attribute, etc.)
  path: string;         // Path from root to current node
  config: Configuration; // Current configuration
  direction: TransformDirection; // XML-to-JSON or JSON-to-XML
  parent?: TransformContext; // Parent context
  // ...additional metadata
}
```

### Configuration: Behavior Control

The configuration system controls how XJX behaves during transformations:

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
  
  // Property naming in JSON
  propNames: {
    attributesKey: string;
    textKey: string;
    contentKey: string;
    // ...other naming options
  }
  
  // Output options
  outputOptions: {
    prettyPrint: boolean;
    indent: number;
    compact: boolean;
    // ...other output settings
  }
}
```

The configuration is managed by the `ConfigService` singleton, which provides global defaults while allowing per-instance customization.

## Composability

XJX embraces composability at multiple levels:

### 1. Fluent API Composition

The fluent API allows you to chain operations together:

```typescript
// Chain operations together
XJX.fromXml(xml)
   .withConfig({ preserveComments: false })
   .withTransforms(new NumberTransform())
   .toJson();
```

### 2. Transform Composition

Transforms can be composed in multiple ways:

```typescript
// Sequential composition
XJX.fromXml(xml)
   .withTransforms(
      transform1,
      transform2,
      transform3
   )
   .toJson();

// Explicit composition using CompositeTransform
const combined = new CompositeTransform([transform1, transform2, transform3]);
XJX.fromXml(xml)
   .withTransforms(combined)
   .toJson();

// Conditional composition
const conditional = new ConditionalTransform({
   condition: (value, ctx) => ctx.nodeName === "price",
   transform: new NumberTransform()
});

// Path-based composition
const pathBased = new PathBasedTransform({
   pathPatterns: ["orders.*.items"],
   transform: combined
});
```

### 3. Converter Composition

Converters are implicitly composed in the transformation pipeline:

```
XML → XmlToXNodeConverter → XNode → Transform Pipeline → XNode → XNodeToJsonConverter → JSON
```

## Extensibility

XJX provides multiple extension points:

### 1. Custom Transforms

Create custom transforms by implementing the `Transform` interface:

```typescript
class MyCustomTransform implements Transform {
  targets = [TransformTarget.Element];
  
  transform(node: XNode, context: TransformContext): TransformResult<XNode> {
    // Custom transformation logic
    return createTransformResult(node);
  }
}
```

### 2. Extension Methods

The XJX class supports registration of extension methods:

```typescript
// Terminal extensions (return a value)
XJX.registerTerminalExtension("myExtension", function(this: TerminalExtensionContext, ...args) {
  // Implementation
  return result;
});

// Non-terminal extensions (return the builder for chaining)
XJX.registerNonTerminalExtension("myChainableExtension", function(this: NonTerminalExtensionContext, ...args) {
  // Implementation
  return this;
});

// Usage
XJX.fromXml(xml)
   .myChainableExtension(arg1, arg2)
   .myExtension(arg3);
```

### 3. Custom Converters

Implement custom converters by implementing the appropriate converter interface:

```typescript
class MyCustomXmlToXNodeConverter implements XmlToXNodeConverter {
  convert(xml: string): XNode {
    // Custom conversion logic
    return node;
  }
}
```

## Error Handling

XJX includes a robust error handling system:

1. **Typed Errors**: Specific error classes for different failure types
   - `XmlToJsonError`: Errors in XML-to-JSON conversion
   - `JsonToXmlError`: Errors in JSON-to-XML conversion
   - `ConfigurationError`: Invalid configuration
   - `EnvironmentError`: Environment compatibility issues

2. **Error Utilities**: The `ErrorUtils` class provides standard error creation and handling:
   - `ErrorUtils.try()`: Execute code with standardized try/catch
   - `ErrorUtils.validate()`: Validate conditions with clear error messages

3. **Validation**: Input validation throughout the library with descriptive error messages

## APIs and Usage Patterns

### Fluent API

The primary interface is a fluent, chainable API:

```typescript
// XML to JSON
const json = XJX.fromXml(xmlString)
              .withConfig({ preserveComments: false })
              .withTransforms(myTransform1, myTransform2)
              .toJson();

// JSON to XML
const xml = XJX.fromJson(jsonObject)
              .withConfig({ preserveNamespaces: true })
              .withTransforms(myTransform3)
              .toXml();
```

### Static Utilities

XJX provides static utility functions for common operations:

```typescript
// Validate XML
const result = XJX.validateXml(xmlString);

// Format XML
const formatted = XJX.prettyPrintXml(xmlString, 2);

// Global configuration
XJX.updateConfig({ preserveWhitespace: true });
XJX.resetConfig();
```

### Extension Context

Extension methods receive context objects with access to the current state:

```typescript
interface TerminalExtensionContext {
  xnode: XNode | null;             // Current XNode
  direction: TransformDirection | null; // Conversion direction
  transforms: Transform[];         // Registered transforms
  config: Configuration;           // Current configuration
  configProvider: ConfigService;   // Config service
  
  // Helper methods
  validateSource(): void;
  deepClone<T>(obj: T): T;
  // ...other helpers
}
```

## Design Principles

XJX follows several key design principles:

1. **Separation of Concerns**: Clear separation between conversion, transformation, and configuration
2. **Immutability**: Operations return new data without modifying inputs
3. **Extensibility**: Multiple extension points for customization
4. **Composability**: Components can be combined in flexible ways
5. **Error Handling**: Comprehensive error handling with clear messages
6. **Configurability**: Extensive configuration options for behavior customization

## Utility Classes

XJX includes several utility classes that provide core functionality:

1. **DomUtils**: Cross-platform DOM operations (browser and Node.js)
2. **XmlUtils**: XML parsing, serialization, and utilities
3. **JsonUtils**: JSON operations and utilities
4. **EntityUtils**: XML entity handling
5. **NamespaceUtils**: XML namespace operations
6. **CommonUtils**: General utilities (deep clone, path operations, etc.)

## Example Workflows

### Basic XML to JSON Conversion

```typescript
// Simple conversion with default settings
const json = XJX.fromXml(xmlString).toJson();
```

### Advanced Data Processing

```typescript
// Process financial data
const processedJson = XJX.fromXml(financialData)
  .withConfig({
    preserveWhitespace: false,
    preserveComments: false
  })
  .withTransforms(
    // Remove debug elements
    new FilterElementsTransform({ removeElements: ["debug", "internal"] }),
    
    // Convert numeric values
    new NumberTransform(),
    
    // Format dates
    new DateTransform({ outputFormat: "YYYY-MM-DD" }),
    
    // Sort transactions by date
    new SortingTransform({
      targetParent: "transactions",
      childElement: "transaction",
      sortBy: "attribute:date",
      valueType: "date"
    }),
    
    // Group by category
    new GroupingTransform({
      targetElement: "transaction",
      groupBy: "attribute:category",
      newParentName: "category",
      newParentAttribute: "name"
    })
  )
  .toJson();
```

### Custom XML Format Conversion

```typescript
// Convert between different XML schemas
const newXml = XJX.fromXml(oldFormat)
  .withTransforms(
    // Rename elements
    new RenameElementsTransform({
      mapping: {
        "OldName": "NewName",
        "legacy_element": "modern-element"
      }
    }),
    
    // Fix attribute names
    new FilterAttributesTransform({
      predicate: (name, value, context) => {
        // Keep all attributes but rename some
        if (name === "old_attr") {
          context.attributeName = "newAttr";
        }
        return true;
      }
    })
  )
  .toXml();
```

## Conclusion

The XJX library provides a powerful, flexible system for XML/JSON transformations with a focus on extensibility and composability. By separating the concerns of parsing, transformation, and serialization, it enables complex data processing pipelines with a clean, fluent API.

Key strengths of the architecture:

1. The unified `XNode` model that normalizes the differences between XML and JSON
2. The composable transform system for customizable data processing
3. The extensive configuration options for fine-tuned behavior
4. The extensibility mechanisms for adding custom functionality
5. The clear error handling system for robust applications

This design makes XJX suitable for a wide range of applications, from simple format conversions to complex data transformation workflows.