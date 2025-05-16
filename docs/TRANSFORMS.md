# XJX Transforms Guide

This guide provides detailed information about the XJX transform system, which allows you to modify data during XML/JSON conversion.

## Table of Contents

- [Understanding the Transform System](#understanding-the-transform-system)
- [Transform Concepts](#transform-concepts)
- [Built-in Transforms](#built-in-transforms)
- [Creating Custom Transforms](#creating-custom-transforms)
- [Advanced Use Cases](#advanced-use-cases)
- [Best Practices](#best-practices)

## Understanding the Transform System

The transform system in XJX provides a powerful way to modify data during the conversion process between XML and JSON. Transforms operate on the internal XNode representation, allowing for precise control over the conversion process.

Key features of the transform system:

- **Format-aware**: Transforms can behave differently based on target format (XML, XJX JSON, or Standard JSON)
- **Targeted**: Each transform can target specific node types (elements, attributes, text, etc.)
- **Chainable**: Multiple transforms can be applied in sequence
- **Stateless**: Transforms don't maintain state between transformations
- **Immutable**: Transforms don't modify the original data, but create new versions

## Transform Concepts

### XNode Model

All transforms operate on the XNode model, which represents XML data:

```javascript
// XNode structure (simplified)
interface XNode {
  name: string;              // Node name
  type: number;              // Node type (element, text, comment, etc.)
  value?: any;               // Node value
  attributes?: Record<string, any>; // Node attributes
  children?: XNode[];        // Child nodes
  namespace?: string;        // Namespace URI
  prefix?: string;           // Namespace prefix
  parent?: XNode;            // Parent node
  metadata?: Record<string, any>; // Metadata (for transform hints)
}
```

### Transform Interface

All transforms implement the `Transform` interface:

```typescript
interface Transform {
  // Types of nodes this transform targets
  targets: TransformTarget[];
  
  // Transform method
  transform(value: any, context: TransformContext): TransformResult<any>;
}

// Target types
enum TransformTarget {
  Value = 'value',                   // Node values
  Attribute = 'attribute',           // Node attributes
  Element = 'element',               // Element nodes
  Text = 'text',                     // Text nodes
  CDATA = 'cdata',                   // CDATA nodes
  Comment = 'comment',               // Comment nodes
  ProcessingInstruction = 'processingInstruction', // PI nodes
  Namespace = 'namespace'            // Namespace declarations
}

// Context provided to each transform
interface TransformContext {
  nodeName: string;         // Name of the current node
  nodeType: number;         // Type of the current node
  path: string;             // Path to the current node
  isAttribute?: boolean;    // Whether this is an attribute
  attributeName?: string;   // Attribute name (if applicable)
  isText?: boolean;         // Whether this is a text node
  isCDATA?: boolean;        // Whether this is a CDATA node
  isComment?: boolean;      // Whether this is a comment node
  isProcessingInstruction?: boolean; // Whether this is a PI node
  namespace?: string;       // Namespace URI
  prefix?: string;          // Namespace prefix
  parent?: TransformContext; // Parent context
  config: Configuration;    // XJX configuration
  targetFormat: FormatId;   // Target format (xml or json)
}

// Result of a transformation
interface TransformResult<T> {
  value: T;      // Transformed value
  remove: boolean; // Whether to remove this node
}
```

### Transform Application

Transforms are applied to XNodes during conversion:

```javascript
import { XJX, BooleanTransform, NumberTransform } from 'xjx';

// Apply transforms during conversion
const result = new XJX()
  .fromXml(xml)
  .withTransforms(
    new BooleanTransform(),
    new NumberTransform()
  )
  .toJson();
```

### Format-Aware Transforms

Transforms can behave differently based on the target format. The updated configuration structure adds support for Standard JSON format, in addition to the existing XML and XJX JSON formats:

```javascript
import { XJX, Transform, FORMATS } from 'xjx';

class MyTransform implements Transform {
  targets = [TransformTarget.Value];
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    if (context.targetFormat === FORMATS.XML) {
      // XML-specific transformation
      return createTransformResult(/* transformed for XML */);
    } else if (context.targetFormat === FORMATS.JSON) {
      // JSON-specific transformation (for both XJX and Standard JSON)
      return createTransformResult(/* transformed for JSON */);
    }
    
    // Default behavior
    return createTransformResult(value);
  }
}
```

## Built-in Transforms

XJX includes several built-in transforms:

### BooleanTransform

Converts string values to booleans and vice versa.

```javascript
import { XJX, BooleanTransform } from 'xjx';

// Create a boolean transform with custom settings
const booleanTransform = new BooleanTransform({
  trueValues: ['true', 'yes', '1', 'on', 'active'],    // Values considered as true
  falseValues: ['false', 'no', '0', 'off', 'inactive'], // Values considered as false
  ignoreCase: true                                     // Ignore case when matching
});

// Apply the transform
const result = new XJX()
  .fromXml('<user><active>yes</active><subscribed>no</subscribed></user>')
  .withTransforms(booleanTransform)
  .toStandardJson();

// Result:
// {
//   "user": {
//     "active": true,
//     "subscribed": false
//   }
// }
```

### NumberTransform

Converts string values to numbers and vice versa.

```javascript
import { XJX, NumberTransform } from 'xjx';

// Create a number transform with custom settings
const numberTransform = new NumberTransform({
  integers: true,                // Convert integer strings to numbers
  decimals: true,                // Convert decimal strings to numbers
  scientific: true,              // Convert scientific notation
  decimalSeparator: '.',         // Decimal separator character
  thousandsSeparator: ','        // Thousands separator character
});

// Apply the transform
const result = new XJX()
  .fromXml('<data><count>42</count><price>19.99</price><large>1,234,567</large></data>')
  .withTransforms(numberTransform)
  .toStandardJson();

// Result:
// {
//   "data": {
//     "count": 42,
//     "price": 19.99,
//     "large": 1234567
//   }
// }
```

### RegexTransform

Performs regex replacements on text values.

```javascript
import { XJX, RegexTransform } from 'xjx';

// Create a regex transform
const dateFormatTransform = new RegexTransform({
  pattern: /(\d{4})-(\d{2})-(\d{2})/g,  // ISO date format
  replacement: '$2/$3/$1',              // MM/DD/YYYY format
  format: 'json'                        // Only apply when converting to JSON
});

// Apply the transform
const result = new XJX()
  .fromXml('<user><birth-date>2023-01-15</birth-date></user>')
  .withTransforms(dateFormatTransform)
  .toStandardJson();

// Result:
// {
//   "user": {
//     "birth-date": "01/15/2023"
//   }
// }
```

### MetadataTransform

Manages metadata on XNode objects. Metadata can be used for processing hints, validation rules, and other custom information.

```javascript
import { XJX, MetadataTransform } from 'xjx';

// Create a metadata transform
const validationMetadataTransform = new MetadataTransform({
  selector: 'user',                // Apply to 'user' elements
  metadata: {                      // Metadata to apply
    validation: {
      required: ['name', 'email'],
      minLength: {
        name: 2,
        email: 5
      }
    }
  },
  formatMetadata: [                // Format-specific metadata
    {
      format: 'json',
      metadata: {
        jsonSchema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' }
          }
        }
      }
    }
  ],
  replace: false,                  // Merge with existing metadata
  removeKeys: [],                  // Keys to remove
  maxDepth: 2                      // Maximum depth to apply
});

// Apply the transform
const result = new XJX()
  .fromXml('<root><user><name>John</name><email>john@example.com</email></user></root>')
  .withTransforms(validationMetadataTransform)
  .toJson();

// The XNode now has metadata attached that can be used by other processing
```

## Creating Custom Transforms

You can create custom transforms to implement specialized transformation logic:

### Basic Custom Transform

```javascript
import { 
  XJX, 
  Transform, 
  TransformContext, 
  TransformResult, 
  TransformTarget,
  createTransformResult 
} from 'xjx';

// Create a custom transform to uppercase all text values
class UppercaseTransform implements Transform {
  // Target text values
  targets = [TransformTarget.Value];
  
  // Transform method
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Skip non-string values
    if (typeof value !== 'string') {
      return createTransformResult(value);
    }
    
    // Convert to uppercase
    return createTransformResult(value.toUpperCase());
  }
}

// Apply the custom transform
const result = new XJX()
  .fromXml('<greeting>Hello, world!</greeting>')
  .withTransforms(new UppercaseTransform())
  .toStandardJson();

// Result:
// {
//   "greeting": "HELLO, WORLD!"
// }
```

### Format-Aware Transform with Standard JSON Support

```javascript
import { 
  XJX, 
  Transform, 
  TransformContext, 
  TransformResult, 
  TransformTarget,
  createTransformResult,
  FORMATS 
} from 'xjx';

// Create a custom transform that behaves differently based on the target format
class CaseTransform implements Transform {
  // Target text values
  targets = [TransformTarget.Value];
  
  // Transform method
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Skip non-string values
    if (typeof value !== 'string') {
      return createTransformResult(value);
    }
    
    // Apply different transformations based on target format
    if (context.targetFormat === FORMATS.JSON) {
      // To JSON (both XJX and Standard): uppercase
      return createTransformResult(value.toUpperCase());
    } else if (context.targetFormat === FORMATS.XML) {
      // To XML: lowercase
      return createTransformResult(value.toLowerCase());
    }
    
    // For other formats, return as is
    return createTransformResult(value);
  }
}

// Apply the custom transform
const jsonResult = new XJX()
  .fromXml('<greeting>Hello, world!</greeting>')
  .withTransforms(new CaseTransform())
  .toStandardJson();

// Result when converting to Standard JSON:
// {
//   "greeting": "HELLO, WORLD!"
// }

const xmlResult = new XJX()
  .fromObjJson({ "greeting": "Hello, WORLD!" })
  .withTransforms(new CaseTransform())
  .toXml();

// Result when converting to XML:
// <greeting>hello, world!</greeting>
```

### Attribute Transform

```javascript
import { 
  XJX, 
  Transform, 
  TransformContext, 
  TransformResult, 
  TransformTarget,
  createTransformResult 
} from 'xjx';

// Create a custom transform for attributes
class AttributePrefixTransform implements Transform {
  // Target attributes
  targets = [TransformTarget.Attribute];
  
  // Transform method
  transform(attr: [string, any], context: TransformContext): TransformResult<[string, any]> {
    // Skip non-attribute contexts
    if (!context.isAttribute) {
      return createTransformResult(attr);
    }
    
    const [name, value] = attr;
    
    // Add a prefix to attribute names
    const newName = 'data-' + name;
    
    return createTransformResult([newName, value]);
  }
}

// Apply the custom transform
const result = new XJX()
  .fromXml('<div id="main" class="container"></div>')
  .withTransforms(new AttributePrefixTransform())
  .toXml();

// Result:
// <div data-id="main" data-class="container"></div>
```

### Element Transform

```javascript
import { 
  XJX, 
  Transform, 
  TransformContext, 
  TransformResult, 
  TransformTarget,
  createTransformResult 
} from 'xjx';

// Create a custom transform for elements
class ElementRenameTransform implements Transform {
  // Target elements
  targets = [TransformTarget.Element];
  
  // Element name mapping
  private mapping: Record<string, string>;
  
  constructor(mapping: Record<string, string>) {
    this.mapping = mapping;
  }
  
  // Transform method
  transform(node: XNode, context: TransformContext): TransformResult<XNode> {
    // Skip non-element nodes
    if (node.type !== 1) { // NodeType.ELEMENT_NODE
      return createTransformResult(node);
    }
    
    // Check if we have a mapping for this element name
    if (this.mapping[node.name]) {
      // Create a new node with the mapped name
      const newNode = node.clone(false); // Shallow clone
      newNode.name = this.mapping[node.name];
      
      // Copy children
      newNode.children = node.children;
      
      return createTransformResult(newNode);
    }
    
    // No mapping, return unchanged
    return createTransformResult(node);
  }
}

// Apply the custom transform
const result = new XJX()
  .fromXml('<user><n>John</n><location>New York</location></user>')
  .withTransforms(new ElementRenameTransform({
    'n': 'name',
    'location': 'address'
  }))
  .toStandardJson();

// Result:
// {
//   "user": {
//     "name": "John",
//     "address": "New York"
//   }
// }
```

### Transform for Standard JSON Format

```javascript
import { 
  XJX, 
  Transform, 
  TransformContext, 
  TransformResult, 
  TransformTarget,
  createTransformResult,
  FORMATS 
} from 'xjx';

// Transform that specifically targets standard JSON conversion
class StandardJsonTransform implements Transform {
  targets = [TransformTarget.Value];
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Only apply when converting to JSON and target is Standard JSON
    if (context.targetFormat === FORMATS.JSON && 
        context.config.converters.stdJson.options.attributeHandling !== 'ignore') {
      
      // Specific transformation for Standard JSON format
      if (typeof value === 'string' && value.includes('$')) {
        // Replace dollar signs with 'USD' text
        return createTransformResult(value.replace('$', 'USD '));
      }
    }
    
    // Return unchanged for other formats
    return createTransformResult(value);
  }
}

// Apply the transform
const result = new XJX()
  .fromXml('<price>$10.99</price>')
  .withTransforms(new StandardJsonTransform())
  .toStandardJson();

// Result:
// {
//   "price": "USD 10.99"
// }
```

## Advanced Use Cases

### Standard JSON Attribute Handling

```javascript
import { 
  XJX, 
  Transform, 
  TransformContext, 
  TransformResult, 
  TransformTarget,
  createTransformResult 
} from 'xjx';

// Transform that works with both types of JSON formats
class ProductTransform implements Transform {
  targets = [TransformTarget.Element];
  
  transform(node: XNode, context: TransformContext): TransformResult<XNode> {
    // Skip non-element nodes or non-product nodes
    if (node.type !== 1 || node.name !== 'product') {
      return createTransformResult(node);
    }
    
    // Create a new node
    const newNode = node.clone(false);
    newNode.children = node.children;
    
    // Add custom metadata for the standard JSON converter
    if (!newNode.metadata) {
      newNode.metadata = {};
    }
    
    // Add format-specific processing hint
    newNode.metadata.standardJsonFormat = {
      attributeHandling: 'prefix',  // Override global config for this node
      onlyTheseAttributes: ['id', 'sku']  // Only process these attributes
    };
    
    return createTransformResult(newNode);
  }
}

// Apply the transform with a config
const result = new XJX()
  .withConfig({
    converters: {
      stdJson: {
        options: {
          attributeHandling: 'merge'  // Global setting
        }
      }
    }
  })
  .fromXml('<product id="123" sku="ABC" internal="xyz"><name>Phone</name></product>')
  .withTransforms(new ProductTransform())
  .toStandardJson();

// Result:
// {
//   "product": {
//     "@id": "123",
//     "@sku": "ABC",
//     "name": "Phone"
//   }
// }
// Note: 'internal' attribute is not prefixed due to the metadata hint
```

### Metadata Transform for Validation

```javascript
import { 
  XJX, 
  Transform, 
  TransformContext, 
  TransformResult, 
  TransformTarget,
  createTransformResult,
  MetadataTransform 
} from 'xjx';

// Create a validation transform that uses metadata
class ValidationTransform implements Transform {
  targets = [TransformTarget.Element];
  
  transform(node: XNode, context: TransformContext): TransformResult<XNode> {
    // Skip non-element nodes
    if (node.type !== 1) { // NodeType.ELEMENT_NODE
      return createTransformResult(node);
    }
    
    // Check if the node has validation metadata
    const validation = node.getMetadata('validation');
    if (!validation) {
      return createTransformResult(node);
    }
    
    // Check required fields
    if (validation.required && Array.isArray(validation.required)) {
      for (const requiredField of validation.required) {
        const found = node.children?.some(child => child.name === requiredField);
        if (!found) {
          // Add validation error metadata
          const newNode = node.clone(false);
          newNode.children = node.children;
          
          if (!newNode.metadata) {
            newNode.metadata = {};
          }
          
          if (!newNode.metadata.validationErrors) {
            newNode.metadata.validationErrors = [];
          }
          
          newNode.metadata.validationErrors.push(
            `Missing required field: ${requiredField}`
          );
          
          return createTransformResult(newNode);
        }
      }
    }
    
    // More validation rules...
    
    return createTransformResult(node);
  }
}

// Usage: First apply metadata, then validate
const result = new XJX()
  .fromXml('<user><name>John</name></user>')
  .withTransforms(
    // Add validation rules as metadata
    new MetadataTransform({
      selector: 'user',
      metadata: {
        validation: {
          required: ['name', 'email']
        }
      }
    }),
    // Validate based on metadata
    new ValidationTransform()
  )
  .toStandardJson();

// The resulting XNode will have validation errors attached
```

### Format Conversion Transform with Standard JSON

```javascript
import { 
  XJX, 
  Transform, 
  TransformContext, 
  TransformResult, 
  TransformTarget,
  createTransformResult,
  FORMATS
} from 'xjx';

// Transform to convert between different XML formats
class FormatConversionTransform implements Transform {
  targets = [TransformTarget.Element];
  
  transform(node: XNode, context: TransformContext): TransformResult<XNode> {
    // Only transform SOAP envelopes and only when targeting JSON
    if (node.name !== 'soap:Envelope' || context.targetFormat !== FORMATS.JSON) {
      return createTransformResult(node);
    }
    
    // Extract the actual content from SOAP envelope
    const bodyNode = node.findChild('soap:Body');
    if (!bodyNode) {
      return createTransformResult(node);
    }
    
    const contentNode = bodyNode.children?.[0];
    if (!contentNode) {
      return createTransformResult(node);
    }
    
    // Add metadata to influence standard JSON conversion
    const newNode = contentNode.clone(true); // Deep clone the content node
    
    if (!newNode.metadata) {
      newNode.metadata = {};
    }
    
    // Add a hint for standard JSON conversion to use property mode for attributes
    newNode.metadata.standardJsonFormat = {
      attributeHandling: 'property',
      attributePropertyName: 'params'
    };
    
    // Get version from SOAP header and add as attribute
    const headerNode = node.findChild('soap:Header');
    if (headerNode) {
      const versionNode = headerNode.findChild('Version');
      if (versionNode) {
        if (!newNode.attributes) {
          newNode.attributes = {};
        }
        newNode.attributes.version = versionNode.getTextContent();
      }
    }
    
    return createTransformResult(newNode);
  }
}

// Apply the transform to convert SOAP to REST
const result = new XJX()
  .fromXml(`
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Header>
        <Version>1.0</Version>
      </soap:Header>
      <soap:Body>
        <GetUserRequest>
          <userId>123</userId>
          <includeDetails>true</includeDetails>
        </GetUserRequest>
      </soap:Body>
    </soap:Envelope>
  `)
  .withTransforms(
    new FormatConversionTransform(),
    new BooleanTransform()
  )
  .toStandardJson();

// Result:
// {
//   "GetUserRequest": {
//     "params": {
//       "version": "1.0"
//     },
//     "userId": "123",
//     "includeDetails": true
//   }
// }
```

### Combining Multiple Transforms

```javascript
import { 
  XJX, 
  BooleanTransform, 
  NumberTransform, 
  RegexTransform, 
  MetadataTransform 
} from 'xjx';

// Apply multiple transforms in sequence for standard JSON output
const result = new XJX()
  .fromXml(`
    <order>
      <orderDate>2023-05-15</orderDate>
      <items>
        <item>
          <id>123</id>
          <name>Widget</name>
          <price>19.99</price>
          <quantity>2</quantity>
          <inStock>true</inStock>
        </item>
        <item>
          <id>456</id>
          <name>Gadget</name>
          <price>29.99</price>
          <quantity>1</quantity>
          <inStock>false</inStock>
        </item>
      </items>
    </order>
  `)
  .withTransforms(
    // Convert boolean values
    new BooleanTransform(),
    
    // Convert numeric values
    new NumberTransform(),
    
    // Format dates
    new RegexTransform({
      pattern: /(\d{4})-(\d{2})-(\d{2})/,
      replacement: '$2/$3/$1'
    }),
    
    // Add metadata for UI rendering
    new MetadataTransform({
      selector: 'order',
      metadata: {
        ui: { component: 'OrderComponent' }
      }
    }),
    
    // Add metadata for validation
    new MetadataTransform({
      selector: 'item',
      metadata: {
        validation: {
          required: ['id', 'name', 'price', 'quantity']
        }
      }
    })
  )
  .toStandardJson();

// Result: Standard JSON with converted types
// {
//   "order": {
//     "orderDate": "05/15/2023",
//     "items": {
//       "item": [
//         {
//           "id": 123,
//           "name": "Widget",
//           "price": 19.99,
//           "quantity": 2,
//           "inStock": true
//         },
//         {
//           "id": 456,
//           "name": "Gadget",
//           "price": 29.99,
//           "quantity": 1,
//           "inStock": false
//         }
//       ]
//     }
//   }
// }
```

## Best Practices

When creating and using transforms, follow these best practices:

### 1. Target Specificity

Target only the node types you need:

```javascript
// Good: Only targets values
class ValueTransform implements Transform {
  targets = [TransformTarget.Value];
  // ...
}

// Bad: Targets everything
class ExcessiveTransform implements Transform {
  targets = [
    TransformTarget.Value,
    TransformTarget.Attribute,
    TransformTarget.Element,
    TransformTarget.Text,
    TransformTarget.CDATA,
    TransformTarget.Comment,
    TransformTarget.ProcessingInstruction
  ];
  // ...
}
```

### 2. Immutability

Never modify input values, create new ones:

```javascript
// Good: Creates new objects
transform(node: XNode, context: TransformContext): TransformResult<XNode> {
  const newNode = node.clone(false);
  newNode.name = 'new-name';
  newNode.children = node.children;
  return createTransformResult(newNode);
}

// Bad: Modifies input
transform(node: XNode, context: TransformContext): TransformResult<XNode> {
  node.name = 'new-name'; // ❌ Don't modify input directly
  return createTransformResult(node);
}
```

### 3. Error Handling

Use the built-in error handling system:

```javascript
import { handleError, ErrorType } from 'xjx';

// Good: Uses error handling system
transform(value: any, context: TransformContext): TransformResult<any> {
  try {
    // Transformation logic
    return createTransformResult(transformedValue);
  } catch (err) {
    return handleError(err, "custom transform operation", {
      data: { 
        value,
        context
      },
      errorType: ErrorType.TRANSFORM,
      fallback: createTransformResult(value) // Return original as fallback
    });
  }
}
```

### 4. Performance Considerations

Be mindful of performance:

```javascript
// Good: Fast path for common case
transform(value: any, context: TransformContext): TransformResult<any> {
  // Quick check to skip unnecessary work
  if (typeof value !== 'string' || value.length === 0) {
    return createTransformResult(value);
  }
  
  // More expensive transformation logic
  // ...
}

// Bad: Unnecessary deep operations
transform(value: any, context: TransformContext): TransformResult<any> {
  // Deep cloning every time is expensive
  const clonedValue = JSON.parse(JSON.stringify(value));
  // ...
}
```

### 5. Format Awareness

Make transforms format-aware:

```javascript
// Good: Different behavior based on format
transform(value: any, context: TransformContext): TransformResult<any> {
  if (context.targetFormat === FORMATS.JSON) {
    // Access config to check which JSON format is being used
    const isStandardJson = context.config.converters.stdJson.options.attributeHandling !== 'ignore';
    
    if (isStandardJson) {
      // Standard JSON-specific transformation
    } else {
      // XJX JSON-specific transformation
    }
  } else if (context.targetFormat === FORMATS.XML) {
    // XML-specific transformation
  }
  return createTransformResult(value);
}
```

### 6. Composition

Compose transforms for complex operations:

```javascript
// Good: Separate transforms for distinct operations
const result = new XJX()
  .fromXml(xml)
  .withTransforms(
    new TypeConversionTransform(),
    new NamingConventionTransform(),
    new ValidationTransform()
  )
  .toStandardJson();

// Bad: Single monolithic transform
const result = new XJX()
  .fromXml(xml)
  .withTransforms(
    new DoEverythingTransform() // ❌ Too many responsibilities
  )
  .toStandardJson();
```

### 7. Context Awareness

Use the context to make informed decisions:

```javascript
// Good: Uses context information
transform(value: any, context: TransformContext): TransformResult<any> {
  // Check node type
  if (context.isText) {
    // Text-specific logic
  }
  
  // Check node name
  if (context.nodeName === 'email') {
    // Email-specific logic
  }
  
  // Check path
  if (context.path.includes('address')) {
    // Address-related logic
  }
  
  // Check configuration
  if (context.config.converters.stdJson.options.attributeHandling === 'prefix') {
    // Handle prefix-style attributes
  }
  
  return createTransformResult(value);
}
```

### 8. Documentation

Document your transforms thoroughly:

```javascript
/**
 * SensitiveDataTransform - Redacts sensitive data in XML/JSON
 * 
 * Redacts values in fields that contain sensitive information such as:
 * - Social Security Numbers (SSN)
 * - Credit card numbers
 * - Passwords
 * 
 * Example usage:
 * ```
 * new XJX()
 *   .fromXml(xml)
 *   .withTransforms(new SensitiveDataTransform({
 *     fields: ['password', 'ssn', 'creditCard']
 *   }))
 *   .toStandardJson();
 * ```
 */
class SensitiveDataTransform implements Transform {
  // ...
}
```

### 9. Standard JSON Compatibility

Ensure transforms work with both JSON formats:

```javascript
// Good: Handles both JSON formats appropriately
transform(value: any, context: TransformContext): TransformResult<any> {
  if (context.targetFormat === FORMATS.JSON) {
    // Check which JSON format we're targeting via the config
    const attributeHandling = context.config.converters.stdJson.options.attributeHandling;
    const isStandardJson = attributeHandling !== 'ignore';
    
    if (isStandardJson) {
      // Standard JSON output - may need different handling
    } else {
      // XJX format output - full fidelity
    }
  }
  return createTransformResult(value);
}
```

### 10. Metadata for Format Control

Use metadata to control format-specific behavior:

```javascript
// Add format-specific metadata
new XJX()
  .fromXml(xml)
  .withTransforms(
    new MetadataTransform({
      selector: 'user',
      formatMetadata: [
        {
          format: 'json',
          metadata: {
            standardJsonFormat: {
              // Override standard JSON format for this node
              attributeHandling: 'property',
              attributePropertyName: 'attrs'
            }
          }
        }
      ]
    })
  )
  .toStandardJson();
```

## Conclusion

The transform system in XJX provides a powerful way to modify data during conversion between XML and JSON. With the addition of Standard JSON support, you can now create transforms that work with both the full-fidelity XJX JSON format and the more natural Standard JSON format.

For more information on the extension system, which complements the transform system, see the [Extensions Guide](./EXTENSIONS.md).