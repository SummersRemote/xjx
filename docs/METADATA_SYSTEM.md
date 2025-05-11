# XJX Metadata System Guide

The XJX Metadata System is a powerful feature that allows you to attach additional information to nodes without affecting the XML or JSON representation. This guide explains how the metadata system works and provides examples of its usage.

## Introduction to XJX Metadata

The metadata system adds a dedicated container to each XNode that carries processing instructions and other metadata without affecting the document content. This metadata container provides:

- A separate layer from the XML/JSON content
- Preservation during transformations
- Accessibility at all processing stages
- Customizability for any use case
- Non-serialization to the final output

## The Metadata Container

Each `XNode` in XJX has an optional metadata container:

```typescript
class XNode {
  // Core properties
  name: string;
  type: number;
  value?: any;
  attributes?: Record<string, any>;
  children?: XNode[];
  // ...other properties...
  
  // Metadata container
  metadata?: Record<string, any>;
  
  // Metadata methods
  setMetadata(key: string, value: any): XNode;
  getMetadata<T>(key: string, defaultValue?: T): T | undefined;
  hasMetadata(key: string): boolean;
  removeMetadata(key: string): boolean;
  setMetadataValues(values: Record<string, any>): XNode;
  clearMetadata(): XNode;
}
```

The metadata container is a simple key-value store that can hold any type of data. This allows for maximum flexibility in what you can attach to nodes.

## Working with Metadata Directly

### Setting Metadata

```javascript
// Create a node
const node = XNode.createElement('user');

// Set individual metadata properties
node.setMetadata('validated', true);
node.setMetadata('source', 'user_import.xml');

// Set multiple metadata properties at once
node.setMetadataValues({
  priority: 'high',
  lastModified: new Date().toISOString(),
  tags: ['important', 'customer']
});
```

### Getting Metadata

```javascript
// Get metadata with type inference
const validated = node.getMetadata<boolean>('validated');

// Get metadata with a default value
const priority = node.getMetadata<string>('priority', 'medium');

// Check if metadata exists
if (node.hasMetadata('tags')) {
  const tags = node.getMetadata<string[]>('tags');
  console.log(tags.join(', '));
}
```

### Removing Metadata

```javascript
// Remove a specific metadata property
node.removeMetadata('temporary');

// Clear all metadata
node.clearMetadata();
```

## The MetadataTransform

While you can manipulate metadata directly on XNode instances, the `MetadataTransform` class provides a convenient way to add metadata through the transformation pipeline:

```typescript
interface MetadataTransformOptions {
  // Criteria for selecting nodes to apply metadata to
  selector?: NodeSelector; // string, RegExp, or function
  
  // Whether to apply to the root node regardless of selector
  applyToRoot?: boolean;
  
  // Whether to apply to all nodes regardless of selector
  applyToAll?: boolean;
  
  // Metadata to apply to matching nodes
  metadata: Record<string, any>;
  
  // Whether to replace existing metadata (true) or merge with it (false)
  replace?: boolean;
  
  // List of metadata keys to remove (if any)
  removeKeys?: string[];
  
  // Maximum depth to apply metadata (undefined = no limit)
  maxDepth?: number;
}

// NodeSelector can be:
type NodeSelector = string | RegExp | ((node: XNode, context: TransformContext) => boolean);
```

### Basic MetadataTransform Examples

```javascript
import { XJX, MetadataTransform } from 'xjx';

// Add metadata to the root node
const result = XJX.fromXml(xml)
  .withTransforms(
    new MetadataTransform({
      applyToRoot: true,
      metadata: {
        'source': 'user_export.xml',
        'timestamp': new Date().toISOString(),
        'version': '1.0'
      }
    })
  )
  .toJson();

// Add metadata to specific elements
const result = XJX.fromXml(xml)
  .withTransforms(
    new MetadataTransform({
      selector: 'user', // Apply to all 'user' elements
      metadata: {
        'validated': true,
        'required': ['name', 'email']
      }
    })
  )
  .toJson();

// Add metadata using a RegExp selector
const result = XJX.fromXml(xml)
  .withTransforms(
    new MetadataTransform({
      selector: /^date/, // Apply to elements starting with 'date'
      metadata: {
        'format': 'YYYY-MM-DD'
      }
    })
  )
  .toJson();

// Add metadata using a function selector
const result = XJX.fromXml(xml)
  .withTransforms(
    new MetadataTransform({
      selector: (node, context) => {
        // Apply to elements with a 'type' attribute
        return node.type === 1 && node.attributes && 'type' in node.attributes;
      },
      metadata: {
        'typed': true
      }
    })
  )
  .toJson();

// Remove certain metadata keys
const result = XJX.fromXml(xml)
  .withTransforms(
    new MetadataTransform({
      applyToAll: true,
      removeKeys: ['temporary', 'debug']
    })
  )
  .toJson();
```

