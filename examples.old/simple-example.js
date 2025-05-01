/**
 * XJX Library Simple Examples (ES Modules version)
 * This file demonstrates basic usage of the XJX library
 */

// Import XJX from the dist directory (using the ES module version)
import { 
  XJX, 
  TransformDirection, 
  BooleanTransformer, 
  NumberTransformer 
} from '../dist/index.js';

console.log('XJX Library Example Script Loaded (ES Modules)');

// Example 1: Basic XML to JSON conversion
function example1() {
  console.group('Example 1: Basic XML to JSON Conversion');
  
  const xml = `
      <person>
          <name>John Doe</name>
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

// Example 3: Using Transformers
function example3() {
  console.group('Example 3: Using Transformers');
  
  const xml = `
      <product>
          <name>Smart Watch Pro</name>
          <price>299.99</price>
          <inStock>true</inStock>
          <features>
              <feature>Heart Rate Monitor</feature>
              <feature>GPS</feature>
              <feature>Water Resistant</feature>
          </features>
      </product>
  `;
  
  try {
      // Create a new XJX instance
      const xjx = new XJX();
      
      // Add a boolean transformer for 'inStock' field
      const booleanTransformer = new BooleanTransformer({
          paths: ['product.inStock']
      });
      
      // Add a number transformer for 'price' field
      const numberTransformer = new NumberTransformer({
          paths: ['product.price']
      });
      
      // Add transformers for XML to JSON direction
      xjx.addValueTransformer(TransformDirection.XML_TO_JSON, booleanTransformer);
      xjx.addValueTransformer(TransformDirection.XML_TO_JSON, numberTransformer);
      
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

// Example 4: Using Object to XJX format conversion
function example4() {
  console.group('Example 4: Using objectToXJX');
  
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
  
  document.getElementById('runAll').addEventListener('click', runAllExamples);
});

// Export examples so they can be used in other modules if needed
export {
  example1,
  example2,
  example3,
  example4,
  runAllExamples
};

// Run all examples by default
runAllExamples();