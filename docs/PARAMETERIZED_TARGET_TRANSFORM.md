# XJX Parameterized Target Format Transform Design

## Overview

This design enhances the XJX transformation system by adding target format awareness to transforms. Rather than thinking in terms of "direction" (XML→JSON or JSON→XML), transforms will be aware of the target format they're transforming toward, which more accurately reflects the transformation pipeline's mechanics. The design uses a parameterized approach for maximum flexibility.

### Goals

- Enable format-specific transformation logic
- Simplify the conceptual model
- Maintain backward compatibility with existing transforms
- Keep the implementation minimal and elegant
- Support extensibility for future formats beyond XML and JSON through parameterization

## Core Interface Changes

### Format Identification System

Instead of using an enum, use a string-based format identification system for maximum extensibility:

```typescript
// Unique identifier for formats
export type FormatId = string;

// Core formats with type safety
export const FORMATS = {
  XML: 'xml' as FormatId,
  JSON: 'json' as FormatId
  // Can be extended with additional formats
};

// For type checking
export type KnownFormat = typeof FORMATS[keyof typeof FORMATS];
```

### TransformContext Update

Update the `TransformContext` interface in `src/core/types/transform-interfaces.ts` to include the target format:

```typescript
export interface TransformContext {
  // Existing properties
  nodeName: string;
  nodeType: number;
  path: string;
  // ...other existing properties...
  
  // New property for target format (string-based for extensibility)
  targetFormat: FormatId;
  
  // Keep direction for backward compatibility (optional)
  direction?: TransformDirection;
}
```

## Implementation Details

### 1. Update DefaultXNodeTransformer

Modify the `DefaultXNodeTransformer` class in `src/converters/xnode-transformer.ts` to use the parameterized target format:

```typescript
/**
 * Apply transformations to XNode
 * @param node XNode to transform
 * @param transforms Transformations to apply
 * @param targetFormat Target format identifier
 * @returns Transformed XNode
 */
public transform(node: XNode, transforms: Transform[], targetFormat: FormatId): XNode {
  return ErrorUtils.try(
    () => {
      if (!transforms || transforms.length === 0) {
        return node; // No transformations to apply
      }

      // Create root context with target format
      const context = this.createRootContext(node, targetFormat);

      // Apply transformations
      const transformedNode = this.applyTransforms(node, context, transforms);

      if (!transformedNode) {
        throw new Error("Root node was removed during transformation");
      }

      return transformedNode;
    },
    'Transformation failed',
    'general'
  );
}

/**
 * Create root transformation context
 * @param node Root node
 * @param targetFormat Target format identifier
 * @returns Transformation context
 */
public createRootContext(node: XNode, targetFormat: FormatId): TransformContext {
  return {
    nodeName: node.name,
    nodeType: node.type,
    path: node.name,
    namespace: node.namespace,
    prefix: node.prefix,
    config: this.config,
    targetFormat,
    
    // For backward compatibility
    direction: targetFormat === FORMATS.JSON 
      ? TransformDirection.XML_TO_JSON 
      : TransformDirection.JSON_TO_XML
  };
}
```

### 2. Update Relevant Methods in XJX and XjxBuilder

Update the relevant methods in `XJX` and `XjxBuilder` to pass target format to the transformer:

```typescript
// In XjxBuilder.toJson method
public toJson(): Record<string, any> {
  // Validate source is set
  this.validateSource();
  
  // Apply transformations if any are registered
  if (this.transforms && this.transforms.length > 0) {
    const transformer = new DefaultXNodeTransformer(this.config);
    this.xnode = transformer.transform(
      this.xnode!, 
      this.transforms, 
      FORMATS.JSON // Use format identifier
    );
  }
  
  // Convert XNode to JSON
  const converter = new DefaultXNodeToJsonConverter(this.config);
  return converter.convert(this.xnode!);
}

// In XjxBuilder.toXml method
public toXml(): string {
  // Validate source is set
  this.validateSource();
  
  // Apply transformations if any are registered
  if (this.transforms && this.transforms.length > 0) {
    const transformer = new DefaultXNodeTransformer(this.config);
    this.xnode = transformer.transform(
      this.xnode!, 
      this.transforms, 
      FORMATS.XML // Use format identifier
    );
  }
  
  // Convert XNode to XML
  const converter = new DefaultXNodeToXmlConverter(this.config);
  return converter.convert(this.xnode!);
}
```

### 3. Format Registration System (Optional)

For maximum extensibility, add a format registration system in `src/core/formats/format-registry.ts`:

```typescript
import { FormatId } from '../types/transform-interfaces';

/**
 * Format metadata and configuration
 */
export interface FormatInfo {
  // Format identifier
  id: FormatId;
  
  // Human-readable name
  name: string;
  
  // MIME types associated with this format
  mimeTypes: string[];
  
  // File extensions associated with this format
  fileExtensions: string[];
  
  // Optional format-specific configuration
  config?: Record<string, any>;
}

/**
 * Registry for format information
 */
export class FormatRegistry {
  private static instance: FormatRegistry;
  private formats = new Map<FormatId, FormatInfo>();
  
  /**
   * Get singleton instance
   */
  public static getInstance(): FormatRegistry {
    if (!FormatRegistry.instance) {
      FormatRegistry.instance = new FormatRegistry();
      
      // Register core formats
      FormatRegistry.instance.registerFormat({
        id: 'xml',
        name: 'XML',
        mimeTypes: ['application/xml', 'text/xml'],
        fileExtensions: ['xml']
      });
      
      FormatRegistry.instance.registerFormat({
        id: 'json',
        name: 'JSON',
        mimeTypes: ['application/json'],
        fileExtensions: ['json']
      });
    }
    
    return FormatRegistry.instance;
  }
  
  /**
   * Register a format
   */
  public registerFormat(format: FormatInfo): void {
    this.formats.set(format.id, format);
  }
  
  /**
   * Get format info by ID
   */
  public getFormat(id: FormatId): FormatInfo | undefined {
    return this.formats.get(id);
  }
  
  /**
   * Get all registered formats
   */
  public getAllFormats(): FormatInfo[] {
    return Array.from(this.formats.values());
  }
  
  /**
   * Find format by file extension
   */
  public getFormatByExtension(extension: string): FormatInfo | undefined {
    const ext = extension.startsWith('.') ? extension.substring(1) : extension;
    
    for (const format of this.formats.values()) {
      if (format.fileExtensions.includes(ext)) {
        return format;
      }
    }
    
    return undefined;
  }
  
  /**
   * Find format by MIME type
   */
  public getFormatByMimeType(mimeType: string): FormatInfo | undefined {
    for (const format of this.formats.values()) {
      if (format.mimeTypes.includes(mimeType)) {
        return format;
      }
    }
    
    return undefined;
  }
}

/**
 * Access format registry
 */
export function getFormatRegistry(): FormatRegistry {
  return FormatRegistry.getInstance();
}
```

### 4. Helper Functions

Add helper functions in `src/transforms/helpers.ts` for common transform patterns:

```typescript
import { FormatId, Transform, TransformContext, TransformResult, 
         TransformTarget, createTransformResult } from '../core/types/transform-interfaces';
import { FORMATS } from '../core/types/transform-interfaces';

/**
 * Create a transform that only applies for a specific target format
 */
export function forFormat(
  format: FormatId, 
  transform: Transform
): Transform {
  return {
    targets: transform.targets,
    transform(value: any, context: TransformContext): TransformResult<any> {
      if (context.targetFormat === format) {
        return transform.transform(value, context);
      }
      return createTransformResult(value);
    }
  };
}

/**
 * Create a transform for JSON output
 */
export function forJson(transform: Transform): Transform {
  return forFormat(FORMATS.JSON, transform);
}

/**
 * Create a transform for XML output
 */
export function forXml(transform: Transform): Transform {
  return forFormat(FORMATS.XML, transform);
}

/**
 * Type for format-specific handlers
 */
export type FormatHandlers = {
  [formatId: string]: (value: any, context: TransformContext) => TransformResult<any>
};

/**
 * Create a transform with different handlers for different formats
 */
export function createFormatAwareTransform(
  targets: TransformTarget[],
  handlers: FormatHandlers
): Transform {
  return {
    targets,
    transform(value: any, context: TransformContext): TransformResult<any> {
      const handler = handlers[context.targetFormat];
      if (handler) {
        return handler(value, context);
      }
      return createTransformResult(value);
    }
  };
}
```

## Backward Compatibility

This design maintains backward compatibility:
- The `direction` property is kept in the context (could be made optional later)
- Existing transforms can continue to check the `direction` property
- The standard transform pipeline mechanics remain unchanged
- Only the context creation is modified

## Extensibility for Future Formats

This parameterized approach makes it very easy to extend XJX with additional formats beyond XML and JSON:

1. Define a new format identifier (e.g., `const YAML_FORMAT = 'yaml' as FormatId`)
2. Optionally register it with the format registry for metadata
3. Create corresponding converters (e.g., XNode to YAML, YAML to XNode)
4. Add new methods to `XjxBuilder` (e.g., `toYaml()`, `fromYaml()`)

