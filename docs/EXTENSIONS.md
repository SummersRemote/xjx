# XJX Extensions Guide

This guide provides detailed information about the XJX extension system, which allows you to customize and extend the XJX library's fluent API.

## Table of Contents

- [Understanding the Extension System](#understanding-the-extension-system)
- [Types of Extensions](#types-of-extensions)
- [Built-in Extensions](#built-in-extensions)
- [Creating Custom Extensions](#creating-custom-extensions)
- [Advanced Use Cases](#advanced-use-cases)
- [Best Practices](#best-practices)

## Understanding the Extension System

The extension system in XJX provides a flexible way to add new methods to the fluent API. Extensions are registered with the XJX class and become available on all instances of XJX.

Key features of the extension system:

- **Modular**: Extensions can be created and registered independently
- **Chainable**: Non-terminal extensions return the XJX instance for further chaining
- **Type-safe**: Extensions integrate with TypeScript type definitions
- **Self-documenting**: Extensions follow a consistent naming and documentation pattern

## Types of Extensions

There are two types of extensions in XJX:

### Terminal Extensions

Terminal extensions are methods that produce a final result and end the fluent API chain. They return a value rather than the XJX instance.

```javascript
// Terminal extension
XJX.registerTerminalExtension("toXjxJson", function() {
  // Implementation...
  return jsonResult;
});
```

### Non-Terminal Extensions

Non-terminal extensions are methods that return the XJX instance, allowing for method chaining to continue.

```javascript
// Non-terminal extension
XJX.registerNonTerminalExtension("withConfig", function(config) {
  // Implementation...
  return this; // Automatically handled by the extension system
});
```

## Built-in Extensions

XJX includes several built-in extensions for its fluent API:

### Terminal Extensions (Return Values)

These extensions produce a final result and end the fluent API chain:

- **XML Output Extensions**:
  - `toXml()` - Convert to DOM Document
  - `toXmlString(options?)` - Convert to XML string with optional formatting settings

- **XJX JSON Output Extensions**:
  - `toXjxJson()` - Convert to XJX-formatted JSON object (full XML fidelity)
  - `toXjxJsonString()` - Convert to XJX-formatted JSON string

- **Standard JSON Output Extensions**:
  - `toStandardJson()` - Convert to standard JavaScript object (natural structure)
  - `toStandardJsonString()` - Convert to standard JSON string

### Non-Terminal Extensions (Return XJX Instance)

These extensions return the XJX instance for further chaining:

- `fromXml(xml)` - Set XML string as the source
- `fromJson(json)` - Set JSON object as source (auto-detects format)
- `fromXjxJson(json)` - Set XJX-formatted JSON as source
- `fromObjJson(json)` - Set standard JavaScript object as source
- `withConfig(config)` - Set configuration options
- `withTransforms(...transforms)` - Add transforms to the pipeline
- `setLogLevel(level)` - Set logger level

## Creating Custom Extensions

You can create and register your own extensions to extend the XJX API:

### Creating a Terminal Extension

```typescript
import { XJX } from 'xjx';

// Create a terminal extension that converts to a different format
function toYamlString(this: XJX): string {
  // First, validate source
  this.validateSource();
  
  // Get JSON representation
  const json = this.toStandardJson();
  
  // Convert to YAML (example implementation)
  const yaml = convertJsonToYaml(json);
  
  return yaml;
}

// Register the extension
XJX.registerTerminalExtension("toYamlString", toYamlString);

// Update TypeScript interface (in a .d.ts file)
declare module 'xjx' {
  interface XJX {
    toYamlString(): string;
  }
}

// Usage
const yaml = new XJX()
  .fromXml(xml)
  .toYamlString();
```

### Creating a Non-Terminal Extension

```typescript
import { XJX, Transform } from 'xjx';

// Create a non-terminal extension that adds multiple transforms
function withTypeConversion(this: XJX): void {
  // Add commonly used data type conversions
  const transforms: Transform[] = [
    new BooleanTransform(),
    new NumberTransform()
  ];
  
  // Use existing withTransforms extension
  this.withTransforms(...transforms);
  
  // No return needed - handled by the extension system
}

// Register the extension
XJX.registerNonTerminalExtension("withTypeConversion", withTypeConversion);

// Update TypeScript interface (in a .d.ts file)
declare module 'xjx' {
  interface XJX {
    withTypeConversion(): XJX;
  }
}

// Usage
const json = new XJX()
  .fromXml(xml)
  .withTypeConversion()
  .toStandardJson();
```

## Advanced Use Cases

### Composite Extensions

You can create composite extensions that combine multiple operations:

```typescript
import { XJX } from 'xjx';

// Create a terminal extension that performs validation before conversion
function toValidatedXmlString(this: XJX, schema: string): string {
  // First, validate source
  this.validateSource();
  
  // Apply schema validation transform
  this.withTransforms(new SchemaValidationTransform(schema));
  
  // Convert to XML string
  return this.toXmlString();
}

// Register the extension
XJX.registerTerminalExtension("toValidatedXmlString", toValidatedXmlString);

// Usage
try {
  const validXml = new XJX()
    .fromJson(json)
    .toValidatedXmlString(xsdSchema);
  console.log("Validation passed:", validXml);
} catch (error) {
  console.error("Validation failed:", error);
}
```

### Extensions with State

Extensions can maintain state using object properties:

```typescript
import { XJX } from 'xjx';

// Create a non-terminal extension that captures metrics
function withMetrics(this: XJX): void {
  // Initialize metrics object if needed
  if (!this._metrics) {
    this._metrics = {
      startTime: Date.now(),
      operations: []
    };
  }
  
  // Wrap transformations to measure performance
  const originalWithTransforms = this.withTransforms;
  this.withTransforms = function(...transforms) {
    const start = performance.now();
    const result = originalWithTransforms.apply(this, transforms);
    const end = performance.now();
    
    this._metrics.operations.push({
      type: 'transforms',
      count: transforms.length,
      duration: end - start
    });
    
    return result;
  };
}

// Create a terminal extension to retrieve metrics
function getMetrics(this: XJX): any {
  return this._metrics || { operations: [] };
}

// Register the extensions
XJX.registerNonTerminalExtension("withMetrics", withMetrics);
XJX.registerTerminalExtension("getMetrics", getMetrics);

// Usage
const xjx = new XJX()
  .withMetrics()
  .fromXml(xml)
  .withTransforms(
    new BooleanTransform(),
    new NumberTransform()
  )
  .toStandardJson();

const metrics = xjx.getMetrics();
console.log("Performance metrics:", metrics);
```

## Best Practices

When creating and using extensions, follow these best practices:

### 1. Extension Naming

Use clear, descriptive names that follow XJX's conventions:

```javascript
// Good: Clear about what it does
XJX.registerTerminalExtension("toHtmlString", toHtmlString);

// Bad: Unclear purpose
XJX.registerTerminalExtension("process", process);
```

Terminal extensions should use names that indicate what they return:
- `toXmlString()` - Returns XML string
- `toXjxJson()` - Returns XJX JSON object
- `toStandardJsonString()` - Returns standard JSON string

Non-terminal extensions should use names that indicate what they do:
- `withConfig()` - Sets configuration
- `fromXml()` - Sets XML source
- `withTransforms()` - Adds transforms

### 2. Extension Implementation

Extensions should follow XJX's implementation patterns:

```javascript
// Good: Validates input and uses XJX's error handling
function myExtension(this: XJX, param: string): void {
  try {
    // Validate parameter
    validate(typeof param === "string", "Parameter must be a string");
    
    // Implementation...
  } catch (err) {
    handleError(err, "my extension operation", {
      data: { param },
      errorType: ErrorType.VALIDATION
    });
  }
}

// Bad: No validation or error handling
function myExtension(this: XJX, param: string): void {
  // Implementation without validation...
}
```

### 3. Type Definitions

Always provide TypeScript type definitions for your extensions:

```typescript
// In your .d.ts file
declare module 'xjx' {
  interface XJX {
    // Terminal extension
    toCustomFormat(): string;
    
    // Non-terminal extension
    withCustomFeature(options: CustomOptions): XJX;
  }
}
```

### 4. Documentation

Document your extensions thoroughly:

```javascript
/**
 * Convert XNode to HTML string with syntax highlighting
 * 
 * @param options - Highlighting options
 * @param options.theme - Color theme (default: 'light')
 * @param options.lineNumbers - Whether to show line numbers (default: false)
 * @returns HTML string with syntax highlighting
 * 
 * @example
 * ```javascript
 * const html = new XJX()
 *   .fromXml(xml)
 *   .toHtmlString({ theme: 'dark', lineNumbers: true });
 * ```
 */
function toHtmlString(this: XJX, options?: HighlightOptions): string {
  // Implementation...
}
```

### 5. Extension Dependencies

Be mindful of dependencies between extensions:

```javascript
// Good: Uses existing methods and handles errors
function toFormattedXmlString(this: XJX): string {
  try {
    // Use existing toXmlString method
    return this.toXmlString({
      prettyPrint: true,
      indent: 4,
      declaration: true
    });
  } catch (err) {
    return handleError(err, "format XML string", {
      fallback: "<root/>"
    });
  }
}

// Bad: Reimplements existing functionality
function toFormattedXmlString(this: XJX): string {
  // Duplicates toXmlString implementation...
}
```

### 6. Extension Registration

Register extensions properly:

```javascript
// Good: Correct extension type
XJX.registerTerminalExtension("toXjxJson", toXjxJson);
XJX.registerNonTerminalExtension("fromXml", fromXml);

// Bad: Wrong extension type
XJX.registerTerminalExtension("fromXml", fromXml); // Should be non-terminal
XJX.registerNonTerminalExtension("toXjxJson", toXjxJson); // Should be terminal
```

## Conclusion

The extension system in XJX provides a powerful way to enhance the library's capabilities. By creating custom extensions, you can add support for new formats, implement specialized transformations, or integrate with other libraries and tools.

With the consistent naming pattern across all output methods (`toXml()`, `toXmlString()`, `toXjxJson()`, `toXjxJsonString()`, `toStandardJson()`, `toStandardJsonString()`), users can easily understand and use the API intuitively.

For more information on the transform system, which complements the extension system, see the [Transforms Guide](./TRANSFORMS.md).