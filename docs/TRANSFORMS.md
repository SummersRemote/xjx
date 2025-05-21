# Creating Custom Transforms for XJX

This guide explains how to create and use custom transforms with the XJX library. Transforms allow you to modify data during the conversion process between XML and JSON.

## Transform Basics

Transforms in XJX:
- Operate on the intermediate `XNode` representation
- Target specific aspects of the data (values, attributes, elements, etc.)
- Are applied in sequence during conversion
- Can be reused across different conversions

## Transform Interface

All transforms implement the `Transform` interface:

```typescript
interface Transform {
  // What aspects of nodes this transform targets
  targets: TransformTarget[];
  
  // Transform method
  transform(value: any, context: TransformContext): TransformResult<any>;
}
```

### Transform Targets

Transforms specify which aspects of the data they target:

```typescript
enum TransformTarget {
  Value = 'value',                 // Node values
  Attribute = 'attribute',         // Node attributes
  Element = 'element',             // Element nodes
  Text = 'text',                   // Text nodes
  CDATA = 'cdata',                 // CDATA sections
  Comment = 'comment',             // Comments
  ProcessingInstruction = 'processingInstruction', // Processing instructions
  Namespace = 'namespace'          // Namespace declarations
}
```

A transform can target multiple aspects by including them in the `targets` array.

### Transform Context

The transform context provides information about the current node being transformed:

```typescript
interface TransformContext {
  nodeName: string;                // Name of the current node
  nodeType: number;                // Type of the current node
  path: string;                    // Path to the current node
  isAttribute?: boolean;           // Whether this is an attribute
  attributeName?: string;          // Name of the attribute (if applicable)
  isText?: boolean;                // Whether this is a text node
  isCDATA?: boolean;               // Whether this is a CDATA section
  isComment?: boolean;             // Whether this is a comment
  isProcessingInstruction?: boolean; // Whether this is a processing instruction
  namespace?: string;              // Namespace URI
  prefix?: string;                 // Namespace prefix
  parent?: TransformContext;       // Parent context
  config: Configuration;           // Current configuration
  targetFormat: FORMAT;            // Target format (XML or JSON)
}
```

### Transform Result

The transform method returns a `TransformResult` object:

```typescript
interface TransformResult<T> {
  value: T;                        // Transformed value
  remove?: boolean;                // Whether to remove the node
}
```

Setting `remove` to `true` will remove the node from the output.

## Creating a Basic Transform

Let's create a simple transform that converts text to uppercase:

```typescript
import { 
  Transform, 
  TransformContext, 
  TransformResult, 
  TransformTarget,
  createTransformResult
} from 'xjx';

/**
 * Transform that converts text values to uppercase
 */
export class UppercaseTransform implements Transform {
  // This transform targets values only
  public readonly targets = [TransformTarget.Value];
  
  /**
   * Transform implementation
   */
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Only transform string values
    if (typeof value !== 'string') {
      return createTransformResult(value);
    }
    
    // Convert to uppercase
    const transformedValue = value.toUpperCase();
    
    // Return the transformed value
    return createTransformResult(transformedValue);
  }
}

/**
 * Factory function to create an UppercaseTransform
 */
export function createUppercaseTransform(): UppercaseTransform {
  return new UppercaseTransform();
}
```

## Transform Options

Most transforms accept options to customize their behavior. Let's create a transform with options:

