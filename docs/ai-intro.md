# XJX Project Overview

## Design Principles & Intent

- **Simplicity First**: Prioritizes clear APIs and straightforward usage patterns. Complex features are opt-in.
- **Developer Experience**: Fluent API design for readability and discoverability. Sensible defaults with explicit overrides.
- **Format Fidelity**: Preserves full XML structure fidelity with XJX JSON format, with optional Standard JSON for easier consumption.
- **Graceful Degradation**: Features like namespaces, comments, and CDATA are preserved when possible, dropped gracefully when not.
- **Error Resilience**: Sophisticated error handling system with context-aware recovery and fallbacks.
- **Immutability**: Transform operations produce new objects rather than mutating originals.
- **Progressive Enhancement**: Core functionality works without configuration; additional features add progressively.
- **Format Awareness**: Tools adjust behavior based on target format for optimal results in either direction.
- **Performance Conscious**: Early-exit patterns and lazy evaluation to minimize unnecessary processing.
- **Self-Documenting**: Explicit naming and patterns over implicit conventions.
- **DOM Access**: Direct access to underlying DOM structures with serialization controls.

## Architecture

XJX is a bidirectional XML/JSON conversion library with a modular, extensible architecture built on a fluent API. The core conversion pipeline is:

1. Parse source (XML/JSON) → XNode (internal model)
2. Apply transforms to XNode
3. Convert XNode → target format (XML DOM/JSON)
4. Optional: Serialize target format to string representation

## Core Components

- **XNode**: Central data model representing XML nodes with attributes, values, children
- **Converters**: Convert between formats and XNode
  - XML → XNode
  - XNode → XML DOM (with stringify capability)
  - JSON (XJX format) → XNode
  - XNode → JSON (XJX format)
  - Standard JSON → XNode
  - XNode → Standard JSON
- **Transforms**: Modify XNode during conversion
- **Extensions**: Add methods to the fluent API

## Data Flow

```
╔════════════╗      ╔═══════════════╗      ╔════════════════════╗      ╔════════════╗
║ XML/JSON   ║ ──→  ║ XNode +       ║ ──→  ║ DOM Document/JSON  ║ ──→  ║ String     ║
║ Source     ║      ║ Transforms    ║      ║ (with stringify)   ║      ║ (optional) ║
╚════════════╝      ╚═══════════════╝      ╚════════════════════╝      ╚════════════╝
```

## Configuration System

Configuration is organized by format:

```javascript
{
  // Global preservation options
  preserveNamespaces: true,
  preserveComments: true,
  preserveProcessingInstr: true,
  preserveCDATA: true,
  preserveTextNodes: true,
  preserveWhitespace: false,
  preserveAttributes: true,

  // Format-specific settings
  converters: {
    // Standard JSON settings
    stdJson: {
      options: { 
        attributeHandling: 'merge',    // ignore, merge, prefix, property
        attributePrefix: '@',          // prefix for attributes if using 'prefix' mode
        attributePropertyName: '_attrs', // property for attributes if using 'property' mode
        textPropertyName: '_text',     // property for text content with attributes/children
        alwaysCreateArrays: false,     // always create arrays for elements with same name
        preserveMixedContent: true,    // preserve mixed content (text + elements)
        emptyElementsAsNull: false     // represent empty elements as null
      },
      naming: { 
        arrayItem: "item"              // name for array items in XML
      }
    },
    
    // XJX JSON settings
    xjxJson: {
      options: { 
        compact: true                  // remove empty nodes/properties
      },
      naming: { 
        namespace: "$ns",              // namespace URI property
        prefix: "$pre",                // namespace prefix property
        attribute: "$attr",            // attributes collection property
        value: "$val",                 // node value property
        cdata: "$cdata",               // CDATA content property
        comment: "$cmnt",              // comment content property
        processingInstr: "$pi",        // processing instruction property
        target: "$trgt",               // PI target property
        children: "$children"          // child nodes collection property
      }
    },
    
    // XML settings
    xml: {
      options: {
        declaration: true,             // include XML declaration
        prettyPrint: true,             // format with indentation
        indent: 2                      // indentation spaces
      }
    }
  }
}
```

