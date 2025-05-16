# XJX Configuration Refactoring Guide

## Overview
This guide outlines the changes made to the XJX library's configuration system. The configuration structure has been reorganized to improve modularity, clarity, and extensibility.

## Key Changes

### Configuration Structure
The configuration has been restructured from a relatively flat structure to a more hierarchical organization:

- **Before**: Core flags at the root with some nested objects for specific settings
- **After**: Core flags remain at root, but converter-specific settings are grouped under a `converters` object

### Property Renaming
Several property names have changed to improve consistency:

- `propNames.attributes` → `converters.xjxJson.naming.attribute`
- `propNames.comments` → `converters.xjxJson.naming.comment`
- `propNames.instruction` → `converters.xjxJson.naming.processingInstr`
- `arrayItemName` → `converters.stdJson.naming.arrayItem`
- `standardJsonDefaults` → `converters.stdJson.options`
- `outputOptions.prettyPrint` → `converters.xml.options.prettyPrint`
- `outputOptions.indent` → `converters.xml.options.indent`
- `outputOptions.xml.declaration` → `converters.xml.options.declaration`

### Format-Specific Settings
All format-specific settings are now grouped under their respective converter:

- `converters.stdJson`: Settings for standard JSON conversion
- `converters.xjxJson`: Settings for XJX JSON format
- `converters.xml`: Settings for XML output

Each converter section has its own:
- `options`: Processing options
- `naming`: Property/field naming (where applicable)

## New Configuration Format

```typescript
interface Configuration {
  // Core flags
  preserveNamespaces: boolean;
  preserveComments: boolean;
  preserveProcessingInstr: boolean;
  preserveCDATA: boolean;
  preserveTextNodes: boolean;
  preserveWhitespace: boolean;
  preserveAttributes: boolean;

  // Converter-specific settings
  converters: {
    stdJson: {
      options: {
        attributeHandling: 'ignore' | 'merge' | 'prefix' | 'property';
        attributePrefix: string;
        attributePropertyName: string;
        textPropertyName: string;
        alwaysCreateArrays: boolean;
        preserveMixedContent: boolean;
        emptyElementsAsNull: boolean;
      };
      naming: {
        arrayItem: string;
      };
    };
    xjxJson: {
      options: {
        compact: boolean;
      };
      naming: {
        namespace: string;
        prefix: string;
        attribute: string;
        value: string;
        cdata: string;
        comment: string;
        processingInstr: string;
        target: string;
        children: string;
      };
    };
    xml: {
      options: {
        declaration: boolean;
        prettyPrint: boolean;
        indent: number;
      };
    };
  };
}
```

## Files Updated

1. `src/core/config.ts` - Updated configuration interface and default values
2. `src/extensions/nonterminal/with-config.ts` - Updated configuration validation and handling
3. `src/converters/xml-to-xnode-converter.ts` - Updated to use new configuration paths
4. `src/converters/xnode-to-xml-converter.ts` - Updated to use new configuration paths
5. `src/converters/xnode-to-xjx-json-converter.ts` - Updated to use new configuration paths
6. `src/converters/xjx-json-to-xnode-converter.ts` - Updated to use new configuration paths
7. `src/converters/std-json-to-xnode-converter.ts` - Updated to use new configuration paths
8. `src/converters/xnode-to-std-json-converter.ts` - Updated to use new configuration paths
9. `src/extensions/terminal/to-xml.ts` - Updated configuration references
10. `src/extensions/terminal/to-json.ts` - Updated configuration references
11. `src/extensions/terminal/to-json-string.ts` - Updated configuration references
12. `src/extensions/terminal/to-std-json.ts` - Updated configuration references
13. `src/extensions/nonterminal/from-json.ts` - Updated configuration references
14. `src/transforms/boolean-transform.ts` - Updated to adapt to new structure
15. `src/transforms/number-transform.ts` - Updated to adapt to new structure
16. `src/transforms/regex-transform.ts` - Updated to adapt to new structure
17. `src/transforms/metadata-transform.ts` - Updated to adapt to new structure

## Migration Guide

### Updating Configuration

If you were previously setting configuration:

```javascript
// Before
const xjx = new XJX({
  propNames: {
    namespace: "ns",
    attributes: "attrs"
  },
  outputOptions: {
    prettyPrint: true,
    indent: 4
  },
  arrayItemName: "element"
});
```

Change to:

```javascript
// After
const xjx = new XJX({
  converters: {
    xjxJson: {
      naming: {
        namespace: "ns",
        attribute: "attrs"
      }
    },
    xml: {
      options: {
        prettyPrint: true,
        indent: 4
      }
    },
    stdJson: {
      naming: {
        arrayItem: "element"
      }
    }
  }
});
```

### Accessing Configuration

If you were accessing configuration properties:

```javascript
// Before
const indent = config.outputOptions.indent;
const ns = config.propNames.namespace;
```

Change to:

```javascript
// After
const indent = config.converters.xml.options.indent;
const ns = config.converters.xjxJson.naming.namespace;
```

## Future Considerations

1. Configuration validation could be further enhanced with runtime type checking
2. Additional converter-specific options can be easily added to each section
3. The existing Config utility methods work with the new structure, but could be optimized

## Conclusion

This refactoring provides a more organized and extensible configuration system that better groups related settings. The hierarchical structure makes it easier to understand and extend the configuration as the library evolves.