```typescript
import { 
  Transform, 
  TransformContext, 
  TransformResult, 
  TransformTarget,
  createTransformResult
} from 'xjx';

/**
 * Options for the date transform
 */
export interface DateTransformOptions {
  /**
   * Input format regex pattern
   * Must include capturing groups for year, month, and day
   */
  inputPattern: RegExp;
  
  /**
   * Output format
   * Use $1, $2, $3 for year, month, day from inputPattern
   */
  outputFormat: string;
}

/**
 * Transform that converts date strings between formats
 */
export class DateTransform implements Transform {
  // This transform targets values only
  public readonly targets = [TransformTarget.Value];
  
  private inputPattern: RegExp;
  private outputFormat: string;
  
  /**
   * Create a new DateTransform
   */
  constructor(options: DateTransformOptions) {
    this.inputPattern = options.inputPattern;
    this.outputFormat = options.outputFormat;
  }
  
  /**
   * Transform implementation
   */
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Only transform string values
    if (typeof value !== 'string') {
      return createTransformResult(value);
    }
    
    // Check if value matches our date pattern
    const match = value.match(this.inputPattern);
    if (!match) {
      return createTransformResult(value);
    }
    
    // Extract year, month, day from match
    const [, year, month, day] = match;
    
    // Format the date using our output format
    const result = this.outputFormat
      .replace('$1', year)
      .replace('$2', month)
      .replace('$3', day);
    
    // Return the transformed value
    return createTransformResult(result);
  }
}

/**
 * Factory function to create a DateTransform
 */
export function createDateTransform(options: DateTransformOptions): DateTransform {
  return new DateTransform(options);
}
```

## Format-Specific Transforms

Sometimes you want a transform to behave differently depending on whether you're converting to XML or JSON:

```typescript
import { 
  Transform, 
  TransformContext, 
  TransformResult, 
  TransformTarget,
  createTransformResult,
  FORMAT
} from 'xjx';

/**
 * Transform that handles numbers differently for XML and JSON
 */
export class NumberFormatTransform implements Transform {
  // This transform targets values only
  public readonly targets = [TransformTarget.Value];
  
  /**
   * Transform implementation
   */
  transform(value: any, context: TransformContext): TransformResult<any> {
    // If not a number, return unchanged
    if (typeof value !== 'number') {
      return createTransformResult(value);
    }
    
    if (context.targetFormat === FORMAT.XML) {
      // For XML: convert to string with fixed precision
      return createTransformResult(value.toFixed(2));
    } else if (context.targetFormat === FORMAT.JSON) {
      // For JSON: keep as number
      return createTransformResult(value);
    }
    
    // Default: return unchanged
    return createTransformResult(value);
  }
}
```

## Advanced Transform Types

### Value Transforms

Value transforms modify primitive values (strings, numbers, booleans):

```typescript
import { 
  Transform, 
  TransformTarget,
  createTransformResult
} from 'xjx';

/**
 * Trim whitespace from string values
 */
export class TrimTransform implements Transform {
  public readonly targets = [TransformTarget.Value];
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    if (typeof value !== 'string') {
      return createTransformResult(value);
    }
    
    return createTransformResult(value.trim());
  }
}
```

### Attribute Transforms

Attribute transforms modify attribute names and values:

```typescript
import { 
  Transform, 
  TransformTarget,
  createTransformResult
} from 'xjx';

/**
 * Standardize attribute names (lowercase, convert spaces to underscores)
 */
export class AttributeNameTransform implements Transform {
  public readonly targets = [TransformTarget.Attribute];
  
  transform(attrPair: [string, any], context: TransformContext): TransformResult<[string, any]> {
    const [name, value] = attrPair;
    
    // Standardize attribute name (lowercase, spaces to underscores)
    const newName = name.toLowerCase().replace(/\s+/g, '_');
    
    // Return the transformed attribute pair
    return createTransformResult([newName, value]);
  }
}
```

### Element Transforms

Element transforms modify element nodes:

```typescript
import { 
  Transform, 
  TransformTarget,
  createTransformResult
} from 'xjx';

/**
 * Rename elements based on a mapping
 */
export class RenameElementTransform implements Transform {
  public readonly targets = [TransformTarget.Element];
  
  private nameMap: Record<string, string>;
  
  constructor(nameMap: Record<string, string>) {
    this.nameMap = nameMap;
  }
  
  transform(node: any, context: TransformContext): TransformResult<any> {
    // Check if we have a mapping for this node
    const newName = this.nameMap[node.name];
    if (!newName) {
      return createTransformResult(node);
    }
    
    // Clone the node to avoid modifying the original
    const clonedNode = { ...node };
    
    // Rename the node
    clonedNode.name = newName;
    
    return createTransformResult(clonedNode);
  }
}
```

