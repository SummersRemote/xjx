# XJX Library - AI Technical Brief

This document provides a technical overview of the XJX library for AI assistants focused on debugging, feature development, and advanced usage scenarios.

## Core Architecture Overview

**XJX** is a fluent API XML/JSON transformation library built around these key concepts:

### 1. XNode - Universal Tree Representation
```typescript
interface XNode {
  name: string;                    // Element name
  type: number;                   // NodeType enum (1=element, 3=text, etc.)
  value?: any;                    // Content/value
  attributes?: Record<string, any>; // Element attributes
  children?: XNode[];             // Child nodes
  parent?: XNode;                 // Parent reference
  namespace?: string;             // Namespace URI
  prefix?: string;                // Namespace prefix
  metadata?: Record<string, any>; // Custom metadata
}
```

**Key Point**: Everything flows through XNode. XML → XNode → JSON, JSON → XNode → XML, functional operations work on XNode trees.

### 2. Extension Registration System
```typescript
// Terminal extensions (return values, end chain)
XJX.registerTerminalExtension("toJson", function() { /* implementation */ });

// Non-terminal extensions (return this, enable chaining)  
XJX.registerNonTerminalExtension("filter", function() { /* implementation */ });
```

**Location**: Extensions auto-register via imports in `src/index.ts`
**Pattern**: Each extension is a separate file in `src/extensions/`

### 3. Converter Pattern
**Purpose**: Handle format transformations (XML ↔ XNode ↔ JSON)
**Location**: `src/converters/`
**Key Files**:
- `xml-to-xnode-converter.ts` - XML parsing to XNode
- `xnode-to-xml-converter.ts` - XNode to XML serialization  
- `json-std-to-xnode-converter.ts` - Standard JSON to XNode
- `xnode-to-json-std-converter.ts` - XNode to standard JSON
- `json-hifi-to-xnode-converter.ts` - High-fidelity JSON to XNode
- `xnode-to-json-hifi-converter.ts` - XNode to high-fidelity JSON

## Critical Code Patterns

### Extension Implementation Pattern
```typescript
// src/extensions/my-extension.ts
export function myMethod(this: TerminalExtensionContext, ...args): ReturnType {
  try {
    // 1. Input validation
    validateInput(condition, "error message");
    
    // 2. Apply pending transforms if needed
    let nodeToProcess = this.xnode as XNode;
    if (this.transforms?.length > 0) {
      nodeToProcess = transformXNode(nodeToProcess, this.transforms, this.config);
    }
    
    // 3. Core logic
    const result = processNode(nodeToProcess);
    
    // 4. Return result
    return result;
  } catch (err) {
    // Standard error handling pattern
    if (err instanceof Error) throw err;
    throw new Error(`Failed in myMethod: ${String(err)}`);
  }
}

// Register extension
XJX.registerTerminalExtension("myMethod", myMethod);
```

### Transform Usage Pattern
Transforms are **NOT** chainable methods. They're functions used within `map()`:

```typescript
// CORRECT - transforms used in map()
new XJX()
  .fromXml(xml)
  .map(node => {
    if (node.name === 'price' && node.value) {
      node.value = toNumber({ precision: 2 })(node.value);
    }
    return node;
  })
  .toJson();

// INCORRECT - no .transform() method exists
// new XJX().fromXml(xml).transform(toNumber()).toJson();
```

## Configuration System

**Location**: `src/core/config.ts`
**Usage**: Controls all transformation behavior
**Key Strategies**:
- `highFidelity: boolean` - Perfect round-trip preservation
- `attributeStrategy`: 'merge' | 'prefix' | 'property'
- `arrayStrategy`: 'multiple' | 'always' | 'never'
- `emptyElementStrategy`: 'object' | 'null' | 'string' | 'remove'

## Debugging Common Issues

### 1. Extension Not Available
**Symptom**: `TypeError: xjx.myMethod is not a function`
**Fix**: Ensure extension file is imported in `src/index.ts`
```typescript
// src/index.ts
import './extensions/my-extension'; // Required for auto-registration
```

