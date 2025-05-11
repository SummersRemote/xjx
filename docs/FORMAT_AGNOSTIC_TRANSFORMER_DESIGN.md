# Format-Agnostic Transformation System Design

## Overview

This design document outlines a simplified format-agnostic transformation system for the XJX library. The key goal is to eliminate format-specific direction enums while maintaining the existing fluent API with `withTransform` methods.

## Core Architecture

```
┌───────────┐     ┌─────────────┐     ┌───────────────┐     ┌─────────────┐     ┌───────────┐
│           │     │             │     │ Transform     │     │             │     │           │
│ Input     │────▶│ Parser      │────▶│ Pipeline     │────▶│ Serializer  │────▶│ Output    │
│ (any      │     │ (to XNode)  │     │ (XNode →     │     │ (from XNode)│     │ (any      │
│  format)  │     │ PARSE stage │     │  XNode)      │     │ SERIALIZE   │     │  format)  │
│           │     │             │     │ TRANSFORM    │     │ stage       │     │           │
└───────────┘     └─────────────┘     └───────────────┘     └─────────────┘     └───────────┘
                                             ▲
                                             │
                                      ┌──────┴───────┐
                                      │ Transformers │
                                      │ (stage-aware)│
                                      └──────────────┘
```

## Key Components

### 1. TransformStage Enum

```typescript
/**
 * Represents the current stage in the transformation pipeline
 */
enum TransformStage {
  /**
   * Converting from external format to XNode
   */
  PARSE = 'parse',
  
  /**
   * Manipulating XNode structure
   */
  TRANSFORM = 'transform',
  
  /**
   * Converting from XNode to external format
   */
  SERIALIZE = 'serialize'
}
```

### 2. Enhanced TransformContext

```typescript
/**
 * Context provided to transformers
 */
interface TransformContext {
  /**
   * Current stage in the pipeline
   */
  stage: TransformStage;
  
  /**
   * Source format name (e.g., 'xml', 'json', 'yaml')
   */
  sourceFormat: string;
  
  /**
   * Target format name (e.g., 'xml', 'json', 'yaml')
   */
  targetFormat: string;
  
  // Existing context properties remain unchanged
  nodeName: string;
  nodeType: number;
  path: string;
  namespace?: string;
  prefix?: string;
  parent?: TransformContext;
  config: Configuration;
  
  // Removed: direction property is no longer needed
}
```

### 3. Unchanged Transform Interface

```typescript
/**
 * Interface for all transformers
 * The interface remains unchanged, but implementations
 * will now use context.stage instead of context.direction
 */
interface Transform {
  /**
   * Node types this transformer targets
   */
  targets: TransformTarget[];
  
  /**
   * Transform method - signature unchanged
   */
  transform(value: any, context: TransformContext): TransformResult<any>;
}
```

## Implementation Patterns

### Stage-Aware Transformers

```typescript
/**
 * Example of a stage-aware transformer
 */
class DataTypeTransformer implements Transform {
  targets = [TransformTarget.Value];
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Choose behavior based on pipeline stage
    switch (context.stage) {
      case TransformStage.PARSE:
        // Convert string values to appropriate types during parsing
        return this.parseValue(value, context);
        
      case TransformStage.SERIALIZE:
        // Format values for output format during serialization
        return this.formatValue(value, context);
        
      default:
        // During TRANSFORM stage, just pass through
        return createTransformResult(value);
    }
  }
  
  private parseValue(value: any, context: TransformContext): TransformResult<any> {
    // Convert strings to appropriate data types based on patterns
    if (typeof value !== 'string') {
      return createTransformResult(value);
    }
    
    // Number conversion
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return createTransformResult(Number(value));
    }
    
    // Boolean conversion
    if (/^(true|false)$/i.test(value)) {
      return createTransformResult(value.toLowerCase() === 'true');
    }
    
    // Format-specific logic can use context.sourceFormat
    // For example, XML might handle certain values differently than JSON
    
    return createTransformResult(value);
  }
  
  private formatValue(value: any, context: TransformContext): TransformResult<any> {
    // Format values based on target format requirements
    // For example, some formats might require string values
    
    if (context.targetFormat === 'xml' && typeof value === 'boolean') {
      return createTransformResult(String(value));
    }
    
    return createTransformResult(value);
  }
}
```

