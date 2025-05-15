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

- **Format-aware**: Transforms can behave differently based on target format (XML or JSON)
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
  .toJson();

// Result:
// {
//   "user": {
//     "$children": [
//       { "active": { "$val": true } },
//       { "subscribed": { "$val": false } }
//     ]
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
  .toJson();

// Result:
// {
//   "data": {
//     "$children": [
//       { "count": { "$val": 42 } },
//       { "price": { "$val": 19.99 } },
//       { "large": { "$val": 1234567 } }
//     ]
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
  .toJson();

// Result:
// {
//   "user": {
//     "$children": [
//       { "birth-date": { "$val": "01/15/2023" } }
//     ]
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
  .toJson();

// Result:
// {
//   "greeting": {
//     "$val": "HELLO, WORLD!"
//   }
// }
```

### Format-Aware Transform

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
      // To JSON: uppercase
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
  .toJson();

// Result when converting to JSON:
// {
//   "greeting": {
//     "$val": "HELLO, WORLD!"
//   }
// }

const xmlResult = new XJX()
  .fromJson({ "greeting": { "$val": "Hello, WORLD!" } })
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
  .toXml();

// Result:
// <user><name>John</name><address>New York</address></user>
```

### Removing Nodes Transform

```javascript
import { 
  XJX, 
  Transform, 
  TransformContext, 
  TransformResult, 
  TransformTarget,
  createTransformResult 
} from 'xjx';

// Create a custom transform to remove nodes
class RemoveNodesTransform implements Transform {
  // Target elements
  targets = [TransformTarget.Element];
  
  // Node names to remove
  private nodeNames: string[];
  
  constructor(nodeNames: string[]) {
    this.nodeNames = nodeNames;
  }
  
  // Transform method
  transform(node: XNode, context: TransformContext): TransformResult<XNode> {
    // Check if this node should be removed
    if (this.nodeNames.includes(node.name)) {
      return createTransformResult(node, true); // Set remove flag to true
    }
    
    // Keep the node
    return createTransformResult(node);
  }
}

// Apply the custom transform
const result = new XJX()
  .fromXml('<user><name>John</name><password>secret123</password><email>john@example.com</email></user>')
  .withTransforms(new RemoveNodesTransform(['password']))
  .toXml();

// Result:
// <user><name>John</name><email>john@example.com</email></user>
```

## Advanced Use Cases

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
  .toJson();

// The resulting XNode will have validation errors attached
```

### Complex XNode Transformation

```javascript
import { 
  XJX, 
  Transform, 
  TransformContext, 
  TransformResult, 
  TransformTarget,
  createTransformResult 
} from 'xjx';

// Transform to convert between different XML formats
class FormatConversionTransform implements Transform {
  targets = [TransformTarget.Element];
  
  transform(node: XNode, context: TransformContext): TransformResult<XNode> {
    // Only transform the root node
    if (context.parent) {
      return createTransformResult(node);
    }
    
    // Skip non-element nodes
    if (node.type !== 1) { // NodeType.ELEMENT_NODE
      return createTransformResult(node);
    }
    
    // Transform from one format to another
    if (node.name === 'soap:Envelope') {
      // Extract the actual content from SOAP envelope
      const bodyNode = node.findChild('soap:Body');
      if (!bodyNode) {
        return createTransformResult(node);
      }
      
      const contentNode = bodyNode.children?.[0];
      if (!contentNode) {
        return createTransformResult(node);
      }
      
      // Convert SOAP request to REST-style
      const newNode = new XNode('api-request');
      
      // Add method attribute
      newNode.setAttribute('method', contentNode.name.replace('Request', ''));
      
      // Add version attribute from SOAP header
      const headerNode = node.findChild('soap:Header');
      if (headerNode) {
        const versionNode = headerNode.findChild('Version');
        if (versionNode) {
          newNode.setAttribute('version', versionNode.getTextContent());
        }
      }
      
      // Add all parameters
      contentNode.children?.forEach(paramNode => {
        newNode.addChild(paramNode);
      });
      
      return createTransformResult(newNode);
    }
    
    // No transformation needed
    return createTransformResult(node);
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
  .withTransforms(new FormatConversionTransform())
  .toXml();

// Result:
// <api-request method="GetUser" version="1.0">
//   <userId>123</userId>
//   <includeDetails>true</includeDetails>
// </api-request>
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

// Apply multiple transforms in sequence
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
  .toJson();

// Result: JSON with converted types and metadata attached
```

### Conditional Transforms

```javascript
import { 
  XJX, 
  Transform, 
  TransformContext, 
  TransformResult, 
  TransformTarget,
  createTransformResult 
} from 'xjx';

// Create a transform that applies conditionally
class ConditionalTransform implements Transform {
  targets = [TransformTarget.Value];
  
  private condition: (value: any, context: TransformContext) => boolean;
  private transform: (value: any) => any;
  
  constructor(
    condition: (value: any, context: TransformContext) => boolean,
    transform: (value: any) => any
  ) {
    this.condition = condition;
    this.transform = transform;
  }
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Apply transform only if condition is met
    if (this.condition(value, context)) {
      return createTransformResult(this.transform(value));
    }
    
    // Otherwise return unchanged
    return createTransformResult(value);
  }
}

// Apply conditional transforms
const result = new XJX()
  .fromXml(`
    <user>
      <email>john.doe@example.com</email>
      <phone>555-123-4567</phone>
      <ssn>123-45-6789</ssn>
    </user>
  `)
  .withTransforms(
    // Redact SSN
    new ConditionalTransform(
      (value, context) => context.nodeName === 'ssn',
      (value) => 'XXX-XX-' + String(value).slice(-4)
    ),
    
    // Anonymize email
    new ConditionalTransform(
      (value, context) => typeof value === 'string' && value.includes('@'),
      (value) => {
        const [username, domain] = String(value).split('@');
        return username.charAt(0) + '***@' + domain;
      }
    )
  )
  .toJson();

// Result:
// {
//   "user": {
//     "$children": [
//       { "email": { "$val": "j***@example.com" } },
//       { "phone": { "$val": "555-123-4567" } },
//       { "ssn": { "$val": "XXX-XX-6789" } }
//     ]
//   }
// }
```

### Path-Based Transform

```javascript
import { 
  XJX, 
  Transform, 
  TransformContext, 
  TransformResult, 
  TransformTarget,
  createTransformResult 
} from 'xjx';

// Create a transform that applies based on node path
class PathBasedTransform implements Transform {
  targets = [TransformTarget.Value];
  