### Metadata Transforms

Metadata transforms add metadata to nodes:

```typescript
import { 
  Transform, 
  TransformTarget,
  createTransformResult
} from 'xjx';

/**
 * Add validation metadata to nodes
 */
export class ValidationMetadataTransform implements Transform {
  public readonly targets = [TransformTarget.Element];
  
  private rules: Record<string, any>;
  
  constructor(rules: Record<string, any>) {
    this.rules = rules;
  }
  
  transform(node: any, context: TransformContext): TransformResult<any> {
    // Check if we have rules for this node
    const nodeRules = this.rules[node.name];
    if (!nodeRules) {
      return createTransformResult(node);
    }
    
    // Clone the node to avoid modifying the original
    const clonedNode = { ...node };
    
    // Initialize metadata if needed
    if (!clonedNode.metadata) {
      clonedNode.metadata = {};
    }
    
    // Add validation rules to metadata
    clonedNode.metadata.validation = nodeRules;
    
    return createTransformResult(clonedNode);
  }
}
```

## Transform Boilerplate

Here's a comprehensive boilerplate for creating new transforms:

```typescript
import { 
  Transform, 
  TransformContext, 
  TransformResult, 
  TransformTarget,
  createTransformResult,
  FORMAT
} from 'xjx';
import { logger } from 'xjx/core/error';

/**
 * Options for MyTransform
 */
export interface MyTransformOptions {
  // Custom options here
  option1?: boolean;
  option2?: string;
}

/**
 * MyTransform class
 */
export class MyTransform implements Transform {
  /**
   * Which parts of nodes this transform targets
   */
  public readonly targets = [
    TransformTarget.Value,
    // Add other targets as needed
  ];
  
  // Private properties for options
  private option1: boolean;
  private option2: string;
  
  /**
   * Create a new MyTransform
   */
  constructor(options: MyTransformOptions = {}) {
    // Initialize options with defaults
    this.option1 = options.option1 ?? true;
    this.option2 = options.option2 ?? 'default';
  }
  
  /**
   * Transform implementation
   * @param value Value to transform
   * @param context Transform context
   * @returns Transform result
   */
  transform(value: any, context: TransformContext): TransformResult<any> {
    try {
      // Example: different behavior based on target format
      if (context.targetFormat === FORMAT.JSON) {
        // To JSON: Transform one way
        return this.toJsonTransform(value, context);
      } else if (context.targetFormat === FORMAT.XML) {
        // To XML: Transform another way
        return this.toXmlTransform(value, context);
      }
      
      // Default: return unchanged
      return createTransformResult(value);
    } catch (err) {
      // Log error
      logger.error(`MyTransform error: ${err instanceof Error ? err.message : String(err)}`, {
        value,
        path: context.path
      });
      
      // Return original value on error
      return createTransformResult(value);
    }
  }
  
  /**
   * Transform for JSON target
   */
  private toJsonTransform(value: any, context: TransformContext): TransformResult<any> {
    // Skip if not applicable
    if (typeof value !== 'string') {
      return createTransformResult(value);
    }
    
    // Your transformation logic here
    const transformedValue = value; // Replace with actual transformation
    
    return createTransformResult(transformedValue);
  }
  
  /**
   * Transform for XML target
   */
  private toXmlTransform(value: any, context: TransformContext): TransformResult<any> {
    // Skip if not applicable
    if (typeof value !== 'string') {
      return createTransformResult(value);
    }
    
    // Your transformation logic here
    const transformedValue = value; // Replace with actual transformation
    
    return createTransformResult(transformedValue);
  }
}

/**
 * Factory function for MyTransform
 */
export function createMyTransform(options: MyTransformOptions = {}): MyTransform {
  return new MyTransform(options);
}
```

