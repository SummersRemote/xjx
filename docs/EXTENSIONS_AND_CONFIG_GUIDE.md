# XJX Extension Developer Guide

This comprehensive guide covers everything you need to know about creating extensions for the XJX library using the ultra-simplified configuration system.

## Table of Contents

1. [Extension Types](#extension-types)
2. [Registration Patterns](#registration-patterns)
3. [Configuration System](#configuration-system)
4. [Hooks and Lifecycle](#hooks-and-lifecycle)
5. [Composition Patterns](#composition-patterns)
6. [Best Practices](#best-practices)
7. [Templates](#templates)
8. [Advanced Patterns](#advanced-patterns)

## Extension Types

### Terminal Extensions

Terminal extensions **return values** and end the fluent chain. They typically convert XNode data to output formats.

**Examples:** `toJson()`, `toXml()`, `toCsv()`, `toYaml()`

**Usage Pattern:**
```typescript
const result = xjx.fromXml(xml).toJson();  // Returns JsonValue
const csv = xjx.fromXml(xml).toCsv();      // Returns string
```

### Non-Terminal Extensions

Non-terminal extensions **return `this`** to enable method chaining. They typically transform data or set up processing.

**Examples:** `fromJson()`, `map()`, `filter()`, `withConfig()`

**Usage Pattern:**
```typescript
const result = xjx
  .fromJson(json)     // Returns this
  .map(transform)     // Returns this
  .filter(predicate)  // Returns this
  .toJson();          // Terminal - returns JsonValue
```

## Registration Patterns

### Basic Registration

The ultra-simplified registration system requires just one method call:

```typescript
// Terminal extension (returns a value)
XJX.registerTerminalExtension("toMyFormat", toMyFormat, {
  myFormat: {
    option1: "default1",
    option2: true
  }
});

// Non-terminal extension (returns this)
XJX.registerNonTerminalExtension("fromMyFormat", fromMyFormat, {
  myFormat: {
    parseMode: "strict",
    encoding: "utf8"
  }
});

// Extension without configuration
XJX.registerTerminalExtension("toPlainText", toPlainText);
```

### Multiple Configuration Properties

Extensions can register multiple configuration objects:

```typescript
XJX.registerTerminalExtension("toAdvanced", toAdvanced, {
  format: {
    style: "pretty",
    colors: true
  },
  output: {
    compression: "gzip",
    encoding: "utf8"
  },
  advanced: {
    caching: false,
    parallel: true
  }
});
```

## Configuration System

### Advanced: Register Configuration Interface (Optional)

Define your configuration with TypeScript interfaces and module augmentation for improved TypeScript support:

```typescript
// Define your configuration options
export interface MyFormatOptions {
  outputStyle: 'compact' | 'pretty' | 'minimal';
  includeMetadata: boolean;
  maxDepth: number;
  
  // Nested options for logical grouping
  formatting: {
    indentSize: number;
    lineEnding: 'lf' | 'crlf';
    colorOutput: boolean;
  };
  
  // Optional advanced features
  advanced?: {
    caching?: boolean;
    parallelProcessing?: boolean;
  };
}

// Extend the main Configuration interface
declare module '../core/config' {
  interface Configuration {
    myFormat?: MyFormatOptions;  // Always optional for users
  }
}
```

### Configuration Access

Extensions access configuration through the pipeline:

```typescript
export function toMyFormat(this: TerminalExtensionContext): string {
  // Configuration is guaranteed to exist due to defaults
  const config = this.pipeline.config.get().myFormat!;
  
  // Use configuration values
  if (config.outputStyle === 'pretty') {
    return formatPretty(this.xnode!, config);
  } else {
    return formatCompact(this.xnode!, config);
  }
}
```

### Configuration Defaults

Provide comprehensive defaults during registration:

```typescript
const MY_FORMAT_DEFAULTS: MyFormatOptions = {
  outputStyle: 'pretty',
  includeMetadata: true,
  maxDepth: 10,
  formatting: {
    indentSize: 2,
    lineEnding: 'lf',
    colorOutput: false
  }
  // advanced is optional, so no default needed
};

XJX.registerTerminalExtension("toMyFormat", toMyFormat, {
  myFormat: MY_FORMAT_DEFAULTS
});
```

## Hooks and Lifecycle

### Output Hooks (Terminal Extensions)

Terminal extensions should support output hooks for user customization:

```typescript
export function toMyFormat(
  this: TerminalExtensionContext, 
  hooks?: OutputHooks<string>
): string {
  try {
    this.validateSource();
    
    let processedNode = this.xnode!;
    
    // Apply beforeTransform hook to XNode
    if (hooks?.beforeTransform) {
      try {
        const beforeResult = hooks.beforeTransform(processedNode);
        if (beforeResult && typeof beforeResult === 'object' && typeof beforeResult.name === 'string') {
          processedNode = beforeResult;
        }
      } catch (err) {
        this.pipeline.logger.warn(`Error in beforeTransform: ${err}`);
      }
    }
    
    // Your conversion logic here
    let result = convertToMyFormat(processedNode, this.pipeline.config.get().myFormat!);
    
    // Apply afterTransform hook to final result
    if (hooks?.afterTransform) {
      try {
        const afterResult = hooks.afterTransform(result);
        if (afterResult !== undefined && afterResult !== null) {
          result = afterResult;
        }
      } catch (err) {
        this.pipeline.logger.warn(`Error in afterTransform: ${err}`);
      }
    }
    
    return result;
  } catch (err) {
    throw new Error(`Failed to convert to MyFormat: ${String(err)}`);
  }
}
```

### Source Hooks (Non-Terminal Extensions)

Non-terminal extensions should support source hooks:

```typescript
export function fromMyFormat(
  this: NonTerminalExtensionContext,
  input: string,
  hooks?: SourceHooks<string>
): void {
  try {
    let processedInput = input;
    
    // Apply beforeTransform hook to input
    if (hooks?.beforeTransform) {
      try {
        const beforeResult = hooks.beforeTransform(processedInput);
        if (beforeResult !== undefined && beforeResult !== null) {
          processedInput = beforeResult;
        }
      } catch (err) {
        this.pipeline.logger.warn(`Error in beforeTransform: ${err}`);
      }
    }
    
    // Your parsing logic here
    let resultNode = parseMyFormat(processedInput, this.pipeline.config.get().myFormat!);
    
    // Apply afterTransform hook to XNode result
    if (hooks?.afterTransform) {
      try {
        const afterResult = hooks.afterTransform(resultNode);
        if (afterResult && typeof afterResult === 'object' && typeof afterResult.name === 'string') {
          resultNode = afterResult;
        }
      } catch (err) {
        this.pipeline.logger.warn(`Error in afterTransform: ${err}`);
      }
    }
    
    this.xnode = resultNode;
  } catch (err) {
    throw new Error(`Failed to parse MyFormat: ${String(err)}`);
  }
}
```

### Node Hooks (Transform Extensions)

Transform extensions use node hooks:

```typescript
export function myTransform(
  this: NonTerminalExtensionContext,
  transformFn: (node: XNode) => XNode,
  hooks?: NodeHooks
): void {
  try {
    this.validateSource();
    
    // Create pipeline stage for the transform
    const transformStage: PipelineStage<XNode, XNode> = {
      name: 'myTransform',
      execute: (node, context) => {
        return transformFn(node);
      }
    };
    
    // Execute using pipeline with hooks
    this.executeTransform(transformStage, hooks);
  } catch (err) {
    throw new Error(`Transform failed: ${String(err)}`);
  }
}
```

## Composition Patterns

### Converter Pattern

For complex conversions, use the unified converter pattern:

```typescript
interface MyConverterInput {
  node: XNode;
  options: MyFormatOptions;
}

export const xnodeToMyFormatConverter: UnifiedConverter<MyConverterInput, string> = {
  name: 'xnodeToMyFormat',
  inputType: 'MyConverterInput',
  outputType: 'string',
  
  validate(input: MyConverterInput, context: PipelineContext): void {
    context.validateInput(!!input.node, "XNode cannot be null");
    context.validateInput(!!input.options, "Options must be provided");
  },
  
  execute(input: MyConverterInput, context: PipelineContext): string {
    const { node, options } = input;
    
    // Your conversion logic here
    return performConversion(node, options);
  },
  
  onError(error: Error, input: MyConverterInput, context: PipelineContext): string | null {
    context.logger.error('Conversion failed', { error });
    return null;
  }
};

// Use in your extension
export function toMyFormat(this: TerminalExtensionContext): string {
  const converterInput = {
    node: this.xnode!,
    options: this.pipeline.config.get().myFormat!
  };
  
  return xnodeToMyFormatConverter.execute(converterInput, this.pipeline);
}
```

### Multi-Format Extensions

Support multiple output formats in one extension:

```typescript
export function toMyFormat(
  this: TerminalExtensionContext,
  format?: 'json' | 'xml' | 'yaml'
): string {
  const config = this.pipeline.config.get().myFormat!;
  const outputFormat = format || config.defaultFormat;
  
  switch (outputFormat) {
    case 'json':
      return convertToJson(this.xnode!, config);
    case 'xml':
      return convertToXml(this.xnode!, config);
    case 'yaml':
      return convertToYaml(this.xnode!, config);
    default:
      throw new Error(`Unsupported format: ${outputFormat}`);
  }
}
```

### Conditional Processing

Handle different input types or conditions:

```typescript
export function smartConvert(this: TerminalExtensionContext): string {
  const node = this.xnode!;
  const config = this.pipeline.config.get().smartConverter!;
  
  // Detect content type
  if (isTableLike(node)) {
    return convertTable(node, config.table);
  } else if (isHierarchical(node)) {
    return convertHierarchy(node, config.hierarchy);
  } else {
    return convertGeneric(node, config.generic);
  }
}
```

## Best Practices

### Configuration Design

✅ **DO:**
- Use descriptive, specific property names
- Provide sensible defaults for all options
- Group related options in nested objects
- Make all extension properties optional (`myExtension?: ...`)
- Export TypeScript interfaces for user consumption

❌ **DON'T:**
- Use generic names like `config` or `options`
- Create deeply nested configuration (max 2-3 levels)
- Make required properties optional in interfaces
- Change configuration schemas after release

### Implementation Guidelines

✅ **DO:**
- Validate source before processing (`this.validateSource()`)
- Handle hooks properly for user customization
- Provide comprehensive error messages
- Use the logger for debugging information
- Clone nodes when modifying them
- Use TypeScript for better developer experience

❌ **DON'T:**
- Mutate the original XNode without cloning
- Ignore hook execution patterns
- Throw generic errors without context
- Access raw configuration without defaults
- Skip input validation

### Performance Considerations

✅ **DO:**
- Cache expensive computations
- Use efficient algorithms for large datasets
- Minimize memory allocations in loops
- Leverage streaming for large files
- Profile your extension with realistic data

❌ **DON'T:**
- Perform unnecessary deep clones
- Create excessive temporary objects
- Use inefficient string concatenation
- Load entire large files into memory

### Error Handling

✅ **DO:**
- Provide specific error messages
- Include context in error information
- Use appropriate error types
- Log warnings for recoverable issues
- Validate inputs at API boundaries

❌ **DON'T:**
- Swallow errors silently
- Throw generic Error objects
- Include sensitive data in error messages
- Fail fast without cleanup

## Templates

See the separate template artifacts for:
- [Terminal Extension Template](#terminal-template)
- [Non-Terminal Extension Template](#non-terminal-template)

## Advanced Patterns

### Extension Families

Create related extensions with shared configuration:

```typescript
// Shared configuration for all CSV-related extensions
const CSV_SHARED_CONFIG = {
  csv: {
    delimiter: ",",
    escapeChar: "\"",
    includeHeaders: true
  }
};

// Input extension
XJX.registerNonTerminalExtension("fromCsv", fromCsv, CSV_SHARED_CONFIG);

// Output extension  
XJX.registerTerminalExtension("toCsv", toCsv, CSV_SHARED_CONFIG);

// Transform extension
XJX.registerNonTerminalExtension("normalizeCsv", normalizeCsv, CSV_SHARED_CONFIG);
```

### Conditional Extension Loading

Load extensions based on environment or features:

```typescript
// Development-only extensions
if (process.env.NODE_ENV === 'development') {
  XJX.registerTerminalExtension("toDebugFormat", toDebugFormat, {
    debug: { verbosity: 'high', includeInternals: true }
  });
}

// Feature-based loading
if (typeof window !== 'undefined') {
  // Browser-only extensions
  XJX.registerTerminalExtension("toHtml", toHtml);
} else {
  // Node.js-only extensions  
  XJX.registerTerminalExtension("toFile", toFile);
}
```

### Extension Validation

Add runtime validation for extension requirements:

```typescript
export function toMyFormat(this: TerminalExtensionContext): string {
  // Validate extension requirements
  const config = this.pipeline.config.get().myFormat!;
  
  if (config.advanced?.requiresLicense && !validateLicense()) {
    throw new Error('Advanced features require a valid license');
  }
  
  if (config.outputSize === 'large' && !hasEnoughMemory()) {
    throw new Error('Insufficient memory for large output format');
  }
  
  return performConversion(this.xnode!, config);
}
```

### Extension Composition

Compose multiple extensions for complex workflows:

```typescript
export function complexWorkflow(this: NonTerminalExtensionContext): void {
  // Chain multiple operations
  this
    .normalize()
    .transform(customTransform)
    .validate()
    .optimize();
}

// Register as a convenience extension
XJX.registerNonTerminalExtension("complexWorkflow", complexWorkflow);
```

This guide provides everything you need to create professional, maintainable extensions for the XJX library. Remember to start simple and add complexity only when needed!