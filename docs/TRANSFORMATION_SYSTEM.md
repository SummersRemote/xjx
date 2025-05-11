# XJX Transformation System Guide

XJX's transformation system is a powerful mechanism that allows you to modify, filter, and enhance data during the conversion process. This guide explains the transformation system in detail and shows how to create your own transformers.

## What Are Transformers?

Transformers are modules that modify the `XNode` structure during conversion. They can:

- Convert data types (strings to booleans, numbers, etc.)
- Filter or rename elements and attributes
- Add or remove nodes
- Modify text content
- Apply metadata

Transformers can be applied in either direction (XML → JSON or JSON → XML) and are executed in a pipeline, where each transformer processes the output of the previous one.

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
  
  // Direction of transformation
  direction: TransformDirection;
}
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

XJX includes several built-in transformers:

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

Converts string values to numbers:

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
      strictParsing: true  // Only convert exact matches
    })
  )
  .toJson();

console.log(json);
// Output: All values are converted to their numeric types
```

### RegexTransform

Performs string replacements using regular expressions:

```javascript
import { XJX, RegexTransform } from 'xjx';

const xml = `
<data>
  <url>https://example.com/page</url>
  <code>function test() { return true; }</code>
</data>
`;

const result = XJX.fromXml(xml)
  .withTransforms(
    new RegexTransform({
      pattern: /(https?:\/\/\S+)/g,
      replacement: '<a href="$1">$1</a>'
    })
  )
  .toXml();

console.log(result);
// Output: URLs are converted to HTML links
```

### AttributeTransform

Manipulates XML attributes:

```javascript
import { XJX, AttributeTransform } from 'xjx';

const xml = `
<user old-id="1234" temp="true" internal-code="ABC">
  <name>John Doe</name>
</user>
`;

const result = XJX.fromXml(xml)
  .withTransforms(
    new AttributeTransform({
      renameMap: { 'old-id': 'id' },       // Rename attributes
      removeAttributes: ['internal-code'], // Remove attributes
      removePattern: /^temp/               // Remove by pattern
    })
  )
  .toXml();

console.log(result);
// Output: <user id="1234"><name>John Doe</name></user>
```

### ElementTransform

Transforms XML elements:

```javascript
import { XJX, ElementTransform } from 'xjx';

const xml = `
<users>
  <user>
    <name>John Doe</name>
    <password>secret123</password>
    <role>admin</role>
  </user>
</users>
`;

const result = XJX.fromXml(xml)
  .withTransforms(
    new ElementTransform({
      // Rename elements
      renameMap: { 'role': 'userRole' },
      
      // Filter children based on condition
      filterChildren: (child) => child.name !== 'password',
      
      // Only process specific elements
      filter: (node) => node.name === 'user'
    })
  )
  .toXml();

console.log(result);
// Output: Password elements are removed and role is renamed to userRole
```

### TextTransform

Manipulates text nodes:

```javascript
import { XJX, TextTransform } from 'xjx';

const xml = `
<data>
  <description>  This is some  text with   extra whitespace.  </description>
</data>
`;

const result = XJX.fromXml(xml)
  .withTransforms(
    new TextTransform({
      trim: true,                    // Trim whitespace
      normalizeWhitespace: true,     // Normalize whitespace
      transformFn: text => text.toLowerCase() // Custom function
    })
  )
  .toXml();

console.log(result);
// Output: <data><description>this is some text with extra whitespace.</description></data>
```

### CommentTransform

Manipulates XML comments:

```javascript
import { XJX, CommentTransform } from 'xjx';

const xml = `
<data>
  <!-- DEBUG: Remove in production -->
  <value>123</value>
  <!-- Regular comment -->
</data>
`;

const result = XJX.fromXml(xml)
  .withTransforms(
    new CommentTransform({
      removePattern: /DEBUG/,  // Remove comments containing "DEBUG"
      keepPattern: /Regular/   // Keep comments containing "Regular"
    })
  )
  .toXml();

console.log(result);
// Output: Only the "Regular comment" is preserved
```

### MetadataTransform

Adds metadata to nodes (see the [Metadata System Guide](metadata-system.md) for details):

```javascript
import { XJX, MetadataTransform } from 'xjx';

const xml = `
<users>
  <user id="1">
    <name>John Doe</name>
    <email>john@example.com</email>
  </user>
</users>
`;

const result = XJX.fromXml(xml)
  .withTransforms(
    new MetadataTransform({
      selector: 'user',
      metadata: {
        'validation': {
          required: ['name', 'email']
        }
      }
    })
  );

// Now validation metadata is attached to user elements
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
  createTransformResult 
} from 'xjx';

export class MyTransform implements Transform {
  // Specify which node types this transformer targets
  targets = [TransformTarget.Value];
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Skip non-applicable values
    if (typeof value !== 'string') {
      return createTransformResult(value);
    }
    
