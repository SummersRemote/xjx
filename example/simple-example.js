/**
 * XJX Library Enhanced Examples (ES Modules version)
 * This file demonstrates all transformer types in the XJX library
 */

// Import XJX from the dist directory (using the ES module version)
import { 
    XJX, 
    TransformDirection,
    BaseValueTransformer,
    BaseAttributeTransformer,
    BaseNodeTransformer,
    BaseChildrenTransformer,
    BooleanTransformer, 
    NumberTransformer,
    StringReplaceTransformer,
    transformResult
} from '../dist/index.js';

console.log('XJX Library Enhanced Examples Script Loaded (ES Modules)');

// Example 1: Basic XML to JSON conversion
function example1() {
    console.group('Example 1: Basic XML to JSON Conversion');
    
    const xml = `
        <person>
            <n>John Doe</n>
            <age>30</age>
            <email>john.doe@example.com</email>
            <active>true</active>
        </person>
    `;
    
    try {
        // Create a new XJX instance
        const xjx = new XJX();
        
        // Convert XML to JSON
        const json = xjx.xmlToJson(xml);
        
        console.log('Original XML:');
        console.log(xml);
        
        console.log('Converted JSON:');
        console.log(json);
        
        // Pretty print the JSON for better visibility
        console.log('Pretty JSON:');
        console.log(JSON.stringify(json, null, 2));
    } catch (error) {
        console.error('Conversion failed:', error.message);
    }
    
    console.groupEnd();
}

// Example 2: JSON to XML conversion
function example2() {
    console.group('Example 2: JSON to XML Conversion');
    
    // Create a simple JSON object in XJX format
    const json = {
        "product": {
            "$children": [
                {
                    "name": {
                        "$val": "Smart Watch Pro"
                    }
                },
                {
                    "price": {
                        "$val": 299.99,
                        "$attr": [
                            {
                                "currency": {
                                    "$val": "USD"
                                }
                            }
                        ]
                    }
                },
                {
                    "inStock": {
                        "$val": true
                    }
                }
            ]
        }
    };
    
    try {
        // Create a new XJX instance
        const xjx = new XJX();
        
        // Convert JSON to XML
        const xml = xjx.jsonToXml(json);
        
        console.log('Original JSON:');
        console.log(JSON.stringify(json, null, 2));
        
        console.log('Converted XML:');
        console.log(xml);
    } catch (error) {
        console.error('Conversion failed:', error.message);
    }
    
    console.groupEnd();
}

// Example 3: Value Transformers
function example3() {
    console.group('Example 3: Value Transformers');
    
    const xml = `
        <product>
            <n>Smart Watch Pro</n>
            <price>299.99</price>
            <inStock>true</inStock>
            <features>
                <feature>Heart Rate Monitor</feature>
                <feature>GPS</feature>
                <feature>Water Resistant</feature>
            </features>
            <description>Visit https://example.com/smartwatch for more details.</description>
        </product>
    `;
    
    try {
        // Create a new XJX instance
        const xjx = new XJX();
        
        // 1. Boolean Transformer
        const booleanTransformer = new BooleanTransformer({
            trueValues: ['true', 'yes', '1', 'on', 'active'],
            falseValues: ['false', 'no', '0', 'off', 'inactive']
        });
        
        // 2. Number Transformer
        const numberTransformer = new NumberTransformer({
            strictParsing: true
        });
        
        // 3. String Replace Transformer - Convert URLs to HTML links
        const urlLinkifier = new StringReplaceTransformer({
            pattern: /(https?:\/\/[\w-]+(\.[\w-]+)+[\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])/g,
            replacement: '<a href="$1">$1</a>'
        });
        
        // Add transformers for XML to JSON direction
        xjx.addValueTransformer(TransformDirection.XML_TO_JSON, booleanTransformer);
        xjx.addValueTransformer(TransformDirection.XML_TO_JSON, numberTransformer);
        xjx.addValueTransformer(TransformDirection.XML_TO_JSON, urlLinkifier);
        
        // Convert XML to JSON with transformations
        const json = xjx.xmlToJson(xml);
        
        console.log('Original XML:');
        console.log(xml);
        
        console.log('Transformed JSON:');
        console.log(JSON.stringify(json, null, 2));
        
        // Check the types of transformed values
        if (json.product && json.product.$children) {
            const children = json.product.$children;
            
            for (const child of children) {
                if (child.inStock && child.inStock.$val !== undefined) {
                    console.log('inStock type:', typeof child.inStock.$val); // Should be boolean
                }
                
                if (child.price && child.price.$val !== undefined) {
                    console.log('price type:', typeof child.price.$val); // Should be number
                }
                
                if (child.description && child.description.$val !== undefined) {
                    console.log('description contains link:', 
                        child.description.$val.includes('<a href=')); // Should be true
                }
            }
        }
        
        // Convert back to XML
        const newXml = xjx.jsonToXml(json);
        console.log('Converted back to XML:');
        console.log(newXml);
        
    } catch (error) {
        console.error('Transformation failed:', error.message);
    }
    
    console.groupEnd();
}

