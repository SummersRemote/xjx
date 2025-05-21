# Creating Custom Extensions for XJX

This guide explains how to extend the XJX library with custom functionality by creating extensions.

## Extension Types

XJX supports two types of extensions:

1. **Terminal Extensions**: Return a value and end the method chain (e.g., `toXml()`)
2. **Non-Terminal Extensions**: Return the XJX instance for further chaining (e.g., `fromXml()`)

## Extension Context

Both types of extensions receive a context object (`this`) that provides access to:

- `config`: Current configuration
- `xnode`: Current XNode representation
- `sourceFormat`: Source format (XML, JSON)
- `transforms`: Current transform pipeline
- Utility methods: `validateSource()`, `deepClone()`, `deepMerge()`, etc.

## Creating Terminal Extensions

Terminal extensions return a value rather than the XJX instance. These are methods that produce an output and end the chain.

### Terminal Extension Interface

```typescript
import { TerminalExtensionContext } from 'xjx';

function myTerminalExtension(this: TerminalExtensionContext, ...args: any[]): any {
  // Implementation that returns a value
}
```

### Terminal Extension Example

Here's an example that converts XNode to a YAML string:

```typescript
// myExtension.ts
import { XJX, TerminalExtensionContext } from 'xjx';

/**
 * Convert XNode to a YAML string
 */
export function toYaml(this: TerminalExtensionContext): string {
  try {
    // Validate that we have a source
    this.validateSource();
    
    // Get the XNode data
    const node = this.xnode;
    
    // Apply any transforms if needed
    let nodeToConvert = node;
    if (this.transforms && this.transforms.length > 0) {
      const FORMAT = require('xjx').FORMAT;
      nodeToConvert = transformXNode(nodeToConvert, this.transforms, FORMAT.JSON, this.config);
    }
    
    // Convert to YAML (using a hypothetical function)
    const yamlString = convertXNodeToYaml(nodeToConvert);
    
    return yamlString;
  } catch (err) {
    // Handle errors
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to convert to YAML: ${String(err)}`);
  }
}

// Register the extension with XJX
XJX.registerTerminalExtension("toYaml", toYaml);

// Helper function to convert XNode to YAML
function convertXNodeToYaml(node) {
  // Implementation would go here
  // ...
}
```

### Using a Terminal Extension

Once registered, the extension can be used like any other XJX method:

```javascript
const yaml = new XJX()
  .fromXml(xmlString)
  .toYaml();
```

## Creating Non-Terminal Extensions

Non-terminal extensions modify the XJX instance and return it for method chaining. These are typically methods that set up data or configure the system.

### Non-Terminal Extension Interface

```typescript
import { NonTerminalExtensionContext } from 'xjx';

function myNonTerminalExtension(this: NonTerminalExtensionContext, ...args: any[]): void {
  // Implementation that modifies the context
  // No return needed - XJX.registerNonTerminalExtension will return 'this'
}
```

### Non-Terminal Extension Example

Here's an example that loads XML from a file:

```typescript
// myExtension.ts
import { XJX, NonTerminalExtensionContext } from 'xjx';

/**
 * Load XML from a file path
 */