### 2. Transform Not Working
**Check**: Transforms are used correctly within `map()`, not as chained methods
**Check**: Transform function is called: `toNumber()(value)` not `toNumber(value)`

### 3. Conversion Issues
**Check**: Configuration strategies match expected format
**Check**: High-fidelity mode for round-trip conversions
**Debug**: Enable logging: `new XJX().withLogLevel('debug')`

### 4. Namespace Problems
**Check**: `preserveNamespaces: true` in config
**Check**: `preservePrefixedNames: true` for prefixed element names
**Location**: Namespace logic in `xml-to-xnode-converter.ts`

## File Organization

```
src/
├── core/                    # Core utilities and interfaces
│   ├── config.ts           # Configuration system
│   ├── xnode.ts           # XNode interface and utilities
│   ├── converter.ts       # Base converter interface
│   ├── transform.ts       # Transform system
│   └── error.ts           # Error handling
├── converters/             # Format conversion logic
├── extensions/             # Fluent API methods
│   ├── from-*.ts          # Source methods (fromXml, fromJson)
│   ├── to-*.ts            # Output methods (toXml, toJson)
│   ├── functional-api.ts  # filter, map, select, reduce
│   └── config-extensions.ts # withConfig, withLogLevel
├── transforms/             # Value transformation functions
└── index.ts               # Main exports + extension registration
```

## Adding New Features

### New Extension Method
1. Create file in `src/extensions/new-method.ts`
2. Implement using extension patterns above
3. Register with `XJX.registerTerminalExtension` or `XJX.registerNonTerminalExtension`
4. Import in `src/index.ts`
5. Add tests in `tests/extensions/`

### New Format Support
1. Create converter in `src/converters/myformat-to-xnode-converter.ts`
2. Implement `Converter<TInput, XNode>` interface
3. Create extension that uses converter
4. Add configuration options if needed

### New Transform
1. Create file in `src/transforms/my-transform.ts`
2. Implement `Transform` type: `(value: any, context?: TransformContext) => any`
3. Export from `src/transforms/index.ts`
4. Add to main index exports

## Test Patterns

**Location**: `tests/` mirrors `src/` structure
**Pattern**: Each extension/converter has corresponding test file
**Key**: Extensions are tested by importing their files (auto-registration)

```typescript
// tests/extensions/my-extension.test.ts
import { XJX } from '../../src/XJX';
import '../../src/extensions/my-extension'; // Registers extension

describe('MyExtension', () => {
  it('should work', () => {
    const result = new XJX().fromXml('<test/>').myMethod();
    expect(result).toBeDefined();
  });
});
```

## Performance Considerations

- **Immutability**: Operations create new objects, don't mutate
- **Deep Cloning**: Use `cloneNode(node, true)` for XNode cloning  
- **Memory**: Large transforms should process in chunks
- **DOM**: Browser DOM operations are expensive, minimize DOM creation

## Advanced Usage Scenarios

### Custom High-Fidelity Format
- Extend JSON HiFi converters for domain-specific metadata
- Use `metadata` property on XNodes for custom annotations

### Stream Processing
- Process large documents via `select()` to reduce memory footprint
- Use `reduce()` for aggregations without loading full result set

### Schema Validation
- Implement via `map()` with validation transforms
- Use `filter()` to remove invalid nodes
- Leverage `metadata` for validation state tracking

## Quick Reference - Method Categories

**Source** (Non-terminal): `fromXml()`, `fromJson()`, `fromXnode()`
**Processing** (Non-terminal): `filter()`, `map()`, `select()`  
**Output** (Terminal): `toXml()`, `toJson()`, `toXnode()`, `reduce()`
**Config** (Non-terminal): `withConfig()`, `withLogLevel()`, `withRoot()`, `flatten()`
**Transforms** (Functions): `toNumber()`, `toBoolean()`, `regex()`, `compose()`

Remember: Transform functions are used **within** `map()`, not as chained methods.