    // Apply transformation logic
    const transformedValue = value.toUpperCase();
    
    // Return the transformed value
    return createTransformResult(transformedValue);
  }
}
```

### Example: Custom Date Transformer

Here's a more complete example that converts ISO date strings to formatted dates:

```javascript
import { 
  Transform, 
  TransformContext, 
  TransformResult, 
  TransformTarget, 
  createTransformResult 
} from 'xjx';

export interface DateTransformOptions {
  // Date detection pattern
  datePattern?: RegExp;
  
  // Output format (e.g., 'YYYY-MM-DD', 'MM/DD/YYYY')
  format?: string;
  
  // Elements to target
  targetElements?: string[];
}

export class DateTransform implements Transform {
  targets = [TransformTarget.Value];
  
  private datePattern: RegExp;
  private format: string;
  private targetElements: string[];
  
  constructor(options: DateTransformOptions = {}) {
    // Default ISO date pattern
    this.datePattern = options.datePattern || 
      /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
    
    // Default output format
    this.format = options.format || 'MMMM D, YYYY';
    
    // Default target elements
    this.targetElements = options.targetElements || 
      ['date', 'created', 'updated', 'timestamp'];
  }
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Skip non-string values
    if (typeof value !== 'string') {
      return createTransformResult(value);
    }
    
    // Check if this is one of our target elements
    const parentName = context.parent?.nodeName;
    if (parentName && this.targetElements.length > 0) {
      if (!this.targetElements.includes(parentName)) {
        return createTransformResult(value);
      }
    }
    
    // Check if the value matches our date pattern
    if (this.datePattern.test(value)) {
      try {
        // Parse the date
        const date = new Date(value);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
          return createTransformResult(value);
        }
        
        // Format the date (simplified formatting)
        const formattedDate = this.formatDate(date);
        return createTransformResult(formattedDate);
      } catch (error) {
        // If date parsing fails, return original value
        return createTransformResult(value);
      }
    }
    
    // Return original value if not a date
    return createTransformResult(value);
  }
  
  // Simple date formatter (in real code, use a date library)
  private formatDate(date: Date): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const year = date.getFullYear();
    const month = months[date.getMonth()];
    const day = date.getDate();
    
    if (this.format === 'MMMM D, YYYY') {
      return `${month} ${day}, ${year}`;
    } else if (this.format === 'MM/DD/YYYY') {
      return `${date.getMonth() + 1}/${day}/${year}`;
    } else if (this.format === 'YYYY-MM-DD') {
      return `${year}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
    
    // Default format
    return `${month} ${day}, ${year}`;
  }
}

// Usage:
const json = XJX.fromXml(xml)
  .withTransforms(
    new DateTransform({
      format: 'MM/DD/YYYY',
      targetElements: ['birthday', 'joinDate']
    })
  )
  .toJson();
```

### Transformer Best Practices

1. **Check value types**: Always verify input types before transformation
   ```javascript
   if (typeof value !== 'string') {
     return createTransformResult(value);
   }
   ```

2. **Use context information**: Leverage context to make informed decisions
   ```javascript
   if (context.parent?.nodeName === 'price') {
     // Apply special handling for price elements
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

### Named Transformers

The `TransformUtils` class provides a `namedTransform` method for better debugging:

```javascript
import { TransformUtils } from 'xjx';
import { BooleanTransform } from './boolean-transform';

// Create a named transform
const boolTransform = TransformUtils.namedTransform(
  'BooleanTransformer',
  new BooleanTransform()
);

// Use the named transform
const result = XJX.fromXml(xml)
  .withTransforms(boolTransform)
  .toJson();
```

## Transformer Pipeline Execution

When you add multiple transformers, XJX executes them in a pipeline:

1. The XML or JSON is first converted to an XNode representation
2. For each node in the XNode tree:
   - The node's target type is determined (element, value, etc.)
   - All transformers that target that type are applied in sequence
   - Each transformer receives the output of the previous transformer
3. The transformed XNode is converted to the target format (XML or JSON)

The transform pipeline only applies transformers to matching node types, which improves performance and simplifies transformer implementation.

## Direction-Aware Transformation

Transformers can adapt their behavior based on the transformation direction:

```javascript
transform(value: any, context: TransformContext): TransformResult<any> {
  // Different behavior based on direction
  if (context.direction === TransformDirection.XML_TO_JSON) {
    // XML to JSON transformation
    return transformResult(value.toUpperCase());
  } else {
    // JSON to XML transformation
    return transformResult(value.toLowerCase());
  }
}
```

This allows you to create transformers that handle both directions appropriately.

## Next Steps

Now that you understand the transformation system, learn more about:

- [The Extension System](extension-system.md) - How to extend XJX with custom methods
- [The Metadata System](metadata-system.md) - Working with the metadata layer
- [API Reference](api-reference.md) - Complete API documentation