// Example 4: Attribute Transformer
function example4() {
    console.group('Example 4: Attribute Transformer');
    
    const xml = `
        <product>
            <n>Smart Watch Pro</n>
            <price currency="USD">299.99</price>
            <dimensions unit="cm">4.5 x 4.5 x 1.2</dimensions>
            <weight unit="g">45</weight>
        </product>
    `;
    
    try {
        // Create a new XJX instance
        const xjx = new XJX();
        
        // Create a custom attribute transformer
        class UnitStandardizer extends BaseAttributeTransformer {
             transformAttribute(name, value, node, context) {
                // Only process the "unit" attribute
                if (name !== 'unit') {
                    return transformResult([name, value]);
                }
                
                // Convert to standard units
                const unitMap = {
                    'cm': 'centimeters',
                    'mm': 'millimeters',
                    'g': 'grams',
                    'kg': 'kilograms',
                    'in': 'inches',
                    'ft': 'feet'
                };
                
                if (unitMap[value]) {
                    // Return the standardized unit
                    return transformResult([name, unitMap[value]]);
                }
                
                // Return unchanged if no mapping exists
                return transformResult([name, value]);
            }
        }
        
        // Create a currency attribute transformer
        class CurrencyFormatter extends BaseAttributeTransformer {
             transformAttribute(name, value, node, context) {
                // Only process the "currency" attribute
                if (name !== 'currency') {
                    return transformResult([name, value]);
                }
                
                // Format currency codes to include symbol
                const currencyMap = {
                    'USD': 'USD ($)',
                    'EUR': 'EUR (€)',
                    'GBP': 'GBP (£)',
                    'JPY': 'JPY (¥)'
                };
                
                if (currencyMap[value]) {
                    return transformResult([name, currencyMap[value]]);
                }
                
                return transformResult([name, value]);
            }
        }
        
        // Add attribute transformers
        xjx.addAttributeTransformer(TransformDirection.XML_TO_JSON, new UnitStandardizer());
        xjx.addAttributeTransformer(TransformDirection.XML_TO_JSON, new CurrencyFormatter());
        
        // Convert XML to JSON with transformations
        const json = xjx.xmlToJson(xml);
        
        console.log('Original XML:');
        console.log(xml);
        
        console.log('Transformed JSON:');
        console.log(JSON.stringify(json, null, 2));
        
        // Convert back to XML
        const newXml = xjx.jsonToXml(json);
        console.log('Converted back to XML:');
        console.log(newXml);
        
    } catch (error) {
        console.error('Transformation failed:', error.message);
    }
    
    console.groupEnd();
}

