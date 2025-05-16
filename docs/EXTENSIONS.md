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
- `toJson()` - Convert to XJX-formatted JSON object
- `toJsonString()` - Convert to JSON string
- `toStandardJson()` - Convert to standard JavaScript object/array

Terminal extensions are registered using `XJX.registerTerminalExtension()`.

### 2. Non-terminal Extensions

Non-terminal extensions perform an operation and return the XJX instance, allowing for method chaining.

Examples of built-in non-terminal extensions:
- `fromXml()` - Set XML string as the source
- `fromJson()` - Set JSON object as the source (auto-detects format)
- `fromXjxJson()` - Set XJX-formatted JSON as the source
- `fromObjJson()` - Set standard JavaScript object as the source
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
  .fromXml(xml)                  // Non-terminal extension
  .withConfig({                  // Non-terminal extension
    preserveComments: true,
    converters: {
      stdJson: {
        options: {
          attributeHandling: 'merge'
        }
      }
    }
  })
  .withTransforms(               // Non-terminal extension
    new XJX.BooleanTransform()
  )
  .toStandardJson();             // Terminal extension
```

### JSON Format Extensions

XJX now supports multiple JSON formats with specialized extensions:

```javascript
// Auto-detect format (XJX or standard)
const result1 = new XJX()
  .fromJson(jsonData)  // Automatically detects format
  .toXml();

// Explicitly use XJX format
const result2 = new XJX()
  .fromXjxJson(xjxFormatData)  // Only accepts XJX format
  .toXml();

// Use standard JavaScript objects
const result3 = new XJX()
  .fromObjJson(standardObject)  // Accepts regular JavaScript objects
  .toXml();

// Convert to standard JSON format
const standardJson = new XJX()
  .fromXml(xml)
  .toStandardJson();  // Returns natural JavaScript objects
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
  
  // Get the standard JSON output as a base
  const json = this.toStandardJson();
  
  // Transform it to a more application-friendly format
  return {
    name: json.root?.name || '',
    value: json.root?.value || '',
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

### Custom JSON Format Extension

This example creates a terminal extension that converts XML to a different JSON format:

```javascript
import { XJX } from 'xjx';

function toFlatJson(this: XJX): Record<string, any> {
  this.validateSource();
  
  // First get the standard JSON
  const standardJson = this.toStandardJson();
  
  // Now flatten the structure
  const result: Record<string, any> = {};
  
  function flattenObject(obj: any, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        // Recursively flatten nested objects
        flattenObject(value, newKey);
      } else {
        // Add leaf value
        result[newKey] = value;
      }
    }
  }
  
  flattenObject(standardJson);
  return result;
}

// Register the extension
XJX.registerTerminalExtension('toFlatJson', toFlatJson);

// Type definition
declare module 'xjx' {
  interface XJX {
    toFlatJson(): Record<string, any>;
  }
}

// Usage
const flatJson = new XJX()
  .fromXml(`
    <user>
      <name>John</name>
      <address>
        <street>123 Main St</street>
        <city>Anytown</city>
      </address>
    </user>
  `)
  .toFlatJson();

// Output:
// {
//   "user.name": "John",
//   "user.address.street": "123 Main St",
//   "user.address.city": "Anytown"
// }
```

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
  
  // Get standard JSON to validate against the schema
  const standardJson = this.toStandardJson();
  return validateAgainstSchema(standardJson, this._schema);
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

### Format Converter Extension

This example creates a terminal extension that converts XML to CSV:

```javascript
import { XJX } from 'xjx';

function toCSV(this: XJX, options = { header: true }): string {
  this.validateSource();
  
  // Convert to standard JSON first (better for this use case than XJX format)
  const json = this.toStandardJson();
  
  // Get all records (assuming they're in a consistent format)
  let records: any[] = [];
  
  // Find the array of records in the JSON (assuming a common structure)
  // This example assumes records are in the first array property found
  function findRecordsArray(obj: any): any[] | null {
    if (Array.isArray(obj)) {
      return obj;
    }
    
    if (obj && typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        const value = obj[key];
        if (Array.isArray(value) && value.length > 0) {
          return value;
        }
        
        const nestedResult = findRecordsArray(value);
        if (nestedResult) {
          return nestedResult;
        }
      }
    }
    
    return null;
  }
  
  records = findRecordsArray(json) || [];
  
  // If no records found, try to use the root object itself as a single record
  if (records.length === 0 && json && typeof json === 'object') {
    records = [json];
  }
  
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
    <records>
      <record>
        <name>John</name>
        <age>30</age>
      </record>
      <record>
        <name>Jane</name>
        <age>28</age>
      </record>
    </records>
  `)
  .withTransforms(new XJX.NumberTransform())
  .toCSV();

