// Basic usage with standard transforms
import { XJX } from './XJX';
import { BooleanTransform } from './transforms/boolean-transform';
import { NumberTransform } from './transforms/number-transform';

// XML with mixed types
const xml = `
<data>
  <boolean>true</boolean>
  <number>42.5</number>
  <mixed>
    <item>true</item>
    <item>false</item>
    <item>100</item>
  </mixed>
</data>
`;

// Convert all applicable values to their proper types
const result = XJX.fromXml(xml)
  .withTransforms(
    new BooleanTransform(),
    new NumberTransform()
  )
  .toJson();

console.log(result);
/* Output:
{
  "data": {
    "boolean": true,
    "number": 42.5,
    "mixed": {
      "item": [true, false, 100]
    }
  }
}
*/

// Convert back to XML
const regeneratedXml = XJX.fromJson(result)
  .withTransforms(
    new BooleanTransform(),
    new NumberTransform()
  )
  .toXml();

console.log(regeneratedXml);
/* Output:
<data>
  <boolean>true</boolean>
  <number>42.5</number>
  <mixed>
    <item>true</item>
    <item>false</item>
    <item>100</item>
  </mixed>
</data>
*/

// Using helper functions for format-specific transforms
import { 
  createBidirectionalTransform, 
  createFormatAwareTransform,
  forJson,
  forXml
} from './transforms/helpers';
import { TransformTarget, FORMATS, createTransformResult } from './core/types/transform-interfaces';

// Create a transform that only applies when converting to JSON
const emailLinkTransform = forJson({
  targets: [TransformTarget.Value],
  transform(value, context) {
    if (typeof value === 'string' && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
      return createTransformResult(`mailto:${value}`);
    }
    return createTransformResult(value);
  }
});

// Create a bidirectional transform using the helper
const dateTransform = createBidirectionalTransform(
  [TransformTarget.Value],
  
  // To JSON: Convert ISO date strings to Date objects
  (value, context) => {
    if (typeof value === 'string' && 
        /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/.test(value)) {
      return createTransformResult(new Date(value));
    }
    return createTransformResult(value);
  },
  
  // To XML: Convert Date objects to ISO date strings
  (value, context) => {
    if (value instanceof Date) {
      return createTransformResult(value.toISOString());
    }
    return createTransformResult(value);
  }
);

// Create a transform that handles multiple formats
const caseTransform = createFormatAwareTransform(
  [TransformTarget.Value],
  {
    [FORMATS.JSON]: (value, context) => {
      // To JSON: Convert keys to camelCase
      if (typeof value === 'string' && context.isAttribute) {
        return createTransformResult(value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()));
      }
      return createTransformResult(value);
    },
    
    [FORMATS.XML]: (value, context) => {
      // To XML: Convert keys to kebab-case
      if (typeof value === 'string' && context.isAttribute) {
        return createTransformResult(value.replace(/([A-Z])/g, '-$1').toLowerCase());
      }
      return createTransformResult(value);
    },
    
    // Can add handlers for additional formats
    'yaml': (value, context) => {
      // YAML-specific transformation
      return createTransformResult(value);
    }
  }
);

// Using format-aware transforms
const userXml = `
<user>
  <name>John Smith</name>
  <email>john@example.com</email>
  <registered-date>2023-05-20T14:30:00Z</registered-date>
  <settings data-format="json" max-items="10"></settings>
</user>
`;

const user = XJX.fromXml(userXml)
  .withTransforms(
    emailLinkTransform,   // Only applies for JSON output
    dateTransform,        // Bidirectional transform
    caseTransform         // Format-aware transform
  )
  .toJson();

console.log(user);
/* Output:
{
  "user": {
    "name": "John Smith",
    "email": "mailto:john@example.com",
    "registeredDate": "2023-05-20T14:30:00.000Z",  // Date object (serialized for display)
    "settings": {
      "$attr": {
        "dataFormat": "json",  // camelCase
        "maxItems": "10"       // camelCase
      }
    }
  }
}
*/

// Creating a custom transform using the target format
import { RegexTransform } from './transforms/regex-transform';

// Format-specific regex replacements
const xmlEnhancer = new RegexTransform({
  pattern: /<(\w+)>/g,
  replacement: '<$1 xmlns="http://example.com">',
  format: FORMATS.XML  // Only apply when converting to XML
});

const result2 = XJX.fromJson(user)
  .withTransforms(
    dateTransform,
    caseTransform,
    xmlEnhancer
  )
  .toXml();

console.log(result2);
/* Output:
<user xmlns="http://example.com">
  <name>John Smith</name>
  <email>john@example.com</email>
  <registered-date>2023-05-20T14:30:00Z</registered-date>
  <settings data-format="json" max-items="10"></settings>
</user>
*/