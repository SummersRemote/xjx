// Simple example of using the XJX library
import { XJX } from '../dist/index.js';

// Sample XML string
const xmlString = `<?xml version="1.0" encoding="UTF-8"?>
<library xmlns:b="http://example.org/books">
  <b:book id="b1" available="true">
    <b:title>The Great Gatsby</b:title>
    <b:author>F. Scott Fitzgerald</b:author>
    <b:year>1925</b:year>
    <b:description><![CDATA[A novel set in the Jazz Age]]></b:description>
    <!-- Classic American literature -->
  </b:book>
  <b:book id="b2" available="false">
    <b:title>To Kill a Mockingbird</b:title>
    <b:author>Harper Lee</b:author>
    <b:year>1960</b:year>
    <b:description><![CDATA[Southern Gothic novel]]></b:description>
    <!-- Pulitzer Prize winner -->
  </b:book>
</library>`;

// Create an instance of XJX with default configuration
const xjx = new XJX();

// Convert XML to JSON
console.log('Converting XML to JSON...');
const jsonObj = xjx.xmlToJson(xmlString);
console.log('JSON result:');
console.log(JSON.stringify(jsonObj, null, 2));

// Using getPath to extract specific values
console.log('\nExtracting specific values using getPath:');
const bookTitle = xjx.getPath(jsonObj, 'library.book.title.$val');
console.log(`Book title: ${bookTitle}`);

const bookYear = xjx.getPath(jsonObj, 'library.book.year.$val');
console.log(`Book year: ${bookYear}`);

const bookId = xjx.getPath(jsonObj, 'library.book.$attr.id.$val');
console.log(`Book ID: ${bookId}`);

// Convert JSON back to XML
console.log('\nConverting back to XML...');
const newXml = xjx.jsonToXml(jsonObj);
console.log('XML result:');
console.log(newXml);

// Pretty print XML
console.log('\nPretty printing XML:');
const prettyXml = xjx.prettyPrintXml(xmlString);
console.log(prettyXml);

// Validate XML
console.log('\nValidating XML:');
const validationResult = xjx.validateXML(xmlString);
console.log(`XML is valid: ${validationResult.isValid}`);
if (!validationResult.isValid) {
  console.log(`Validation error: ${validationResult.message}`);
}

// Clean up when done (important for Node.js environments)
xjx.cleanup();