# XJX Extensions Guide

This guide provides detailed information about the XJX extension system, which allows you to extend and customize the XJX library's functionality.

## Table of Contents

- [Understanding the Extension System](#understanding-the-extension-system)
- [Types of Extensions](#types-of-extensions)
- [Using Built-in Extensions](#using-built-in-extensions)
- [Creating Custom Extensions](#creating-custom-extensions)
- [Advanced Use Cases](#advanced-use-cases)
- [Best Practices](#best-practices)

## Understanding the Extension System

The XJX extension system is designed to provide a flexible, modular way to extend the library's functionality. Extensions form the basis of XJX's fluent API, allowing you to chain method calls to create complex transformation pipelines.

Each extension method is registered with the XJX class and becomes available on all XJX instances. Extensions access the internal state of the XJX instance, including the current XNode, transformation pipeline, and configuration.

The extension system provides:

- **Modular architecture**: Add only the features you need
- **Fluent API**: Chain method calls for readable, concise code
- **Type safety**: Full TypeScript support for extension methods
- **Dynamic registration**: Register extensions at runtime

## Types of Extensions

XJX supports two types of extensions:

### 1. Terminal Extensions

Terminal extensions perform an operation and return a value other than the XJX instance. They typically represent the end of a transformation chain.

Examples of built-in terminal extensions:
- `toXml()` - Convert to XML string
- `toJson()` - Convert to JSON object
- `toJsonString()` - Convert to JSON string

Terminal extensions are registered using `XJX.registerTerminalExtension()`.

### 2. Non-terminal Extensions

Non-terminal extensions perform an operation and return the XJX instance, allowing for method chaining.

Examples of built-in non-terminal extensions:
- `fromXml()` - Set XML string as the source
- `fromJson()` - Set JSON object as the source
- `withConfig()` - Set configuration options
- `withTransforms()` - Add transforms to the pipeline
- `setLogLevel()` - Set logger level

Non-terminal extensions are registered using `XJX.registerNonTerminalExtension()`.

## Using Built-in Extensions

XJX comes with several built-in extensions that form its fluent API:

```javascript
import { XJX } from 'xjx';

// Using the built-in extensions
const result = new XJX()
  .fromXml(xml)             // Non-terminal extension
  .withConfig({             // Non-terminal extension
    preserveComments: true  
  })
  .withTransforms(          // Non-terminal extension
    new XJX.BooleanTransform()
  )
  .toJson();                // Terminal extension
```

## Creating Custom Extensions

You can create custom extensions to add specialized functionality to XJX. Here's how to create and register both types of extensions:

### Creating a Custom Terminal Extension

Terminal extensions return a value and typically represent the end of a chain.

```javascript
import { XJX } from 'xjx';

// Define a function that becomes a terminal extension method
function toObject(this: XJX): Record<string, any> {
  // First, validate that we have a source set
  this.validateSource();
  
  // Get the JSON output
  const json = this.toJson();
  
  // Transform it to a more application-friendly format
  return {
    name: json.root?.$children?.[0]?.name?.$val || '',
    value: json.root?.$children?.[1]?.value?.$val || '',
    // Add more custom transformations as needed
  };
}

// Register the terminal extension
XJX.registerTerminalExtension('toObject', toObject);

// Now you can use it in your code
const result = new XJX()
  .fromXml('<root><name>John</name><value>42</value></root>')
  .toObject(); // Returns { name: "John", value: "42" }
```

### Type Augmentation for TypeScript

When creating custom extensions in TypeScript, you need to augment the XJX interface to include your new methods:

```typescript
import { XJX } from 'xjx';

// Augment the XJX interface to include your custom method
declare module 'xjx' {
  interface XJX {
    toObject(): Record<string, any>;
  }
}

// Define and register the extension as before
function toObject(this: XJX): Record<string, any> {
  // Implementation
}

XJX.registerTerminalExtension('toObject', toObject);
```

### Creating a Custom Non-terminal Extension

Non-terminal extensions return the XJX instance for method chaining.

```javascript
import { XJX } from 'xjx';

// Define a function that becomes a non-terminal extension method
function withValidator(this: XJX, validator: (xnode: XNode) => boolean): void {
  // Store the validator in the instance
  this._validator = validator;
  
  // Note: The registration wrapper will handle returning 'this'
}

// Register the non-terminal extension
XJX.registerNonTerminalExtension('withValidator', withValidator);

// Type augmentation for TypeScript
declare module 'xjx' {
  interface XJX {
    _validator?: (xnode: XNode) => boolean;
    withValidator(validator: (xnode: XNode) => boolean): XJX;
  }
}

// Now you can use it in your code
const result = new XJX()
  .fromXml(xml)
  .withValidator((xnode) => xnode.name !== 'forbidden')
  .toJson();
```

## Advanced Use Cases

### Extension Dependencies

Extensions can depend on other extensions and coordinate their behavior:

```javascript
import { XJX } from 'xjx';

// Extension that adds schema validation capabilities
function withSchema(this: XJX, schema: Record<string, any>): void {
  this._schema = schema;
}

// Extension that depends on the schema extension
function validate(this: XJX): boolean {
  if (!this._schema) {
    throw new Error('No schema set: call withSchema() before validation');
  }
  
  this.validateSource();
  return validateAgainstSchema(this.xnode, this._schema);
}

// Type augmentation
declare module 'xjx' {
  interface XJX {
    _schema?: Record<string, any>;
    withSchema(schema: Record<string, any>): XJX;
    validate(): boolean;
  }
}

// Register extensions
XJX.registerNonTerminalExtension('withSchema', withSchema);
XJX.registerTerminalExtension('validate', validate);

// Use them together
const isValid = new XJX()
  .fromXml(xml)
  .withSchema({
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'number' }
    }
  })
  .validate();
```

### Creating a Format Converter Extension

This example creates a terminal extension that converts XML to CSV:

```javascript
import { XJX } from 'xjx';

function toCSV(this: XJX, options = { header: true }): string {
  this.validateSource();
  
  // Convert to JSON first
  const json = this.toJson();
  
  // Get all records (assuming they're in a consistent format)
  const recordsNode = json.root?.$children || [];
  const records = recordsNode.map(record => {
    const obj = {};
    const children = record[Object.keys(record)[0]].$children || [];
    
    children.forEach(child => {
      const key = Object.keys(child)[0];
      const value = child[key].$val;
      obj[key] = value;
    });
    
    return obj;
  });
  
  // Extract headers from the first record
  const headers = records.length > 0 ? Object.keys(records[0]) : [];
  
  // Build CSV string
  let csv = options.header ? headers.join(',') + '\n' : '';
  
  records.forEach(record => {
    const values = headers.map(header => {
      const value = record[header];
      // Escape quotes and handle commas
      return typeof value === 'string' 
        ? `"${value.replace(/"/g, '""')}"` 
        : value;
    });
    csv += values.join(',') + '\n';
  });
  
  return csv;
}

