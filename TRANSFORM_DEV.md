# XJX Transformer Developer Guide

## Table of Contents

1. [Introduction to XJX Transformers](#1-introduction-to-xjx-transformers)
2. [Core Types and Interfaces](#2-core-types-and-interfaces)
3. [Creating Basic Transformers](#3-creating-basic-transformers)
4. [Transform Target Types](#4-transform-target-types)
5. [Transformer Best Practices](#5-transformer-best-practices)
6. [Creating Transformers with Options](#6-creating-transformers-with-options)
7. [Examples by Transform Target](#7-examples-by-transform-target)
   - [Value Transformer](#value-transformer)
   - [Attribute Transformer](#attribute-transformer)
   - [Element Transformer](#element-transformer)
   - [Text Node Transformer](#text-node-transformer)
   - [CDATA Transformer](#cdata-transformer)
   - [Comment Transformer](#comment-transformer)
8. [Creating Custom Transformers](#8-creating-custom-transformers)
9. [Advanced Techniques](#9-advanced-techniques)
   - [Composing Transformers](#composing-transformers)
   - [Conditional Transformers](#conditional-transformers)
   - [Transform Pipelines](#transform-pipelines)
   - [Named Transformers](#named-transformers)
10. [Testing Transformers](#10-testing-transformers)
11. [Common Pitfalls and Solutions](#11-common-pitfalls-and-solutions)
12. [Cookbook: Common Transformation Recipes](#12-cookbook-common-transformation-recipes)

## 1. Introduction to XJX Transformers

Transformers are the core extensibility mechanism in the XJX library. They allow you to modify XML/JSON content during conversion by:

- Converting data types (strings to booleans, numbers, etc.)
- Filtering or renaming elements and attributes
- Adding or removing nodes
- Modifying text content
- And much more

The XJX library uses a pipeline-level type checking architecture where:

1. Each transformer declares which node types it can handle
2. The pipeline filters transformers based on the current node type
3. Only applicable transformers are invoked for each node

This approach simplifies transformer implementation by eliminating redundant type checking code and focusing purely on transformation logic.

## 2. Core Types and Interfaces

### Transform Interface

```typescript
interface Transform {
  // Target types this transformer can handle
  targets: TransformTarget[];
  
  // Transform method with context
  transform(value: any, context: TransformContext): TransformResult<any>;
}
```

### TransformTarget Enum

```typescript
enum TransformTarget {
  Value = 'value',       // Primitive values (strings, numbers, booleans)
  Attribute = 'attribute', // XML attributes
  Element = 'element',   // XML elements
  Text = 'text',         // Text nodes
  CDATA = 'cdata',       // CDATA sections
  Comment = 'comment',   // XML comments
  ProcessingInstruction = 'processingInstruction', // Processing instructions
  Namespace = 'namespace' // XML namespaces
}
```

### TransformContext Interface

```typescript
interface TransformContext {
  // Node information
  nodeName: string;      // Name of the current node
  nodeType: number;      // DOM node type (element, text, etc.)
  path: string;          // Dot-notation path to current node
  
  // Type-specific flags
  isAttribute?: boolean;
  attributeName?: string;
  isText?: boolean;
  isCDATA?: boolean;
  isComment?: boolean;
  isProcessingInstruction?: boolean;
  
  // Namespace information
  namespace?: string;
  prefix?: string;
  
  // Hierarchical context
  parent?: TransformContext;
  
  // Configuration
  config: Configuration;
  
  // Direction of transformation
  direction: TransformDirection;
}
```

### TransformResult Interface

```typescript
interface TransformResult<T> {
  // The transformed value
  value: T;
  
  // Whether the node/value should be removed
  remove: boolean;
}
```

### Helper Function

```typescript
function transformResult<T>(value: T, remove: boolean = false): TransformResult<T> {
  return { value, remove };
}
```

### XNode Interface (Internal Node Representation)

```typescript
interface XNode {
  name: string;          // Element/node name
  type: number;          // DOM node type
  value?: any;           // Node value (for text, comments, etc.)
  attributes?: Record<string, any>; // Element attributes
  children?: XNode[];    // Child nodes
  namespace?: string;    // Namespace URI
  prefix?: string;       // Namespace prefix
  
  // Enhanced namespace handling
  namespaceDeclarations?: Record<string, string>;
  isDefaultNamespace?: boolean;
  parent?: XNode;        // Parent node reference
}
```

## 3. Creating Basic Transformers

### Minimal Transformer Template

```typescript
import { 
  Transform, 
  TransformContext, 
  TransformResult, 
  TransformTarget, 
  transformResult 
} from '../../core/types/transform-interfaces';

export class MyTransform implements Transform {
  // Specify which node types this transformer targets
  targets = [TransformTarget.Value];
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Skip non-applicable values
    if (typeof value !== 'string') {
      return transformResult(value);
    }
    
    // Apply transformation logic
    const transformedValue = value.toUpperCase();
    
    // Return the transformed value
    return transformResult(transformedValue);
  }
}
```

### Using Your Transformer

```typescript
import { XJX } from '../../core/XJX';
import { MyTransform } from './my-transform';

// Use the transformer in the XJX fluent API
const result = XJX.fromXml(xmlString)
  .withTransforms(new MyTransform())
  .toJson();
```

## 4. Transform Target Types

The `targets` property specifies which node types your transformer handles. The pipeline will only invoke your transformer for matching node types.

### TransformTarget.Value

Targets primitive values (strings, numbers, booleans). Use for:
- Converting data types (strings to numbers, booleans, etc.)
- Formatting primitive values
- Validating primitive values

```typescript
targets = [TransformTarget.Value];
```

### TransformTarget.Attribute

Targets XML attribute name-value pairs. Use for:
- Renaming attributes
- Removing attributes
- Filtering attributes
- Transforming attribute values

```typescript
targets = [TransformTarget.Attribute];
```

### TransformTarget.Element

Targets XML elements. Use for:
- Renaming elements
- Filtering elements or their children
- Adding new children
- Structural transformations

```typescript
targets = [TransformTarget.Element];
```

### TransformTarget.Text

Targets XML text nodes specifically. Use for:
- Formatting text content
- Filtering text nodes
- Special handling of text nodes

```typescript
targets = [TransformTarget.Text];
```

### TransformTarget.CDATA

Targets CDATA sections. Use for:
- Processing CDATA content
- Converting CDATA to text nodes or vice versa

```typescript
targets = [TransformTarget.CDATA];
```

### TransformTarget.Comment

Targets XML comments. Use for:
- Removing or filtering comments
- Processing comment content
- Converting comments to other node types

```typescript
targets = [TransformTarget.Comment];
```

### TransformTarget.ProcessingInstruction

Targets XML processing instructions. Use for:
- Filtering processing instructions
- Modifying processing instruction content

```typescript
targets = [TransformTarget.ProcessingInstruction];
```

### TransformTarget.Namespace

Targets XML namespace declarations. Use for:
- Modifying namespace URIs
- Filtering namespaces

```typescript
targets = [TransformTarget.Namespace];
```

### Multiple Targets

A transformer can target multiple node types:

```typescript
targets = [
  TransformTarget.Value,
  TransformTarget.Text,
  TransformTarget.CDATA
];
```

## 5. Transformer Best Practices

### 1. Single Responsibility Principle

Each transformer should focus on one specific transformation concern.

```typescript
// Good: Focused transformer
class TrimTransform implements Transform {
  targets = [TransformTarget.Value];
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    if (typeof value !== 'string') {
      return transformResult(value);
    }
    return transformResult(value.trim());
  }
}
```

### 2. Maintain Immutability

Don't modify input values; return new values instead.

```typescript
// Good: Maintains immutability
transform(node: XNode, context: TransformContext): TransformResult<XNode> {
  // Deep clone the node to avoid modifying the original
  const result = this.deepClone(node);
  
  // Modify the clone
  result.name = 'new-name';
  
  return transformResult(result);
}

private deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
```

### 3. Check Types Before Transforming

Always verify value types before applying transformations.

```typescript
transform(value: any, context: TransformContext): TransformResult<any> {
  // Skip non-string values
  if (typeof value !== 'string') {
    return transformResult(value);
  }
  
  // Now safely transform the string
  return transformResult(value.toUpperCase());
}
```

### 4. Use Consistent Return Format

Always use the `transformResult` helper to ensure consistent results.

```typescript
// Good: Proper result format
return transformResult(transformedValue, shouldRemove);
```

### 5. Implement Proper Node Removal

To remove a node, return a result with `remove: true`.

```typescript
// Remove elements matching a condition
if (node.name === 'secret') {
  return transformResult(node, true); // Mark for removal
}
```

### 6. Document Your Transformers

Provide clear documentation for your transformers, including:
- Purpose
- Target types
- Options
- Example usage

```typescript
/**
 * BooleanTransform - Converts string values to booleans
 * 
 * Example usage:
 * ```
 * XJX.fromXml(xml)
 *    .withTransforms(new BooleanTransform({
 *      trueValues: ['true', 'yes', '1', 'on', 'active'],
 *      falseValues: ['false', 'no', '0', 'off', 'inactive']
 *    }))
 *    .toJson();
 * ```
 */
export class BooleanTransform implements Transform {
  // Implementation...
}
```

### 7. Use Type Guards for Safety

Use TypeScript type guards for better type safety.

```typescript
transform(value: any, context: TransformContext): TransformResult<any> {
  // Type guard for XNode
  if (isXNode(value)) {
    // Safely handle XNode
  }
  
  return transformResult(value);
}

// Type guard function
function isXNode(value: any): value is XNode {
  return value && 
    typeof value === 'object' && 
    typeof value.name === 'string' && 
    typeof value.type === 'number';
}
```

### 8. Keep Transformers Stateless When Possible

Prefer stateless transformers for better testability and predictability.

```typescript
// Good: Stateless transformer with options
class StringTransform implements Transform {
  targets = [TransformTarget.Value];
  
  constructor(private options: StringTransformOptions) {}
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Transform based on options, not internal state
    return transformResult(transformedValue);
  }
}
```

## 6. Creating Transformers with Options

### Step 1: Define Options Interface

```typescript
export interface TextTransformOptions {
  /**
   * Whether to trim whitespace (default: false)
   */
  trim?: boolean;
  
  /**
   * Whether to normalize whitespace (default: false)
   * Replaces multiple whitespace characters with a single space
   */
  normalizeWhitespace?: boolean;
  
  /**
   * Function to transform text content
   */
  transformFn?: (text: string) => string;
}
```

### Step 2: Initialize Options in Constructor

```typescript
export class TextTransform implements Transform {
  targets = [TransformTarget.Text, TransformTarget.Value];
  
  private trim: boolean;
  private normalizeWhitespace: boolean;
  private transformFn?: (text: string) => string;
  
  constructor(options: TextTransformOptions = {}) {
    // Use defaults for missing options
    this.trim = options.trim || false;
    this.normalizeWhitespace = options.normalizeWhitespace || false;
    this.transformFn = options.transformFn;
  }
  
  // Implementation...
}
```

### Step 3: Apply Options in Transform Method

```typescript
transform(value: any, context: TransformContext): TransformResult<any> {
  if (typeof value !== 'string') {
    return transformResult(value);
  }
  
  let result = value;
  
  // Apply trim if enabled
  if (this.trim) {
    result = result.trim();
  }
  
  // Apply whitespace normalization if enabled
  if (this.normalizeWhitespace) {
    result = result.replace(/\s+/g, ' ');
  }
  
  // Apply custom transform function if provided
  if (this.transformFn) {
    result = this.transformFn(result);
  }
  
  return transformResult(result);
}
```

### Step 4: Use the Transformer with Options

```typescript
// With default options
const defaultTransform = new TextTransform();

// With custom options
const customTransform = new TextTransform({
  trim: true,
  normalizeWhitespace: true,
  transformFn: (text) => text.toUpperCase()
});

// Use in XJX pipeline
const result = XJX.fromXml(xml)
  .withTransforms(customTransform)
  .toJson();
```

## 7. Examples by Transform Target

### Value Transformer

```typescript
/**
 * BooleanTransform - Converts string values to booleans
 */
export class BooleanTransform implements Transform {
  // Target value transformations
  targets = [TransformTarget.Value];
  
  private trueValues: string[];
  private falseValues: string[];
  private ignoreCase: boolean;
  
  constructor(options: BooleanTransformOptions = {}) {
    this.trueValues = options.trueValues || ['true', 'yes', '1', 'on'];
    this.falseValues = options.falseValues || ['false', 'no', '0', 'off'];
    this.ignoreCase = options.ignoreCase !== false; // Default to true
  }
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Already a boolean, return as is
    if (typeof value === 'boolean') {
      return transformResult(value);
    }
    
    // Skip non-string values
    if (typeof value !== 'string') {
      return transformResult(value);
    }
    
    // Convert to string for comparison
    const strValue = String(value);
    
    // Check for true values
    for (const trueVal of this.trueValues) {
      if (this.compareValues(strValue, trueVal)) {
        return transformResult(true);
      }
    }
    
    // Check for false values
    for (const falseVal of this.falseValues) {
      if (this.compareValues(strValue, falseVal)) {
        return transformResult(false);
      }
    }
    
    // No match, return original value
    return transformResult(value);
  }
  
  private compareValues(a: string, b: string): boolean {
    if (this.ignoreCase) {
      return a.toLowerCase() === b.toLowerCase();
    }
    return a === b;
  }
}
```

### Attribute Transformer

```typescript
/**
 * AttributeTransform - Transforms XML attributes
 */
export class AttributeTransform implements Transform {
  // Target attributes
  targets = [TransformTarget.Attribute];
  
  private renameMap: Record<string, string>;
  private removeAttributes: Set<string>;
  private removePattern?: RegExp;
  
  constructor(options: AttributeTransformOptions = {}) {
    this.renameMap = options.renameMap || {};
    this.removeAttributes = new Set(options.removeAttributes || []);
    this.removePattern = options.removePattern;
  }
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Ensure we have an attribute name from context
    if (!context.attributeName) {
      return transformResult(value);
    }
    
    const attributeName = context.attributeName;
    
    // Check if attribute should be removed by name
    if (this.removeAttributes.has(attributeName)) {
      return transformResult(null, true);
    }
    
    // Check if attribute should be removed by pattern
    if (this.removePattern && this.removePattern.test(attributeName)) {
      return transformResult(null, true);
    }
    
    // Check if attribute should be renamed
    const newName = this.renameMap[attributeName];
    if (newName) {
      // For attribute transformers, we need to handle [name, value] tuples
      if (Array.isArray(value) && value.length === 2) {
        return transformResult([newName, value[1]]);
      }
      
      // If we're just processing the attribute name itself
      return transformResult([newName, value]);
    }
    
    // No changes needed
    return transformResult(value);
  }
}
```

### Element Transformer

```typescript
/**
 * ElementTransform - Transforms XML elements
 */
export class ElementTransform implements Transform {
  // Target elements
  targets = [TransformTarget.Element];
  
  private filter?: (node: XNode, context: TransformContext) => boolean;
  private renameMap?: Record<string, string>;
  private filterChildren?: (node: XNode, context: TransformContext) => boolean;
  private addChildren?: (parentNode: XNode, context: TransformContext) => XNode[];
  
  constructor(options: ElementTransformOptions = {}) {
    this.filter = options.filter;
    this.renameMap = options.renameMap;
    this.filterChildren = options.filterChildren;
    this.addChildren = options.addChildren;
  }
  
  transform(node: XNode, context: TransformContext): TransformResult<XNode> {
    // Skip if filter is provided and returns false
    if (this.filter && !this.filter(node, context)) {
      return transformResult(node);
    }
    
    // Deep clone the node to avoid modifying the original
    const result = this.deepClone(node);
    
    // Rename element if needed
    if (this.renameMap && this.renameMap[result.name]) {
      result.name = this.renameMap[result.name];
    }
    
    // Filter children if a filter function is provided and children exist
    if (this.filterChildren && result.children && result.children.length > 0) {
      result.children = result.children.filter(child => {
        const childContext: TransformContext = {
          nodeName: child.name,
          nodeType: child.type,
          namespace: child.namespace,
          prefix: child.prefix,
          path: `${context.path}.${child.name}`,
          config: context.config,
          direction: context.direction,
          parent: context
        };
        
        return this.filterChildren!(child, childContext);
      });
    }
    
    // Add children if an add function is provided
    if (this.addChildren) {
      const newChildren = this.addChildren(result, context);
      
      if (newChildren && newChildren.length > 0) {
        // Ensure children array exists
        if (!result.children) {
          result.children = [];
        }
        
        // Set parent reference for each new child
        newChildren.forEach(child => {
          child.parent = result;
        });
        
        // Add the new children
        result.children.push(...newChildren);
      }
    }
    
    return transformResult(result);
  }
  
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}
```

### Text Node Transformer

```typescript
/**
 * TextTransform - Transforms text nodes
 */
export class TextTransform implements Transform {
  // Target text nodes specifically
  targets = [TransformTarget.Text];
  
  private trim: boolean;
  private normalizeWhitespace: boolean;
  private transformFn?: (text: string) => string;
  
  constructor(options: TextTransformOptions = {}) {
    this.trim = options.trim || false;
    this.normalizeWhitespace = options.normalizeWhitespace || false;
    this.transformFn = options.transformFn;
  }
  
  transform(node: any, context: TransformContext): TransformResult<any> {
    // Handle both node object and direct string value
    let text: string;
    const isNodeObject = typeof node === 'object' && node !== null;
    
    if (isNodeObject && node.value !== undefined) {
      text = String(node.value);
    } else if (typeof node === 'string') {
      text = node;
    } else {
      // Not a text node or string, return unchanged
      return transformResult(node);
    }
    
    // Apply transformations
    let result = text;
    
    if (this.trim) {
      result = result.trim();
    }
    
    if (this.normalizeWhitespace) {
      // Replace sequences of whitespace with a single space
      result = result.replace(/\s+/g, ' ');
    }
    
    // Apply custom transform function
    if (this.transformFn) {
      result = this.transformFn(result);
    }
    
    // Return transformed text in the same format as input
    if (isNodeObject) {
      const newNode = { ...node, value: result };
      return transformResult(newNode);
    } else {
      return transformResult(result);
    }
  }
}
```

### CDATA Transformer

```typescript
/**
 * CDATATransform - Transforms CDATA sections
 */
export class CDATATransform implements Transform {
  // Target CDATA sections
  targets = [TransformTarget.CDATA];
  
  private transformFn?: (text: string) => string;
  private convertToText: boolean;
  
  constructor(options: CDATATransformOptions = {}) {
    this.transformFn = options.transformFn;
    this.convertToText = options.convertToText || false;
  }
  
  transform(node: any, context: TransformContext): TransformResult<any> {
    // Ensure it's a CDATA node
    if (!context.isCDATA) {
      return transformResult(node);
    }
    
    // Extract CDATA content
    const content = typeof node === 'object' && node.value !== undefined
      ? String(node.value)
      : String(node);
    
    // Apply transformation function if provided
    let transformedContent = content;
    if (this.transformFn) {
      transformedContent = this.transformFn(content);
    }
    
    // Convert to text node if requested
    if (this.convertToText) {
      // Create a text node instead of CDATA
      return transformResult({
        name: '#text',
        type: 3, // Text node type
        value: transformedContent,
        parent: typeof node === 'object' && node.parent ? node.parent : undefined
      });
    }
    
    // Update the CDATA content
    if (typeof node === 'object') {
      return transformResult({ ...node, value: transformedContent });
    } else {
      return transformResult(transformedContent);
    }
  }
}
```

### Comment Transformer

```typescript
/**
 * CommentTransform - Handles XML comments
 */
export class CommentTransform implements Transform {
  // Target comments
  targets = [TransformTarget.Comment];
  
  private removeAll: boolean;
  private removePattern?: RegExp;
  private keepPattern?: RegExp;
  private transformFn?: (text: string) => string;
  
  constructor(options: CommentTransformOptions = {}) {
    this.removeAll = options.removeAll || false;
    this.removePattern = options.removePattern;
    this.keepPattern = options.keepPattern;
    this.transformFn = options.transformFn;
  }
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Get comment content
    const commentValue = typeof value === 'object' && value.value 
      ? value.value 
      : String(value);
    
    // Check if comment should be kept based on keepPattern
    if (this.keepPattern && this.keepPattern.test(commentValue)) {
      // Apply transformation if provided
      if (this.transformFn) {
        const transformedValue = this.transformFn(commentValue);
        
        if (typeof value === 'object') {
          return transformResult({ ...value, value: transformedValue });
        } else {
          return transformResult(transformedValue);
        }
      }
      
      return transformResult(value);
    }
    
    // Check if comment should be removed based on removeAll or removePattern
    if (this.removeAll || (this.removePattern && this.removePattern.test(commentValue))) {
      return transformResult(null, true);
    }
    
    // Apply transformation if provided
    if (this.transformFn) {
      const transformedValue = this.transformFn(commentValue);
      
      if (typeof value === 'object') {
        return transformResult({ ...value, value: transformedValue });
      } else {
        return transformResult(transformedValue);
      }
    }
    
    // Default case: keep the comment unchanged
    return transformResult(value);
  }
}
```

## 8. Creating Custom Transformers

### Custom Transformer Template

```typescript
/**
 * Custom transformer template
 */
export class CustomTransform implements Transform {
  // Specify which node types to target
  targets = [TransformTarget.Value]; // Modify as needed
  
  constructor(private options: CustomTransformOptions = {}) {
    // Initialize options
  }
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Skip non-applicable types
    if (/* type check condition */) {
      return transformResult(value);
    }
    
    // Apply custom transformation logic
    const transformedValue = /* your transformation logic */;
    
    // Return transformed value
    return transformResult(transformedValue);
  }
}
```

### Example: URL Linkifier

```typescript
/**
 * URLLinkifierTransform - Converts URLs in text to HTML links
 */
export class URLLinkifierTransform implements Transform {
  targets = [TransformTarget.Value, TransformTarget.Text];
  
  // URL regex pattern
  private urlPattern = /(https?:\/\/[^\s]+)/g;
  private targetElements: string[];
  
  constructor(options: URLLinkifierOptions = {}) {
    this.targetElements = options.targetElements || ['description', 'content', 'text'];
  }
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Only process strings
    if (typeof value !== 'string') {
      return transformResult(value);
    }
    
    // Only process specific elements if specified
    if (context.parent && 
        context.parent.nodeName && 
        this.targetElements.length > 0 && 
        !this.targetElements.includes(context.parent.nodeName)) {
      return transformResult(value);
    }
    
    // Replace URLs with HTML links
    const transformedValue = value.replace(
      this.urlPattern, 
      '<a href="$1">$1</a>'
    );
    
    return transformResult(transformedValue);
  }
}
```

### Example: Date Formatter

```typescript
/**
 * DateFormatterTransform - Formats dates in specific format
 */
export class DateFormatterTransform implements Transform {
  targets = [TransformTarget.Value];
  
  private datePattern: RegExp;
  private outputFormat: string;
  private targetElements: string[];
  
  constructor(options: DateFormatterOptions = {}) {
    this.datePattern = options.datePattern || 
      /\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?/g;
    this.outputFormat = options.outputFormat || 'MMMM D, YYYY';
    this.targetElements = options.targetElements || ['date', 'publishDate', 'created'];
  }
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Only process strings
    if (typeof value !== 'string') {
      return transformResult(value);
    }
    
    // Only process specific elements if specified
    if (context.parent && 
        context.parent.nodeName && 
        this.targetElements.length > 0 && 
        !this.targetElements.includes(context.parent.nodeName)) {
      return transformResult(value);
    }
    
    // If value matches date pattern, format it
    if (this.datePattern.test(value)) {
      try {
        // Note: In a real implementation, you'd use a date library like date-fns
        // or moment.js to format the date correctly.
        const date = new Date(value);
        const formattedDate = this.formatDate(date, this.outputFormat);
        return transformResult(formattedDate);
      } catch {
        // Not a valid date, return original
        return transformResult(value);
      }
    }
    
    return transformResult(value);
  }
  
  // Simple date formatter (in a real implementation, use a library)
  private formatDate(date: Date, format: string): string {
    // This is a very simplified implementation
    const month = date.toLocaleString('default', { month: 'long' });
    const day = date.getDate();
    const year = date.getFullYear();
    
    return `${month} ${day}, ${year}`;
  }
}
```

## 9. Advanced Techniques

### Composing Transformers

The `TransformUtils` class provides a `composeTransforms` method to combine multiple transformers into one.

```typescript
import { TransformUtils } from '../fluent/utils/transform-utils';
import { BooleanTransform } from './boolean-transform';
import { NumberTransform } from './number-transform';

// Create individual transforms
const booleanTransform = new BooleanTransform();
const numberTransform = new NumberTransform();

// Compose them into a single transform
const dataTypeTransform = TransformUtils.composeTransforms(
  booleanTransform,
  numberTransform
);

// Use the composed transform
const result = XJX.fromXml(xml)
  .withTransforms(dataTypeTransform)
  .toJson();
```

### Conditional Transformers

The `TransformUtils` class provides a `conditionalTransform` method to create transforms that only apply when certain conditions are met.

```typescript
import { TransformUtils } from '../fluent/utils/transform-utils';
import { ElementTransform } from './element-transform';
import { NodeType } from '../core/types/dom-types';

// Create a transform that only applies to "user" elements
const userElementTransform = TransformUtils.conditionalTransform(
  (node, context) => node.name === 'user',
  new ElementTransform({
    addChildren: (parent) => [{
      name: 'timestamp',
      type: NodeType.ELEMENT_NODE,
      value: new Date().toISOString(),
      parent: parent
    }]
  })
);

// Use the conditional transform
const result = XJX.fromXml(xml)
  .withTransforms(userElementTransform)
  .toJson();
```

### Transform Pipelines

The XJX fluent API allows you to chain multiple transformers in a pipeline:

```typescript
// Create a pipeline of transforms
const result = XJX.fromXml(xml)
  .withTransforms(
    // First, transform data types
    new BooleanTransform(),
    new NumberTransform(),
    
    // Then, filter sensitive data
    new ElementTransform({
      filterChildren: node => node.name !== 'password'
    }),
    
    // Add metadata
    new ElementTransform({
      filter: node => node.name === 'user',
      addChildren: parent => [{
        name: 'processedAt',
        type: NodeType.ELEMENT_NODE,
        value: new Date().toISOString(),
        parent: parent
      }]
    }),
    
    // Format text content
    new TextTransform({
      trim: true,
      normalizeWhitespace: true
    })
  )
  .toJson();
```

### Named Transformers

The `TransformUtils` class provides a `namedTransform` method to create named transforms for better debugging.

```typescript
import { TransformUtils } from '../fluent/utils/transform-utils';
import { BooleanTransform } from './boolean-transform';

// Create a named transform
const boolTransform = TransformUtils.namedTransform(
  'BooleanTransformer',
  new BooleanTransform()
);

// Use the named transform
const result = XJX.fromXml(xml)
  .withTransforms(boolTransform)
  .toJson();
```

## 10. Testing Transformers

### Unit Testing Value Transformers

```typescript
import { BooleanTransform } from '../transforms/boolean-transform';
import { TransformDirection, TransformContext, Configuration } from '../types/transform-interfaces';

describe('BooleanTransform', () => {
  let transform: BooleanTransform;
  let context: TransformContext;
  
  beforeEach(() => {
    transform = new BooleanTransform();
    context = {
      nodeName: 'test',
      nodeType: 1,
      path: 'test',
      config: {} as Configuration,
      direction: TransformDirection.XML_TO_JSON
    };
  });
  
  it('should convert "true" to boolean true', () => {
    const result = transform.transform('true', context);
    expect(result.value).toBe(true);
    expect(result.remove).toBeFalsy();
  });
  
  it('should convert "yes" to boolean true', () => {
    const result = transform.transform('yes', context);
    expect(result.value).toBe(true);
  });
  
  it('should convert "false" to boolean false', () => {
    const result = transform.transform('false', context);
    expect(result.value).toBe(false);
  });
  
  it('should not convert values that don\'t match patterns', () => {
    const result = transform.transform('something else', context);
    expect(result.value).toBe('something else');
  });
  
  it('should handle non-string values', () => {
    const result = transform.transform(123, context);
    expect(result.value).toBe(123);
  });
});
```

### Unit Testing Element Transformers

```typescript
import { ElementTransform } from '../transforms/element-transform';
import { TransformDirection, TransformContext, Configuration, XNode } from '../types/transform-interfaces';
import { NodeType } from '../types/dom-types';

describe('ElementTransform', () => {
  let context: TransformContext;
  
  beforeEach(() => {
    context = {
      nodeName: 'test',
      nodeType: NodeType.ELEMENT_NODE,
      path: 'test',
      config: {} as Configuration,
      direction: TransformDirection.XML_TO_JSON
    };
  });
  
  it('should rename elements', () => {
    const transform = new ElementTransform({
      renameMap: { 'oldName': 'newName' }
    });
    
    const node: XNode = {
      name: 'oldName',
      type: NodeType.ELEMENT_NODE
    };
    
    const result = transform.transform(node, context);
    
    expect(result.value.name).toBe('newName');
    expect(result.remove).toBeFalsy();
  });
  
  it('should add children', () => {
    const transform = new ElementTransform({
      addChildren: (parent) => [{
        name: 'child',
        type: NodeType.ELEMENT_NODE,
        value: 'test',
        parent: parent
      }]
    });
    
    const node: XNode = {
      name: 'parent',
      type: NodeType.ELEMENT_NODE
    };
    
    const result = transform.transform(node, context);
    
    expect(result.value.children).toBeDefined();
    expect(result.value.children?.length).toBe(1);
    expect(result.value.children?.[0].name).toBe('child');
  });
  
  it('should filter children', () => {
    const transform = new ElementTransform({
      filterChildren: (child) => child.name !== 'secret'
    });
    
    const node: XNode = {
      name: 'parent',
      type: NodeType.ELEMENT_NODE,
      children: [
        { name: 'public', type: NodeType.ELEMENT_NODE },
        { name: 'secret', type: NodeType.ELEMENT_NODE }
      ]
    };
    
    const result = transform.transform(node, context);
    
    expect(result.value.children).toBeDefined();
    expect(result.value.children?.length).toBe(1);
    expect(result.value.children?.[0].name).toBe('public');
  });
});
```

### Integration Testing

```typescript
import { XJX } from '../core/XJX';
import { BooleanTransform } from '../transforms/boolean-transform';
import { NumberTransform } from '../transforms/number-transform';

describe('Transform Integration', () => {
  it('should correctly transform XML to JSON with type transformations', () => {
    const xml = `
      <root>
        <active>true</active>
        <count>42</count>
      </root>
    `;
    
    const result = XJX.fromXml(xml)
      .withTransforms(
        new BooleanTransform(),
        new NumberTransform()
      )
      .toJson();
    
    // Check for root element
    expect(result.root).toBeDefined();
    
    // Check transformed values
    expect(typeof result.root.active.$val).toBe('boolean');
    expect(result.root.active.$val).toBe(true);
    
    expect(typeof result.root.count.$val).toBe('number');
    expect(result.root.count.$val).toBe(42);
  });
  
  it('should handle round-trip conversion with transformations', () => {
    const xml = `
      <data>
        <enabled>yes</enabled>
        <value>123</value>
      </data>
    `;
    
    // XML to JSON with transforms
    const json = XJX.fromXml(xml)
      .withTransforms(
        new BooleanTransform(),
        new NumberTransform()
      )
      .toJson();
    
    // Check transformed values
    expect(typeof json.data.enabled.$val).toBe('boolean');
    expect(json.data.enabled.$val).toBe(true);
    
    expect(typeof json.data.value.$val).toBe('number');
    expect(json.data.value.$val).toBe(123);
    
    // JSON back to XML
    const resultXml = XJX.fromJson(json).toXml();
    
    // XML should preserve the transformed types
    expect(resultXml).toContain('<enabled>true</enabled>');
    expect(resultXml).toContain('<value>123</value>');
  });
});
```

## 11. Common Pitfalls and Solutions

### 1. Mutating Input Values

**Pitfall**: Modifying input objects directly can cause side effects.

**Solution**: Always clone objects before modifying them.

```typescript
// Bad: Mutating input
transform(node: XNode, context: TransformContext): TransformResult<XNode> {
  node.name = 'new-name'; // Don't modify the input directly!
  return transformResult(node);
}

// Good: Cloning first
transform(node: XNode, context: TransformContext): TransformResult<XNode> {
  const result = this.deepClone(node);
  result.name = 'new-name';
  return transformResult(result);
}
```

### 2. Ignoring Value Types

**Pitfall**: Not checking value types can lead to errors.

**Solution**: Always check types before transforming.

```typescript
// Bad: Not checking type
transform(value: any, context: TransformContext): TransformResult<any> {
  return transformResult(value.toUpperCase()); // Will crash for non-strings
}

// Good: Checking type first
transform(value: any, context: TransformContext): TransformResult<any> {
  if (typeof value !== 'string') {
    return transformResult(value);
  }
  return transformResult(value.toUpperCase());
}
```

### 3. Ignoring Context Direction

**Pitfall**: Not handling transformation direction can lead to inconsistent behavior.

**Solution**: Check the transformation direction when needed.

```typescript
transform(value: any, context: TransformContext): TransformResult<any> {
  // Different behavior based on direction
  if (context.direction === TransformDirection.XML_TO_JSON) {
    // XML to JSON transformation
    return transformResult(value.toUpperCase());
  } else {
    // JSON to XML transformation
    return transformResult(value.toLowerCase());
  }
}
```

### 4. Missing Target Types

**Pitfall**: Forgetting to specify the correct target types.

**Solution**: Always explicitly define the target types your transformer handles.

```typescript
// Bad: Missing or incorrect targets
class MyTransform implements Transform {
  // Missing targets property!
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Transform logic
  }
}

// Good: Properly specified targets
class MyTransform implements Transform {
  targets = [TransformTarget.Value];
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Transform logic
  }
}
```

### 5. Forgetting to Return Transform Results

**Pitfall**: Returning values directly instead of using TransformResult.

**Solution**: Always use the transformResult helper function.

```typescript
// Bad: Returning value directly
transform(value: any, context: TransformContext): TransformResult<any> {
  return value.toUpperCase(); // Wrong return type!
}

// Good: Using transformResult
transform(value: any, context: TransformContext): TransformResult<any> {
  return transformResult(value.toUpperCase());
}
```

### 6. Inefficient Deep Cloning

**Pitfall**: Using JSON.parse/stringify for deep cloning large objects.

**Solution**: Consider more efficient deep cloning approaches for large objects.

```typescript
// Simple but inefficient for large objects
private deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// More efficient for large objects
private deepClone<T>(obj: T): T {
  // For simple objects, quick return
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => this.deepClone(item)) as unknown as T;
  }
  
  // Handle objects
  const result = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key as keyof T] = this.deepClone(obj[key as keyof T]);
    }
  }
  
  return result;
}
```

### 7. Ignoring Error Handling

**Pitfall**: Not handling potential errors in transformers.

**Solution**: Add proper error handling.

```typescript
transform(value: any, context: TransformContext): TransformResult<any> {
  try {
    // Transformation logic that might throw
    const result = JSON.parse(value);
    return transformResult(result);
  } catch (error) {
    // Handle error gracefully
    console.warn(`Transform error for ${context.path}: ${error}`);
    return transformResult(value); // Return original value on error
  }
}
```

## 12. Cookbook: Common Transformation Recipes

### Converting String Values to Numbers

```typescript
export class NumberTransform implements Transform {
  targets = [TransformTarget.Value];
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    if (typeof value !== 'string') {
      return transformResult(value);
    }
    
    const num = Number(value);
    if (!isNaN(num)) {
      return transformResult(num);
    }
    
    return transformResult(value);
  }
}
```

### Converting String Values to Booleans

```typescript
export class BooleanTransform implements Transform {
  targets = [TransformTarget.Value];
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    if (typeof value !== 'string') {
      return transformResult(value);
    }
    
    const str = value.toLowerCase();
    
    if (str === 'true' || str === 'yes' || str === '1') {
      return transformResult(true);
    }
    
    if (str === 'false' || str === 'no' || str === '0') {
      return transformResult(false);
    }
    
    return transformResult(value);
  }
}
```

### Adding a Creation Timestamp to Elements

```typescript
export class TimestampTransform implements Transform {
  targets = [TransformTarget.Element];
  
  constructor(private options = { elementName: 'timestamp' }) {}
  
  transform(node: XNode, context: TransformContext): TransformResult<XNode> {
    const result = this.deepClone(node);
    
    if (!result.children) {
      result.children = [];
    }
    
    result.children.push({
      name: this.options.elementName,
      type: NodeType.ELEMENT_NODE,
      value: new Date().toISOString(),
      parent: result
    });
    
    return transformResult(result);
  }
  
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}
```

### Filtering Out Sensitive Data

```typescript
export class SensitiveDataFilterTransform implements Transform {
  targets = [TransformTarget.Element, TransformTarget.Attribute];
  
  constructor(private options = { 
    sensitiveElements: ['password', 'creditCard', 'ssn'],
    sensitiveAttributes: ['secret', 'password', 'token']
  }) {}
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Handle attributes
    if (context.isAttribute && context.attributeName) {
      if (this.options.sensitiveAttributes.includes(context.attributeName)) {
        return transformResult(null, true); // Remove the attribute
      }
    }
    
    // Handle elements
    if (!context.isAttribute && typeof value === 'object' && value.name) {
      if (this.options.sensitiveElements.includes(value.name)) {
        return transformResult(null, true); // Remove the element
      }
    }
    
    return transformResult(value);
  }
}
```

### Normalizing Text Content

```typescript
export class TextNormalizerTransform implements Transform {
  targets = [TransformTarget.Text, TransformTarget.Value];
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    if (typeof value !== 'string') {
      return transformResult(value);
    }
    
    // Trim whitespace
    let result = value.trim();
    
    // Normalize whitespace
    result = result.replace(/\s+/g, ' ');
    
    // Normalize line endings
    result = result.replace(/\r\n/g, '\n');
    
    return transformResult(result);
  }
}
```

### Renaming Elements and Attributes

```typescript
export class RenameTransform implements Transform {
  targets = [TransformTarget.Element, TransformTarget.Attribute];
  
  constructor(private options = {
    elementRenameMap: {} as Record<string, string>,
    attributeRenameMap: {} as Record<string, string>
  }) {}
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Handle attributes
    if (context.isAttribute && context.attributeName) {
      const newName = this.options.attributeRenameMap[context.attributeName];
      if (newName) {
        if (Array.isArray(value) && value.length === 2) {
          return transformResult([newName, value[1]]);
        }
        return transformResult([newName, value]);
      }
    }
    
    // Handle elements
    if (!context.isAttribute && typeof value === 'object' && value.name) {
      const newName = this.options.elementRenameMap[value.name];
      if (newName) {
        return transformResult({
          ...value,
          name: newName
        });
      }
    }
    
    return transformResult(value);
  }
}
```

### Case Transformer (camelCase, snake_case, etc.)

```typescript
export class CaseTransform implements Transform {
  targets = [TransformTarget.Element, TransformTarget.Attribute];
  
  constructor(private options = { 
    caseStyle: 'camel', // 'camel', 'snake', 'kebab', 'pascal'
    applyToElements: true,
    applyToAttributes: true
  }) {}
  
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Handle attributes
    if (context.isAttribute && context.attributeName && this.options.applyToAttributes) {
      const newName = this.transformCase(context.attributeName);
      
      if (Array.isArray(value) && value.length === 2) {
        return transformResult([newName, value[1]]);
      }
      return transformResult([newName, value]);
    }
    
    // Handle elements
    if (!context.isAttribute && typeof value === 'object' && value.name && this.options.applyToElements) {
      return transformResult({
        ...value,
        name: this.transformCase(value.name)
      });
    }
    
    return transformResult(value);
  }
  
  private transformCase(name: string): string {
    switch (this.options.caseStyle) {
      case 'camel':
        return this.toCamelCase(name);
      case 'snake':
        return this.toSnakeCase(name);
      case 'kebab':
        return this.toKebabCase(name);
      case 'pascal':
        return this.toPascalCase(name);
      default:
        return name;
    }
  }
  
  private toCamelCase(str: string): string {
    return str.replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
              .replace(/^\w/, c => c.toLowerCase());
  }
  
  private toSnakeCase(str: string): string {
    return str.replace(/([A-Z])/g, '_$1')
              .replace(/[-\s]/g, '_')
              .toLowerCase()
              .replace(/^_/, '');
  }
  
  private toKebabCase(str: string): string {
    return str.replace(/([A-Z])/g, '-$1')
              .replace(/[_\s]/g, '-')
              .toLowerCase()
              .replace(/^-/, '');
  }
  
  private toPascalCase(str: string): string {
    return str.replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
              .replace(/^\w/, c => c.toUpperCase());
  }
}
```

---

This guide should help you create effective, efficient transformers for the XJX library. Remember to follow the best practices and leverage the pipeline-level type checking architecture to create clean, focused transformers.