Transforms can handle the new formats by checking the `targetFormat` property or adding new handlers to format-aware transforms.

### Example: Adding YAML Support

```typescript
// 1. Define YAML format identifier
export const FORMATS = {
  XML: 'xml' as FormatId,
  JSON: 'json' as FormatId,
  YAML: 'yaml' as FormatId  // Add YAML format
};

// 2. Register format metadata (optional)
getFormatRegistry().registerFormat({
  id: FORMATS.YAML,
  name: 'YAML',
  mimeTypes: ['application/yaml', 'text/yaml'],
  fileExtensions: ['yaml', 'yml']
});

// 3. Create converters
export class XNodeToYamlConverter implements Converter<XNode, string> {
  // Implementation...
}

export class YamlToXNodeConverter implements Converter<string, XNode> {
  // Implementation...
}

// 4. Add XjxBuilder methods
export function toYaml(this: TerminalExtensionContext): string {
  // Validate source is set
  this.validateSource();
  
  // Apply transformations if any are registered
  if (this.transforms && this.transforms.length > 0) {
    const transformer = new DefaultXNodeTransformer(this.config);
    this.xnode = transformer.transform(
      this.xnode!, 
      this.transforms, 
      FORMATS.YAML  // Use YAML format identifier
    );
  }
  
  // Convert XNode to YAML
  const converter = new XNodeToYamlConverter(this.config);
  return converter.convert(this.xnode!);
}

// Register the extension
XJX.registerTerminalExtension("toYaml", toYaml);
```

## Testing Strategy

1. **Unit Tests**:
   - Test that transforms receive the correct target format in context
   - Test format-specific transformations
   - Verify backward compatibility with transforms checking direction

2. **Integration Tests**:
   - Create transforms that use target format to apply format-specific logic
   - Verify transformations work correctly for different target formats
   - Test round-trip conversions (XML → JSON → XML)

## Example Implementations

### Example 1: Boolean Transform with Parameterized Formats

```typescript
export class BooleanTransform implements Transform {
  targets = [TransformTarget.Value];
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    if (context.targetFormat === FORMATS.JSON) {
      // To JSON: Convert strings to booleans
      if (typeof value === 'string') {
        const lowered = value.toLowerCase().trim();
        if (['true', 'yes', '1', 'on'].includes(lowered)) {
          return createTransformResult(true);
        }
        if (['false', 'no', '0', 'off'].includes(lowered)) {
          return createTransformResult(false);
        }
      }
    } else if (context.targetFormat === FORMATS.XML) {
      // To XML: Convert booleans to strings
      if (typeof value === 'boolean') {
        return createTransformResult(value ? 'true' : 'false');
      }
    }
    
    return createTransformResult(value);
  }
}
```

### Example 2: Date Transform with Switch Statement for Multiple Formats

```typescript
export class DateTransform implements Transform {
  targets = [TransformTarget.Value];
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    switch (context.targetFormat) {
      case FORMATS.JSON:
        // To JSON: Convert ISO date strings to Date objects
        if (typeof value === 'string' && this.isIsoDateString(value)) {
          return createTransformResult(new Date(value));
        }
        break;
        
      case FORMATS.XML:
        // To XML: Convert Date objects to ISO date strings
        if (value instanceof Date) {
          return createTransformResult(value.toISOString());
        }
        break;
        
      case 'yaml': // Support for additional formats
        // YAML can handle Date objects natively in some implementations
        if (typeof value === 'string' && this.isIsoDateString(value)) {
          return createTransformResult(new Date(value));
        }
        break;
    }
    
    return createTransformResult(value);
  }
  
  private isIsoDateString(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/.test(value);
  }
}
```

### Example 3: Using Helper Functions with Format Handlers

```typescript
import { createFormatAwareTransform, FORMATS } from '../core/transforms';

const numberTransform = createFormatAwareTransform(
  [TransformTarget.Value],
  {
    [FORMATS.JSON]: (value, context) => {
      // To JSON: Convert strings to numbers
      if (typeof value === 'string' && /^-?\d*\.?\d+$/.test(value)) {
        return createTransformResult(Number(value));
      }
      return createTransformResult(value);
    },
    
    [FORMATS.XML]: (value, context) => {
      // To XML: Convert numbers to strings
      if (typeof value === 'number') {
        return createTransformResult(String(value));
      }
      return createTransformResult(value);
    },
    
    // Additional format handlers can be added easily
    'yaml': (value, context) => {
      // YAML also uses native JavaScript numbers
      if (typeof value === 'string' && /^-?\d*\.?\d+$/.test(value)) {
        return createTransformResult(Number(value));
      }
      return createTransformResult(value);
    }
  }
);
```