// Register the extension
XJX.registerTerminalExtension('toCSV', toCSV);

// Type definition
declare module 'xjx' {
  interface XJX {
    toCSV(options?: { header?: boolean }): string;
  }
}

// Usage
const csv = new XJX()
  .fromXml(`
    <root>
      <record>
        <name>John</name>
        <age>30</age>
      </record>
      <record>
        <name>Jane</name>
        <age>28</age>
      </record>
    </root>
  `)
  .toCSV();

// Output:
// name,age
// "John",30
// "Jane",28
```

### Creating a Data Validation Extension

This example creates extensions for schema-based validation:

```javascript
import { XJX } from 'xjx';

// Define validation schema types
interface ValidationSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  properties?: Record<string, ValidationSchema>;
  items?: ValidationSchema;
  required?: string[];
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
}

// Schema extension
function withValidationSchema(this: XJX, schema: ValidationSchema): void {
  this._validationSchema = schema;
}

// Validation function
function validate(this: XJX): { valid: boolean; errors: string[] } {
  if (!this._validationSchema) {
    throw new Error('No validation schema set');
  }
  
  this.validateSource();
  const json = this.toJson();
  
  const errors: string[] = [];
  const valid = validateAgainstSchema(json, this._validationSchema, '', errors);
  
  return { valid, errors };
}

// Helper function (simplified)
function validateAgainstSchema(
  value: any, 
  schema: ValidationSchema, 
  path: string,
  errors: string[]
): boolean {
  // Type checking
  if (schema.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
    errors.push(`${path}: expected object, got ${typeof value}`);
    return false;
  }
  
  // Required properties checking
  if (schema.type === 'object' && schema.properties && schema.required) {
    for (const prop of schema.required) {
      if (!(prop in value)) {
        errors.push(`${path}: missing required property ${prop}`);
        return false;
      }
    }
  }
  
  // More validation logic...
  
  return errors.length === 0;
}

// Register extensions
XJX.registerNonTerminalExtension('withValidationSchema', withValidationSchema);
XJX.registerTerminalExtension('validate', validate);

// Type augmentation
declare module 'xjx' {
  interface XJX {
    _validationSchema?: ValidationSchema;
    withValidationSchema(schema: ValidationSchema): XJX;
    validate(): { valid: boolean; errors: string[] };
  }
}