// Example 5: Node Transformer
function example5() {
    console.group('Example 5: Node Transformer');
    
    const xml = `
        <product>
            <title>Smart Watch Pro</title>
            <description>High-quality smartwatch with advanced features</description>
            <price>299.99</price>
            <stock>43</stock>
            <discontinued>false</discontinued>
        </product>
    `;
    
    try {
        // Create a new XJX instance
        const xjx = new XJX();
        
        // Create a custom node transformer that renames elements and adds attributes
        class ProductNodeTransformer extends BaseNodeTransformer {
             transformNode(node, context) {
                // Create a copy of the node to avoid modifying the original
                const modifiedNode = { ...node };
                
                // Rename the "title" element to "name"
                if (node.name === 'title') {
                    modifiedNode.name = 'name';
                }
                
                // Add attributes to price elements
                if (node.name === 'price') {
                    if (!modifiedNode.attributes) {
                        modifiedNode.attributes = {};
                    }
                    modifiedNode.attributes.currency = 'USD';
                }
                
                // Add attributes to stock elements
                if (node.name === 'stock') {
                    if (!modifiedNode.attributes) {
                        modifiedNode.attributes = {};
                    }
                    modifiedNode.attributes.updated = 'today';
                }
                
                // Remove discontinued products with no stock
                if (node.name === 'product' && node.children) {
                    // Find relevant child nodes
                    const discontinued = node.children.find(child => child.name === 'discontinued');
                    const stock = node.children.find(child => child.name === 'stock');
                    
                    if (discontinued?.value === 'true' && stock?.value === '0') {
                        // Return with remove flag to remove this product
                        return transformResult(modifiedNode, true);
                    }
                }
                
                return transformResult(modifiedNode);
            }
        }
        
        // Add node transformer
        xjx.addNodeTransformer(TransformDirection.XML_TO_JSON, new ProductNodeTransformer());
        
        // Convert XML to JSON with transformations
        const json = xjx.xmlToJson(xml);
        
        console.log('Original XML:');
        console.log(xml);
        
        console.log('Transformed JSON:');
        console.log(JSON.stringify(json, null, 2));
        
        // Convert back to XML
        const newXml = xjx.jsonToXml(json);
        console.log('Converted back to XML:');
        console.log(newXml);
        
    } catch (error) {
        console.error('Transformation failed:', error.message);
    }
    
    console.groupEnd();
}

// Example 6: Children Transformer
function example6() {
    console.group('Example 6: Children Transformer');
    
    const xml = `
        <catalog>
            <items>
                <item id="3">Keyboard</item>
                <item id="1">Monitor</item>
                <item id="2">Mouse</item>
                <item id="5">Speakers</item>
                <item id="4">Headphones</item>
                <note>All items are in stock</note>
            </items>
        </catalog>
    `;
    
    try {
        // Create a new XJX instance
        const xjx = new XJX();
        
        // Create a custom children transformer that sorts and filters
        class ItemSorterTransformer extends BaseChildrenTransformer {
             transformChildren(children, node, context) {
                // Only process children of the "items" element
                if (node.name !== 'items') {
                    return transformResult(children);
                }
                
                // Get item elements (exclude non-item elements like notes)
                const itemElements = children.filter(child => child.name === 'item');
                const otherElements = children.filter(child => child.name !== 'item');
                
                // Filter out items with IDs greater than 4
                const filteredItems = itemElements.filter(item => {
                    const id = item.attributes?.id;
                    if (!id) return true;
                    return parseInt(id, 10) <= 4;
                });
                
                // Sort items by ID
                const sortedItems = filteredItems.sort((a, b) => {
                    const idA = parseInt(a.attributes?.id || '0', 10);
                    const idB = parseInt(b.attributes?.id || '0', 10);
                    return idA - idB;
                });
                
                // Create a summary node
                const summaryNode = {
                    name: 'summary',
                    type: 1, // ELEMENT_NODE
                    value: `Total items: ${sortedItems.length}`
                };
                
                // Combine sorted items, other elements, and summary
                return transformResult([...sortedItems, ...otherElements, summaryNode]);
            }
        }
        
        // Add children transformer
        xjx.addChildrenTransformer(TransformDirection.XML_TO_JSON, new ItemSorterTransformer());
        
        // Convert XML to JSON with transformations
        const json = xjx.xmlToJson(xml);
        
        console.log('Original XML:');
        console.log(xml);
        
        console.log('Transformed JSON:');
        console.log(JSON.stringify(json, null, 2));
        
        // Convert back to XML
        const newXml = xjx.jsonToXml(json);
        console.log('Converted back to XML:');
        console.log(newXml);
        
    } catch (error) {
        console.error('Transformation failed:', error.message);
    }
    
    console.groupEnd();
}