## Key Interfaces

```typescript
// Transform interface
interface Transform {
  targets: TransformTarget[];
  transform(value: any, context: TransformContext): TransformResult<any>;
}

// Converter interface
interface Converter<TInput, TOutput> {
  convert(input: TInput): TOutput;
}

// Enhanced Document interface (new)
interface EnhancedDocument extends Document {
  stringify(options?: {
    prettyPrint?: boolean;
    indent?: number;
    declaration?: boolean;
  }): string;
}

// Extension registration
XJX.registerTerminalExtension(name: string, method: Function): void;
XJX.registerNonTerminalExtension(name: string, method: Function): void;
```

## JSON Formats

1. **XJX Format**: Full-fidelity XML representation with namespaces, CDATA, etc.
   ```javascript
   {
     "element": {
       "$attr": [{ "id": { "$val": "123" } }],
       "$children": [{ "child": { "$val": "value" } }]
     }
   }
   ```

2. **Standard Format**: Natural JavaScript object structure
   ```javascript
   {
     "element": {
       "id": "123",
       "child": "value"
     }
   }
   ```

## File Structure

- `/src/core/`: Core functionality (XNode, configuration, error handling)
  - `/src/core/xml/`: XML processing
  - `/src/core/json/`: JSON processing
- `/src/transforms/`: Built-in transforms
- `/src/extensions/`: Extension registration
- `/src/converters/`: Format converters

## Error Handling

Centralized error handling system with typed errors:
- ValidationError
- ParseError
- SerializeError
- TransformError
- ConfigurationError
- EnvironmentError

## Key Dependencies

- **Browser**: Uses native DOM APIs
- **Node.js**: Uses JSDOM or xmldom as fallback
- **TypeScript**: For type safety
- **Zero runtime dependencies**: Self-contained

## Usage Patterns

```javascript
// Convert XML to Standard JSON
const standardJson = new XJX()
  .withConfig({
    converters: {
      stdJson: { options: { attributeHandling: 'merge' } }
    }
  })
  .fromXml(xml)
  .withTransforms(
    new BooleanTransform(),
    new NumberTransform()
  )
  .toStandardJson();

// Convert XML to DOM with stringify capability
const xmlDoc = new XJX()
  .fromXml(xml)
  .toXml();

// Manipulate the DOM
const elements = xmlDoc.getElementsByTagName('user');
xmlDoc.documentElement.setAttribute('timestamp', Date.now());

// Serialize with default options from config
const xmlString = xmlDoc.stringify();

// Serialize with custom options
const compactXml = xmlDoc.stringify({ 
  prettyPrint: false, 
  declaration: false 
});
```

## Extension Points

- Add custom transforms for data type conversion or structure changes
- Create terminal/non-terminal extensions for new conversion paths 
- Use metadata to control conversion behavior
- Override format-specific handling at node level
- Extend the DOM interface with custom methods

## Refactoring Considerations

- **Extension method dependencies and order**: Extensions build on each other; respect dependencies
- **Transform context sharing**: Ensure context is correctly propagated through the transform chain
- **Error propagation and recovery**: Maintain fallback behavior in the error handling chain
- **Format-awareness in transforms**: Transforms should check target format and adjust behavior
- **Config structure integrity**: Validate against the complete configuration schema
- **XNode immutability**: Clone nodes rather than modifying them directly
- **Progressive enhancement**: New features should be opt-in with sensible defaults
- **API surface consistency**: Follow existing naming patterns for new methods
- **Type safety**: Maintain strong typing throughout the codebase
- **Test boundary cases**: Handle empty values, deep nesting, unusual XML structures
- **Performance profiling**: Focus optimizations on the critical conversion path
- **DOM access patterns**: Provide consistent methods for DOM manipulation and serialization