// Usage
const result = new XJX()
  .fromXml('<user><name>John</name><age>30</age></user>')
  .withValidationSchema({
    type: 'object',
    properties: {
      user: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2 },
          age: { type: 'number', minimum: 0 }
        },
        required: ['name', 'age']
      }
    }
  })
  .validate();

console.log(result.valid); // true or false
console.log(result.errors); // Array of validation errors
```

### Creating a CRUD Extension Suite

This example creates a suite of extensions for CRUD operations on XML data:

```javascript
import { XJX } from 'xjx';

// Create extension
function createElement(this: XJX, path: string, element: Record<string, any>): void {
  this.validateSource();
  
  const pathParts = path.split('.');
  let currentNode = this.xnode;
  
  // Navigate to the target parent node
  for (let i = 0; i < pathParts.length - 1; i++) {
    const child = currentNode.findChild(pathParts[i]);
    if (!child) {
      throw new Error(`Path not found: ${pathParts.slice(0, i + 1).join('.')}`);
    }
    currentNode = child;
  }
  
  // Create new element
  const newNode = new XJX.XNode(pathParts[pathParts.length - 1]);
  
  // Add attributes and children
  Object.entries(element).forEach(([key, value]) => {
    if (key === 'attributes' && typeof value === 'object') {
      Object.entries(value).forEach(([attrName, attrValue]) => {
        newNode.setAttribute(attrName, attrValue);
      });
    } else if (key === 'value') {
      newNode.value = value;
    } else if (key === 'children' && Array.isArray(value)) {
      value.forEach(child => {
        const childNode = new XJX.XNode(Object.keys(child)[0]);
        childNode.value = child[Object.keys(child)[0]];
        newNode.addChild(childNode);
      });
    }
  });
  
  // Add to the parent
  currentNode.addChild(newNode);
}

// Read extension
function getElement(this: XJX, path: string): Record<string, any> | null {
  this.validateSource();
  
  const pathParts = path.split('.');
  let currentNode = this.xnode;
  
  // Navigate to the target node
  for (const part of pathParts) {
    const child = currentNode.findChild(part);
    if (!child) {
      return null;
    }
    currentNode = child;
  }
  
  // Convert to object
  const result: Record<string, any> = {};
  
  if (currentNode.attributes) {
    result.attributes = { ...currentNode.attributes };
  }
  
  if (currentNode.value !== undefined) {
    result.value = currentNode.value;
  }
  
  if (currentNode.children && currentNode.children.length > 0) {
    result.children = currentNode.children.map(child => {
      return { [child.name]: child.value };
    });
  }
  
  return result;
}

// Update extension
function updateElement(this: XJX, path: string, updates: Record<string, any>): void {
  this.validateSource();
  
  const pathParts = path.split('.');
  let currentNode = this.xnode;
  
  // Navigate to the target node
  for (const part of pathParts) {
    const child = currentNode.findChild(part);
    if (!child) {
      throw new Error(`Path not found: ${path}`);
    }
    currentNode = child;
  }
  
  // Apply updates
  Object.entries(updates).forEach(([key, value]) => {
    if (key === 'attributes' && typeof value === 'object') {
      if (!currentNode.attributes) {
        currentNode.attributes = {};
      }
      Object.entries(value).forEach(([attrName, attrValue]) => {
        currentNode.attributes![attrName] = attrValue;
      });
    } else if (key === 'value') {
      currentNode.value = value;
    } else if (key === 'children' && Array.isArray(value)) {
      // Replace all children
      currentNode.children = [];
      value.forEach(child => {
        const childNode = new XJX.XNode(Object.keys(child)[0]);
        childNode.value = child[Object.keys(child)[0]];
        currentNode.addChild(childNode);
      });
    }
  });
}

// Delete extension
function deleteElement(this: XJX, path: string): boolean {
  this.validateSource();
  
  const pathParts = path.split('.');
  let currentNode = this.xnode;
  
  // Navigate to the parent of the target node
  for (let i = 0; i < pathParts.length - 1; i++) {
    const child = currentNode.findChild(pathParts[i]);
    if (!child) {
      return false;
    }
    currentNode = child;
  }
  
  // Find the target child
  const targetName = pathParts[pathParts.length - 1];
  const targetChild = currentNode.findChild(targetName);
  
  if (!targetChild) {
    return false;
  }
  
  // Remove the child
  return currentNode.removeChild(targetChild);
}

// Register the extensions
XJX.registerNonTerminalExtension('createElement', createElement);
XJX.registerTerminalExtension('getElement', getElement);
XJX.registerNonTerminalExtension('updateElement', updateElement);
XJX.registerNonTerminalExtension('deleteElement', deleteElement);