// Example 7: Combined Transformers
function example7() {
    console.group('Example 7: Combined Transformers');
    
    const xml = `
        <products>
            <product>
                <title>Smart Watch Pro</title>
                <description>High-quality smartwatch</description>
                <price currency="usd">299.99</price>
                <inStock>true</inStock>
                <specs>
                    <weight unit="g">45</weight>
                    <dimensions unit="cm">4.5 x 4.5 x 1.2</dimensions>
                </specs>
            </product>
            <product>
                <title>Wireless Earbuds</title>
                <description>Premium sound quality</description>
                <price currency="eur">149.99</price>
                <inStock>true</inStock>
                <specs>
                    <weight unit="g">8</weight>
                    <dimensions unit="cm">2.1 x 1.8 x 1.0</dimensions>
                </specs>
            </product>
            <product>
                <title>Vintage Keyboard</title>
                <description>Mechanical keyboard with retro design</description>
                <price currency="usd">199.99</price>
                <inStock>false</inStock>
                <specs>
                    <weight unit="g">950</weight>
                    <dimensions unit="cm">44.5 x 14.0 x 4.0</dimensions>
                </specs>
            </product>
        </products>
    `;
    
    try {
        // Create a new XJX instance
        const xjx = new XJX();
        
        // 1. Value transformers
        const booleanTransformer = new BooleanTransformer();
        const numberTransformer = new NumberTransformer();
        
        // 2. Attribute transformer - Convert units and currency to standard format
        class AttributeStandardizer extends BaseAttributeTransformer {
             transformAttribute(name, value, node, context) {
                // Standardize units
                if (name === 'unit') {
                    const unitMap = {
                        'g': 'grams',
                        'cm': 'centimeters',
                        'mm': 'millimeters'
                    };
                    
                    if (unitMap[value]) {
                        return transformResult([name, unitMap[value]]);
                    }
                }
                
                // Standardize currency
                if (name === 'currency') {
                    const currencyMap = {
                        'usd': 'USD',
                        'eur': 'EUR',
                        'gbp': 'GBP'
                    };
                    
                    if (currencyMap[value]) {
                        return transformResult([name, currencyMap[value]]);
                    }
                }
                
                return transformResult([name, value]);
            }
        }
        
        // 3. Node transformer - Rename elements and add timestamps
        class ProductEnhancer extends BaseNodeTransformer {
             transformNode(node, context) {
                const modifiedNode = { ...node };
                
                // Rename title to name
                if (node.name === 'title') {
                    modifiedNode.name = 'name';
                }
                
                // Add last-updated attribute to products
                if (node.name === 'product') {
                    if (!modifiedNode.attributes) {
                        modifiedNode.attributes = {};
                    }
                    modifiedNode.attributes['last-updated'] = '2023-10-15';
                }
                
                return transformResult(modifiedNode);
            }
        }
        
        // 4. Children transformer - Sort products by price
        class ProductSorter extends BaseChildrenTransformer {
             transformChildren(children, node, context) {
                // Only process children of the "products" element
                if (node.name !== 'products') {
                    return transformResult(children);
                }
                
                // Sort products by price (ascending)
                const sortedChildren = [...children].sort((a, b) => {
                    // Find price nodes
                    const priceA = a.children?.find(child => child.name === 'price')?.value;
                    const priceB = b.children?.find(child => child.name === 'price')?.value;
                    
                    if (priceA === undefined || priceB === undefined) {
                        return 0;
                    }
                    
                    return parseFloat(priceA) - parseFloat(priceB);
                });
                
                return transformResult(sortedChildren);
            }
        }
        
        // Add all transformers in the correct order
        // 1. Node transformers (structural changes first)
        xjx.addNodeTransformer(TransformDirection.XML_TO_JSON, new ProductEnhancer());
        
        // 2. Attribute transformers
        xjx.addAttributeTransformer(TransformDirection.XML_TO_JSON, new AttributeStandardizer());
        
        // 3. Value transformers (data conversions)
        xjx.addValueTransformer(TransformDirection.XML_TO_JSON, booleanTransformer);
        xjx.addValueTransformer(TransformDirection.XML_TO_JSON, numberTransformer);
        
        // 4. Children transformers (collection operations last)
        xjx.addChildrenTransformer(TransformDirection.XML_TO_JSON, new ProductSorter());
        
        // Convert XML to JSON with all transformations
        const json = xjx.xmlToJson(xml);
        
        console.log('Original XML:');
        console.log(xml);
        
        console.log('Transformed JSON:');
        console.log(JSON.stringify(json, null, 2));
        
        // Convert back to XML
        const newXml = xjx.jsonToXml(json);
        console.log('Converted back to XML:');
        console.log(newXml);
        
    } catch (error) {
        console.error('Transformation failed:', error.message);
    }
    
    console.groupEnd();
}