// Output:
// name,age
// "John",30
// "Jane",28
```

### CRUD Extension Suite

This example creates a suite of extensions for CRUD operations on XML data, using the standard JSON format for easier manipulation:

```javascript
import { XJX } from 'xjx';

// Create extension
function createElement(this: XJX, path: string, element: Record<string, any>): void {
  this.validateSource();
  
  // Convert to standard JSON for easier manipulation
  const standardJson = this.toStandardJson();
  
  // Navigate to the target parent path
  const pathParts = path.split('.');
  let current = standardJson;
  
  // Navigate to the target parent node
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    if (!current[part]) {
      current[part] = {};
    }
    current = current[part];
  }
  
  // Get the new element name
  const newElementName = pathParts[pathParts.length - 1];
  
  // Add the new element
  if (Array.isArray(current)) {
    // If current is an array, add to it
    current.push({ [newElementName]: element });
  } else {
    // If the same element already exists, make an array
    if (current[newElementName]) {
      if (!Array.isArray(current[newElementName])) {
        current[newElementName] = [current[newElementName]];
      }
      current[newElementName].push(element);
    } else {
      // Otherwise just set it
      current[newElementName] = element;
    }
  }
  
  // Update the XNode using the standard JSON converter
  this.xnode = new DefaultStandardJsonToXNodeConverter(this.config).convert(standardJson);
}

// Read extension
function getElement(this: XJX, path: string): Record<string, any> | null {
  this.validateSource();
  
  // Convert to standard JSON
  const standardJson = this.toStandardJson();
  
  // Navigate to the requested path
  const pathParts = path.split('.');
  let current = standardJson;
  
  for (const part of pathParts) {
    if (!current || typeof current !== 'object' || !(part in current)) {
      return null;
    }
    current = current[part];
  }
  
  return current;
}

// Update extension
function updateElement(this: XJX, path: string, updates: Record<string, any>): void {
  this.validateSource();
  
  // Convert to standard JSON
  const standardJson = this.toStandardJson();
  
  // Navigate to the requested path
  const pathParts = path.split('.');
  let current = standardJson;
  
  // Navigate to the parent of the target node
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    if (!current || typeof current !== 'object' || !(part in current)) {
      throw new Error(`Path not found: ${pathParts.slice(0, i + 1).join('.')}`);
    }
    current = current[part];
  }
  
  // Get the target element name
  const targetName = pathParts[pathParts.length - 1];
  
  // Apply updates
  if (current && typeof current === 'object' && targetName in current) {
    if (typeof current[targetName] === 'object' && !Array.isArray(current[targetName])) {
      // Merge objects
      current[targetName] = { ...current[targetName], ...updates };
    } else {
      // Replace non-objects
      current[targetName] = updates;
    }
    
    // Update the XNode using the standard JSON converter
    this.xnode = new DefaultStandardJsonToXNodeConverter(this.config).convert(standardJson);
  } else {
    throw new Error(`Element not found at path: ${path}`);
  }
}

// Delete extension
function deleteElement(this: XJX, path: string): boolean {
  this.validateSource();
  
  // Convert to standard JSON
  const standardJson = this.toStandardJson();
  
  // Navigate to the requested path
  const pathParts = path.split('.');
  let current = standardJson;
  
  // Navigate to the parent of the target node
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    if (!current || typeof current !== 'object' || !(part in current)) {
      return false;
    }
    current = current[part];
  }
  
  // Get the target element name
  const targetName = pathParts[pathParts.length - 1];
  
  // Delete the element
  if (current && typeof current === 'object' && targetName in current) {
    if (Array.isArray(current)) {
      // For arrays, filter out the target index
      const index = parseInt(targetName);
      if (!isNaN(index) && index >= 0 && index < current.length) {
        current.splice(index, 1);
      } else {
        return false;
      }
    } else {
      // For objects, delete the property
      delete current[targetName];
    }
    
    // Update the XNode using the standard JSON converter
    this.xnode = new DefaultStandardJsonToXNodeConverter(this.config).convert(standardJson);
    return true;
  }
  
  return false;
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
  id: '123',
  name: 'John Doe',
  email: 'john@example.com'
});

// Read
const user = xjx.getElement('users.user');

// Update
xjx.updateElement('users.user', {
  status: 'active'
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

- **Terminal extensions**: Use names that describe the output (`toXml`, `toJson`, `toCSV`, `toStandardJson`)
- **Non-terminal extensions**: Use names that describe the action (`fromXml`, `fromObjJson`, `withConfig`, `addTransform`)

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

### 9. JSON Format Awareness

Make extensions compatible with both JSON formats:

```javascript
function customExtension(this: XJX, param: string): void {
  this.validateSource();
  
  // Work with standard JSON for easier manipulation
  const standardJson = this.toStandardJson();
  
  // Perform operations...
  
  // Convert back to XNode using standard JSON converter
  this.xnode = new DefaultStandardJsonToXNodeConverter(this.config).convert(modifiedJson);
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