export function fromFile(this: NonTerminalExtensionContext, filePath: string): void {
  try {
    // Validate input
    if (typeof filePath !== 'string' || filePath.trim().length === 0) {
      throw new Error('File path must be a non-empty string');
    }
    
    // In Node.js, read the file
    const fs = require('fs');
    const xml = fs.readFileSync(filePath, 'utf8');
    
    // Use the existing fromXml method
    // We'd need to call the implementation directly
    const fromXmlFn = require('./from-xml').fromXml;
    fromXmlFn.call(this, xml);
    
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to load from file: ${String(err)}`);
  }
}

// Register the extension with XJX
XJX.registerNonTerminalExtension("fromFile", fromFile);
```

### Using a Non-Terminal Extension

Once registered, the extension can be used in a method chain:

```javascript
const result = new XJX()
  .fromFile('data.xml')
  .withTransforms(/* ... */)
  .toJson();
```

## Extension Registration

Extensions must be registered with XJX to be available. This is done using the static registration methods:

```typescript
// Terminal extension
XJX.registerTerminalExtension("toYaml", toYaml);

// Non-terminal extension
XJX.registerNonTerminalExtension("fromFile", fromFile);
```

### Registration Best Practices

1. **Register at module load time**: Ensure extensions are registered when your module is imported
2. **Export your extension functions**: This makes them available to other modules
3. **Use descriptive names**: Extension names should clearly indicate their purpose

```typescript
// myExtensions.ts
import { XJX } from 'xjx';

export function toYaml(/* ... */) { /* ... */ }
export function fromFile(/* ... */) { /* ... */ }

// Register extensions
XJX.registerTerminalExtension("toYaml", toYaml);
XJX.registerNonTerminalExtension("fromFile", fromFile);

// Main export
export { toYaml, fromFile };
```

## Extension Boilerplates

### Terminal Extension Boilerplate

```typescript
// terminalExtension.ts
import { XJX, TerminalExtensionContext } from 'xjx';

/**
 * My custom terminal extension
 * @param arg1 First argument
 * @param arg2 Second argument
 * @returns Custom result
 */
export function myTerminalExtension(
  this: TerminalExtensionContext, 
  arg1: string, 
  arg2?: number
): any {
  try {
    // Validate that a source is set
    this.validateSource();
    
    // Access XNode, config, and transforms
    const { xnode, config, transforms } = this;
    
    // Validate inputs
    if (!arg1) {
      throw new Error('First argument is required');
    }
    
    // Implementation
    // ...
    const result = { /* ... */ };
    
    // Return some value
    return result;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed in myTerminalExtension: ${String(err)}`);
  }
}

// Register the extension
XJX.registerTerminalExtension("myTerminalExtension", myTerminalExtension);
```

### Non-Terminal Extension Boilerplate

```typescript
// nonTerminalExtension.ts
import { XJX, NonTerminalExtensionContext } from 'xjx';

/**
 * My custom non-terminal extension
 * @param arg1 First argument
 * @param arg2 Second argument
 */
export function myNonTerminalExtension(
  this: NonTerminalExtensionContext, 
  arg1: string, 
  arg2?: number
): void {
  try {
    // Validate inputs
    if (!arg1) {
      throw new Error('First argument is required');
    }
    
    // Implementation
    // ...
    
    // Modify XJX instance properties if needed
    this.config = this.deepMerge(this.config, { /* ... */ });
    
    // No return needed - XJX.registerNonTerminalExtension will return 'this'
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed in myNonTerminalExtension: ${String(err)}`);
  }
}

// Register the extension
XJX.registerNonTerminalExtension("myNonTerminalExtension", myNonTerminalExtension);
```

## Advanced Extension Examples

### Adding Support for a New Format

This example adds support for converting to and from CSV:

```typescript
// csvExtensions.ts
import { XJX, TerminalExtensionContext, NonTerminalExtensionContext } from 'xjx';

// From CSV to XNode
export function fromCsv(this: NonTerminalExtensionContext, csv: string, options: any = {}): void {
  try {
    // Validate input
    if (typeof csv !== 'string') {
      throw new Error('CSV source must be a string');
    }
    
    // Parse CSV
    const rows = csv.split('\n').map(row => row.split(','));
    const headers = rows[0];
    const data = rows.slice(1);
    
    // Create an XNode structure
    const rootNode = {
      name: options.rootName || 'root',
      type: 1, // Element node
      children: data.map(row => ({
        name: options.itemName || 'item',
        type: 1, // Element node
        children: headers.map((header, i) => ({
          name: header.trim(),
          type: 1, // Element node
          value: row[i]?.trim()
        }))
      }))
    };
    
    // Set as current XNode
    this.xnode = rootNode;
    
    // Set source format (using JSON as fallback)
    const FORMAT = require('xjx').FORMAT;
    this.sourceFormat = FORMAT.JSON;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to parse CSV: ${String(err)}`);
  }
}

