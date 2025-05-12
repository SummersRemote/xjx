# XJX Extension System Guide

XJX provides a powerful extension system that allows developers to enhance its functionality. This guide explains how to create, register, and use extensions for the XJX library.

## Extension System Overview

The extension system in XJX enables you to add custom methods to both the `XJX` class (static methods) and the `XjxBuilder` class (fluent API methods). Extensions integrate directly with the fluent API, enabling both standalone usage and seamless chaining in method calls.

There are two types of extensions in XJX:

1. **Terminal Extensions**: Return a value and typically end a method chain
2. **Non-Terminal Extensions**: Return the builder instance (`this`) to enable method chaining

## Terminal vs. Non-Terminal Extensions

### Terminal Extensions

Terminal extensions have these characteristics:

- End the method chain
- Return a value (not `this`)
- Often perform an operation that produces a result
- Typically named with prefixes like `to...` or `get...`
- Examples: `toXml()`, `toJson()`, `toJsonString()`

### Non-Terminal Extensions

Non-terminal extensions have these characteristics:

- Continue the method chain
- Always return `this` (the builder instance)
- Modify the builder's state or add configuration
- Typically named with prefixes like `with...` or `add...`
- Examples: `withConfig()`, `withTransforms()`, `fromXml()`

## Creating Terminal Extensions

Terminal extensions return a value other than the builder instance and typically end the method chain.

### Terminal Extension Structure

```typescript
/**
 * Example terminal extension function
 * 
 * @param {any} arg1 First argument
 * @param {any} arg2 Second argument
 * @returns {any} Result value
 */
function myTerminalExtension(arg1, arg2) {
  // Access the builder's configuration
  const config = this.config;
  
  // Perform operations using config and arguments
  const result = /* ... */;
  
  // Return the result (not this)
  return result;
}

// Register the terminal extension
XJX.registerTerminalExtension("toMyResult", myTerminalExtension);
```

### Terminal Extension Example: XML Validator

Let's create a terminal extension that validates XML with custom rules:

```javascript
// src/extensions/terminal/validate-xml-with-rules.ts
import { XJX } from "../../XJX";
import { TerminalExtensionContext } from "../../core/types/extension-types";
import { XmlUtils } from "../../core/utils/xml-utils";

/**
 * Extended XML validation with rule checking
 * 
 * @param rules Optional validation rules
 * @returns Validation result object
 */
function validateXmlWithRules(
  this: TerminalExtensionContext,
  rules: Array<{ selector: string, test: (node: any) => boolean, message: string }> = []
) {
  // Validate source is set
  this.validateSource();
  
  // Basic XML validation
  const basicValidation = XmlUtils.validateXML(this.toXml());
  if (!basicValidation.isValid) {
    return basicValidation;
  }
  
  // No rules to check, return basic validation
  if (!rules || rules.length === 0) {
    return { isValid: true };
  }
  
  // Check custom rules
  const errors = [];
  
  for (const rule of rules) {
    // Find matching nodes
    const nodes = this.xnode?.findAll(n => n.name === rule.selector);
    
    if (nodes && nodes.length > 0) {
      for (const node of nodes) {
        // Apply the test
        if (!rule.test(node)) {
          errors.push({
            node: node.name,
            path: node.getPath(),
            message: rule.message
          });
        }
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

// Register the extension
XJX.registerTerminalExtension("validateWithRules", validateXmlWithRules);
```

### Using Your Terminal Extension

Once registered, the extension can be used in two ways:

```javascript
// Fluent API usage
const validationResult = XJX.fromXml(xml)
  .withConfig({ preserveNamespaces: true })
  .validateWithRules([
    {
      selector: 'email',
      test: node => /^[^@]+@[^@]+\.[^@]+$/.test(node.getTextContent()),
      message: 'Invalid email format'
    }
  ]);

// Static usage
const validationResult = XJX.validateWithRules([
  {
    selector: 'user',
    test: node => node.findChild('name') !== undefined,
    message: 'User must have a name element'
  }
]);
```

## Creating Non-Terminal Extensions

Non-terminal extensions return the builder instance (`this`) and allow method chaining to continue.

### Non-Terminal Extension Structure

```typescript
/**
 * Example non-terminal extension function
 * 
 * @param {any} arg1 First argument
 * @param {any} arg2 Second argument
 * @returns {XjxBuilder} The builder instance for chaining
 */
function myNonTerminalExtension(arg1, arg2) {
  // Access the builder's configuration
  const config = this.config;
  
  // Modify the builder's state
  this.someProperty = /* ... */;
  
  // Call other builder methods
  this.withTransforms(/* ... */);
  
  // ALWAYS return this for chaining
  return this;
}

// Register the non-terminal extension
XJX.registerNonTerminalExtension("withMyFeature", myNonTerminalExtension);
```

### Non-Terminal Extension Example: Data Type Conversions

Let's create a non-terminal extension that adds common data type conversions:

```javascript
// src/extensions/nonterminal/with-data-type-conversions.ts
import { XJX } from "../../XJX";
import { BooleanTransform } from "../../transforms/boolean-transform";
import { NumberTransform } from "../../transforms/number-transform";
import { NonTerminalExtensionContext } from "../../core/types/extension-types";

/**
 * Add common data type transformers to the pipeline
 * 
 * @param options Options for the data type conversions
 * @returns The builder instance for chaining
 */
function withDataTypeConversions(this: NonTerminalExtensionContext, options = {
  booleanOptions: {
    trueValues: ['true', 'yes', '1', 'on'],
    falseValues: ['false', 'no', '0', 'off'],
    ignoreCase: true
  },
  numberOptions: {
    integers: true,
    decimals: true,
    scientific: true,
    decimalSeparator: '.',
    thousandsSeparator: ','
  }
}) {
  // Add boolean transformer
  this.withTransforms(new BooleanTransform(options.booleanOptions));
  
  // Add number transformer
  this.withTransforms(new NumberTransform(options.numberOptions));
  
  // Return this for chaining
  return this;
}

// Register the non-terminal extension
XJX.registerNonTerminalExtension("withDataTypeConversions", withDataTypeConversions);
```

### Using Your Non-Terminal Extension

Once registered, the extension can be used in two ways:

```javascript
// Fluent API usage
const json = XJX.fromXml(xml)
  .withDataTypeConversions()
  .toJson();

// Static usage
const builder = XJX.withDataTypeConversions()
  .fromXml(xml);
```

## Accessing Configuration and Context

Inside extension functions, `this` refers to:

1. In fluent API: The `XjxBuilder` instance with all properties and methods
2. In static usage: A context object with the configuration

### Available Properties and Methods in Extension Context

When creating extensions, you can access:

```typescript
// Configuration (always available)
this.config                 // Current configuration object

// Additional properties (only in fluent API context)
this.xnode                 // Current XNode (if set)
this.transforms            // Array of registered transformers
this.sourceFormat          // Current source format

// Additional methods (only in fluent API context)
this.withTransforms()       // Add transformers
this.withConfig()           // Modify configuration
this.validateSource()       // Validate source is set
this.deepClone()            // Deep clone utility
this.deepMerge()            // Deep merge utility
```

### Example: Using Configuration and Context

```javascript
function myExtension(options = {}) {
  // Access and use configuration
  const preserveComments = this.config.preserveComments;
  const propNames = this.config.propNames;
  
  // In fluent context, add transformers
  if (this.withTransforms) {
    this.withTransforms(
      new CustomTransform(options)
    );
  }
  
  // Return this for non-terminal or result for terminal
  return this; // or return result;
}
```

## Registering Extensions

Extensions are registered using two methods in the `XJX` class:

### 1. Register Terminal Extensions

```typescript
/**
 * Register a terminal extension method (returns a value)
 * @param name Extension name (e.g., 'toXml')
 * @param method Implementation function
 */
XJX.registerTerminalExtension(name, method);
```

### 2. Register Non-Terminal Extensions

```typescript
/**
 * Register a non-terminal extension method (returns this for chaining)
 * @param name Extension name (e.g., 'withConfig')
 * @param method Implementation function
 */
XJX.registerNonTerminalExtension(name, method);
```

### Naming Conventions

- Terminal extensions: `to*` or `get*` (e.g., `toXml`, `toJson`)
- Non-terminal extensions: `with*` or `add*` (e.g., `withTransforms`)

## Complete Extension Examples

### Example 1: With Transforms Extension (Non-Terminal)

```javascript
// src/extensions/nonterminal/with-transforms.ts
import { XJX } from "../../XJX";
import { Transform } from "../../core/types/transform-interfaces";
import { XJXError } from "../../core/types/error-types";
import { NonTerminalExtensionContext } from "../../core/types/extension-types";

/**
 * Add transformers to the pipeline
 * @param transforms One or more transformers
 */
function withTransforms(this: NonTerminalExtensionContext, ...transforms: Transform[]) {
  if (!transforms || transforms.length === 0) {
    return this;
  }
  
  // Validate transforms
  for (const transform of transforms) {
    if (!transform || !transform.targets || !transform.transform) {
      throw new XJXError('Invalid transform: must implement the Transform interface');
    }
  }
  
  // Initialize transforms array if it doesn't exist
  if (!this.transforms) {
    this.transforms = [];
  }
  
  // Add transforms to the pipeline
  this.transforms.push(...transforms);
  return this;
}

// Register the extension
XJX.registerNonTerminalExtension("withTransforms", withTransforms);
```

### Example 2: With Config Extension (Non-Terminal)

```javascript
// src/extensions/nonterminal/with-config.ts
import { XJX } from "../../XJX";
import { Configuration } from "../../core/types/transform-interfaces";
import { NonTerminalExtensionContext } from "../../core/types/extension-types";
import { CommonUtils } from "../../core/utils/common-utils";

/**
 * Set configuration options
 * @param config Partial configuration to merge with defaults
 */
function withConfig(this: NonTerminalExtensionContext, config: Partial<Configuration>) {
  if (!config || Object.keys(config).length === 0) {
    return this;
  }
  
  // Merge with current config
  this.config = CommonUtils.deepMerge(this.config, config);
  return this;
}

// Register the extension
XJX.registerNonTerminalExtension("withConfig", withConfig);
```