### Format-Specific Transformers

```typescript
/**
 * Example of a format-specific transformer that still works in an agnostic way
 */
class XmlNamespaceTransformer implements Transform {
  targets = [TransformTarget.Element, TransformTarget.Attribute];
  
  transform(node: any, context: TransformContext): TransformResult<any> {
    // Only process during specific stages and for specific formats
    if (context.stage === TransformStage.PARSE && context.sourceFormat === 'xml') {
      // Process XML namespaces during parsing from XML
      return this.processNamespaces(node, context);
    }
    
    if (context.stage === TransformStage.SERIALIZE && context.targetFormat === 'xml') {
      // Prepare namespaces during serialization to XML
      return this.prepareNamespaces(node, context);
    }
    
    // For other stages/formats, pass through unchanged
    return createTransformResult(node);
  }
  
  // Implementation methods...
}
```

### Metadata-Based Transformers

```typescript
/**
 * Example of a transformer that uses node metadata for processing
 */
class MetadataBasedFormatter implements Transform {
  targets = [TransformTarget.Element, TransformTarget.Value];
  
  transform(node: any, context: TransformContext): TransformResult<any> {
    if (context.stage === TransformStage.TRANSFORM) {
      // Add metadata during transform stage
      return this.addFormattingMetadata(node, context);
    }
    
    if (context.stage === TransformStage.SERIALIZE) {
      // Use metadata during serialization
      return this.applyFormatting(node, context);
    }
    
    return createTransformResult(node);
  }
  
  // Implementation methods...
}
```

## Fluent API (Unchanged)

```typescript
// The public API remains unchanged
const result = XJX.fromXml(xmlString)
  .withTransforms(
    new BooleanTransform(),
    new NumberTransform(),
    new CustomTransform()
  )
  .toJson();
```

## Internal Pipeline Implementation

```typescript
/**
 * Conceptual implementation of internal pipeline
 * (The actual implementation would be integrated with existing code)
 */
class TransformationPipeline {
  private sourceFormat: string;
  private targetFormat: string;
  private transforms: Transform[] = [];
  private xnode: XNode | null = null;
  
  constructor(sourceFormat: string, input: any) {
    this.sourceFormat = sourceFormat;
    // Parse input to XNode with PARSE stage context
    this.xnode = this.parseToXNode(input, sourceFormat);
  }
  
  public withTransforms(...transforms: Transform[]): TransformationPipeline {
    this.transforms.push(...transforms);
    return this;
  }
  
  public to(targetFormat: string): any {
    this.targetFormat = targetFormat;
    
    if (!this.xnode) {
      throw new Error("No source data provided");
    }
    
    // Apply transforms with TRANSFORM stage context
    const transformedNode = this.applyTransforms(this.xnode);
    
    // Serialize with SERIALIZE stage context
    return this.serializeFromXNode(transformedNode, targetFormat);
  }
  
  private parseToXNode(input: any, sourceFormat: string): XNode {
    // Create parse context
    const parseContext: TransformContext = {
      stage: TransformStage.PARSE,
      sourceFormat,
      targetFormat: '',  // Not known yet at parse time
      // Other context properties...
    };
    
    // Parse to XNode using format-specific parser
    const initialNode = this.getParser(sourceFormat)(input);
    
    // Apply parse-stage transforms
    return this.applyTransformsWithContext(initialNode, parseContext);
  }
  
  private applyTransforms(node: XNode): XNode {
    // Create transform context
    const transformContext: TransformContext = {
      stage: TransformStage.TRANSFORM,
      sourceFormat: this.sourceFormat,
      targetFormat: this.targetFormat,
      // Other context properties...
    };
    
    // Apply transform-stage transforms
    return this.applyTransformsWithContext(node, transformContext);
  }
  
  private serializeFromXNode(node: XNode, targetFormat: string): any {
    // Create serialize context
    const serializeContext: TransformContext = {
      stage: TransformStage.SERIALIZE,
      sourceFormat: this.sourceFormat,
      targetFormat,
      // Other context properties...
    };
    
    // Apply serialize-stage transforms
    const preparedNode = this.applyTransformsWithContext(node, serializeContext);
    
    // Serialize using format-specific serializer
    return this.getSerializer(targetFormat)(preparedNode);
  }
  
  private applyTransformsWithContext(node: XNode, context: TransformContext): XNode {
    // Apply transforms that are relevant for the current context
    // (This is a simplified version of the actual implementation)
    let result = node;
    
    for (const transform of this.transforms) {
      // Apply the transform
      const transformResult = transform.transform(result, context);
      
      if (transformResult.remove) {
        // Handle node removal
        return null as any; // Simplified handling
      }
      
      result = transformResult.value;
    }
    
    return result;
  }
  
  // Format-specific parsers and serializers
  private getParser(format: string): (input: any) => XNode {
    // Return the appropriate parser for the format
    switch (format) {
      case 'xml':
        return this.parseXml;
      case 'json':
        return this.parseJson;
      // Add cases for additional formats
      default:
        throw new Error(`Unsupported source format: ${format}`);
    }
  }
  
  private getSerializer(format: string): (node: XNode) => any {
    // Return the appropriate serializer for the format
    switch (format) {
      case 'xml':
        return this.serializeXml;
      case 'json':
        return this.serializeJson;
      // Add cases for additional formats
      default:
        throw new Error(`Unsupported target format: ${format}`);
    }
  }
  
  // Format-specific parser/serializer implementations
  private parseXml(input: string): XNode {
    // Implementation for XML parsing
    return {} as XNode; // Placeholder
  }
  
  private parseJson(input: any): XNode {
    // Implementation for JSON parsing
    return {} as XNode; // Placeholder
  }
  
  private serializeXml(node: XNode): string {
    // Implementation for XML serialization
    return ''; // Placeholder
  }
  
  private serializeJson(node: XNode): any {
    // Implementation for JSON serialization
    return {}; // Placeholder
  }
}
```

