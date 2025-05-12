# XJX Transformation System Guide

XJX's transformation system is a powerful mechanism that allows you to modify, filter, and enhance data during the conversion process. This guide explains the transformation system in detail and shows how to create your own transformers.

## What Are Transformers?

Transformers are modules that modify the `XNode` structure during conversion. They can:

- Convert data types (strings to booleans, numbers, etc.)
- Filter or rename elements and attributes
- Add or remove nodes
- Modify text content
- Apply metadata

Transformers can be applied to any target format (XML, JSON, etc.) and are executed in a pipeline, where each transformer processes the output of the previous one.

## Transformer Interface

All transformers implement the `Transform` interface:

```typescript
interface Transform {
  // Target types this transformer can handle
  targets: TransformTarget[];
  
  // Transform method with context
  transform(value: any, context: TransformContext): TransformResult<any>;
}
```

### Transform Targets

The `targets` property specifies which node types your transformer handles. The pipeline will only invoke your transformer for matching node types:

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

### Transform Context

The `TransformContext` provides information about the current transformation:

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

The `targetFormat` property identifies which format the node is being transformed toward (e.g., 'xml' or 'json'). This is a key feature that allows for more flexible transformations based on the output format.

### Format Identification

XJX uses a string-based format identification system for maximum extensibility:

```typescript
// Unique identifier for formats
export type FormatId = string;

// Core formats with type safety
export const FORMATS = {
  XML: 'xml' as FormatId,
  JSON: 'json' as FormatId
  // Can be extended with additional formats
};
```

### Transform Result

Transformers return a `TransformResult` that includes the transformed value and a flag indicating whether the node should be removed:

```typescript
interface TransformResult<T> {
  // The transformed value
  value: T;
  
  // Whether the node/value should be removed
  remove: boolean;
}
```

XJX provides a helper function to create transform results:

```typescript
function createTransformResult<T>(value: T, remove: boolean = false): TransformResult<T> {
  return { value, remove };
}
```

## Built-in Transformers

XJX includes several built-in transformers that use the format-aware approach:

### BooleanTransform

Converts string values to booleans based on specific patterns:

```javascript
import { XJX, BooleanTransform } from 'xjx';

const xml = `
<data>
  <active>true</active>
  <enabled>yes</enabled>
  <verified>1</verified>
  <disabled>false</disabled>
</data>
`;

const json = XJX.fromXml(xml)
  .withTransforms(
    new BooleanTransform({
      trueValues: ['true', 'yes', '1', 'on'],
      falseValues: ['false', 'no', '0', 'off'],
      ignoreCase: true
    })
  )
  .toJson();

console.log(json);
// Output: active, enabled, verified are true (boolean)
//         disabled is false (boolean)
```

### NumberTransform

Converts string values to numbers with format-specific behavior:

```javascript
import { XJX, NumberTransform } from 'xjx';

const xml = `
<data>
  <count>42</count>
  <price>19.99</price>
  <temperature>-5</temperature>
  <scientific>1.2e3</scientific>
</data>
`;

const json = XJX.fromXml(xml)
  .withTransforms(
    new NumberTransform({
      integers: true,      // Convert integers
      decimals: true,      // Convert decimals
      scientific: true,    // Convert scientific notation
      decimalSeparator: '.',    // Decimal separator character
      thousandsSeparator: ','   // Thousands separator character
    })
  )
  .toJson();

console.log(json);
// Output: All values are converted to their numeric types
```

The improved NumberTransform now has better handling of different number formats and separators, with a format-aware approach that converts strings to numbers when transforming to JSON and numbers to strings when transforming to XML.

### RegexTransform

The improved RegexTransform now supports format-specific transformations and more flexible pattern specification:

```javascript
import { XJX, RegexTransform, FORMATS } from 'xjx';

const xml = `
<data>
  <url>https://example.com/page</url>
  <code>function test() { return true; }</code>
</data>
`;

// This transform will only apply when converting to XML
const result = XJX.fromJson(json)
  .withTransforms(
    new RegexTransform({
      pattern: /<(\w+)>/g,
      replacement: '<$1 xmlns="http://example.com">',
      format: FORMATS.XML  // Only apply when converting to XML
    })
  )
  .toXml();

// RegExp with flags for case-insensitive global replacement
const linkified = XJX.fromXml(xml)
  .withTransforms(
    new RegexTransform({
      pattern: /(https?:\/\/[\w-]+(\.[\w-]+)+[\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])/gi,
      replacement: '<a href="$1">$1</a>'
    })
  )
  .toXml();

// String pattern with embedded flags
const formatted = XJX.fromXml(xml)
  .withTransforms(
    new RegexTransform({
      pattern: "/world/i",  // String-based pattern with flags
      replacement: "World"
    })
  )
  .toXml();
```

