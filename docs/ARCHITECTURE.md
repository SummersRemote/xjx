# XJX Architecture

This document describes the architecture and design of the XJX library, including its core components, design principles, and internal workflow.

## Design Principles

XJX is built on several key design principles:

1. **Modular Design**: Components are highly modular with clear boundaries and responsibilities.
2. **Fluent API**: The API is designed for intuitive chaining of operations.
3. **Extensibility**: The system can be extended with custom functionality.
4. **Unified Internal Representation**: A common intermediate format (`XNode`) simplifies transformations.
5. **Configurability**: Extensive options for controlling conversion behavior.
6. **Cross-Platform**: Works consistently in both browser and Node.js environments.

## Major Components

### Overview

XJX is structured around these major components:

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│   Source   │     │ Converters │     │ Transforms │     │   Output   │
│ (XML/JSON) │────▶│(to XNode)  │────▶│(modify data)│────▶│(XML/JSON)  │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
                          ▲                  ▲                  ▲
                          │                  │                  │
                          │                  │                  │
                          └────────┬─────────┴─────────────────┘
                                   │
                          ┌────────▼────────┐
                          │  Configuration  │
                          └─────────────────┘
```

### XNode Model

The central pillar of XJX is the `XNode` intermediate representation. `XNode` provides a unified model that can represent both XML and JSON structures with high fidelity.

```typescript
interface XNode {
  // Core node properties
  name: string;            // Element name
  type: number;            // Node type (element, text, comment, etc.)
  value?: any;             // Node value
  attributes?: Record<string, any>; // Node attributes
  children?: XNode[];      // Child nodes
  
  // Namespace information
  namespace?: string;      // Namespace URI
  prefix?: string;         // Namespace prefix
  namespaceDeclarations?: Record<string, string>; // Namespace declarations
  isDefaultNamespace?: boolean; // Whether this has a default namespace
  
  // Metadata
  metadata?: Record<string, any>; // User-defined metadata
  parent?: XNode;          // Parent node reference
}
```

This model allows XJX to represent the full richness of XML while still being compatible with JSON structures.

### Converters

Converters are responsible for transforming between external formats (XML, JSON) and the internal `XNode` format:

1. **XML to XNode**: Parses XML and builds the `XNode` tree
2. **XNode to XML**: Serializes `XNode` to XML DOM or string
3. **JSON to XNode**: Converts JSON to `XNode` format
4. **XNode to JSON**: Converts `XNode` to JSON object or string

Converters follow a converter pattern with a unified interface:

```typescript
interface Converter<TInput, TOutput, TOptions = any> {
  convert(input: TInput, options?: TOptions): TOutput;
}
```

### Transforms

Transforms are specialized components that modify the `XNode` tree during conversion. They operate on specific aspects of the data:

- **Type-based transforms**: Convert data types (strings to numbers, booleans, etc.)
- **Pattern-based transforms**: Apply regex patterns or other transformations to values
- **Structural transforms**: Modify the structure of the data
- **Metadata transforms**: Add metadata to nodes for further processing

Each transform implements the `Transform` interface:

```typescript
interface Transform {
  targets: TransformTarget[];  // What node aspects this transform targets
  transform(value: any, context: TransformContext): TransformResult<any>;
}
```

### Extensions System

The extension system enables adding new methods to the XJX class. Extensions come in two flavors:

1. **Terminal Extensions**: Return a value and end the method chain
2. **Non-Terminal Extensions**: Return the XJX instance for further chaining

Extensions are registered via the static methods:

```typescript
XJX.registerTerminalExtension(name, implementationFunction);
XJX.registerNonTerminalExtension(name, implementationFunction);
```

### Configuration System

The configuration system allows fine-grained control over conversion behavior:

- **Preservation options**: Control what XML features to preserve
- **Strategy options**: Control how different aspects are handled during conversion
- **Format options**: Control output formatting

The configuration can be provided at instantiation or via the `withConfig()` method.

## Data Flow

The typical data flow through XJX is:

1. **Source Input**: Data enters via `fromXml()` or `fromJson()`
2. **Source Conversion**: Input is converted to the internal `XNode` format
3. **Transformation**: Transforms are applied to the `XNode` tree
4. **Target Conversion**: `XNode` is converted to the target format
5. **Output**: Result is returned via `toXml()`, `toXmlString()`, `toJson()`, or `toJsonString()`

## Type System

XJX uses TypeScript for strong typing throughout the codebase. Key types include:

- **XNode and related interfaces**: The core data model
- **Configuration types**: Control conversion behavior
- **Transform interfaces**: Define how transformations work
- **Result types**: Define the structure of conversion results

## Error Handling

XJX includes a comprehensive error handling system:

- **XJXError**: Base error class for all XJX errors
- **ValidationError**: Errors during input validation
- **ProcessingError**: Errors during data processing

All errors provide:
- Descriptive messages
- Original source data (when available)
- Context information about where the error occurred

## Logging

The library includes a simple but effective logging system:

- **Multiple log levels**: DEBUG, INFO, WARN, ERROR, NONE
- **Contextual logging**: Log entries include context about the operation
- **Configurable**: Log level can be set via the API

```typescript
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  NONE = 'none'
}
```

## DOM Handling

XJX provides a unified DOM interface that works consistently across environments:

- In the browser, it uses the native DOM API
- In Node.js, it uses JSDOM or xmldom
- The DOM implementation is detected and initialized automatically

This abstraction allows XJX to work consistently in any JavaScript environment.

## Cross-Platform Compatibility

XJX is designed to work in both browser and Node.js environments:

- **Universal DOM API**: Works with browser DOM or Node.js DOM libraries
- **ESM and CommonJS builds**: Support for all module systems
- **UMD build**: For direct browser use via script tags
- **No dependencies**: Core functionality has no required dependencies

## Performance Considerations

XJX balances flexibility and performance:

- **Lazy initialization**: Components are initialized only when needed
- **Minimal DOM manipulations**: DOM operations are minimized
- **Efficient transformations**: Transforms are applied efficiently

## Code Organization

The codebase is organized into several key areas:

- **core/**: Core types, utilities, and base functionality
- **converters/**: Format conversion implementations
- **transforms/**: Transform implementations
- **extensions/**: Extension implementations
- **XJX.ts**: Main class with fluent API
- **index.ts**: Public API exports

## Extension Points

XJX provides several key extension points:

1. **Custom Extensions**: Add new methods to the XJX class
2. **Custom Transforms**: Create specialized transformations
3. **Configuration**: Customize behavior via configuration
4. **Transform Pipeline**: Control the sequence of transformations

For details on creating custom extensions and transforms, see the [EXTENSIONS-AND-TRANSFORMS.md](./EXTENSIONS-AND-TRANSFORMS.md) document.