## Adding New Formats

To add a new format (e.g., YAML):

1. Implement the parser and serializer:
   ```typescript
   private parseYaml(input: string): XNode {
     // Implementation for YAML parsing
     return parsedNode;
   }
   
   private serializeYaml(node: XNode): string {
     // Implementation for YAML serialization
     return yamlString;
   }
   ```

2. Add new format to parser and serializer lookup:
   ```typescript
   private getParser(format: string): (input: any) => XNode {
     switch (format) {
       // Existing cases...
       case 'yaml':
         return this.parseYaml;
       default:
         throw new Error(`Unsupported source format: ${format}`);
     }
   }
   
   private getSerializer(format: string): (node: XNode) => any {
     switch (format) {
       // Existing cases...
       case 'yaml':
         return this.serializeYaml;
       default:
         throw new Error(`Unsupported target format: ${format}`);
     }
   }
   ```

3. Add fluent API methods:
   ```typescript
   public fromYaml(yamlString: string): TransformationPipeline {
     this.sourceFormat = 'yaml';
     this.xnode = this.parseToXNode(yamlString, 'yaml');
     return this;
   }
   
   public toYaml(): string {
     return this.to('yaml') as string;
   }
   ```

Existing transformers will automatically work with the new format without modification, as they now make decisions based on stage and context rather than hardcoded direction.

## Benefits

1. **True Format Agnosticism**: Transformers operate based on pipeline stage and context rather than hardcoded format pairs.
2. **Simplified Extensibility**: Adding new formats doesn't require modifying existing transformers.
3. **Unified Transformation Logic**: Transformers can provide consistent behavior across all formats.
4. **Maintained Fluent API**: The existing API remains unchanged for backward compatibility.
5. **Enhanced Context Awareness**: Transformers have richer context about the transformation process.

## Implementation Notes

- The existing `TransformDirection` enum should be removed.
- The fluent API methods (`fromXml`, `toJson`, etc.) remain unchanged externally.
- Internal pipeline implementation needs to be updated to set the appropriate stage and format information in the context.
- Transformers should be refactored to use `context.stage` instead of `context.direction`.