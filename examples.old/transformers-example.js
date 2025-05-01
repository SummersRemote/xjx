/**
 * XJX Transformers Example
 * 
 * This example demonstrates how to use multiple transformers together:
 * 1. BooleanTransformer - Convert "true"/"false" strings to boolean values
 * 2. NumberTransformer - Convert numeric strings to numbers
 * 3. StringReplaceTransformer - Transform URLs into HTML links
 */

/**
 * XJX Transformers Example
 * 
 * This example demonstrates how to use multiple transformers together:
 * 1. BooleanTransformer - Convert "true"/"false" strings to boolean values
 * 2. NumberTransformer - Convert numeric strings to numbers
 * 3. StringReplaceTransformer - Transform URLs into HTML links
 */

// Import the required modules from the project's dist folder
import { XJX, TransformDirection } from '/dist/index.js';
import { 
  BooleanTransformer, 
  NumberTransformer, 
  StringReplaceTransformer 
} from '/dist/transformers.js';

// Function to log output to both console and page
function log(message, isObject = false) {
  console.log(message);
  
  const output = document.getElementById('output');
  const line = document.createElement('div');
  
  if (isObject) {
    line.innerHTML = `<pre>${JSON.stringify(message, null, 2)}</pre>`;
  } else {
    line.textContent = message;
  }
  
  output.appendChild(line);
}

// Sample XML with various data types and URLs
const xml = `
<product>
  <id>12345</id>
  <name>Smart Watch Pro</name>
  <price>299.99</price>
  <inStock>true</inStock>
  <freeShipping>false</freeShipping>
  <specifications>
    <weight>45</weight>
    <batteryLife>72</batteryLife>
    <waterproof>true</waterproof>
  </specifications>
  <description>
    <paragraph>The Smart Watch Pro is our premium smartwatch offering.</paragraph>
    <paragraph>Visit https://example.com/smartwatch for more details.</paragraph>
    <paragraph>Technical support available at https://support.example.com.</paragraph>
  </description>
  <ratings>
    <quality>4.8</quality>
    <features>4.5</features>
    <value>4.2</value>
  </ratings>
</product>
`;

/**
 * Run the XJX transformers example
 */
function runExample() {
  log("XML to JSON and back with multiple transformers");
  
  try {
    // Create a new XJX instance
    const xjx = new XJX();
    
    // 1. Create a Boolean Transformer
    const boolTransformer = new BooleanTransformer({
      trueValues: ['true', 'yes', 'y', '1'],
      falseValues: ['false', 'no', 'n', '0'],
      paths: [
        'product.inStock', 
        'product.freeShipping', 
        'product.specifications.waterproof'
      ]
    });
    
    // 2. Create a Number Transformer
    const numberTransformer = new NumberTransformer({
      integers: true,
      decimals: true,
      paths: [
        'product.id', 
        'product.price', 
        'product.specifications.weight', 
        'product.specifications.batteryLife',
        'product.ratings.*'  // Apply to all children of ratings
      ]
    });
    
    // 3. Create a String Replace Transformer
    const urlLinkifier = new StringReplaceTransformer({
      pattern: /(https?:\/\/[\w-]+(\.[\w-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+)/g,
      replacement: '<a href="$1">$1</a>',
      paths: ['product.description.paragraph']
    });
    
    // Add all transformers to the XJX instance for XML to JSON direction
    xjx.addValueTransformer(TransformDirection.XML_TO_JSON, boolTransformer)
       .addValueTransformer(TransformDirection.XML_TO_JSON, numberTransformer)
       .addValueTransformer(TransformDirection.XML_TO_JSON, urlLinkifier);
    
    // Add transformers for JSON to XML direction
    xjx.addValueTransformer(TransformDirection.JSON_TO_XML, boolTransformer)
       .addValueTransformer(TransformDirection.JSON_TO_XML, numberTransformer);
    
    // Step 1: Convert XML to JSON with transformations
    log("Step 1: Converting XML to JSON with transformations...");
    const json = xjx.xmlToJson(xml);
    
    // Print the transformed JSON
    log("Transformed JSON:", true);
    log(json, true);
    log("------------------------------------");
    
    // Step 2: Convert JSON back to XML
    log("Step 2: Converting JSON back to XML...");
    const convertedXml = xjx.jsonToXml(json);
    
    // Print the transformed XML
    log("Converted XML:");
    log(convertedXml);
    
    // Demonstrate transformation effects
    log("------------------------------------");
    log("Transformation Effects:");
    
    // Extract specific values from the JSON to show transformations
    const productInfo = json.product;
    
    log("\nBoolean Transformer Effects:");
    log(`- inStock: ${typeof productInfo.inStock.$val} -> ${productInfo.inStock.$val}`);
    log(`- freeShipping: ${typeof productInfo.freeShipping.$val} -> ${productInfo.freeShipping.$val}`);
    log(`- waterproof: ${typeof productInfo.specifications.waterproof.$val} -> ${productInfo.specifications.waterproof.$val}`);
    
    log("\nNumber Transformer Effects:");
    log(`- id: ${typeof productInfo.id.$val} -> ${productInfo.id.$val}`);
    log(`- price: ${typeof productInfo.price.$val} -> ${productInfo.price.$val}`);
    log(`- weight: ${typeof productInfo.specifications.weight.$val} -> ${productInfo.specifications.weight.$val}`);
    log(`- battery life: ${typeof productInfo.specifications.batteryLife.$val} -> ${productInfo.specifications.batteryLife.$val}`);
    log(`- quality rating: ${typeof productInfo.ratings.quality.$val} -> ${productInfo.ratings.quality.$val}`);
    
    log("\nString Replace Transformer Effects:");
    // Extract description paragraphs to show URL transformation
    const paragraphs = productInfo.description.$children;
    
    // Find paragraphs with URLs
    paragraphs.forEach((paragraph, index) => {
      const paragraphObj = Object.values(paragraph)[0];
      if (paragraphObj.$val && paragraphObj.$val.includes('<a href=')) {
        log(`- Paragraph ${index + 1}: URLs converted to HTML links`);
        log(`  ${paragraphObj.$val}`);
      }
    });

    // Clean up resources
    xjx.cleanup();
  } 
  catch (error) {
    log(`Error: ${error.message}`);
    console.error(error);
  }
}

// Run the example when the DOM is loaded
document.addEventListener('DOMContentLoaded', runExample);
// Also run immediately in case DOMContentLoaded already fired
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  runExample();
}