// Type augmentation
declare module 'xjx' {
  interface XJX {
    createElement(path: string, element: Record<string, any>): XJX;
    getElement(path: string): Record<string, any> | null;
    updateElement(path: string, updates: Record<string, any>): XJX;
    deleteElement(path: string): XJX;
  }
}

// Usage example:
const xjx = new XJX().fromXml('<users></users>');

// Create
xjx.createElement('users.user', {
  attributes: { id: '123' },
  children: [
    { name: 'John Doe' },
    { email: 'john@example.com' }
  ]
});

// Read
const user = xjx.getElement('users.user');

// Update
xjx.updateElement('users.user', {
  attributes: { status: 'active' }
});

// Delete
xjx.deleteElement('users.user');

// Complete operation
const xml = xjx.toXml();
```

## Best Practices

When creating and using extensions, follow these best practices:

### 1. Validation

Always validate inputs and state:

```javascript
function customExtension(this: XJX, param: string): void {
  // Validate parameter
  if (!param || typeof param !== 'string') {
    throw new Error('Invalid parameter: must be a non-empty string');
  }
  
  // Validate XJX state if needed
  if (this.sourceFormat === 'xml') {
    // XML-specific logic
  } else if (this.sourceFormat === 'json') {
    // JSON-specific logic
  } else {
    throw new Error('No source set: call fromXml() or fromJson() first');
  }
}
```

### 2. Error Handling

Use the built-in error handling system:

```javascript
import { XJX, handleError, ErrorType } from 'xjx';

function customExtension(this: XJX, param: string): void {
  try {
    // Implementation
  } catch (err) {
    handleError(err, "custom extension operation", {
      data: { param },
      errorType: ErrorType.VALIDATION
    });
  }
}
```

### 3. Naming Conventions

Follow consistent naming conventions:

- **Terminal extensions**: Use names that describe the output (`toXml`, `toJson`, `toCSV`)
- **Non-terminal extensions**: Use names that describe the action (`fromXml`, `withConfig`, `addTransform`)

### 4. Documentation

Document your extensions thoroughly:

```javascript
/**
 * Converts the current XNode to a custom format
 * 
 * @param options - Conversion options
 * @param options.compact - Whether to use compact format
 * @param options.indent - Indentation level
 * @returns The converted string
 */
function toCustomFormat(this: XJX, options?: { compact?: boolean; indent?: number }): string {
  // Implementation
}
```

### 5. Modular Design

Keep extensions focused on a single responsibility:

```javascript
// Good: Focused on a single task
XJX.registerNonTerminalExtension('withSchema', withSchema);
XJX.registerTerminalExtension('validate', validate);

// Bad: Trying to do too much
XJX.registerNonTerminalExtension('withSchemaAndValidate', withSchemaAndValidate);
```

### 6. Immutable Transforms

Ensure extensions don't mutate the original data:

```javascript
// Good: Creates a new XNode instead of modifying the original
function customTransform(this: XJX): void {
  this.validateSource();
  
  const originalNode = this.xnode;
  const newNode = originalNode.clone(true); // Deep clone
  
  // Modify newNode...
  
  this.xnode = newNode;
}
```

### 7. Consistent Return Types

Ensure consistent return types:

- Terminal extensions should return a specific value type
- Non-terminal extensions should never return a value (the registration handles returning `this`)

### 8. Extension Versioning

When creating public extensions:

```javascript
// Version your extensions
const MY_EXTENSION_VERSION = '1.0.0';

function withCustomFeature(this: XJX, options: any): void {
  this._customFeatureVersion = MY_EXTENSION_VERSION;
  // Implementation
}

function useCustomFeature(this: XJX): any {
  // Version check
  if (this._customFeatureVersion !== MY_EXTENSION_VERSION) {
    throw new Error(`Extension version mismatch: expected ${MY_EXTENSION_VERSION}, got ${this._customFeatureVersion || 'none'}`);
  }
  
  // Implementation
}
```

## Package Organization

When publishing extensions as a package:

```javascript
// my-xjx-extensions.js
import { XJX } from 'xjx';

// Extension implementation
function toCustomFormat(this: XJX, options = {}): string {
  // Implementation
}

// Register when the module is imported
XJX.registerTerminalExtension('toCustomFormat', toCustomFormat);

// Also export the function for testing
export { toCustomFormat };

// Type augmentation
declare module 'xjx' {
  interface XJX {
    toCustomFormat(options?: Record<string, any>): string;
  }
}
```

## Conclusion

The XJX extension system provides a powerful way to enhance and customize the library's functionality. By creating your own extensions, you can adapt XJX to fit your specific needs and workflows.

For more information on the transform system, which complements the extension system, see the [Transforms Guide](./TRANSFORMS.md).