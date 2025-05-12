// Examples of using the updated MetadataTransform
import { XJX } from './XJX';
import { MetadataTransform } from './transforms/metadata-transform';
import { FORMATS } from './core/types/transform-interfaces';

// Add general metadata to all elements
const xml = `
<document>
  <section id="intro">
    <title>Introduction</title>
    <para>This is the introduction paragraph.</para>
  </section>
  <section id="main">
    <title>Main Content</title>
    <para>First paragraph of main content.</para>
    <para>Second paragraph of main content.</para>
  </section>
</document>
`;

// Add formatting metadata to all elements
const result1 = XJX.fromXml(xml)
  .withTransforms(
    new MetadataTransform({
      applyToAll: true,
      metadata: { 
        version: '1.0',
        lastModified: new Date().toISOString()
      }
    })
  )
  .toJson();

console.log("Result with general metadata:");
console.log(JSON.stringify(result1, null, 2));
// All nodes will have version and lastModified metadata

// Using format-specific metadata
const result2 = XJX.fromXml(xml)
  .withTransforms(
    new MetadataTransform({
      selector: 'section',
      formatMetadata: [
        {
          format: FORMATS.JSON,
          metadata: { 
            jsonSchema: {
              type: 'object',
              properties: {
                title: { type: 'string', required: true },
                para: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        },
        {
          format: FORMATS.XML,
          metadata: { 
            xmlSchema: 'section.xsd',
            validation: true
          }
        }
      ]
    })
  )
  .toJson(); // Will apply the JSON-specific metadata

console.log("\nResult with format-specific metadata (JSON):");
console.log(JSON.stringify(result2, null, 2));
// Section nodes will have jsonSchema metadata

// Converting to XML would apply the XML-specific metadata instead
const result3 = XJX.fromJson(result2)
  .withTransforms(
    new MetadataTransform({
      selector: 'section',
      formatMetadata: [
        {
          format: FORMATS.JSON,
          metadata: { 
            jsonSchema: {
              type: 'object',
              properties: {
                title: { type: 'string', required: true },
                para: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        },
        {
          format: FORMATS.XML,
          metadata: { 
            xmlSchema: 'section.xsd',
            validation: true
          }
        }
      ]
    })
  )
  .toXml(); // Will apply the XML-specific metadata

// Using a RegExp selector for specific elements
const result4 = XJX.fromXml(xml)
  .withTransforms(
    new MetadataTransform({
      selector: /^para$/,
      metadata: {
        formatting: {
          indent: 2,
          wrap: true,
          maxWidth: 80
        }
      }
    })
  )
  .toJson();

console.log("\nResult with RegExp selector for paragraphs:");
console.log(JSON.stringify(result4, null, 2));
// Only para elements will have formatting metadata

// Using a custom selector function
const result5 = XJX.fromXml(xml)
  .withTransforms(
    new MetadataTransform({
      selector: (node, context) => {
        // Apply to nodes with an id attribute
        return !!node.attributes && 'id' in node.attributes;
      },
      metadata: {
        indexed: true,
        searchable: true
      }
    })
  )
  .toJson();

console.log("\nResult with custom selector function for elements with id:");
console.log(JSON.stringify(result5, null, 2));
// Only elements with an id attribute will have indexed and searchable metadata

// Removing specific metadata keys
const result6 = XJX.fromXml(xml)
  .withTransforms(
    // First add some metadata
    new MetadataTransform({
      applyToAll: true,
      metadata: { 
        temp: 'temporary data',
        permanent: 'keep this',
        debug: true
      }
    }),
    // Then remove specific keys
    new MetadataTransform({
      applyToAll: true,
      removeKeys: ['temp', 'debug']
    })
  )
  .toJson();

console.log("\nResult after removing specific metadata keys:");
console.log(JSON.stringify(result6, null, 2));
// All nodes will have permanent metadata, but temp and debug keys will be removed