## More Complex Transform Examples

### Filtering Transform

A transform that filters out nodes based on criteria:

```typescript
import { 
  Transform, 
  TransformTarget,
  createTransformResult
} from 'xjx';

/**
 * Options for filter transform
 */
export interface FilterTransformOptions {
  /**
   * Function to determine if a node should be kept
   */
  predicate: (node: any, context: TransformContext) => boolean;
}

/**
 * Transform that filters nodes
 */
export class FilterTransform implements Transform {
  public readonly targets = [TransformTarget.Element];
  
  private predicate: (node: any, context: TransformContext) => boolean;
  
  constructor(options: FilterTransformOptions) {
    this.predicate = options.predicate;
  }
  
  transform(node: any, context: TransformContext): TransformResult<any> {
    // Check if node should be kept
    const keep = this.predicate(node, context);
    
    if (!keep) {
      // Remove the node
      return createTransformResult(node, true);
    }
    
    // Keep the node
    return createTransformResult(node);
  }
}

// Example usage:
const filterPrivate = new FilterTransform({
  predicate: (node, context) => {
    // Filter out nodes with a "private" attribute set to "true"
    return !(node.attributes?.private === "true");
  }
});
```

### Aggregate Transform

A transform that combines data from multiple nodes:

```typescript
import { 
  Transform, 
  TransformTarget,
  createTransformResult
} from 'xjx';

/**
 * Transform that combines child values into a single property
 */
export class AggregateTransform implements Transform {
  public readonly targets = [TransformTarget.Element];
  
  // Map of element names to fields that should be aggregated
  private aggregateMap: Record<string, { 
    fields: string[],
    targetField: string
  }>;
  
  constructor(aggregateMap: Record<string, { fields: string[], targetField: string }>) {
    this.aggregateMap = aggregateMap;
  }
  
  transform(node: any, context: TransformContext): TransformResult<any> {
    // Check if we have an aggregation for this node
    const config = this.aggregateMap[node.name];
    if (!config || !node.children) {
      return createTransformResult(node);
    }
    
    // Clone the node to avoid modifying the original
    const clonedNode = { ...node };
    if (!clonedNode.children) {
      return createTransformResult(clonedNode);
    }
    
    // Find the child nodes to aggregate
    const fieldsToAggregate = config.fields;
    const targetField = config.targetField;
    
    // Extract values
    const values: Record<string, any> = {};
    const childIndicesToRemove: number[] = [];
    
    for (let i = 0; i < clonedNode.children.length; i++) {
      const child = clonedNode.children[i];
      
      if (fieldsToAggregate.includes(child.name)) {
        // Store the value
        values[child.name] = child.value;
        
        // Mark for removal
        childIndicesToRemove.push(i);
      }
    }
    
    // Skip if no values found
    if (Object.keys(values).length === 0) {
      return createTransformResult(clonedNode);
    }
    
    // Remove aggregated children
    clonedNode.children = clonedNode.children.filter((_, i) => !childIndicesToRemove.includes(i));
    
    // Create the aggregate node
    const aggregateNode = {
      name: targetField,
      type: 1, // Element node
      value: values
    };
    
    // Add the aggregate node
    clonedNode.children.push(aggregateNode);
    
    return createTransformResult(clonedNode);
  }
}

// Example usage:
const addressAggregator = new AggregateTransform({
  'contact': {
    fields: ['street', 'city', 'zip', 'country'],
    targetField: 'address'
  }
});
```

## Using Transforms

Transforms are applied using the `withTransforms()` method:

```javascript
import { XJX, createDateTransform } from 'xjx';

const result = new XJX()
  .fromXml('<user><birthdate>1990-05-15</birthdate></user>')
  .withTransforms(
    createDateTransform({
      inputPattern: /(\d{4})-(\d{2})-(\d{2})/,
      outputFormat: '$2/$3/$1'
    })
  )
  .toJson();

// Result: { "user": { "birthdate": "05/15/1990" } }
```

