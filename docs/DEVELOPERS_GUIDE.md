# XJX Developers Guide

Comprehensive guide for developers working on or extending the XJX library.

## Table of Contents

1. [Architecture Deep Dive](#architecture-deep-dive)
2. [Design Decisions](#design-decisions)
3. [Code Style & Patterns](#code-style--patterns)
4. [Extension Development](#extension-development)
5. [Converter Development](#converter-development)
6. [Transform Development](#transform-development)
7. [Testing Strategy](#testing-strategy)
8. [Build & Distribution](#build--distribution)

## Architecture Deep Dive

### Core Architectural Principles

1. **Immutability**: XJX operations create new objects rather than mutating existing ones
2. **Composability**: Functions and methods can be combined in flexible ways
3. **Extensibility**: Plugin architecture allows adding new capabilities
4. **Type Safety**: Full TypeScript support with comprehensive type definitions
5. **Universal Compatibility**: Works in both browser and Node.js environments

### Component Interaction Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                          XJX Class                               │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │   Instance      │    │   Static        │                    │
│  │   Properties    │    │   Registration  │                    │
│  │                 │    │   System        │                    │
│  │ • xnode         │    │                 │                    │
│  │ • transforms    │    │ • registerT...  │                    │
│  │ • config        │    │ • registerN...  │                    │
│  └─────────────────┘    └─────────────────┘                    │
└──────────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌─────────────────┐            ┌─────────────────┐
│   Extensions    │            │   Converters    │
│                 │            │                 │
│ • fromXml()     │◀──────────▶│ • XML ↔ XNode  │
│ • toJson()      │            │ • JSON ↔ XNode │
│ • filter()      │            │ • Validation   │
│ • map()         │            │ • Callbacks    │
└─────────────────┘            └─────────────────┘
         │                              │
         ▼                              ▼
┌─────────────────┐            ┌─────────────────┐
│  XNode Tree     │◀──────────▶│  Configuration  │
│                 │            │                 │
│ • Hierarchical  │            │ • Strategies    │
│ • Type-aware    │            │ • Properties    │
│ • Namespaced    │            │ • Formatting    │
│ • Metadata      │            │ • Validation    │
└─────────────────┘            └─────────────────┘
```

### Extension Registration System

The extension system uses prototype modification to add methods to XJX instances:

```typescript
// Terminal Extension Registration
XJX.registerTerminalExtension = function(name: string, method: Function) {
  (XJX.prototype as any)[name] = function(...args: any[]): any {
    this.validateSource();  // Ensure source is set
    return method.apply(this, args);  // Call implementation
  };
};

// Non-Terminal Extension Registration  
XJX.registerNonTerminalExtension = function(name: string, method: Function) {
  (XJX.prototype as any)[name] = function(...args: any[]): XJX {
    method.apply(this, args);  // Call implementation
    return this;               // Return for chaining
  };
};
```

### Context Interfaces

Extensions receive context objects that provide access to instance state:

```typescript
// Terminal extension context (read-only operations)
interface TerminalExtensionContext extends XJXContext {
  readonly xnode: XNode | null;
  readonly transforms: Transform[];
  validateSource(): void;
  cloneNode(node: XNode, deep?: boolean): XNode;
  deepClone<T>(obj: T): T;
}

// Non-terminal extension context (can modify state)
interface NonTerminalExtensionContext extends XJXContext {
  xnode: XNode | null;        // Can be modified
  transforms: Transform[];    // Can be modified
  validateSource(): void;
  cloneNode(node: XNode, deep?: boolean): XNode;
  deepClone<T>(obj: T): T;
}
```

## Design Decisions

### 1. Fluent API Design

**Decision**: Use method chaining with terminal/non-terminal distinction

**Rationale**:
- Intuitive pipeline construction
- Clear separation between transformative and output operations
- Type safety through return type distinction

```typescript
// Non-terminal methods return XJX for chaining
fromXml(xml: string): XJX
filter(predicate: Function): XJX
map(transformer: Function): XJX

// Terminal methods return values
toJson(): JsonValue
reduce<T>(reducer: Function, initial: T): T
```

### 2. XNode as Internal Representation

**Decision**: Use unified XNode interface for all internal processing

**Rationale**:
- Format-agnostic processing
- Consistent functional operations across formats
- Metadata preservation capability
- Type-aware node operations

### 3. Configuration-Driven Behavior

**Decision**: Comprehensive configuration object rather than method parameters

**Rationale**:
- Reduces method signature complexity
- Enables preset configurations
- Consistent behavior across operations
- Extensible without breaking changes

### 4. Converter Pattern

**Decision**: Separate converter classes for format transformations

**Rationale**:
- Single responsibility principle
- Easy to test and maintain
- Extensible for new formats
- Consistent error handling

### 5. Extension Registration via Imports

**Decision**: Auto-registration through ES module imports

**Rationale**:
- Zero-configuration extension loading
- Tree-shaking compatible
- Explicit dependency management
- Prevents runtime registration issues

```typescript
// Extensions auto-register when imported
import './extensions/from-xml';  // Registers fromXml()
import './extensions/to-json';   // Registers toJson()
```

## Code Style & Patterns

### TypeScript Guidelines

1. **Strict Type Checking**: All code uses TypeScript strict mode
2. **Interface Segregation**: Small, focused interfaces
3. **Generics**: Type-safe generic functions where appropriate
4. **Union Types**: Use union types for strategy options

```typescript
// Good: Specific union types
type AttributeStrategy = 'merge' | 'prefix' | 'property';

// Good: Generic with constraints
function transform<T extends XNode>(node: T, fn: (n: T) => T): T;

// Good: Interface segregation
interface Converter<TInput, TOutput> {
  convert(input: TInput, config: Configuration): TOutput;
}
```

### Error Handling Patterns

1. **Structured Errors**: Custom error classes with context
2. **API Boundary Validation**: Validate inputs at public API boundaries
3. **Graceful Degradation**: Continue processing when possible

```typescript
// API boundary validation
export function fromXml(xml: string): void {
  validateInput(typeof xml === 'string', 'XML must be a string');
  validateInput(xml.trim().length > 0, 'XML cannot be empty');
  
  try {
    this.xnode = xmlToXNodeConverter.convert(xml, this.config);
  } catch (err) {
    throw new ProcessingError('Failed to parse XML', xml);
  }
}
```

### Functional Programming Patterns

1. **Pure Functions**: Functions without side effects
2. **Immutable Operations**: Create new objects instead of mutating
3. **Composable Transforms**: Small, reusable transformation functions

```typescript
// Pure function example
export function cloneNode(node: XNode, deep: boolean = false): XNode {
  // Creates new node without modifying original
  const clone = { ...node, parent: undefined };
  
  if (deep && node.children) {
    clone.children = node.children.map(child => cloneNode(child, true));
  }
  
  return clone;
}
```

### Logging Strategy

1. **Structured Logging**: Consistent log message format
2. **Debug Information**: Rich context in debug logs
3. **Performance Monitoring**: Log operation timing in debug mode

```typescript
export function convertXmlToXNode(xml: string, config: Configuration): XNode {
  logger.debug('Starting XML to XNode conversion', {
    xmlLength: xml.length,
    preserveNamespaces: config.preserveNamespaces
  });
  
  const startTime = performance.now();
  const result = performConversion(xml, config);
  
  logger.debug('Completed XML to XNode conversion', {
    duration: performance.now() - startTime,
    resultNodeName: result.name
  });
  
  return result;
}
```

## Extension Development

### Creating Terminal Extensions

Terminal extensions return values and end the method chain.

#### Boilerplate Template

```typescript
// src/extensions/my-terminal-extension.ts
import { XJX } from '../XJX';
import { TerminalExtensionContext } from '../core/extension';
import { logger } from '../core/error';

/**
 * Custom terminal extension that returns processed data
 */
export function myTerminalMethod(
  this: TerminalExtensionContext,
  options?: MyOptions
): MyReturnType {
  try {
    // Source validation is handled by registration system
    
    logger.debug('Starting my terminal operation', {
      hasTransforms: this.transforms.length > 0,
      options
    });
    
    // Apply any pending transforms
    let nodeToProcess = this.xnode as XNode;
    
    if (this.transforms && this.transforms.length > 0) {
      nodeToProcess = transformXNode(nodeToProcess, this.transforms, this.config);
    }
    
    // Perform your custom processing
    const result = processNode(nodeToProcess, options);
    
    logger.debug('Completed my terminal operation', {
      resultType: typeof result
    });
    
    return result;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed in myTerminalMethod: ${String(err)}`);
  }
}

// Define options interface
interface MyOptions {
  // Define your options here
  format?: string;
  includeMetadata?: boolean;
}

// Define return type
type MyReturnType = {
  // Define your return type here
  data: any;
  metadata: Record<string, any>;
};

// Processing function
function processNode(node: XNode, options?: MyOptions): MyReturnType {
  // Implement your processing logic
  return {
    data: node,
    metadata: { processed: new Date() }
  };
}

// Register the extension
XJX.registerTerminalExtension('myTerminalMethod', myTerminalMethod);
```

### Creating Non-Terminal Extensions

Non-terminal extensions modify the XJX instance state and return `this` for chaining.

#### Boilerplate Template

```typescript
// src/extensions/my-non-terminal-extension.ts
import { XJX } from '../XJX';
import { NonTerminalExtensionContext } from '../core/extension';
import { validateInput } from '../core/converter';
import { logger } from '../core/error';

/**
 * Custom non-terminal extension that modifies the processing pipeline
 */
export function myNonTerminalMethod(
  this: NonTerminalExtensionContext,
  param1: string,
  param2?: MyOptions
): void {
  try {
    // API boundary validation
    validateInput(typeof param1 === 'string', 'param1 must be a string');
    validateInput(param1.length > 0, 'param1 cannot be empty');
    
    logger.debug('Executing my non-terminal operation', {
      param1,
      param2,
      hasSource: !!this.xnode
    });
    
    // Validate source if required
    if (requiresSource()) {
      this.validateSource();
    }
    
    // Modify instance state
    if (this.xnode) {
      this.xnode = processXNode(this.xnode, param1, param2);
    }
    
    // Or add transforms to the pipeline
    if (param2?.addTransform) {
      this.transforms.push(createMyTransform(param1));
    }
    
    logger.debug('Completed my non-terminal operation');
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed in myNonTerminalMethod: ${String(err)}`);
  }
}

// Define options interface
interface MyOptions {
  addTransform?: boolean;
  processingMode?: 'fast' | 'thorough';
}

// Helper functions
function requiresSource(): boolean {
  return true; // Return true if this operation requires a source to be set
}

function processXNode(node: XNode, param1: string, options?: MyOptions): XNode {
  // Implement your XNode processing logic
  const clone = cloneNode(node, true);
  
  // Modify the clone as needed
  if (options?.processingMode === 'thorough') {
    // Deep processing
  } else {
    // Fast processing
  }
  
  return clone;
}

function createMyTransform(param: string): Transform {
  return (value: any) => {
    // Transform implementation
    return value;
  };
}

// Register the extension
XJX.registerNonTerminalExtension('myNonTerminalMethod', myNonTerminalMethod);
```

### Extension Testing

```typescript
// tests/extensions/my-extension.test.ts
import { XJX } from '../../src/XJX';
import '../../src/extensions/my-extension'; // Auto-registers

describe('MyExtension', () => {
  it('should process data correctly', () => {
    const xml = '<test>data</test>';
    
    const result = new XJX()
      .fromXml(xml)
      .myNonTerminalMethod('param')
      .myTerminalMethod({ format: 'json' });
    
    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
  });
  
  it('should validate inputs', () => {
    expect(() => {
      new XJX().myNonTerminalMethod('');
    }).toThrow('param1 cannot be empty');
  });
});
```

## Converter Development

Converters handle transformations between different data formats (XML, JSON, XNode).

### Converter Interface

```typescript
interface Converter<TInput, TOutput, TOptions = any> {
  convert(
    input: TInput,
    config: Configuration,
    options?: TOptions,
    beforeFn?: NodeCallback,
    afterFn?: NodeCallback
  ): TOutput;
}
```

### Creating a New Converter

#### Boilerplate Template

```typescript
// src/converters/my-format-to-xnode-converter.ts
import { Configuration } from '../core/config';
import { logger, ProcessingError, ValidationError } from '../core/error';
import { XNode, createElement, createTextNode, addChild } from '../core/xnode';
import { 
  Converter, 
  NodeCallback, 
  validateInput,
  applyNodeCallbacks
} from '../core/converter';

/**
 * Options for MyFormat conversion
 */
export interface MyFormatOptions {
  encoding?: string;
  strictMode?: boolean;
  customParsing?: boolean;
}

/**
 * MyFormat to XNode converter
 */
export const myFormatToXNodeConverter: Converter<MyFormatInput, XNode, MyFormatOptions> = {
  convert(
    input: MyFormatInput,
    config: Configuration,
    options?: MyFormatOptions,
    beforeFn?: NodeCallback,
    afterFn?: NodeCallback
  ): XNode {
    // API boundary validation
    validateInput(input !== null && input !== undefined, 'Input cannot be null or undefined');
    validateInput(isValidMyFormat(input), 'Input must be valid MyFormat');
    
    logger.debug('Starting MyFormat to XNode conversion', {
      inputType: typeof input,
      hasCallbacks: !!(beforeFn || afterFn),
      options
    });
    
    try {
      // Parse the input format
      const parsedData = parseMyFormat(input, options);
      
      // Convert to XNode tree
      const rootNode = convertToXNode(parsedData, config, beforeFn, afterFn);
      
      logger.debug('Successfully converted MyFormat to XNode', {
        rootNodeName: rootNode.name,
        rootNodeType: rootNode.type
      });
      
      return rootNode;
    } catch (err) {
      throw new ProcessingError(
        `Failed to convert MyFormat to XNode: ${err instanceof Error ? err.message : String(err)}`,
        input
      );
    }
  }
};

// Define your input type
type MyFormatInput = string | Buffer | MyFormatObject;

interface MyFormatObject {
  // Define your format structure
  version: string;
  data: any;
}

// Validation function
function isValidMyFormat(input: any): input is MyFormatInput {
  // Implement validation logic
  if (typeof input === 'string') {
    return input.trim().length > 0;
  }
  
  if (Buffer.isBuffer(input)) {
    return input.length > 0;
  }
  
  if (typeof input === 'object' && input !== null) {
    return 'version' in input && 'data' in input;
  }
  
  return false;
}

// Parsing function
function parseMyFormat(input: MyFormatInput, options?: MyFormatOptions): ParsedData {
  // Implement your parsing logic
  if (typeof input === 'string') {
    return parseStringFormat(input, options);
  }
  
  if (Buffer.isBuffer(input)) {
    return parseBufferFormat(input, options);
  }
  
  return parseObjectFormat(input as MyFormatObject, options);
}

interface ParsedData {
  // Define your parsed data structure
  elements: ParsedElement[];
  metadata: Record<string, any>;
}

interface ParsedElement {
  name: string;
  value?: any;
  attributes?: Record<string, any>;
  children?: ParsedElement[];
}

// Conversion functions
function convertToXNode(
  data: ParsedData,
  config: Configuration,
  beforeFn?: NodeCallback,
  afterFn?: NodeCallback
): XNode {
  // Create root element
  const root = createElement('root');
  applyNodeCallbacks(root, beforeFn);
  
  // Process elements
  data.elements.forEach(element => {
    const childNode = convertElement(element, config, beforeFn, afterFn);
    addChild(root, childNode);
  });
  
  // Add metadata if configured
  if (config.preserveComments && data.metadata) {
    root.metadata = { ...data.metadata };
  }
  
  applyNodeCallbacks(root, undefined, afterFn);
  return root;
}

function convertElement(
  element: ParsedElement,
  config: Configuration,
  beforeFn?: NodeCallback,
  afterFn?: NodeCallback
): XNode {
  const node = createElement(element.name);
  applyNodeCallbacks(node, beforeFn);
  
  // Set attributes
  if (element.attributes && config.preserveAttributes) {
    node.attributes = { ...element.attributes };
  }
  
  // Set value or children
  if (element.value !== undefined && config.preserveTextNodes) {
    node.value = element.value;
  } else if (element.children) {
    element.children.forEach(child => {
      const childNode = convertElement(child, config, beforeFn, afterFn);
      addChild(node, childNode);
    });
  }
  
  applyNodeCallbacks(node, undefined, afterFn);
  return node;
}

// Helper parsing functions
function parseStringFormat(input: string, options?: MyFormatOptions): ParsedData {
  // Implement string parsing logic
  return {
    elements: [],
    metadata: {}
  };
}

function parseBufferFormat(input: Buffer, options?: MyFormatOptions): ParsedData {
  // Implement buffer parsing logic
  return {
    elements: [],
    metadata: {}
  };
}

function parseObjectFormat(input: MyFormatObject, options?: MyFormatOptions): ParsedData {
  // Implement object parsing logic
  return {
    elements: [],
    metadata: { version: input.version }
  };
}
```

### Converter Testing

```typescript
// tests/converters/my-format-converter.test.ts
import { myFormatToXNodeConverter } from '../../src/converters/my-format-to-xnode-converter';
import { getDefaultConfig } from '../../src/core/config';
import { NodeType } from '../../src/core/dom';

describe('MyFormatToXNodeConverter', () => {
  const config = getDefaultConfig();
  
  it('should convert valid input', () => {
    const input = 'valid-my-format-data';
    
    const result = myFormatToXNodeConverter.convert(input, config);
    
    expect(result).toBeDefined();
    expect(result.type).toBe(NodeType.ELEMENT_NODE);
    expect(result.name).toBe('root');
  });
  
  it('should handle callbacks', () => {
    const beforeCalls: string[] = [];
    const afterCalls: string[] = [];
    
    const beforeFn = (node: XNode) => beforeCalls.push(node.name);
    const afterFn = (node: XNode) => afterCalls.push(node.name);
    
    myFormatToXNodeConverter.convert('input', config, {}, beforeFn, afterFn);
    
    expect(beforeCalls.length).toBeGreaterThan(0);
    expect(afterCalls.length).toBeGreaterThan(0);
  });
  
  it('should validate input', () => {
    expect(() => {
      myFormatToXNodeConverter.convert(null as any, config);
    }).toThrow('Input cannot be null or undefined');
  });
});
```

## Transform Development

Transforms are functions that modify values during processing.

### Transform Interface

```typescript
type Transform = (value: any, context?: TransformContext) => any;

interface TransformContext {
  intent?: TransformIntent;
  isAttribute?: boolean;
  attributeName?: string;
  path?: string;
  [key: string]: any;
}

enum TransformIntent {
  PARSE = 'parse',      // Convert strings to typed values
  SERIALIZE = 'serialize' // Convert typed values to strings
}
```

### Creating a New Transform

#### Boilerplate Template

```typescript
// src/transforms/my-transform.ts
import { 
  Transform, 
  TransformOptions, 
  TransformIntent, 
  createTransform 
} from '../core/transform';

/**
 * Options for MyTransform
 */
export interface MyTransformOptions extends TransformOptions {
  // Define your transform-specific options
  option1?: string;
  option2?: number;
  strictMode?: boolean;
}

/**
 * Create a transform that performs custom value transformation
 * 
 * @example
 * ```
 * // PARSE mode (default): Convert input values
 * xjx.transform(myTransform());
 * 
 * // With options
 * xjx.transform(myTransform({ 
 *   option1: 'value',
 *   strictMode: true
 * }));
 * 
 * // SERIALIZE mode: Convert for output
 * xjx.transform(myTransform({ 
 *   intent: TransformIntent.SERIALIZE,
 *   option2: 42
 * }));
 * ```
 * 
 * @param options Transform options
 * @returns A transform function
 */
export function myTransform(options: MyTransformOptions = {}): Transform {
  const {
    option1 = 'default',
    option2 = 0,
    strictMode = false,
    intent = TransformIntent.PARSE,
    ...transformOptions
  } = options;
  
  return createTransform((value: any, context?: any) => {
    // Handle null/undefined
    if (value == null) {
      return value;
    }
    
    // Get the current intent (from context or from options)
    const currentIntent = context?.intent || intent;
    
    // SERIALIZE mode: convert processed values to output format
    if (currentIntent === TransformIntent.SERIALIZE) {
      return serializeValue(value, options);
    }
    
    // PARSE mode: convert input values to processed format
    if (currentIntent === TransformIntent.PARSE) {
      return parseValue(value, options);
    }
    
    // No transformation needed
    return value;
  }, transformOptions);
}

/**
 * Parse value from input format
 */
function parseValue(value: any, options: MyTransformOptions): any {
  const { option1, strictMode } = options;
  
  // Handle different input types
  if (typeof value === 'string') {
    return parseStringValue(value, option1, strictMode);
  }
  
  if (typeof value === 'number') {
    return parseNumberValue(value, option1);
  }
  
  if (Array.isArray(value)) {
    return value.map(item => parseValue(item, options));
  }
  
  // Return unchanged for unsupported types
  return value;
}

/**
 * Serialize value to output format
 */
function serializeValue(value: any, options: MyTransformOptions): any {
  const { option2 } = options;
  
  // Implement serialization logic
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  
  if (typeof value === 'number') {
    return value.toFixed(option2);
  }
  
  return String(value);
}

/**
 * Parse string values
 */
function parseStringValue(value: string, option1?: string, strictMode?: boolean): any {
  // Implement string parsing logic
  const trimmed = value.trim();
  
  if (strictMode && !isValidInput(trimmed)) {
    throw new Error(`Invalid input for transform: ${value}`);
  }
  
  // Apply transformations based on option1
  switch (option1) {
    case 'uppercase':
      return trimmed.toUpperCase();
    case 'lowercase':
      return trimmed.toLowerCase();
    case 'capitalize':
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    default:
      return trimmed;
  }
}

/**
 * Parse number values
 */
function parseNumberValue(value: number, option1?: string): any {
  // Implement number parsing logic
  switch (option1) {
    case 'round':
      return Math.round(value);
    case 'floor':
      return Math.floor(value);
    case 'ceil':
      return Math.ceil(value);
    default:
      return value;
  }
}

/**
 * Validate input for strict mode
 */
function isValidInput(value: string): boolean {
  // Implement validation logic
  return value.length > 0 && !value.includes('invalid');
}
```

### Transform Testing

```typescript
// tests/transforms/my-transform.test.ts
import { myTransform, MyTransformOptions } from '../../src/transforms/my-transform';
import { TransformIntent } from '../../src/core/transform';

describe('MyTransform', () => {
  describe('PARSE mode', () => {
    it('should transform string values', () => {
      const transform = myTransform({ option1: 'uppercase' });
      
      expect(transform('hello')).toBe('HELLO');
      expect(transform('  world  ')).toBe('WORLD');
    });
    
    it('should handle arrays', () => {
      const transform = myTransform({ option1: 'capitalize' });
      
      expect(transform(['hello', 'world'])).toEqual(['Hello', 'World']);
    });
    
    it('should handle null values', () => {
      const transform = myTransform();
      
      expect(transform(null)).toBe(null);
      expect(transform(undefined)).toBe(undefined);
    });
  });
  
  describe('SERIALIZE mode', () => {
    it('should serialize values', () => {
      const transform = myTransform({ 
        intent: TransformIntent.SERIALIZE,
        option2: 2
      });
      
      expect(transform(3.14159)).toBe('3.14');
      expect(transform({ key: 'value' })).toBe('{"key":"value"}');
    });
  });
  
  describe('strict mode', () => {
    it('should validate input in strict mode', () => {
      const transform = myTransform({ strictMode: true });
      
      expect(() => transform('invalid')).toThrow('Invalid input for transform');
    });
  });
});
```

## Testing Strategy

### Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── core/               # Core functionality
│   ├── converters/         # Converter tests
│   ├── transforms/         # Transform tests
│   └── extensions/         # Extension tests
├── integration/            # Integration tests
│   ├── pipelines/          # Full pipeline tests
│   └── formats/            # Format compatibility tests
├── fixtures/               # Test data
│   ├── xml/               # XML test files
│   ├── json/              # JSON test files
│   └── expected/          # Expected outputs
└── helpers/               # Test utilities
```

### Test Utilities

```typescript
// tests/helpers/test-utils.ts
import { XJX } from '../../src/XJX';
import { Configuration, getDefaultConfig } from '../../src/core/config';
import { XNode } from '../../src/core/xnode';

/**
 * Create test XJX instance with optional config
 */
export function createTestXJX(config?: Partial<Configuration>): XJX {
  const testConfig = config ? { ...getDefaultConfig(), ...config } : getDefaultConfig();
  return new XJX(testConfig);
}

/**
 * Load test fixture file
 */
export function loadFixture(filename: string): string {
  // Implementation depends on test environment
  return require(`../fixtures/${filename}`);
}

/**
 * Compare XNode trees for equality
 */
export function compareXNodes(actual: XNode, expected: XNode): boolean {
  if (actual.name !== expected.name) return false;
  if (actual.type !== expected.type) return false;
  if (actual.value !== expected.value) return false;
  
  // Compare attributes
  if (!deepEqual(actual.attributes, expected.attributes)) return false;
  
  // Compare children
  if (actual.children?.length !== expected.children?.length) return false;
  
  if (actual.children) {
    for (let i = 0; i < actual.children.length; i++) {
      if (!compareXNodes(actual.children[i], expected.children![i])) {
        return false;
      }
    }
  }
  
  return true;
}

function deepEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
```

## Build & Distribution

### Build Configuration

The library uses Rollup for building multiple distribution formats:

```javascript
// rollup.config.js excerpt
export default [
  // ESM build
  {
    input: "src/index.ts",
    output: {
      dir: "dist/esm",
      format: "es",
      preserveModules: true,
    },
    external,
    plugins: [typescript(), commonPlugins],
  },
  
  // CommonJS build
  {
    input: "src/index.ts", 
    output: {
      dir: "dist/cjs",
      format: "cjs",
      preserveModules: true,
    },
    external,
    plugins: [typescript(), commonPlugins],
  },
  
  // UMD build (browser)
  {
    input: "src/index.ts",
    output: {
      file: "dist/umd/xjx.js",
      format: "umd",
      name: "XJX",
    },
    external,
    plugins: [typescript(), commonPlugins, terser()],
  }
];
```

### Package.json Configuration

```json
{
  "main": "./dist/cjs/index.js",
  "module": "./dist/esm/index.js", 
  "types": "./dist/types/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js",
      "types": "./dist/types/index.d.ts"
    }
  },
  "sideEffects": [
    "**/extensions/*.js",
    "**/index.js"
  ]
}
```

### Development Workflow

1. **Development**: `npm run dev` - Watch mode with type checking
2. **Testing**: `npm test` - Run all tests
3. **Building**: `npm run build` - Build all distribution formats
4. **Type Checking**: `npm run type-check` - TypeScript validation
5. **Linting**: `npm run lint` - ESLint validation

### Extension Auto-Registration

Extensions must be imported in the main index file to ensure registration:

```typescript
// src/index.ts
// IMPORTANT: Register all extensions by importing their files
import './extensions/from-xml';      // Registers fromXml()
import './extensions/from-json';     // Registers fromJson()
import './extensions/to-xml';        // Registers toXml()
import './extensions/to-json';       // Registers toJson()
import './extensions/functional-api'; // Registers filter(), map(), etc.

// Export main class and types
export { XJX } from './XJX';
export * from './core/config';
// ... other exports
```

This ensures that when users import XJX, all extensions are automatically available on the prototype.