// Example 8: Using Object to XJX format conversion
function example8() {
    console.group('Example 8: Using objectToXJX');
    
    // Regular JSON object (not in XJX format)
    const regularJson = {
        name: "Smart Watch Pro",
        price: 299.99,
        inStock: true,
        features: ["Heart Rate Monitor", "GPS", "Water Resistant"],
        specs: {
            weight: "45g",
            batteryLife: "48 hours"
        }
    };
    
    try {
        // Create a new XJX instance
        const xjx = new XJX();
        
        // Convert regular JSON to XJX format with a root element
        const xjxJson = xjx.objectToXJX(regularJson, "product");
        
        console.log('Regular JSON:');
        console.log(JSON.stringify(regularJson, null, 2));
        
        console.log('XJX Format JSON:');
        console.log(JSON.stringify(xjxJson, null, 2));
        
        // Convert to XML
        const xml = xjx.jsonToXml(xjxJson);
        
        console.log('Converted to XML:');
        console.log(xml);
    } catch (error) {
        console.error('Conversion failed:', error.message);
    }
    
    console.groupEnd();
}

// Run all examples function
function runAllExamples() {
    console.clear();
    console.log('Running all examples...');
    example1();
    example2();
    example3();
    example4();
    example5();
    example6();
    example7();
    example8();
    console.log('All examples completed. Check the console groups above for details.');
}

// Add event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('example1').addEventListener('click', () => {
        console.clear();
        example1();
    });
    
    document.getElementById('example2').addEventListener('click', () => {
        console.clear();
        example2();
    });
    
    document.getElementById('example3').addEventListener('click', () => {
        console.clear();
        example3();
    });
    
    document.getElementById('example4').addEventListener('click', () => {
        console.clear();
        example4();
    });
    
    document.getElementById('example5').addEventListener('click', () => {
        console.clear();
        example5();
    });
    
    document.getElementById('example6').addEventListener('click', () => {
        console.clear();
        example6();
    });
    
    document.getElementById('example7').addEventListener('click', () => {
        console.clear();
        example7();
    });
    
    document.getElementById('example8').addEventListener('click', () => {
        console.clear();
        example8();
    });
    
    document.getElementById('runAll').addEventListener('click', runAllExamples);
});

// Export examples so they can be used in other modules if needed
export {
    example1,
    example2,
    example3,
    example4,
    example5,
    example6,
    example7,
    example8,
    runAllExamples
};

// Run all examples by default
// runAllExamples();