## Using Multiple Transforms

Multiple transforms can be applied in sequence:

```javascript
import { 
  XJX, 
  createBooleanTransform, 
  createNumberTransform, 
  createRegexTransform 
} from 'xjx';

const result = new XJX()
  .fromXml(xmlString)
  .withTransforms(
    // Convert booleans first
    createBooleanTransform(),
    
    // Then convert numbers
    createNumberTransform(),
    
    // Then format dates
    createRegexTransform({
      pattern: /(\d{4})-(\d{2})-(\d{2})/,
      replacement: '$2/$3/$1'
    })
  )
  .toJson();
```

Transforms are applied in the order they are specified. The output of one transform becomes the input to the next.

## Transform Composition

Complex transformations can be achieved by combining multiple transforms:

```javascript
import { XJX } from 'xjx';
import { createBooleanTransform } from 'xjx/transforms';
import { createNumberTransform } from 'xjx/transforms';
import { createDateTransform } from './myTransforms';
import { createValidationMetadataTransform } from './myTransforms';

// Define validation rules
const validationRules = {
  'user': {
    required: ['name', 'email'],
    format: {
      email: 'email'
    }
  }
};

// Create a composite transformation
const result = new XJX()
  .fromXml(xmlString)
  .withTransforms(
    // Data type transforms
    createBooleanTransform(),
    createNumberTransform(),
    createDateTransform({
      inputPattern: /(\d{4})-(\d{2})-(\d{2})/,
      outputFormat: '$2/$3/$1'
    }),
    
    // Metadata transform
    createValidationMetadataTransform(validationRules)
  )
  .toJson();
```

## Best Practices

1. **Target Specific**: Be specific about what aspects your transform targets
2. **Error Handling**: Always handle errors gracefully and avoid throwing exceptions
3. **Immutability**: Don't modify input values directly, return new ones
4. **Documentation**: Document your transform's behavior and options
5. **Testing**: Test transforms with various inputs including edge cases
6. **Performance**: Keep transforms efficient, especially for large documents

## Common Pitfalls

1. **Modifying Inputs**: Never modify input values directly, always return new ones
2. **Ignoring Context**: Consider the transform context (XML vs JSON, path, etc.)
3. **Overlooking Edge Cases**: Handle null, undefined, and unexpected values
4. **Using Too Many Transforms**: Each transform adds processing overhead
5. **Order Dependency**: Be aware that transform order can matter

## Debugging Transforms

To debug transforms, use the logging system:

```javascript
import { XJX, LogLevel } from 'xjx';

// Enable debug logging
const xjx = new XJX()
  .setLogLevel(LogLevel.DEBUG);
  
// Apply transforms
const result = xjx
  .fromXml(xmlString)
  .withTransforms(/* transforms */)
  .toJson();
```

This will log detailed information about the transformation process, which can help identify issues.

## Transform Testing

It's important to test transforms thoroughly:

```javascript
// Simple test function for transforms
function testTransform(transform, input, expectedOutput) {
  // Create a basic context
  const context = {
    nodeName: 'test',
    nodeType: 1,
    path: 'test',
    config: {},
    targetFormat: 'json'
  };
  
  // Apply the transform
  const result = transform.transform(input, context);
  
  // Check the result
  console.log('Input:', input);
  console.log('Expected:', expectedOutput);
  console.log('Actual:', result.value);
  console.log('Match:', JSON.stringify(result.value) === JSON.stringify(expectedOutput));
}

// Test a transform
testTransform(
  createDateTransform({
    inputPattern: /(\d{4})-(\d{2})-(\d{2})/,
    outputFormat: '$2/$3/$1'
  }),
  '2023-04-15',
  '04/15/2023'
);
```

For more complex transforms, consider using a testing framework like Jest or Mocha.