### Example 4: Format-Specific Transform

```typescript
import { forJson } from '../transforms/helpers';

// Create a transform that only applies when converting to JSON
const isoDateToDateObject = forJson({
  targets: [TransformTarget.Value],
  transform(value, context) {
    if (typeof value === 'string' && 
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/.test(value)) {
      return createTransformResult(new Date(value));
    }
    return createTransformResult(value);
  }
});

// Usage
XJX.fromXml(xml)
  .withTransforms(isoDateToDateObject)
  .toJson();
```

### Example 5: Multi-Format Aware Transform

```typescript
// A transform that works with multiple formats including future ones
export class SmartTypeTransform implements Transform {
  targets = [TransformTarget.Value];
  
  // Format-specific handlers stored in a map
  private handlers: Record<string, (value: any, context: TransformContext) => TransformResult<any>> = {};
  
  constructor() {
    // Register default handlers
    this.registerHandler(FORMATS.JSON, this.handleToJson.bind(this));
    this.registerHandler(FORMATS.XML, this.handleToXml.bind(this));
  }
  
  // Allow registering handlers for new formats
  registerHandler(format: FormatId, handler: (value: any, context: TransformContext) => TransformResult<any>): void {
    this.handlers[format] = handler;
  }
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Call appropriate handler for the target format
    const handler = this.handlers[context.targetFormat];
    if (handler) {
      return handler(value, context);
    }
    
    // Default behavior for unknown formats
    return createTransformResult(value);
  }
  
  private handleToJson(value: any, context: TransformContext): TransformResult<any> {
    // Handle conversion to JSON
    // ...
    return createTransformResult(value);
  }
  
  private handleToXml(value: any, context: TransformContext): TransformResult<any> {
    // Handle conversion to XML
    // ...
    return createTransformResult(value);
  }
}

// Later, can add support for new formats:
const transform = new SmartTypeTransform();
transform.registerHandler('yaml', (value, context) => {
  // YAML-specific handling
  return createTransformResult(value);
});
```

## Usage Examples

```typescript
// Using target format in a custom transform
export class CustomTransform implements Transform {
  targets = [TransformTarget.Value];
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    switch (context.targetFormat) {
      case FORMATS.JSON:
        // Transform logic for JSON output
        return this.transformForJson(value, context);
        
      case FORMATS.XML:
        // Transform logic for XML output
        return this.transformForXml(value, context);
        
      // Easy to add support for additional formats
      case 'yaml':
        // YAML-specific transformation
        return this.transformForYaml(value, context);
        
      case 'toml':
        // TOML-specific transformation
        return this.transformForToml(value, context);
        
      default:
        // Default behavior
        return createTransformResult(value);
    }
  }
  
  private transformForJson(value: any, context: TransformContext): TransformResult<any> {
    // JSON-specific transformation logic
    return createTransformResult(/* transformed value */);
  }
  
  private transformForXml(value: any, context: TransformContext): TransformResult<any> {
    // XML-specific transformation logic
    return createTransformResult(/* transformed value */);
  }
  
  private transformForYaml(value: any, context: TransformContext): TransformResult<any> {
    // YAML-specific transformation logic
    return createTransformResult(/* transformed value */);
  }
  
  private transformForToml(value: any, context: TransformContext): TransformResult<any> {
    // TOML-specific transformation logic
    return createTransformResult(/* transformed value */);
  }
}
```

## Implementation Plan

1. Add `FormatId` type and `FORMATS` object to `src/core/types/transform-interfaces.ts`
2. Update `TransformContext` interface with targetFormat property
3. Optionally create a format registry for handling format metadata
4. Modify `DefaultXNodeTransformer` to use target format
5. Update `XjxBuilder` methods to pass target format to transformer
6. Add helper functions for format-specific transforms
7. Update documentation with examples
8. Add unit and integration tests

## Benefits of the Parameterized Approach

The parameterized approach offers several advantages:

1. **String-based identifiers** instead of enums make it more extensible
2. **No recompilation needed** to add new formats
3. **Switch statements work well** with string constants
4. **Third-party extensions** can easily add new formats without modifying core code
5. **Format metadata** can be associated with each format identifier
6. **More flexible transformation logic** can handle multiple formats elegantly

## Best Practices

When implementing transformers with the parameterized format approach:

1. Use **switch statements** for multi-format transforms for clarity
2. Use the **helper functions** for simple format-specific transforms
3. **Register format metadata** for important formats
4. Use **consistent format identifiers** across the application
5. Consider adding a **default case** in switches to handle unknown formats
6. For complex applications, consider using a **plugin system** to register format handlers