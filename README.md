# XMLToJSON version 1

A simple javascript module for converting XML into JSON within the browser.

Features
* no external dependencies
* small (~3kb minified)
* simple parsing.  pass either a string or xml node and get back a javascipt object ( use JSON.stringify(obj) to get the string representation )
* supports atrributes, text, cdata, namespaces, default namespaces, attributes with namespaces... you get the idea
* lots of rendering of options
* consistent, predictable output
* browser support - it works on IE 9+, and nearly every version of Chrome, Safari, and Firefox as well as iOS, Android, and Blackberry.  (xmlToJSON will work for IE 7/8 as well if you set the xmlns option to false)

Parsing XML (esp. with namespaces) with javascript remains one of the great frustrations of writing web applications.
Most methods are limited by such things as poor browser support, poor or non-existent namespace support, poor attribute handling, incomplete representation, and bloated dependencies.

xmlToJSON may not solve all of your woes, but it solved some of mine :)

Usage
-----
Include the src
```
<script type="text/javascript" src="path/xmlToJSON.js"></script>
 ```
and enjoy!  xmlToJSON is packaged as a simple module, so use it like this
 ```javascript
  testString = '<xml><a>It Works!</a></xml>';  	// get some xml (string or document/node)
  result = xmlToJSON.parseString(testString);	// parse
 ```
 The (prettified) result of the above code is
 ```javascript
{
    "xml": {
        "a": [
            {
                "text": "It Works!"
            }
        ]
    }
}
```

Node Usage
----------
While this library does not officialy support use in the NodeJS environment; several users have reported good results by requiring the xmldom package.

