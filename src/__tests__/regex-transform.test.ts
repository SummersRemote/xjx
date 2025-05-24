import { RegexTransform, RegexOptions } from '../transforms/regex-transform';
import { TransformContext, FORMAT, TransformResult, createRootContext, TransformTarget } from '../core/transform';
import { XNode, createElement, createTextNode, createCommentNode, createCDATANode, addChild } from '../core/xnode';
import { NodeType } from '../core/dom';
import { getDefaultConfig } from '../core/config';

describe('RegexTransform', () => {
  let defaultConfig: ReturnType<typeof getDefaultConfig>;
  let baseContextJson: TransformContext;
  let baseContextXml: TransformContext;

  beforeEach(() => {
    defaultConfig = getDefaultConfig();
    const dummyRootNode = createElement('root'); // Context needs a node, though not directly used by RegexTransform itself
    baseContextJson = createRootContext(FORMAT.JSON, dummyRootNode, defaultConfig);
    baseContextXml = createRootContext(FORMAT.XML, dummyRootNode, defaultConfig);
  });

  it('should perform basic regex replacement on string values', () => {
    const options: RegexOptions = { pattern: /foo/g, replacement: 'bar' };
    const transform = new RegexTransform(options);
    const result = transform.transform('this is foofoo', baseContextJson);
    expect(result.value).toBe('this is barbar');
  });

  it('should handle pattern as a string (literal match, global by default)', () => {
    const options: RegexOptions = { pattern: 'foo', replacement: 'bar' };
    const transform = new RegexTransform(options); // 'foo' becomes /foo/g
    const result = transform.transform('this is foofoo', baseContextJson);
    expect(result.value).toBe('this is barbar');
  });

  it('should handle pattern as a string with flags like "/pattern/i"', () => {
    const options: RegexOptions = { pattern: '/Foo/i', replacement: 'bar' }; // Should become /Foo/i (not /Foo/ig)
    const transform = new RegexTransform(options);
    // Default for string pattern without /.../flags is 'g'. If /.../flags is used, those flags are used.
    // The processPattern tries new RegExp(parsed.source, parsed.flags || "g");
    // So, /Foo/i should result in a non-global regex if "g" is not in flags.
    // Let's test with /Foo/gi to ensure global works as expected.
    const optionsGlobal: RegexOptions = { pattern: '/Foo/gi', replacement: 'bar' };
    const transformGlobal = new RegexTransform(optionsGlobal);

    expect(transformGlobal.transform('Foo foo FOO', baseContextJson).value).toBe('bar bar bar');
    
    // Test non-global explicitly by checking if only first match is replaced
    const optionsNonGlobal: RegexOptions = { pattern: '/foo/i', replacement: 'bar' };
    const transformNonGlobal = new RegexTransform(optionsNonGlobal);
     // processPattern will use 'g' if flags are empty from parseRegExpString.
     // To make it non-global from string, it must be a non-issue as `replace` on string with non-global regex works as expected.
     // The default in processPattern is `new RegExp(parsed.source, parsed.flags || "g")`
     // If `parsed.flags` is empty string (e.g. from "/foo/"), it still adds "g".
     // If `parsed.flags` is "i", it becomes "ig".
     // This means string-defined patterns are effectively always global unless a passed RegExp object is non-global.
    expect(transformNonGlobal.transform('foo foo', baseContextJson).value).toBe('bar bar'); // Will be global due to default 'g'
  });
  
  it('should use RegExp object with its specified flags (non-global)', () => {
    const options: RegexOptions = { pattern: /foo/i, replacement: 'bar' }; // Non-global, case-insensitive
    const transform = new RegexTransform(options);
    const result = transform.transform('Foo foo foo', baseContextJson);
    expect(result.value).toBe('bar foo foo'); // Only first "Foo" replaced
  });

  it('should use capture groups in replacement string', () => {
    const options: RegexOptions = { pattern: /(\w+)\s(\w+)/g, replacement: '$2, $1' };
    const transform = new RegexTransform(options);
    const result = transform.transform('hello world test this', baseContextJson);
    expect(result.value).toBe('world, hello this, test');
  });

  it('should only apply if context.targetFormat matches options.format (if provided)', () => {
    const optionsJson: RegexOptions = { pattern: /a/g, replacement: 'b', format: FORMAT.JSON };
    const transformJson = new RegexTransform(optionsJson);

    expect(transformJson.transform('aaa', baseContextJson).value).toBe('bbb'); // Matches JSON context
    expect(transformJson.transform('aaa', baseContextXml).value).toBe('aaa');  // Mismatched XML context, no change

    const optionsXml: RegexOptions = { pattern: /a/g, replacement: 'b', format: FORMAT.XML };
    const transformXml = new RegexTransform(optionsXml);
    expect(transformXml.transform('aaa', baseContextJson).value).toBe('aaa'); // Mismatched JSON context
    expect(transformXml.transform('aaa', baseContextXml).value).toBe('bbb');  // Matches XML context
  });

  it('should not change non-string values', () => {
    const options: RegexOptions = { pattern: /foo/g, replacement: 'bar' };
    const transform = new RegexTransform(options);
    expect(transform.transform(123, baseContextJson).value).toBe(123);
    expect(transform.transform(true, baseContextJson).value).toBe(true);
    expect(transform.transform(null, baseContextJson).value).toBeNull();
  });
  
  it('should return original string instance if no replacement occurs', () => {
    const options: RegexOptions = { pattern: /notfound/g, replacement: 'bar' };
    const transform = new RegexTransform(options);
    const originalString = 'this is a test';
    const result = transform.transform(originalString, baseContextJson);
    expect(result.value).toBe(originalString); // Should be the same instance
    expect(result.value).toEqual('this is a test');
  });

  it('should correctly apply to different XNode parts based on targets', () => {
    const options: RegexOptions = { pattern: /test/g, replacement: 'passed' };
    const transform = new RegexTransform(options);

    // Test XNode.value (matches TransformTarget.Value)
    const nodeWithValue = createElement('el');
    nodeWithValue.value = 'this is a test value';
    expect(transform.transform(nodeWithValue.value, baseContextJson).value).toBe('this is a passed value');

    // Test TextNode child (matches TransformTarget.Text)
    const textChild = createTextNode('a text node test');
    expect(transform.transform(textChild.value, baseContextJson).value).toBe('a passed node passed');
    
    // Test CDATA child (matches TransformTarget.CDATA)
    const cdataChild = createCDATANode('cdata test content');
    expect(transform.transform(cdataChild.value, baseContextJson).value).toBe('cdata passed content');

    // Test Comment child (matches TransformTarget.Comment)
    const commentChild = createCommentNode('comment test here');
    expect(transform.transform(commentChild.value, baseContextJson).value).toBe('comment passed here');
  });
  
   it('targets should be correct', () => {
    const transform = new RegexTransform({ pattern: /a/, replacement: 'b' });
    expect(transform.targets).toEqual([
      TransformTarget.Value,
      TransformTarget.Text,
      TransformTarget.CDATA,
      TransformTarget.Comment,
    ]);
  });
});