  private pathPatterns: RegExp[];
  private transform: (value: any) => any;
  
  constructor(
    pathPatterns: RegExp[],
    transform: (value: any) => any
  ) {
    this.pathPatterns = pathPatterns;
    this.transform = transform;
  }
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Check if the current path matches any of the patterns
    const matchesPath = this.pathPatterns.some(pattern => 
      pattern.test(context.path)
    );
    
    if (matchesPath) {
      return createTransformResult(this.transform(value));
    }
    
    // Otherwise return unchanged
    return createTransformResult(value);
  }
}

// Apply path-based transforms
const result = new XJX()
  .fromXml(`
    <data>
      <users>
        <user>
          <id>1</id>
          <name>John Doe</name>
          <email>john@example.com</email>
        </user>
        <user>
          <id>2</id>
          <name>Jane Smith</name>
          <email>jane@example.com</email>
        </user>
      </users>
      <settings>
        <email>notify@example.com</email>
      </settings>
    </data>
  `)
  .withTransforms(
    // Apply to all email fields under users
    new PathBasedTransform(
      [/^data\.users\.user\[\d+\]\.email$/],
      (value) => {
        const [username, domain] = String(value).split('@');
        return username.charAt(0) + '***@' + domain;
      }
    ),
    
    // Apply to all IDs
    new PathBasedTransform(
      [/\.id\[\d+\]$/],
      (value) => Number(value) // Convert ID to number
    )
  )
  .toJson();

// Result:
// User emails are anonymized but settings email is unchanged
// IDs are converted to numbers
```

### Metadata-Driven Transforms

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

// Create a transform that uses metadata to guide transformation
class MetadataDrivenTransform implements Transform {
  targets = [
    TransformTarget.Element,
    TransformTarget.Value,
    TransformTarget.Attribute
  ];
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Get the node from context
    const node = value instanceof XNode ? value : null;
    
    // Skip if no node or no metadata
    if (!node || !node.metadata) {
      return createTransformResult(value);
    }
    
    // Check for transform instructions in metadata
    const transformInstructions = node.getMetadata('transform');
    if (!transformInstructions) {
      return createTransformResult(value);
    }
    
    // Apply transformations based on metadata
    let result = value;
    
    // Transform element name
    if (transformInstructions.rename && node.type === 1) { // NodeType.ELEMENT_NODE
      const newNode = node.clone(false);
      newNode.name = transformInstructions.rename;
      newNode.children = node.children;
      result = newNode;
    }
    
    // Transform value format
    if (transformInstructions.format && typeof node.value === 'string') {
      const format = transformInstructions.format;
      
      if (format === 'uppercase') {
        node.value = node.value.toUpperCase();
      } else if (format === 'lowercase') {
        node.value = node.value.toLowerCase();
      } else if (format === 'capitalize') {
        node.value = node.value.charAt(0).toUpperCase() + node.value.slice(1);
      }
      
      result = node;
    }
    
    // More transformation types...
    
    return createTransformResult(result);
  }
}

// Apply metadata-driven transforms
const result = new XJX()
  .fromXml(`
    <user>
      <firstname>john</firstname>
      <lastname>doe</lastname>
      <email>JOHN.DOE@EXAMPLE.COM</email>
    </user>
  `)
  .withTransforms(
    // Add transformation instructions as metadata
    new MetadataTransform({
      selector: 'firstname',
      metadata: {
        transform: {
          rename: 'firstName',
          format: 'capitalize'
        }
      }
    }),
    new MetadataTransform({
      selector: 'lastname',
      metadata: {
        transform: {
          rename: 'lastName',
          format: 'capitalize'
        }
      }
    }),
    new MetadataTransform({
      selector: 'email',
      metadata: {
        transform: {
          format: 'lowercase'
        }
      }
    }),
    
    // Apply the metadata-driven transform
    new MetadataDrivenTransform()
  )
  .toXml();

// Result:
// <user>
//   <firstName>John</firstName>
//   <lastName>Doe</lastName>
//   <email>john.doe@example.com</email>
// </user>
```

