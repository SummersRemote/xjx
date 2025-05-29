# XJX - XML/JSON Transformation Library

A powerful, modular XML/JSON transformation library with a fluent API, designed for high-fidelity conversions and functional data processing.

## ✨ Features

- **High-Fidelity Conversions**: Perfect round-trip XML ↔ JSON transformations
- **Fluent API**: Chainable methods for intuitive data processing pipelines
- **Functional Operations**: filter, map, select, reduce operations on document trees
- **Built-in Transforms**: Number, boolean, and regex value transformations
- **Comprehensive Configuration**: Fine-grained control over conversion behavior
- **TypeScript Support**: Full type definitions included
- **Universal**: Works in browsers and Node.js environments

## 📦 Installation

### Node.js
```bash
npm install xjx
```

### Browser (ES Modules)
```html
<script type="module">
  import { XJX } from 'https://unpkg.com/xjx/dist/esm/index.js';
</script>
```

### Browser (UMD)
```html
<script src="https://unpkg.com/xjx/dist/umd/xjx.min.js"></script>
<script>
  const { XJX } = window.XJX;
</script>
```

## 🚀 Quick Start

### Basic XML to JSON Conversion

```javascript
import { XJX } from 'xjx';

const xml = `
<book id="123">
  <title>JavaScript Guide</title>
  <author>Jane Smith</author>
  <price currency="USD">29.99</price>
</book>`;

const result = new XJX()
  .fromXml(xml)
  .toJson();

console.log(result);
// Output: { book: { id: "123", title: "JavaScript Guide", ... } }
```

### Functional Pipeline Processing

```javascript
import { XJX, toNumber } from 'xjx';

const xml = `
<products>
  <item><name>Laptop</name><price>999.99</price></item>
  <item><name>Mouse</name><price>25.50</price></item>
  <item><name>Keyboard</name><price>75.00</price></item>
</products>`;

// Find products over $50 and convert prices to numbers
const expensiveProducts = new XJX()
  .fromXml(xml)
  .select(node => node.name === 'item')
  .map(item => {
    // Transform price values to numbers using transforms
    if (item.children) {
      const priceNode = item.children.find(child => child.name === 'price');
      if (priceNode && priceNode.value) {
        priceNode.value = toNumber()(priceNode.value);
      }
    }
    return item;
  })
  .filter(item => {
    const priceNode = item.children?.find(child => child.name === 'price');
    return priceNode && priceNode.value > 50;
  })
  .toJson();
```

### Value Transformations in map()

```javascript
import { XJX, toNumber, toBoolean, regex } from 'xjx';

const xml = `
<config>
  <timeout>30.5</timeout>
  <enabled>true</enabled>
  <version>v1.2.3-beta</version>
</config>`;

// Convert timeout to integer
new XJX()
  .fromXml(xml)
  .map(node => {
    if (node.name === 'timeout' && node.value) {
      node.value = toNumber({ precision: 0 })(node.value);
    }
    return node;
  })
  .toJson();

// Clean version strings
new XJX()
  .fromXml(xml)
  .map(node => {
    if (node.name === 'version' && node.value) {
      node.value = regex(/[^\d.]/g, '')(node.value);
    }
    return node;
  })
  .toJson();
```

## ⚙️ Configuration

```javascript
const config = {
  // Preservation settings
  preserveNamespaces: true,
  preserveComments: false,
  preserveCDATA: true,
  preserveAttributes: true,
  
  // Transformation strategies
  strategies: {
    highFidelity: false,           // Enable for perfect round-trips
    attributeStrategy: 'merge',    // 'merge' | 'prefix' | 'property'
    textStrategy: 'direct',       // 'direct' | 'property'
    arrayStrategy: 'multiple',    // 'multiple' | 'always' | 'never'
    emptyElementStrategy: 'object' // 'object' | 'null' | 'string' | 'remove'
  },
  
  // Output formatting
  formatting: {
    pretty: true,
    indent: 2,
    declaration: true
  }
};

const result = new XJX(config)
  .fromXml(xml)
  .toJson();
```

## 📖 Core API

### Source Methods
- `fromXml(xml)` - Parse XML string
- `fromJson(json)` - Parse JSON object  
- `fromXnode(nodes)` - Use XNode array as source

### Processing Methods
- `filter(predicate)` - Keep nodes matching predicate (maintains hierarchy)
- `map(transformer)` - Transform every node in the document
- `select(predicate)` - Collect matching nodes (flattened)

### Output Methods
- `toXml()` - Convert to XML DOM Document
- `toXmlString()` - Convert to XML string
- `toJson()` - Convert to JSON object
- `toJsonString()` - Convert to JSON string
- `toXnode()` - Convert to XNode array
- `reduce(reducer, initial)` - Aggregate to single value

### Configuration Methods
- `withConfig(config)` - Apply configuration options
- `withLogLevel(level)` - Set logging level

### Transform Functions (for use in map())
- `toNumber(options?)` - Convert strings to numbers
- `toBoolean(options?)` - Convert strings to booleans
- `regex(pattern, replacement)` - Apply regex transformations
- `compose(...transforms)` - Combine multiple transforms

## 🔧 Advanced Usage

### High-Fidelity Round-Trip Conversion

```javascript
const xml = `<book id="123"><title>Guide</title></book>`;

// Convert XML → JSON → XML with perfect fidelity
const roundTrip = new XJX({ strategies: { highFidelity: true } })
  .fromXml(xml)
  .toJson();

const backToXml = new XJX({ strategies: { highFidelity: true } })
  .fromJson(roundTrip)
  .toXmlString();

console.log(backToXml); // Identical to original XML
```

### Error Handling

```javascript
import { XJX, ValidationError, ProcessingError } from 'xjx';

try {
  const result = new XJX()
    .fromXml('<invalid-xml>')
    .toJson();
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Input validation failed:', error.message);
  } else if (error instanceof ProcessingError) {
    console.log('Processing failed:', error.message);
  }
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- [API Documentation](docs/API_GUIDE.md)
- [Developer Guide](docs/DEVELOPERS_GUIDE.md)
- [GitHub Repository](https://github.com/summersremote/xjx)