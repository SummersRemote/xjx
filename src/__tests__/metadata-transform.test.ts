import { MetadataTransform, MetadataTransformOptions, NodeSelector } from '../transforms/metadata-transform';
import { TransformContext, FORMAT, TransformResult, createRootContext, createChildContext } from '../core/transform';
import { XNode, createElement, createTextNode, addChild } from '../core/xnode';
import { NodeType } from '../core/dom';
import { getDefaultConfig, createConfig } from '../core/config';

describe('MetadataTransform', () => {
  let defaultConfig: ReturnType<typeof getDefaultConfig>;
  let baseRootNode: XNode;
  let baseContextJson: TransformContext;
  let baseContextXml: TransformContext;

  beforeEach(() => {
    defaultConfig = getDefaultConfig();
    baseRootNode = createElement('root');
    baseContextJson = createRootContext(FORMAT.JSON, baseRootNode, defaultConfig);
    baseContextXml = createRootContext(FORMAT.XML, baseRootNode, defaultConfig);
  });

  // Helper to get metadata from the transformed node
  const getTransformedMetadata = (originalNode: XNode, transform: MetadataTransform, context: TransformContext): Record<string, any> | undefined => {
    const result = transform.transform(originalNode, context);
    return result.value.metadata; // MetadataTransform returns the modified XNode
  };

  it('should add new metadata to a node', () => {
    const options: MetadataTransformOptions = {
      applyToRoot: true, // Apply to the node passed in context (baseRootNode)
      metadata: { key1: 'value1', 'anotherKey': 123 }
    };
    const transform = new MetadataTransform(options);
    const metadata = getTransformedMetadata(baseRootNode, transform, baseContextJson);
    
    expect(metadata).toBeDefined();
    expect(metadata!.key1).toBe('value1');
    expect(metadata!.anotherKey).toBe(123);
  });

  it('should merge new metadata with existing metadata by default (replace: false)', () => {
    baseRootNode.metadata = { existingKey: 'original', sharedKey: 'oldValue' };
    const options: MetadataTransformOptions = {
      applyToRoot: true,
      metadata: { newKey: 'newValue', sharedKey: 'mergedValue' }
      // replace is false by default
    };
    const transform = new MetadataTransform(options);
    const metadata = getTransformedMetadata(baseRootNode, transform, baseContextJson);

    expect(metadata).toBeDefined();
    expect(metadata!.existingKey).toBe('original');
    expect(metadata!.newKey).toBe('newValue');
    expect(metadata!.sharedKey).toBe('mergedValue'); // Merged, new value overwrites
  });
  
  it('should merge nested objects in metadata', () => {
    baseRootNode.metadata = { obj: { a: 1, b: 2 } };
    const options: MetadataTransformOptions = {
      applyToRoot: true,
      metadata: { obj: { b: 3, c: 4 } }
    };
    const transform = new MetadataTransform(options);
    const metadata = getTransformedMetadata(baseRootNode, transform, baseContextJson);
    expect(metadata!.obj).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('should replace existing metadata if replace is true', () => {
    baseRootNode.metadata = { existingKey: 'original', sharedKey: 'oldValue' };
    const options: MetadataTransformOptions = {
      applyToRoot: true,
      metadata: { newKey: 'newValue', sharedKey: 'replacedValue' },
      replace: true
    };
    const transform = new MetadataTransform(options);
    const metadata = getTransformedMetadata(baseRootNode, transform, baseContextJson);

    expect(metadata).toBeDefined();
    expect(metadata!.existingKey).toBeUndefined(); // Old key gone
    expect(metadata!.newKey).toBe('newValue');
    expect(metadata!.sharedKey).toBe('replacedValue');
  });

  it('should remove specified keys using removeKeys', () => {
    baseRootNode.metadata = { keyToRemove: 'gone', keyToKeep: 'stay', anotherToRemove: 'bye' };
    const options: MetadataTransformOptions = {
      applyToRoot: true,
      removeKeys: ['keyToRemove', 'anotherToRemove', 'nonExistentKey']
      // Can be combined with adding/replacing other metadata
    };
    const transform = new MetadataTransform(options);
    const metadata = getTransformedMetadata(baseRootNode, transform, baseContextJson);

    expect(metadata).toBeDefined();
    expect(metadata!.keyToRemove).toBeUndefined();
    expect(metadata!.anotherToRemove).toBeUndefined();
    expect(metadata!.keyToKeep).toBe('stay');
  });
  
  it('should remove metadata object if all keys are removed by removeKeys', () => {
    baseRootNode.metadata = { keyToRemove: 'gone' };
    const options: MetadataTransformOptions = { applyToRoot: true, removeKeys: ['keyToRemove']};
    const transform = new MetadataTransform(options);
    const resultNode = transform.transform(baseRootNode, baseContextJson).value;
    expect(resultNode.metadata).toBeUndefined();
  });

  it('should apply metadata based on string selector (node name)', () => {
    const options: MetadataTransformOptions = {
      selector: 'targetNode',
      metadata: { selected: true }
    };
    const transform = new MetadataTransform(options);
    const targetNode = createElement('targetNode');
    const nonTargetNode = createElement('otherNode');
    
    const targetMetadata = getTransformedMetadata(targetNode, transform, baseContextJson);
    expect(targetMetadata).toBeDefined();
    expect(targetMetadata!.selected).toBe(true);

    const nonTargetMetadata = getTransformedMetadata(nonTargetNode, transform, baseContextJson);
    expect(nonTargetMetadata).toBeUndefined(); // Or empty if it had metadata before
  });
  
  it('should apply metadata based on RegExp selector (node name)', () => {
    const options: MetadataTransformOptions = {
      selector: /^(target|item)Node$/,
      metadata: { regexSelected: true }
    };
    const transform = new MetadataTransform(options);
    const target1 = createElement('targetNode');
    const target2 = createElement('itemNode');
    const nonTarget = createElement('other');

    expect(getTransformedMetadata(target1, transform, baseContextJson)!.regexSelected).toBe(true);
    expect(getTransformedMetadata(target2, transform, baseContextJson)!.regexSelected).toBe(true);
    expect(getTransformedMetadata(nonTarget, transform, baseContextJson)).toBeUndefined();
  });

  it('should apply metadata based on function selector', () => {
    const selectorFn: NodeSelector = (node, context) => node.name === 'funcTarget' && node.type === NodeType.ELEMENT_NODE;
    const options: MetadataTransformOptions = {
      selector: selectorFn,
      metadata: { funcSelected: true }
    };
    const transform = new MetadataTransform(options);
    const targetNode = createElement('funcTarget');
    const nonTargetNode = createElement('otherTarget');
    
    expect(getTransformedMetadata(targetNode, transform, baseContextJson)!.funcSelected).toBe(true);
    expect(getTransformedMetadata(nonTargetNode, transform, baseContextJson)).toBeUndefined();
  });
  
  it('should apply to root if applyToRoot is true, regardless of selector', () => {
    const options: MetadataTransformOptions = {
      applyToRoot: true,
      selector: 'nonExistent', // Selector would not match root
      metadata: { isRoot: true }
    };
    const transform = new MetadataTransform(options);
    // baseRootNode is 'root', context is for baseRootNode (parent is undefined)
    const metadata = getTransformedMetadata(baseRootNode, transform, baseContextJson);
    expect(metadata).toBeDefined();
    expect(metadata!.isRoot).toBe(true);
  });

  it('should apply to all nodes if applyToAll is true (respecting maxDepth)', () => {
    const options: MetadataTransformOptions = {
      applyToAll: true,
      metadata: { appliedToAll: true }
    };
    const transform = new MetadataTransform(options);

    const root = createElement('root');
    const child1 = createElement('child1');
    const grandchild1 = createElement('grandchild1');
    addChild(child1, grandchild1);
    addChild(root, child1);

    // Create contexts for each node
    const rootCtx = createRootContext(FORMAT.JSON, root, defaultConfig);
    const child1Ctx = createChildContext(rootCtx, child1, 0);
    const grandchild1Ctx = createChildContext(child1Ctx, grandchild1, 0);

    const transformedRoot = transform.transform(root, rootCtx).value;
    const transformedChild1 = transform.transform(child1, child1Ctx).value; // Transform children individually for unit test
    const transformedGrandchild1 = transform.transform(grandchild1, grandchild1Ctx).value;

    expect(transformedRoot.metadata!.appliedToAll).toBe(true);
    expect(transformedChild1.metadata!.appliedToAll).toBe(true);
    expect(transformedGrandchild1.metadata!.appliedToAll).toBe(true);
  });

  it('should respect maxDepth with applyToAll', () => {
    const options: MetadataTransformOptions = {
      applyToAll: true,
      metadata: { depthLimited: true },
      maxDepth: 1 // Apply to root (depth 0) and direct children (depth 1)
    };
    const transform = new MetadataTransform(options);

    const root = createElement('root'); // depth 0
    const child1 = createElement('child1'); // depth 1
    const grandchild1 = createElement('grandchild1'); // depth 2
    addChild(child1, grandchild1);
    addChild(root, child1);
    
    const rootCtx = createRootContext(FORMAT.JSON, root, defaultConfig);
    const child1Ctx = createChildContext(rootCtx, child1, 0);
    const grandchild1Ctx = createChildContext(child1Ctx, grandchild1, 0);

    const transformedRoot = transform.transform(root, rootCtx).value;
    const transformedChild1 = transform.transform(child1, child1Ctx).value;
    const transformedGrandchild1 = transform.transform(grandchild1, grandchild1Ctx).value;

    expect(transformedRoot.metadata!.depthLimited).toBe(true);
    expect(transformedChild1.metadata!.depthLimited).toBe(true);
    expect(transformedGrandchild1.metadata).toBeUndefined(); // Max depth 1, grandchild is at depth 2
  });
  
  it('should use format-specific metadata if provided and context matches', () => {
    const options: MetadataTransformOptions = {
      applyToRoot: true,
      metadata: { general: 'data'}, // Fallback
      formatMetadata: [
        { format: FORMAT.JSON, metadata: { formatSpecific: 'json_data' } },
        { format: FORMAT.XML, metadata: { formatSpecific: 'xml_data' } }
      ]
    };
    const transform = new MetadataTransform(options);

    // Test with JSON context
    let metadata = getTransformedMetadata(baseRootNode, transform, baseContextJson);
    expect(metadata).toBeDefined();
    expect(metadata!.formatSpecific).toBe('json_data');
    expect(metadata!.general).toBeUndefined(); // Format specific should take precedence

    // Test with XML context
    // Need a fresh node as metadata is mutated
    const xmlNode = createElement('root');
    metadata = getTransformedMetadata(xmlNode, transform, baseContextXml);
    expect(metadata).toBeDefined();
    expect(metadata!.formatSpecific).toBe('xml_data');
    expect(metadata!.general).toBeUndefined();
  });
  
  it('should use general metadata if no matching format-specific metadata', () => {
    const options: MetadataTransformOptions = {
      applyToRoot: true,
      metadata: { general: 'data'},
      formatMetadata: [ // No entry for XML
        { format: FORMAT.JSON, metadata: { formatSpecific: 'json_data' } }
      ]
    };
    const transform = new MetadataTransform(options);
    const metadata = getTransformedMetadata(baseRootNode, transform, baseContextXml); // XML context
    expect(metadata).toBeDefined();
    expect(metadata!.general).toBe('data');
    expect(metadata!.formatSpecific).toBeUndefined();
  });

  it('targets should be correct', () => {
    const transform = new MetadataTransform({ applyToRoot: true, metadata: {a:1}});
    expect(transform.targets).toEqual([
      TransformTarget.Element,
      TransformTarget.Text,
      TransformTarget.CDATA,
      TransformTarget.Comment,
      TransformTarget.ProcessingInstruction
    ]);
  });
});