User [sethb0](https://github.com/sethb0) has suggested the following workaround example.

```
const { DOMParser } = require('xmldom');
const xmlToJSON = require('xmlToJSON');
xmlToJSON.stringToXML = (string) => new DOMParser().parseFromString(string, 'text/xml');
```
 

Options
-------
```javascript
// These are the option defaults
var options = { 
	mergeCDATA: true,	// extract cdata and merge with text nodes
	grokAttr: true,		// convert truthy attributes to boolean, etc
	grokText: true,		// convert truthy text/attr to boolean, etc
	normalize: true,	// collapse multiple spaces to single space
	xmlns: true, 		// include namespaces as attributes in output
	namespaceKey: '_ns', 	// tag name for namespace objects
	textKey: '_text', 	// tag name for text nodes
	valueKey: '_value', 	// tag name for attribute values
	attrKey: '_attr', 	// tag for attr groups
	cdataKey: '_cdata',	// tag for cdata nodes (ignored if mergeCDATA is true)
	attrsAsObject: true, 	// if false, key is used as prefix to name, set prefix to '' to merge children and attrs.
	stripAttrPrefix: true, 	// remove namespace prefixes from attributes
	stripElemPrefix: true, 	// for elements of same name in diff namespaces, you can enable namespaces and access the nskey property
	childrenAsArray: true 	// force children into arrays
};	

// you can change the defaults by passing the parser an options object of your own
var myOptions = {
	mergeCDATA: false,
	xmlns: false,
	attrsAsObject: false
}

result = xmlToJSON.parseString(xmlString, myOptions);
```

A more complicated example (with xmlns: true)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<xml xmlns="http://default.namespace.uri">
    <a>
        <b id="1">one</b>
        <b id="2"><![CDATA[some <cdata>]]>two</b>
        <ns:c xmlns:ns="http://another.namespace" ns:id="3">three</ns:c>
    </a>
</xml>
```

results in
```javascript
{
        "xml": [{
                "attr": {
                        "xmlns": {
                                "value": "http://default.namespace.uri"
                        }
                },
                "a": [{
                        "b": [{
                                "attr": {
                                        "id": {
                                                "value": 1
                                        }
                                },
                                "text": "one"
                        }, {
                                "attr": {
                                        "id": {
                                                "value": 2
                                        }
                                },
                                "text": "some <cdata>two"
                        }],
                        "c": [{
                                "attr": {
                                        "xmlns:ns": {
                                                "value": "http://another.namespace"
                                        },
                                        "id": {
                                                "value": 3
                                        }
                                },
                                "text": "three"
                        }]
                }]
        }]
}
```


# XMLToJSON version 3

A modern ESM library for converting between XML and JSON with support for namespaces, attributes, and various node types. Works in both browser and Node.js environments through a hybrid DOM implementation approach.

[![npm version](https://img.shields.io/npm/v/xmltojson.svg)](https://www.npmjs.com/package/xmltojson)
[![License](https://img.shields.io/npm/l/xmltojson.svg)](https://github.com/yourusername/xmltojson/blob/main/LICENSE)
[![Build Status](https://img.shields.io/github/workflow/status/yourusername/xmltojson/CI)](https://github.com/yourusername/xmltojson/actions)
[![Coverage Status](https://img.shields.io/codecov/c/github/yourusername/xmltojson)](https://codecov.io/gh/yourusername/xmltojson)

## Features

- **Symmetric Conversion**: Transform XML to JSON and back with no data loss
- **Namespace Support**: Preserve namespaces in both XML and JSON
- **Node Type Preservation**: Support for CDATA, comments, processing instructions, and text nodes
- **Highly Configurable**: Customize property names, output format, and preservation options
- **TypeScript Support**: Full TypeScript definitions for better development experience
- **ESM Compatible**: Modern module system for both Node.js and browser environments
- **Hybrid DOM Support**: Flexible DOM implementation with support for browsers, JSDOM, and xmldom

## Installation

```bash
npm install xmltojson
```

### Node.js Dependencies

For Node.js environments, you'll need to install one of these DOM implementations:

```bash
# Option 1: JSDOM (recommended, more complete DOM implementation)
npm install jsdom

# Option 2: xmldom (lightweight alternative)
npm install @xmldom/xmldom
```

## Usage

### Basic Usage

```javascript
import XMLToJSON from 'xmltojson';

// Create a converter with default settings
const converter = new XMLToJSON();

// Convert XML to JSON
const xmlString = `
<root xmlns:ns="http://example.org">
  <ns:item id="123">
    <title>Example</title>
    <ns:description>This is a <![CDATA[CDATA section]]> with comments</ns:description>
    <!-- This is a comment -->
    <?xml-stylesheet type="text/css" href="style.css"?>
  </ns:item>
</root>
`;

const jsonObj = converter.xmlToJson(xmlString);
console.log(JSON.stringify(jsonObj, null, 2));

// Convert back to XML
const xmlResult = converter.jsonToXml(jsonObj);
console.log(xmlResult);

// Clean up resources when done (especially important when using JSDOM)
converter.cleanup();
```

### Custom Configuration

```javascript
import XMLToJSON from 'xmltojson';

// Create a converter with custom settings
const converter = new XMLToJSON({
  // Features to preserve during transformation
  preserveNamespaces: true,
  preserveComments: true,
  preserveProcessingInstr: true,
  preserveCDATA: true,
  preserveTextNodes: true,
  preserveWhitespace: false,

  // Output options
  outputOptions: {
    prettyPrint: true,
    indent: 3,
    compact: true,  // removes empty or null nodes and elements
    // JSON-specific options
    json: {
      // Additional JSON options can be added here
    },
    // XML-specific options
    xml: {
      declaration: true,  // include the declaration if not present
    },
  },

  // Property names in the JSON representation
  propNames: {
    namespace: "@ns",
    prefix: "@prefix",
    attributes: "@attrs",
    value: "@val",
    cdata: "@cdata",
    comments: "@comments",
    processing: "@processing",
    children: "@children",
  },
});

// Use the converter with custom settings
const jsonObj = converter.xmlToJson(xmlString);
```

### Using a Custom DOM Implementation

The library allows you to provide your own DOM implementation, which is useful for specialized environments or testing:

```javascript
import XMLToJSON from 'xmltojson';
import { DOMImplementation } from 'xmltojson';

// Node.js example with xmldom
const { DOMParser, XMLSerializer, DOMImplementation: XmlDomImpl } = require('@xmldom/xmldom');

// Create custom DOM implementation
const domImpl = new XmlDomImpl();
const customDOM = {
  parser: new DOMParser(),
  serializer: new XMLSerializer(),
  document: domImpl.createDocument(null, null, null),
  createDocument: () => domImpl.createDocument(null, null, null)
};

// Create converter with custom DOM implementation
const converter = new XMLToJSON({}, customDOM);

// Use the converter
const json = converter.xmlToJson(xmlString);

// Clean up resources when done
converter.cleanup();
```

### Node.js Usage with JSDOM

```javascript
import XMLToJSON from 'xmltojson';
import { JSDOM } from 'jsdom';

// Create a converter (will auto-detect JSDOM if installed)
const converter = new XMLToJSON();

// ... use as normal ...

// Clean up resources when done
converter.cleanup();
```

## JSON Structure

The library uses a consistent structure for representing XML in JSON:

```json
{
  "Root_node": {
    "@attrs": [
      {
        "attr": {
          "@ns": "",
          "@prefix": "",
          "@val": ""
        }
      }
    ],
    "@ns": "",
    "@prefix": "",
    "@children": [
      {
        "node_name": {
          "@attrs": [
            {
              "attr": {
                "@ns": "",
                "@prefix": "",
                "@val": ""
              }
            }
          ],
          "@ns": "",
          "@children": [
            {
              "@processing": {
                "target": "target",
                "data": "data"
              }
            },
            {
              "@comments": "comment text"
            },
            {
              "@cdata": "cdata text"
            },
            {
              "@val": "text content"
            }
          ]
        }
      }
    ]
  }
}
```

## Browser Support

This library works in all modern browsers that support the DOM and ES modules.

## Node.js Support

For Node.js environments, you need to install either:

- `jsdom` (recommended, more complete DOM implementation)
- `@xmldom/xmldom` (lightweight alternative)

The library will automatically detect which one is available.

## API Reference

### Class: XMLToJSON

The main class for XML to JSON conversion.

#### Constructor

```typescript
constructor(
  config?: Partial<Configuration>,
  customDOMImplementation?: DOMImplementation
)
```

Creates a new converter instance with optional configuration and DOM implementation.

#### Methods

##### `xmlToJson(xmlString: string): Record<string, any>`

Converts an XML string to a JSON object.

- **Parameters**:
  - `xmlString`: The XML content to convert
- **Returns**: A JSON object representing the XML content

##### `jsonToXml(jsonObj: Record<string, any>): string`

Converts a JSON object to an XML string.

- **Parameters**:
  - `jsonObj`: The JSON object to convert
- **Returns**: XML string

##### `cleanup(): void`

Cleans up any resources, especially important when using JSDOM.

### Interface: Configuration

Configuration interface for XMLToJSON.

```typescript
interface Configuration {
  // Features to preserve during transformation
  preserveNamespaces: boolean;
  preserveComments: boolean;
  preserveProcessingInstr: boolean;
  preserveCDATA: boolean;
  preserveTextNodes: boolean;
  preserveWhitespace: boolean;

  // Output options
  outputOptions: {
    prettyPrint: boolean;
    indent: number;
    compact: boolean;
    json: Record<string, any>;
    xml: {
      declaration: boolean;
    };
  };

  // Property names in the JSON representation
  propNames: {
    namespace: string;
    prefix: string;
    attributes: string;
    value: string;
    cdata: string;
    comments: string;
    processing: string;
    children: string;
  };
}
```

### Class: DOMAdapter

Provides a unified interface for DOM operations across different environments.

#### Constructor

```typescript
constructor(customImplementation?: DOMImplementation)
```

Creates a new DOMAdapter with an optional custom implementation.

### Interface: DOMImplementation

Interface for custom DOM implementations.

```typescript
interface DOMImplementation {
  parser: any;
  serializer: any;
  document: any;
  createDocument: () => Document;
}
```

## Examples

See the [examples](./examples) directory for detailed usage examples:

- [Browser Usage](./examples/browser-example.html)
- [Node.js with JSDOM](./examples/node-example.js)
- [Custom DOM Implementation](./examples/custom-dom-example.ts)

## Configuration Options

### Preservation Options

| Option | Description | Default |
|--------|-------------|---------|
| `preserveNamespaces` | Preserve XML namespaces in JSON | `true` |
| `preserveComments` | Preserve XML comments in JSON | `true` |
| `preserveProcessingInstr` | Preserve XML processing instructions in JSON | `true` |
| `preserveCDATA` | Preserve CDATA sections in JSON | `true` |
| `preserveTextNodes` | Preserve text nodes separately in JSON | `true` |
| `preserveWhitespace` | Preserve whitespace-only text nodes | `false` |

### Output Options

| Option | Description | Default |
|--------|-------------|---------|
| `prettyPrint` | Format XML output with indentation | `true` |
| `indent` | Number of spaces for indentation | `2` |
| `compact` | Remove empty/null properties | `true` |
| `declaration` | Include XML declaration | `true` |

### Property Names

| Option | Description | Default |
|--------|-------------|---------|
| `namespace` | Property name for namespace URI | `"@ns"` |
| `prefix` | Property name for namespace prefix | `"@prefix"` |
| `attributes` | Property name for attributes | `"@attrs"` |
| `value` | Property name for text content | `"@val"` |
| `cdata` | Property name for CDATA sections | `"@cdata"` |
| `comments` | Property name for comments | `"@comments"` |
| `processing` | Property name for processing instructions | `"@processing"` |
| `children` | Property name for child nodes | `"@children"` |

## Performance Considerations

- For large XML documents, consider using the lightweight `@xmldom/xmldom` in Node.js
- The `compact` option removes empty properties, reducing JSON size
- Disable unneeded preservation options for better performance

## Troubleshooting

- **DOM implementation not found in Node.js**: Install either `jsdom` or `@xmldom/xmldom`
- **Memory leaks with JSDOM**: Always call `converter.cleanup()` when done
- **XML parsing errors**: Ensure the XML is well-formed

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Generate documentation
npm run docs
```

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.