## Practical Applications

The metadata system enables numerous use cases where you need to attach information to nodes without affecting the final output. Here are some practical applications:

### 1. Pretty Printing with Formatting Instructions

```javascript
import { XJX, MetadataTransform, PrettyPrintTransform } from 'xjx';

// First add formatting metadata
const result = XJX.fromXml(xml)
  .withTransforms(
    // Add formatting metadata to different node types
    new MetadataTransform({
      selector: 'code',
      metadata: {
        'formatting': {
          'preserveWhitespace': true,
          'indent': 0
        }
      }
    }),
    new MetadataTransform({
      selector: 'section',
      metadata: {
        'formatting': {
          'indent': 4,
          'blankLinesBefore': 1
        }
      }
    }),
    // Apply pretty printing using metadata
    new PrettyPrintTransform()
  )
  .toXml();
```

The `PrettyPrintTransform` can use the formatting metadata to guide its behavior, producing XML with custom formatting rules for different elements.

### 2. Validation Rules

```javascript
import { XJX, MetadataTransform, ValidationTransform } from 'xjx';

// Add validation metadata and then validate
const validationResult = XJX.fromXml(xml)
  .withTransforms(
    // Add validation rules as metadata
    new MetadataTransform({
      selector: 'user',
      metadata: {
        'validation': {
          'required': ['name', 'email'],
          'minLength': { 'name': 2, 'email': 5 },
          'pattern': { 'email': '^[^@]+@[^@]+\\.[^@]+$' }
        }
      }
    }),
    new MetadataTransform({
      selector: 'age',
      metadata: {
        'validation': {
          'type': 'number',
          'min': 0,
          'max': 120
        }
      }
    })
  )
  // Validate using the metadata
  .validate();

if (!validationResult.valid) {
  console.error('Validation errors:', validationResult.errors);
}
```

The `validate()` extension could use the metadata to check if nodes meet the specified validation rules.

### 3. Security and Redaction

```javascript
import { XJX, MetadataTransform, SecurityTransform } from 'xjx';

// Add security metadata and apply security transform
const result = XJX.fromXml(xml)
  .withTransforms(
    // Add security metadata to sensitive fields
    new MetadataTransform({
      selector: 'creditCard',
      metadata: {
        'security': {
          'redact': true,
          'pattern': 'XXXX-XXXX-XXXX-$4' // Keep last 4 digits
        }
      }
    }),
    new MetadataTransform({
      selector: 'ssn',
      metadata: {
        'security': {
          'redact': true,
          'pattern': 'XXX-XX-$4'
        }
      }
    }),
    // Apply security transform that uses the metadata
    new SecurityTransform()
  )
  .toJson();
```

The `SecurityTransform` could use the security metadata to redact sensitive information according to the specified patterns.

### 4. Rendering Instructions

```javascript
import { XJX, MetadataTransform } from 'xjx';

// Add rendering metadata for UI components
const data = XJX.fromXml(xml)
  .withTransforms(
    // Add rendering hints for different elements
    new MetadataTransform({
      selector: 'price',
      metadata: {
        'ui': {
          'component': 'PriceDisplay',
          'format': 'currency',
          'locale': 'en-US',
          'precision': 2
        }
      }
    }),
    new MetadataTransform({
      selector: 'date',
      metadata: {
        'ui': {
          'component': 'DateDisplay',
          'format': 'MMMM D, YYYY'
        }
      }
    }),
    // Data type conversions
    new BooleanTransform(),
    new NumberTransform()
  )
  .toJson();

// Now your UI code can use the metadata:
function renderField(field, value) {
  const metadata = field.getMetadata('ui');
  
  if (metadata) {
    switch (metadata.component) {
      case 'PriceDisplay':
        return <PriceDisplay 
          value={value} 
          format={metadata.format}
          locale={metadata.locale}
          precision={metadata.precision}
        />;
      case 'DateDisplay':
        return <DateDisplay 
          value={value} 
          format={metadata.format}
        />;
      // ...other components...
    }
  }
  
  // Default rendering if no metadata
  return <DefaultDisplay value={value} />;
}
```

### 5. Processing Audit Trail