// From XNode to CSV
export function toCsv(this: TerminalExtensionContext, options: any = {}): string {
  try {
    // Validate source
    this.validateSource();
    
    // Apply transforms if any
    let nodeToConvert = this.xnode;
    if (this.transforms && this.transforms.length > 0) {
      const FORMAT = require('xjx').FORMAT;
      const transformXNode = require('xjx').transformXNode;
      nodeToConvert = transformXNode(nodeToConvert, this.transforms, FORMAT.JSON, this.config);
    }
    
    // Extract data
    const rows = [];
    const headers = new Set();
    
    // Find all item nodes
    const itemNodes = nodeToConvert.children || [];
    
    // Collect all headers first
    itemNodes.forEach(item => {
      (item.children || []).forEach(field => {
        headers.add(field.name);
      });
    });
    
    // Convert headers set to array
    const headerArray = Array.from(headers);
    rows.push(headerArray.join(','));
    
    // Add data rows
    itemNodes.forEach(item => {
      const row = headerArray.map(header => {
        const field = (item.children || []).find(child => child.name === header);
        return field?.value || '';
      });
      rows.push(row.join(','));
    });
    
    // Join rows with newlines
    return rows.join('\n');
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to convert to CSV: ${String(err)}`);
  }
}

// Register extensions
XJX.registerNonTerminalExtension("fromCsv", fromCsv);
XJX.registerTerminalExtension("toCsv", toCsv);
```

### Adding Custom Validation

This example adds a validation feature:

```typescript
// validationExtension.ts
import { XJX, TerminalExtensionContext } from 'xjx';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate the current XNode against rules
 */
export function validate(
  this: TerminalExtensionContext, 
  rules: Record<string, any>
): ValidationResult {
  try {
    // Validate source
    this.validateSource();
    
    const result: ValidationResult = {
      isValid: true,
      errors: []
    };
    
    // Get the XNode to validate
    const node = this.xnode;
    
    // Example validation logic
    function validateNode(node, rulePath, rules) {
      // Check required fields
      if (rules.required && Array.isArray(rules.required)) {
        rules.required.forEach(field => {
          const hasField = (node.children || []).some(child => child.name === field);
          if (!hasField) {
            result.isValid = false;
            result.errors.push(`Missing required field '${field}' at path ${rulePath}`);
          }
        });
      }
      
      // Check child rules
      if (rules.children && typeof rules.children === 'object') {
        Object.entries(rules.children).forEach(([childName, childRules]) => {
          const childNodes = (node.children || []).filter(child => child.name === childName);
          
          // Check if child exists when required
          if (childRules.required === true && childNodes.length === 0) {
            result.isValid = false;
            result.errors.push(`Missing required child '${childName}' at path ${rulePath}`);
            return;
          }
          
          // Apply rules to each matching child
          childNodes.forEach(childNode => {
            validateNode(childNode, `${rulePath}.${childName}`, childRules);
          });
        });
      }
    }
    
    // Start validation from root
    validateNode(node, node.name, rules);
    
    return result;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Validation failed: ${String(err)}`);
  }
}

// Register the extension
XJX.registerTerminalExtension("validate", validate);
```

## Common Extension Patterns

### 1. Data Format Converters

Extensions that convert to/from other formats (CSV, YAML, etc.):

```javascript
// Terminal: toFormat()
// Non-Terminal: fromFormat()
```

### 2. Data Manipulation

Extensions that transform or manipulate data:

```javascript
// Non-Terminal: withSorting()
// Non-Terminal: withFiltering()
```

### 3. Validation and Analysis

Extensions that validate or analyze data:

```javascript
// Terminal: validate()
// Terminal: analyze()
```

### 4. I/O Operations

Extensions that interact with files or network:

```javascript
// Non-Terminal: fromFile()
// Terminal: saveToFile()
```

## Best Practices

1. **Validate Inputs**: Always validate method arguments
2. **Handle Errors**: Use try/catch blocks and provide useful error messages
3. **Document Extensions**: Add JSDoc comments to explain behavior and parameters
4. **Follow Naming Conventions**: Use descriptive names that match the XJX style
5. **Immutability**: Avoid modifying input values directly
6. **Testing**: Test extensions with various inputs and edge cases

## Common Pitfalls

1. **Forgetting Registration**: Extensions must be registered to be usable
2. **Ignoring Context**: The extension context provides important state info
3. **Side Effects**: Be careful about modifying global state
4. **Invalid Returns**: Terminal extensions must return a value, non-terminal must not

## Debugging Extensions

To debug extensions, use the XJX logging system:

```javascript
import { XJX, LogLevel } from 'xjx';

// Enable debug logging
const xjx = new XJX()
  .setLogLevel(LogLevel.DEBUG);
  
// Use your extension
const result = xjx
  .myCustomExtension(/* ... */)
  .toJson();
```

This will show detailed information about extension execution, which can help identify issues.