The RegexTransform improvements include:
- Format-specific replacements using the `format` option
- Support for string patterns with embedded flags ("/pattern/flags")
- More robust handling of regular expressions

## Format-Aware Transformation

With the format-based approach, transformers can adapt their behavior based on the target format:

```javascript
import { Transform, TransformContext, TransformResult, TransformTarget, createTransformResult, FORMATS } from 'xjx';

class FormattingTransform implements Transform {
  targets = [TransformTarget.Value];
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Different behavior based on target format
    if (context.targetFormat === FORMATS.JSON) {
      // When converting to JSON
      if (typeof value === 'string') {
        return createTransformResult(value.trim());
      }
    } else if (context.targetFormat === FORMATS.XML) {
      // When converting to XML
      if (typeof value === 'string') {
        return createTransformResult(value.padStart(value.length + 2, ' '));
      }
    }
    
    return createTransformResult(value);
  }
}
```

## Creating Custom Transformers

You can create your own transformers by implementing the `Transform` interface:

### Basic Transformer Template

```javascript
import { 
  Transform, 
  TransformContext, 
  TransformResult, 
  TransformTarget, 
  createTransformResult,
  FORMATS
} from 'xjx';

export class MyTransform implements Transform {
  // Specify which node types this transformer targets
  targets = [TransformTarget.Value];
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Format-specific behavior
    if (context.targetFormat === FORMATS.JSON) {
      // JSON-specific transformation
      return createTransformResult(/* transformed value */);
    } else if (context.targetFormat === FORMATS.XML) {
      // XML-specific transformation
      return createTransformResult(/* transformed value */);
    }
    
    // Default behavior for other formats
    return createTransformResult(value);
  }
}
```

### Example: Date Formatter with Format Awareness

```javascript
import { 
  Transform, 
  TransformContext, 
  TransformResult, 
  TransformTarget, 
  createTransformResult,
  FORMATS
} from 'xjx';

export class DateTransform implements Transform {
  targets = [TransformTarget.Value];
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Skip non-applicable values
    if (typeof value !== 'string' && !(value instanceof Date)) {
      return createTransformResult(value);
    }
    
    // Determine transformation based on format
    switch (context.targetFormat) {
      case FORMATS.JSON:
        // Convert date strings to Date objects
        if (typeof value === 'string' && this.isDateString(value)) {
          const date = new Date(value);
          return createTransformResult(date);
        }
        break;
        
      case FORMATS.XML:
        // Convert Date objects to ISO strings
        if (value instanceof Date) {
          return createTransformResult(value.toISOString());
        }
        break;
        
      // Support for additional formats can be added here
      case 'yaml':
        // YAML-specific date handling
        return createTransformResult(value);
    }
    
    // Default: return unchanged
    return createTransformResult(value);
  }
  
  private isDateString(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
  }
}
```

## Transformer Best Practices

1. **Check value types**: Always verify input types before transformation
   ```javascript
   if (typeof value !== 'string') {
     return createTransformResult(value);
   }
   ```

2. **Use context information**: Leverage context to make informed decisions
   ```javascript
   if (context.targetFormat === FORMATS.JSON) {
     // Apply JSON-specific behavior
   }
   ```

3. **Handle remove carefully**: Only set `remove: true` when you explicitly want to remove nodes
   ```javascript
   if (shouldRemove) {
     return createTransformResult(null, true);
   }
   ```

4. **Maintain immutability**: Don't modify input values, return new ones
   ```javascript
   // Don't do this:
   node.name = 'newName';
   
   // Do this instead:
   const newNode = {...node, name: 'newName'};
   ```

5. **Target specific node types**: Limit your transformer to the node types it needs to process
   ```javascript
   targets = [TransformTarget.Element, TransformTarget.Attribute];
   ```

6. **Use format constants**: Use the FORMATS constants for better type safety
   ```javascript
   if (context.targetFormat === FORMATS.JSON) { ... }
   ```

7. **Consider extensibility**: Write transforms that can be extended to support additional formats
   ```javascript
   switch (context.targetFormat) {
     case FORMATS.JSON:
       // JSON handling
       break;
     case FORMATS.XML:
       // XML handling
       break;
     default:
       // Default handling for other formats
   }
   ```

