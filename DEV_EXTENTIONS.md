# XJX Extension Developer Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Extension System Overview](#extension-system-overview)
3. [Terminal vs. Non-Terminal Extensions](#terminal-vs-non-terminal-extensions)
4. [Creating Terminal Extensions](#creating-terminal-extensions)
5. [Creating Non-Terminal Extensions](#creating-non-terminal-extensions)
6. [Accessing Configuration and Context](#accessing-configuration-and-context)
7. [Registering Extensions](#registering-extensions)
8. [Complete Extension Examples](#complete-extension-examples)
9. [Integration and Usage](#integration-and-usage)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

## Introduction

The XJX library provides a powerful extension mechanism that allows developers to enhance its functionality. Extensions integrate directly with the fluent API, enabling both standalone usage and seamless chaining in method calls.

This guide explains how to create, register, and use extensions for the XJX library. You'll learn about the different types of extensions, how to implement them, and best practices for extension development.

## Extension System Overview

There are two types of extensions in XJX:

1. **Terminal Extensions**: Return a value and typically end a method chain
2. **Non-Terminal Extensions**: Return the builder instance (`this`) to enable method chaining

Extensions are registered with the `XJX` class and are then available both as static methods on the `XJX` class and as instance methods on the `XjxBuilder` class for fluent API usage.

## Terminal vs. Non-Terminal Extensions

### Terminal Extensions

- End the method chain
- Return a value (not `this`)
- Often perform an operation that produces a result
- Typically named with prefixes like `to...` or `get...`
- Examples: `toJsonSchema()`, `getPath()`

### Non-Terminal Extensions

- Continue the method chain
- Always return `this` (the builder instance)
- Modify the builder's state or add configuration
- Typically named with prefixes like `with...` or `add...`
- Examples: `withDataTypeConversions()`, `withValidation()`

## Creating Terminal Extensions

Terminal extensions return a value other than the builder instance and typically end the method chain.

### Terminal Extension Structure

```typescript
/**
 * Example terminal extension function
 * 
 * @param {any} arg1 First argument
 * @param {any} arg2 Second argument
 * @returns {any} Result value
 */
function myTerminalExtension(arg1, arg2) {
  // Access the builder's configuration
  const config = this.config;
  
  // Perform operations using config and arguments
  const result = /* ... */;
  
  // Return the result (not this)
  return result;
}

// Register the terminal extension
XJX.registerTerminalExtension("toMyResult", myTerminalExtension);
```

### Terminal Extension Boilerplate

Here's a typical boilerplate for creating a terminal extension:

```typescript
// =====================================================================================
// MyTerminalExtension.ts
//
// Extension that adds a terminal method to the XJX library
// =====================================================================================

import { XJX } from "../core/XJX";

/**
 * My terminal extension description
 * 
 * @param {Type} param1 Description of param1
 * @param {Type} param2 Description of param2
 * @returns {ResultType} Description of return value
 */
function myTerminalFunction(param1, param2) {
  // Access the builder's configuration
  const config = this.config;
  
  // Implement extension logic
  const result = /* ... */;
  
  // Return result (not this)
  return result;
}

// Register the terminal extension
XJX.registerTerminalExtension("toMyResult", myTerminalFunction);

// =====================================================================================
// END OF FILE
// =====================================================================================
```

## Creating Non-Terminal Extensions

Non-terminal extensions return the builder instance (`this`) and allow method chaining to continue.

### Non-Terminal Extension Structure

```typescript
/**
 * Example non-terminal extension function
 * 
 * @param {any} arg1 First argument
 * @param {any} arg2 Second argument
 * @returns {XjxBuilder} The builder instance for chaining
 */
function myNonTerminalExtension(arg1, arg2) {
  // Access the builder's configuration
  const config = this.config;
  
  // Modify the builder's state
  this.someProperty = /* ... */;
  
  // Call other builder methods
  this.withTransforms(/* ... */);
  
  // ALWAYS return this for chaining
  return this;
}

// Register the non-terminal extension
XJX.registerNonTerminalExtension("withMyFeature", myNonTerminalExtension);
```

### Non-Terminal Extension Boilerplate

Here's a typical boilerplate for creating a non-terminal extension:

```typescript
// =====================================================================================
// MyNonTerminalExtension.ts
//
// Extension that adds a non-terminal method to the XJX library
// =====================================================================================

import { XJX } from "../core/XJX";

/**
 * My non-terminal extension description
 * 
 * @param {Type} param1 Description of param1
 * @param {Type} param2 Description of param2
 * @returns {XjxBuilder} The builder instance for chaining
 */
function myNonTerminalFunction(param1, param2) {
  // Access the builder's configuration
  const config = this.config;
  
  // Implement extension logic
  // Modify builder state, add transformers, etc.
  
  // ALWAYS return this for chaining
  return this;
}

// Register the non-terminal extension
XJX.registerNonTerminalExtension("withMyFeature", myNonTerminalFunction);

// =====================================================================================
// END OF FILE
// =====================================================================================
```

## Accessing Configuration and Context

Inside extension functions, `this` refers to:

1. In fluent API: The `XjxBuilder` instance with all properties and methods
2. In static usage: A context object with the configuration

### Available Properties and Methods in Extension Context

When creating extensions, you can access:

```typescript
// Configuration (always available)
this.config                 // Current configuration object

// Additional properties (only in fluent API context)
this.source                 // Source XML or JSON
this.sourceType             // 'xml' or 'json'
this.transforms             // Array of registered transformers

// Additional methods (only in fluent API context)
this.withTransforms()       // Add transformers
this.withConfig()           // Modify configuration
```

### Example: Using Configuration and Context

```typescript
function myExtension(options = {}) {
  // Access and use configuration
  const preserveComments = this.config.preserveComments;
  const propNames = this.config.propNames;
  
  // In fluent context, add transformers
  if (this.withTransforms) {
    this.withTransforms(
      new CustomTransform(options)
    );
  }
  
  // Return this for non-terminal or result for terminal
  return this; // or return result;
}
```

## Registering Extensions

Extensions are registered using two methods in the `XJX` class:

### 1. Register Terminal Extensions

```typescript
/**
 * Register a terminal extension method (returns a value)
 * @param name Extension name (e.g., 'toJsonSchema')
 * @param method Implementation function
 */
XJX.registerTerminalExtension(name, method);
```

### 2. Register Non-Terminal Extensions

```typescript
/**
 * Register a non-terminal extension method (returns this for chaining)
 * @param name Extension name (e.g., 'withDataTypeConversions')
 * @param method Implementation function
 */
XJX.registerNonTerminalExtension(name, method);
```

### Naming Conventions

- Terminal extensions: `to*` or `get*` (e.g., `toJsonSchema`, `getPath`)
- Non-terminal extensions: `with*` or `add*` (e.g., `withDataTypeConversions`)

## Complete Extension Examples

### Example 1: Terminal Extension (toJsonSchema)

```typescript
// src/extensions/GetJsonSchemaExtension.ts
import { XJX } from "../core/XJX";
import { JSONObject } from "../core/types/json-types";
import { XJXError } from "../core/types/error-types";

function getJsonSchema() {
  try {
    // Use 'this.config' which is available in the extension context
    const config = this.config;
    const propNames = config.propNames;
    
    // Generate schema based on configuration
    const schema = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      title: "XJX JSON Schema",
      description: "Schema for JSON representation of XML documents",
      // ... schema generation logic based on config ...
    };
    
    return schema;
  } catch (error) {
    throw new XJXError(`Schema generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Register the terminal extension
XJX.registerTerminalExtension("toJsonSchema", getJsonSchema);
```

### Example 2: Non-Terminal Extension (withDataTypeConversions)

```typescript
// src/extensions/DataTypeConversionsExtension.ts
import { XJX } from "../core/XJX";
import { BooleanTransform } from "../fluent/transforms/boolean-transform";
import { NumberTransform } from "../fluent/transforms/number-transform";

function withDataTypeConversions(options = {
  booleanOptions: {
    trueValues: ['true', 'yes', '1', 'on'],
    falseValues: ['false', 'no', '0', 'off'],
    ignoreCase: true
  },
  numberOptions: {
    integers: true,
    decimals: true,
    scientific: true,
    strictParsing: true
  }
}) {
  // Add boolean transformer
  this.withTransforms(new BooleanTransform(options.booleanOptions));
  
  // Add number transformer
  this.withTransforms(new NumberTransform(options.numberOptions));
  
  // Return this for chaining
  return this;
}

// Register the non-terminal extension
XJX.registerNonTerminalExtension("withDataTypeConversions", withDataTypeConversions);
```

## Integration and Usage

### Extension Modules

Create individual extension files in the `src/extensions` directory:

```
src/
  ├── extensions/
  │   ├── GetPathExtension.ts
  │   ├── GetJsonSchemaExtension.ts
  │   ├── DataTypeConversionsExtension.ts
  │   └── index.ts  // Import and register all extensions
```

### Entry Point for Extensions

Create an entry point to register all extensions:

```typescript
// src/extensions/index.ts
import './GetPathExtension';
import './GetJsonSchemaExtension';
import './DataTypeConversionsExtension';

// Export nothing - the imports above are only for side effects (registration)
export {};
```

### Using Extensions in the Library

```typescript
// src/index.ts
export * from './core/XJX';
export * from './fluent/xjx-builder';
// ... other exports ...

// Import all extensions to ensure they're registered
import './extensions';
```

### Example Usage of Extensions

```typescript
// Terminal extension usage (fluent API)
const schema = XJX.fromXml(xml)
  .withConfig({ preserveNamespaces: true })
  .toJsonSchema();

// Terminal extension usage (static)
const schema = XJX.toJsonSchema();

// Non-terminal extension usage (fluent API)
const json = XJX.fromXml(xml)
  .withDataTypeConversions()
  .toJson();

// Non-terminal extension usage (static)
const builder = XJX.withDataTypeConversions()
  .fromXml(xml);
```

## Best Practices

### 1. Extension Naming

- Use clear, descriptive names
- Follow naming conventions:
  - Terminal: `to*` or `get*` (`toJsonSchema`, `getPath`)
  - Non-terminal: `with*` or `add*` (`withDataTypeConversions`)

### 2. Function Structure

- Document parameters and return types
- Keep extensions focused on a single responsibility
- Handle errors gracefully

### 3. Terminal vs. Non-Terminal

- Be consistent with return values:
  - Terminal: Return a value (not `this`)
  - Non-terminal: ALWAYS return `this`

### 4. Configuration Access

- Use `this.config` to access current configuration
- Don't modify configuration directly unless that's the extension's purpose

### 5. Documentation

- Include JSDoc comments for all extensions
- Document parameters, return values, and examples
- Explain the purpose and behavior of the extension

### 6. Testing

- Write tests for all extensions
- Test both fluent API and static usage
- Cover error cases and edge conditions

## Troubleshooting

### Common Issues

**Issue**: Extension is not available on `XJX` or in the fluent API
**Solution**: Ensure the extension is properly registered and the extension file is imported

**Issue**: Type errors in extension implementation
**Solution**: Add proper TypeScript interfaces and type annotations

**Issue**: Extension doesn't have access to expected builder methods
**Solution**: Verify the extension is registered as the correct type (terminal or non-terminal)

**Issue**: Configuration changes aren't reflected in extension
**Solution**: Ensure you're accessing `this.config` directly, not storing it in a variable at initialization

### Debugging Tips

- Add console.log statements to verify extension registration
- Check the context (`this`) inside your extension function
- Verify extension file import paths
- Use TypeScript to catch type errors early

---

This guide provides a comprehensive overview of the XJX extension system. By following these guidelines, you can create powerful extensions that enhance the XJX library's functionality while maintaining its fluent API style.