### Schema Generation Transform

```javascript
import { 
  XJX, 
  Transform, 
  TransformContext, 
  TransformResult, 
  TransformTarget,
  createTransformResult 
} from 'xjx';

// Create a transform that generates JSON Schema
class SchemaGeneratorTransform implements Transform {
  targets = [TransformTarget.Element];
  
  transform(node: XNode, context: TransformContext): TransformResult<XNode> {
    // Only apply to the root node
    if (context.parent) {
      return createTransformResult(node);
    }
    
    // Generate schema and attach as metadata
    const schema = this.generateSchema(node);
    
    const newNode = node.clone(false);
    newNode.children = node.children;
    
    if (!newNode.metadata) {
      newNode.metadata = {};
    }
    
    newNode.metadata.jsonSchema = schema;
    
    return createTransformResult(newNode);
  }
  
  private generateSchema(node: XNode): Record<string, any> {
    // Basic schema structure
    const schema: Record<string, any> = {
      type: 'object',
      properties: {},
      required: []
    };
    
    // Process attributes
    if (node.attributes) {
      schema.properties = {
        ...schema.properties,
        ...Object.keys(node.attributes).reduce((props, key) => {
          const value = node.attributes![key];
          props[key] = this.inferType(value);
          return props;
        }, {} as Record<string, any>)
      };
    }
    
    // Process children
    if (node.children) {
      // Group children by name
      const childrenByName: Record<string, XNode[]> = {};
      
      node.children.forEach(child => {
        if (child.type === 1) { // NodeType.ELEMENT_NODE
          if (!childrenByName[child.name]) {
            childrenByName[child.name] = [];
          }
          childrenByName[child.name].push(child);
        }
      });
      
      // Add properties for each child group
      Object.entries(childrenByName).forEach(([name, children]) => {
        if (children.length > 1) {
          // Array of items
          schema.properties[name] = {
            type: 'array',
            items: this.generateSchema(children[0])
          };
        } else {
          // Single item
          const child = children[0];
          
          if (child.children && child.children.length > 0) {
            // Complex type
            schema.properties[name] = this.generateSchema(child);
          } else {
            // Simple type
            schema.properties[name] = this.inferType(child.value);
          }
        }
        
        // Assume all properties are required
        schema.required.push(name);
      });
    }
    
    return schema;
  }
  
  private inferType(value: any): Record<string, any> {
    if (value === null || value === undefined) {
      return { type: 'null' };
    }
    
    if (typeof value === 'string') {
      return { type: 'string' };
    }
    
    if (typeof value === 'number') {
      return { type: 'number' };
    }
    
    if (typeof value === 'boolean') {
      return { type: 'boolean' };
    }
    
    if (Array.isArray(value)) {
      return { 
        type: 'array',
        items: value.length > 0 ? this.inferType(value[0]) : {}
      };
    }
    
    if (typeof value === 'object') {
      return { type: 'object' };
    }
    
    return { type: 'string' };
  }
}

// Apply schema generator transform
const result = new XJX()
  .fromXml(`
    <user id="123">
      <firstname>John</firstname>
      <lastname>Doe</lastname>
      <age>30</age>
      <email>john@example.com</email>
      <address>
        <street>123 Main St</street>
        <city>Anytown</city>
        <zipcode>12345</zipcode>
      </address>
      <phones>
        <phone type="home">555-1234</phone>
        <phone type="mobile">555-5678</phone>
      </phones>
    </user>
  `)
  .withTransforms(
    new NumberTransform(),
    new SchemaGeneratorTransform()
  )
  .toJson();

// The resulting XNode will have JSON Schema metadata attached
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
  if (context.targetFormat === 'json') {
    // JSON-specific transformation
  } else if (context.targetFormat === 'xml') {
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
  .toJson();

// Bad: Single monolithic transform
const result = new XJX()
  .fromXml(xml)
  .withTransforms(
    new DoEverythingTransform() // ❌ Too many responsibilities
  )
  .toJson();
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
 *   .toJson();
 * ```
 */
class SensitiveDataTransform implements Transform {
  // ...
}
```

## Conclusion

The transform system in XJX provides a powerful way to modify data during conversion between XML and JSON. By creating custom transforms, you can adapt the library to fit your specific needs and implement complex transformation logic.

For more information on the extension system, which complements the transform system, see the [Extensions Guide](./EXTENSIONS.md).