## Advanced Transformer Techniques

### Composing Transformers

The `TransformUtils` class provides a `composeTransforms` method to combine multiple transformers:

```javascript
import { TransformUtils } from 'xjx';
import { BooleanTransform } from './boolean-transform';
import { NumberTransform } from './number-transform';

// Create individual transforms
const booleanTransform = new BooleanTransform();
const numberTransform = new NumberTransform();

// Compose them into a single transform
const dataTypeTransform = TransformUtils.composeTransforms(
  booleanTransform,
  numberTransform
);

// Use the composed transform
const result = XJX.fromXml(xml)
  .withTransforms(dataTypeTransform)
  .toJson();
```

### Conditional Transformers

The `TransformUtils` class provides a `conditionalTransform` method:

```javascript
import { TransformUtils } from 'xjx';
import { ElementTransform } from './element-transform';

// Create a transform that only applies to "user" elements
const userElementTransform = TransformUtils.conditionalTransform(
  (node, context) => node.name === 'user',
  new ElementTransform({
    addChildren: (parent) => [{
      name: 'timestamp',
      type: NodeType.ELEMENT_NODE,
      value: new Date().toISOString(),
      parent: parent
    }]
  })
);

// Use the conditional transform
const result = XJX.fromXml(xml)
  .withTransforms(userElementTransform)
  .toJson();
```

### Format-Specific Multi-Transform

```javascript
import { FORMATS, createFormatAwareTransform } from 'xjx';

// Create a transform that applies different transforms based on format
const caseTransform = createFormatAwareTransform(
  [TransformTarget.Value],
  {
    [FORMATS.JSON]: (value, context) => {
      // To JSON: Convert keys to camelCase
      if (typeof value === 'string' && context.isAttribute) {
        return createTransformResult(value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()));
      }
      return createTransformResult(value);
    },
    
    [FORMATS.XML]: (value, context) => {
      // To XML: Convert keys to kebab-case
      if (typeof value === 'string' && context.isAttribute) {
        return createTransformResult(value.replace(/([A-Z])/g, '-$1').toLowerCase());
      }
      return createTransformResult(value);
    }
  }
);
```

## Transformer Pipeline Execution

When you add multiple transformers, XJX executes them in a pipeline:

1. The XML or JSON is first converted to an XNode representation
2. For each node in the XNode tree:
   - The node's target type is determined (element, value, etc.)
   - All transformers that target that type are applied in sequence
   - Each transformer receives the output of the previous transformer
3. The transformed XNode is converted to the target format (XML, JSON, etc.)

The transform pipeline only applies transformers to matching node types, which improves performance and simplifies transformer implementation.

## Extending to New Formats

One of the key benefits of the parameterized format approach is that it's easy to extend XJX to support new formats beyond XML and JSON:

1. Define a new format identifier:
   ```typescript
   // Add to FORMATS or define separately
   const YAML_FORMAT = 'yaml' as FormatId;
   ```

2. Create corresponding converters:
   ```typescript
   class XNodeToYamlConverter implements Converter<XNode, string> { /*...*/ }
   class YamlToXNodeConverter implements Converter<string, XNode> { /*...*/ }
   ```

3. Add new methods to XjxBuilder:
   ```typescript
   // Terminal extension to convert to YAML
   function toYaml(this: TerminalExtensionContext): string {
     // Apply transformations
     if (this.transforms && this.transforms.length > 0) {
       const transformer = new DefaultXNodeTransformer(this.config);
       this.xnode = transformer.transform(
         this.xnode!, 
         this.transforms, 
         'yaml'  // Use YAML format identifier
       );
     }
     
     // Convert XNode to YAML
     const converter = new XNodeToYamlConverter(this.config);
     return converter.convert(this.xnode!);
   }
   
   // Register the extension
   XJX.registerTerminalExtension("toYaml", toYaml);
   ```

4. Update transforms to handle the new format:
   ```typescript
   transform(value: any, context: TransformContext): TransformResult<any> {
     switch (context.targetFormat) {
       case FORMATS.JSON:
         // JSON handling
         break;
       case FORMATS.XML:
         // XML handling
         break;
       case 'yaml':
         // YAML handling
         break;
     }
     
     return createTransformResult(value);
   }
   ```

## Next Steps

Now that you understand the transformation system, learn more about:

- [The Extension System](extension-system.md) - How to extend XJX with custom methods
- [The Metadata System](metadata-system.md) - Working with the metadata layer
- [API Reference](api-reference.md) - Complete API documentation