## Integration and Usage

### Extension Modules

Create individual extension files in the `src/extensions` directory:

```
src/
  ├── extensions/
  │   ├── terminal/
  │   │   ├── to-xml.ts
  │   │   ├── to-json.ts
  │   │   ├── to-json-string.ts
  │   │   └── ...
  │   ├── nonterminal/
  │   │   ├── from-xml.ts
  │   │   ├── from-json.ts
  │   │   ├── with-transforms.ts
  │   │   └── ...
  │   └── index.ts  // Import and register all extensions
```

### Entry Point for Extensions

Create an entry point to register all extensions:

```typescript
// src/extensions/index.ts
// Terminal extensions
import './terminal/to-xml';
import './terminal/to-json';
import './terminal/to-json-string';

// Non-terminal extensions
import './nonterminal/from-xml';
import './nonterminal/from-json';
import './nonterminal/with-config';
import './nonterminal/with-transforms';

// Export nothing - the imports above are only for side effects (registration)
export {};
```

### Using Extensions in the Library

```typescript
// src/index.ts
export * from './core/XJX';
export * from './fluent/xjx-builder';
// ... other exports ...

// Import all extensions to ensure they're registered
import './extensions';
```

## Best Practices

### 1. Extension Naming

- Use clear, descriptive names
- Follow naming conventions:
  - Terminal: `to*` or `get*` (`toXml`, `toJson`)
  - Non-terminal: `with*` or `add*` (`withConfig`)

### 2. Function Structure

- Document parameters and return types
- Keep extensions focused on a single responsibility
- Handle errors gracefully

### 3. Terminal vs. Non-Terminal

- Be consistent with return values:
  - Terminal: Return a value (not `this`)
  - Non-terminal: ALWAYS return `this`

### 4. Configuration Access

- Use `this.config` to access current configuration
- Don't modify configuration directly unless that's the extension's purpose

### 5. Documentation

- Include JSDoc comments for all extensions
- Document parameters, return values, and examples
- Explain the purpose and behavior of the extension

### 6. Testing

- Write tests for all extensions
- Test both fluent API and static usage
- Cover error cases and edge conditions

## Debugging Extensions

### Common Issues

**Issue**: Extension is not available on `XJX` or in the fluent API  
**Solution**: Ensure the extension is properly registered and the extension file is imported

**Issue**: Type errors in extension implementation  
**Solution**: Add proper TypeScript interfaces and type annotations

**Issue**: Extension doesn't have access to expected builder methods  
**Solution**: Verify the extension is registered as the correct type (terminal or non-terminal)

**Issue**: Configuration changes aren't reflected in extension  
**Solution**: Ensure you're accessing `this.config` directly, not storing it in a variable at initialization

### Debugging Tips

- Add console.log statements to verify extension registration
- Check the context (`this`) inside your extension function
- Verify extension file import paths
- Use TypeScript to catch type errors early

## Real-World Example: Data Transformation Pipeline

```javascript
// src/extensions/nonterminal/with-pipeline.ts
import { XJX } from "../../XJX";
import { Transform } from "../../core/types/transform-interfaces";
import { NonTerminalExtensionContext } from "../../core/types/extension-types";

/**
 * Configure a transform pipeline with named stages
 * 
 * @param pipeline Object with named pipeline stages
 */
function withPipeline(
  this: NonTerminalExtensionContext,
  pipeline: Record<string, Transform | Transform[]>
) {
  // Process each pipeline stage
  for (const [name, transforms] of Object.entries(pipeline)) {
    if (Array.isArray(transforms)) {
      // Add all transforms from this stage
      this.withTransforms(...transforms);
    } else {
      // Add single transform
      this.withTransforms(transforms);
    }
  }
  
  return this;
}

// Register the extension
XJX.registerNonTerminalExtension("withPipeline", withPipeline);
```

Usage:

```javascript
const result = XJX.fromXml(xml)
  .withPipeline({
    // Pipeline stages with descriptive names
    'dataTypes': [
      new BooleanTransform(),
      new NumberTransform()
    ],
    'security': new FilterTransform({
      removeElements: ['password', 'secret'],
      removeAttributes: ['internal-id']
    }),
    'formatting': new TextTransform({
      trim: true,
      normalizeWhitespace: true
    })
  })
  .toJson();
```

## Conclusion

The XJX extension system provides a powerful way to enhance the library's functionality with custom methods. By following the guidelines in this document, you can create extensions that integrate seamlessly with the fluent API and provide valuable functionality to users of your library.

## Next Steps

Now that you understand the extension system, learn more about:

- [The Metadata System](metadata-system.md) - Working with the metadata layer
- [API Reference](api-reference.md) - Complete API documentation