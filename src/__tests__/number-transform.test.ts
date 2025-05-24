import { NumberTransform, NumberTransformOptions } from '../transforms/number-transform';
import { TransformContext, FORMAT, TransformResult, createRootContext } from '../core/transform';
import { XNode, createElement } from '../core/xnode';
import { NodeType } from '../core/dom';
import { getDefaultConfig } from '../core/config';

describe('NumberTransform', () => {
  let defaultConfig: ReturnType<typeof getDefaultConfig>;
  let baseContextJson: TransformContext;
  let baseContextXml: TransformContext;

  beforeEach(() => {
    defaultConfig = getDefaultConfig();
    const dummyRootNode = createElement('root');
    baseContextJson = createRootContext(FORMAT.JSON, dummyRootNode, defaultConfig);
    baseContextXml = createRootContext(FORMAT.XML, dummyRootNode, defaultConfig);
  });

  // --- Tests for stringToNumber conversion (context.targetFormat === FORMAT.JSON) ---
  describe('String to Number (targetFormat: JSON)', () => {
    it('should convert valid integer strings to numbers', () => {
      const transform = new NumberTransform();
      expect(transform.transform("123", baseContextJson).value).toBe(123);
      expect(transform.transform("  -456 ", baseContextJson).value).toBe(-456);
      expect(transform.transform("0", baseContextJson).value).toBe(0);
    });

    it('should convert valid decimal strings to numbers with default separators', () => {
      const transform = new NumberTransform();
      expect(transform.transform("123.45", baseContextJson).value).toBe(123.45);
      expect(transform.transform("-0.50", baseContextJson).value).toBe(-0.5);
      expect(transform.transform("  .789 ", baseContextJson).value).toBe(0.789); // Number(".789") is 0.789
    });

    it('should handle thousands separators correctly (default comma)', () => {
      const transform = new NumberTransform();
      expect(transform.transform("1,234", baseContextJson).value).toBe(1234);
      expect(transform.transform("1,234,567.89", baseContextJson).value).toBe(1234567.89);
      expect(transform.transform("-1,000", baseContextJson).value).toBe(-1000);
    });
    
    it('should convert scientific notation strings to numbers by default', () => {
      const transform = new NumberTransform();
      expect(transform.transform("1.23e4", baseContextJson).value).toBe(1.23e4);
      expect(transform.transform("1.23E+4", baseContextJson).value).toBe(12300);
      expect(transform.transform("-5.67e-2", baseContextJson).value).toBe(-5.67e-2);
    });

    it('should use custom decimalSeparator', () => {
      const options: NumberTransformOptions = { decimalSeparator: ',' };
      const transform = new NumberTransform(options);
      expect(transform.transform("123,45", baseContextJson).value).toBe(123.45);
      expect(transform.transform("1.000,50", baseContextJson).value).toBe(1000.50); // Assuming default thousands still removed
    });

    it('should use custom thousandsSeparator', () => {
      const options: NumberTransformOptions = { thousandsSeparator: '.' }; // e.g. European style 1.234,56
      const transform = new NumberTransform(options);
       // For this to work, decimalSeparator must also be set if it's not the default '.'
      const optionsEuro = { thousandsSeparator: '.', decimalSeparator: ',' };
      const transformEuro = new NumberTransform(optionsEuro);
      expect(transformEuro.transform("1.234,56", baseContextJson).value).toBe(1234.56);
      expect(transformEuro.transform("1.234", baseContextJson).value).toBe(1234); // Integer
    });
    
    it('should return original value for invalid number strings', () => {
      const transform = new NumberTransform();
      expect(transform.transform("abc", baseContextJson).value).toBe("abc");
      expect(transform.transform("12.34.56", baseContextJson).value).toBe("12.34.56");
      expect(transform.transform("--5", baseContextJson).value).toBe("--5");
      expect(transform.transform("1,2,3.4", baseContextJson).value).toBe("1,2,3.4"); // Multiple thousands
    });

    it('should return original value if input is not a string (and not number)', () => {
      const transform = new NumberTransform();
      expect(transform.transform(true, baseContextJson).value).toBe(true);
      expect(transform.transform(null, baseContextJson).value).toBeNull();
      expect(transform.transform(undefined, baseContextJson).value).toBeUndefined();
      const obj = { a: 1 };
      expect(transform.transform(obj, baseContextJson).value).toBe(obj);
    });

    it('should return number input as is', () => {
      const transform = new NumberTransform();
      expect(transform.transform(123, baseContextJson).value).toBe(123);
      expect(transform.transform(-45.67, baseContextJson).value).toBe(-45.67);
    });

    it('should disable integer conversion if options.integers is false', () => {
      const options: NumberTransformOptions = { integers: false, decimals: true, scientific: false };
      const transform = new NumberTransform(options);
      expect(transform.transform("123", baseContextJson).value).toBe("123"); // Not matched by decimal or scientific
      expect(transform.transform("123.45", baseContextJson).value).toBe(123.45);
    });

    it('should disable decimal conversion if options.decimals is false', () => {
      const options: NumberTransformOptions = { integers: true, decimals: false, scientific: false };
      const transform = new NumberTransform(options);
      expect(transform.transform("123.45", baseContextJson).value).toBe("123.45");
      expect(transform.transform("123", baseContextJson).value).toBe(123);
    });
    
    it('should disable scientific notation conversion if options.scientific is false', () => {
      const options: NumberTransformOptions = { integers: true, decimals: true, scientific: false };
      const transform = new NumberTransform(options);
      expect(transform.transform("1.23e4", baseContextJson).value).toBe("1.23e4");
      expect(transform.transform("123.45", baseContextJson).value).toBe(123.45);
    });
  });

  // --- Tests for numberToString conversion (context.targetFormat === FORMAT.XML) ---
  describe('Number to String (targetFormat: XML)', () => {
    it('should convert numbers to strings', () => {
      const transform = new NumberTransform();
      expect(transform.transform(123, baseContextXml).value).toBe("123");
      expect(transform.transform(-45.67, baseContextXml).value).toBe("-45.67");
      expect(transform.transform(0, baseContextXml).value).toBe("0");
    });

    it('should return non-number values as is', () => {
      const transform = new NumberTransform();
      expect(transform.transform("text", baseContextXml).value).toBe("text");
      expect(transform.transform(true, baseContextXml).value).toBe(true);
      expect(transform.transform(null, baseContextXml).value).toBeNull();
    });
  });
  
  // --- Test application to XNode value ---
  it('should transform an XNode string value to number when context is JSON', () => {
    const transform = new NumberTransform();
    const node = createElement('data');
    node.value = '1,234.56';
    
    const transformedResult = transform.transform(node.value, baseContextJson);
    node.value = transformedResult.value;
    
    expect(node.value).toBe(1234.56);
  });

  it('should transform an XNode number value to string when context is XML', () => {
    const transform = new NumberTransform();
    const node = createElement('data');
    node.value = 1234.56;
    
    const transformedResult = transform.transform(node.value, baseContextXml);
    node.value = transformedResult.value;
    
    expect(node.value).toBe('1234.56');
  });
  
  // --- Test targets property ---
  it('should have "Value" as its target', () => {
    const transform = new NumberTransform();
    expect(transform.targets).toEqual(['value']);
  });
});