```javascript
import { XJX, MetadataTransform } from 'xjx';

// Track processing steps
let result = XJX.fromXml(xml);

// Add source information
result = result.withTransforms(
  new MetadataTransform({
    applyToRoot: true,
    metadata: {
      'audit': {
        'source': 'api_export.xml',
        'timestamp': new Date().toISOString(),
        'steps': []
      }
    }
  })
);

// Each processing step adds to the audit trail
function addAuditStep(builder, step) {
  const root = builder.xnode;
  const audit = root?.getMetadata('audit');
  
  if (audit) {
    audit.steps.push({
      step,
      timestamp: new Date().toISOString()
    });
    
    root.setMetadata('audit', audit);
  }
  
  return builder;
}

// Perform processing steps and track them
result = addAuditStep(result, 'Data validation');
result = result.withTransforms(/* validation transforms */);

result = addAuditStep(result, 'Data type conversion');
result = result.withTransforms(
  new BooleanTransform(),
  new NumberTransform()
);

result = addAuditStep(result, 'Security filtering');
result = result.withTransforms(/* security transforms */);

// Get final result
const json = result.toJson();

// We can also retrieve the audit trail
const audit = result.xnode?.getMetadata('audit');
console.log('Processing audit:', audit);
```

This example shows how metadata can be used to track the processing history of a document, useful for debugging and audit purposes.

## Advanced Usage: Metadata-Aware Transformers

You can create custom transformers that work with metadata. Here's an example of a transformer that uses metadata to transform nodes:

```typescript
import { 
  Transform, 
  TransformContext, 
  TransformResult, 
  TransformTarget, 
  createTransformResult,
  XNode
} from 'xjx';

export class FormatBasedOnMetadataTransform implements Transform {
  // Target elements only
  targets = [TransformTarget.Element];
  
  transform(node: XNode, context: TransformContext): TransformResult<XNode> {
    // Clone the node to avoid modifying the original
    const result = node.clone(false);
    result.children = node.children; // Shallow copy children
    
    // Get formatting metadata if it exists
    const formatting = node.getMetadata<{
      casing?: 'upper' | 'lower' | 'title',
      prefix?: string,
      suffix?: string
    }>('formatting');
    
    if (formatting) {
      // Apply text formatting to all text children
      if (result.children) {
        result.children = result.children.map(child => {
          if (child.type === 3) { // Text node
            let text = String(child.value || '');
            
            // Apply casing transformation
            if (formatting.casing) {
              switch (formatting.casing) {
                case 'upper':
                  text = text.toUpperCase();
                  break;
                case 'lower':
                  text = text.toLowerCase();
                  break;
                case 'title':
                  text = text.split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
                  break;
              }
            }
            
            // Apply prefix/suffix
            if (formatting.prefix) {
              text = formatting.prefix + text;
            }
            if (formatting.suffix) {
              text = text + formatting.suffix;
            }
            
            // Create new text node with transformed text
            const newChild = child.clone(false);
            newChild.value = text;
            return newChild;
          }
          
          return child;
        });
      }
    }
    
    return createTransformResult(result);
  }
}
```

Usage:

```javascript
// First add formatting metadata
const result = XJX.fromXml(xml)
  .withTransforms(
    // Add formatting metadata
    new MetadataTransform({
      selector: 'title',
      metadata: {
        'formatting': {
          'casing': 'upper'
        }
      }
    }),
    new MetadataTransform({
      selector: 'price',
      metadata: {
        'formatting': {
          'prefix': '$'
        }
      }
    }),
    // Apply formatting based on metadata
    new FormatBasedOnMetadataTransform()
  )
  .toXml();
```

This would transform title elements to uppercase and add a '$' prefix to price elements.

## Retrieving Metadata After Processing

After processing, you can access the metadata from the XNode tree:

```javascript
// Process the XML
const result = XJX.fromXml(xml)
  .withTransforms(
    new MetadataTransform({
      applyToRoot: true,
      metadata: { 'config': { 'version': '1.0' } }
    })
  );

// Access the root node
const rootNode = result.xnode;

// Get metadata from the root
const config = rootNode?.getMetadata('config');
console.log('Config version:', config?.version);

// Find a specific node and get its metadata
const userNode = rootNode?.findChild('user');
const validation = userNode?.getMetadata('validation');
console.log('User validation:', validation);
```

## Conclusion

The XJX Metadata System provides a powerful way to attach additional information to XML/JSON documents without affecting their serialized form. This enables numerous use cases from validation and security to formatting and UI rendering instructions.

Key benefits of the metadata system:

1. **Separation of Concerns**: Keeps processing instructions separate from document content
2. **Non-Intrusive**: Doesn't affect the serialized XML or JSON
3. **Extensible**: Can store any type of data
4. **Hierarchical**: Metadata can be attached at any level of the document tree
5. **Transformable**: Works seamlessly with the transform pipeline

By leveraging metadata, you can build more sophisticated processing pipelines that maintain clean separation between content and processing instructions.

## Next Steps

Now that you understand the metadata system, check out:

- [API Reference](api-reference.md) - Complete API documentation