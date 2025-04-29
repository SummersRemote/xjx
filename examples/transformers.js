/**
 * Comprehensive Example: Using Boolean, Number, and StringReplace Transformers
 * 
 * This example demonstrates how to use multiple transformers together:
 * 1. BooleanTransformer - Convert "true"/"false" strings to boolean values
 * 2. NumberTransformer - Convert numeric strings to numbers
 * 3. StringReplaceTransformer - Transform URLs into HTML links
 */
import { XJX, TransformDirection } from 'xjx';
import { BooleanTransformer } from 'xjx/transformers/boolean-transformer';
import { NumberTransformer } from 'xjx/transformers/number-transformer';
import { StringReplaceTransformer } from 'xjx/transformers/stringreplace-transformer';

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

// Run the example
function runExample() {
  console.log("XML to JSON and back with multiple transformers\n");
  
  // Create a new XJX instance
  const xjx = new XJX();
  
  // 1. Create a Boolean Transformer
  // Converts "true"/"false" strings to boolean values in JSON
  const boolTransformer = new BooleanTransformer({
    // Custom values to consider as "true" or "false"
    trueValues: ['true', 'yes', 'y', '1'],
    falseValues: ['false', 'no', 'n', '0'],
    // Only apply to specific paths
    paths: ['product.inStock', 'product.freeShipping', 'product.specifications.waterproof']
  });
  
  // 2. Create a Number Transformer
  // Converts numeric strings to numbers in JSON
  const numberTransformer = new NumberTransformer({
    // Configure which types of numbers to parse
    parseIntegers: true,
    parseFloats: true,
    // Only apply to specific paths
    paths: [
      'product.id', 
      'product.price', 
      'product.specifications.weight', 
      'product.specifications.batteryLife',
      'product.ratings.*'  // Apply to all children of ratings
    ]
  });
  
  // 3. Create a String Replace Transformer
  // Converts URLs to HTML links
  const urlLinkifier = new StringReplaceTransformer({
    pattern: /(https?:\/\/[\w-]+(\.[\w-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+)/g,
    replacement: '<a href="$1">$1</a>',
    // Only apply in description paragraphs
    paths: ['product.description.paragraph'],
    // Only transform when converting XML to JSON (not when going back to XML)
    xmlToJson: true,
    jsonToXml: false
  });
  
  // Add all transformers to the XJX instance for XML to JSON direction
  xjx.transformValue(TransformDirection.XML_TO_JSON, boolTransformer)
     .transformValue(TransformDirection.XML_TO_JSON, numberTransformer)
     .transformValue(TransformDirection.XML_TO_JSON, urlLinkifier);
  
  // Add boolean and number transformers for JSON to XML direction
  // (We don't add the urlLinkifier for this direction as specified in its options)
  xjx.transformValue(TransformDirection.JSON_TO_XML, boolTransformer)
     .transformValue(TransformDirection.JSON_TO_XML, numberTransformer);
  
  // Step 1: Convert XML to JSON with transformations
  console.log("Step 1: Converting XML to JSON with transformations...\n");
  const json = xjx.xmlToJson(xml);
  
  // Print the transformed JSON
  console.log("Transformed JSON:");
  console.log(JSON.stringify(json, null, 2));
  console.log("\n------------------------------------\n");
  
  // Step 2: Convert JSON back to XML
  console.log("Step 2: Converting JSON back to XML...\n");
  const convertedXml = xjx.jsonToXml(json);
  
  // Print the transformed XML
  console.log("Converted XML:");
  console.log(convertedXml);
  
  // Demonstrate transformation effects
  console.log("\n------------------------------------\n");
  console.log("Transformation Effects:");
  
  // Extract specific values from the JSON to show transformations
  const productInfo = json.product;
  
  console.log("\nBoolean Transformer Effects:");
  console.log("- inStock:", typeof productInfo.inStock.$val, "->", productInfo.inStock.$val);
  console.log("- freeShipping:", typeof productInfo.freeShipping.$val, "->", productInfo.freeShipping.$val);
  console.log("- waterproof:", typeof productInfo.specifications.waterproof.$val, "->", productInfo.specifications.waterproof.$val);
  
  console.log("\nNumber Transformer Effects:");
  console.log("- id:", typeof productInfo.id.$val, "->", productInfo.id.$val);
  console.log("- price:", typeof productInfo.price.$val, "->", productInfo.price.$val);
  console.log("- weight:", typeof productInfo.specifications.weight.$val, "->", productInfo.specifications.weight.$val);
  console.log("- battery life:", typeof productInfo.specifications.batteryLife.$val, "->", productInfo.specifications.batteryLife.$val);
  console.log("- quality rating:", typeof productInfo.ratings.quality.$val, "->", productInfo.ratings.quality.$val);
  
  console.log("\nString Replace Transformer Effects:");
  // Extract description paragraphs to show URL transformation
  const paragraphs = productInfo.description.$children;
  
  // Find paragraphs with URLs
  paragraphs.forEach((paragraph, index) => {
    if (paragraph.$val && paragraph.$val.includes('<a href=')) {
      console.log(`- Paragraph ${index + 1}: URLs converted to HTML links`);
      console.log(`  ${paragraph.$val}`);
    }
  });
}

// Run the example
runExample();