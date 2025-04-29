import { XmlUtil } from '../../../../src/core/utils/xml-utils';
import { DEFAULT_CONFIG } from '../../../../src/core/config/config';
import { normalizeXML } from '../../../../test/utils/testUtils';

describe('XmlUtil', () => {
  let xmlUtil: XmlUtil;

  beforeEach(() => {
    // Create a fresh XmlUtil instance for each test
    xmlUtil = new XmlUtil(DEFAULT_CONFIG);
  });

  describe('prettyPrintXml', () => {
    it('should format XML with correct indentation', () => {
      const input = '<root><child><grandchild>text</grandchild></child></root>';
      const expected = '<root>\n  <child>\n    <grandchild>text</grandchild>\n  </child>\n</root>';
      
      const result = xmlUtil.prettyPrintXml(input);
      
      // Use normalizeXML to remove whitespace differences for comparison
      expect(normalizeXML(result)).toBe(normalizeXML(expected));
    });

    it('should respect config indent setting', () => {
      // Create XML util with custom indentation
      const customConfig = { ...DEFAULT_CONFIG, outputOptions: { ...DEFAULT_CONFIG.outputOptions, indent: 4 } };
      const customXmlUtil = new XmlUtil(customConfig);
      
      const input = '<root><child>text</child></root>';
      const expected = '<root>\n    <child>text</child>\n</root>';
      
      const result = customXmlUtil.prettyPrintXml(input);
      
      expect(normalizeXML(result)).toBe(normalizeXML(expected));
    });

    it('should handle XML with attributes', () => {
      const input = '<root attr="value"><child id="1">text</child></root>';
      const expected = '<root attr="value">\n  <child id="1">text</child>\n</root>';
      
      const result = xmlUtil.prettyPrintXml(input);
      
      expect(normalizeXML(result)).toBe(normalizeXML(expected));
    });

    it('should handle self-closing tags', () => {
      const input = '<root><empty/><another-empty /></root>';
      const expected = '<root>\n  <empty />\n  <another-empty />\n</root>';
      
      const result = xmlUtil.prettyPrintXml(input);
      
      expect(normalizeXML(result)).toBe(normalizeXML(expected));
    });
    
    it('should preserve CDATA sections', () => {
      const input = '<root><data><![CDATA[Some <markup> that should & not be parsed]]></data></root>';
      
      const result = xmlUtil.prettyPrintXml(input);
      
      // Check that CDATA content is preserved
      expect(result).toContain('<![CDATA[Some <markup> that should & not be parsed]]>');
    });
    
    it('should preserve comments', () => {
      const input = '<root><!-- This is a comment --><child>text</child></root>';
      
      const result = xmlUtil.prettyPrintXml(input);
      
      // Check that comment is preserved
      expect(result).toContain('<!-- This is a comment -->');
    });
    
    it('should preserve processing instructions', () => {
      const input = '<?xml version="1.0"?><?custom instruction?><root></root>';
      
      const result = xmlUtil.prettyPrintXml(input);
      
      // Check that processing instruction is preserved
      expect(result).toContain('<?custom instruction?>');
    });
  });

  describe('validateXML', () => {
    it('should validate well-formed XML', () => {
      const xml = '<root><child>content</child></root>';
      
      const result = xmlUtil.validateXML(xml);
      
      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should reject malformed XML', () => {
      const xml = '<root><child>content</child></wrongtag>';
      
      const result = xmlUtil.validateXML(xml);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('should reject XML with unclosed tags', () => {
      const xml = '<root><child>content';
      
      const result = xmlUtil.validateXML(xml);
      
      expect(result.isValid).toBe(false);
    });
    
    it('should reject XML with mismatched tags', () => {
      const xml = '<root><child>content</wrong></root>';
      
      const result = xmlUtil.validateXML(xml);
      
      expect(result.isValid).toBe(false);
    });
  });

  describe('ensureXMLDeclaration', () => {
    it('should add XML declaration if missing', () => {
      const xml = '<root></root>';
      
      const result = xmlUtil.ensureXMLDeclaration(xml);
      
      expect(result).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
      expect(result).toContain(xml);
    });

    it('should not add XML declaration if already present', () => {
      const xml = '<?xml version="1.0" encoding="UTF-8"?><root></root>';
      
      const result = xmlUtil.ensureXMLDeclaration(xml);
      
      expect(result).toBe(xml);
      // Should not duplicate the declaration
      expect(result.match(/<\?xml/g)?.length).toBe(1);
    });
    
    it('should handle whitespace in input', () => {
      const xml = '  \n  <root></root>';
      
      const result = xmlUtil.ensureXMLDeclaration(xml);
      
      expect(result).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    });
  });

  describe('escapeXML and unescapeXML', () => {
    it('should escape special XML characters', () => {
      const input = 'Text with <tags> & "quotes" and \'apostrophes\'';
      const expected = 'Text with &lt;tags&gt; &amp; &quot;quotes&quot; and &apos;apostrophes&apos;';
      
      const result = xmlUtil.escapeXML(input);
      
      expect(result).toBe(expected);
    });

    it('should not change already escaped entities', () => {
      const input = 'Already &lt;escaped&gt; &amp; &quot;content&quot;';
      
      const result = xmlUtil.escapeXML(input);
      
      expect(result).toBe(input);
    });

    it('should unescape XML entities back to characters', () => {
      const input = 'Text with &lt;tags&gt; &amp; &quot;quotes&quot; and &apos;apostrophes&apos;';
      const expected = 'Text with <tags> & "quotes" and \'apostrophes\'';
      
      const result = xmlUtil.unescapeXML(input);
      
      expect(result).toBe(expected);
    });

    it('should handle empty strings', () => {
      expect(xmlUtil.escapeXML('')).toBe('');
      expect(xmlUtil.unescapeXML('')).toBe('');
    });

    it('should handle non-string inputs gracefully', () => {
      expect(xmlUtil.escapeXML(null as any)).toBe('');
      expect(xmlUtil.escapeXML(undefined as any)).toBe('');
      expect(xmlUtil.unescapeXML(null as any)).toBe('');
      expect(xmlUtil.unescapeXML(undefined as any)).toBe('');
    });
    
    it('should be reversible', () => {
      const original = 'Text with <complex> & "mixed" \'characters\' that need escaping';
      
      const escaped = xmlUtil.escapeXML(original);
      const unescaped = xmlUtil.unescapeXML(escaped);
      
      expect(unescaped).toBe(original);
    });
  });

  describe('namespace helpers', () => {
    describe('extractPrefix', () => {
      it('should extract namespace prefix from qualified name', () => {
        expect(xmlUtil.extractPrefix('ns:element')).toBe('ns');
        expect(xmlUtil.extractPrefix('prefix:name')).toBe('prefix');
      });

      it('should return null for names without prefix', () => {
        expect(xmlUtil.extractPrefix('element')).toBeNull();
      });
      
      it('should handle edge cases correctly', () => {
        expect(xmlUtil.extractPrefix('')).toBeNull();
        expect(xmlUtil.extractPrefix(':')).toBeNull(); // Empty prefix
        expect(xmlUtil.extractPrefix('ns:')).toBe('ns'); // Empty local name
      });
    });

    describe('extractLocalName', () => {
      it('should extract local name from qualified name', () => {
        expect(xmlUtil.extractLocalName('ns:element')).toBe('element');
        expect(xmlUtil.extractLocalName('prefix:name')).toBe('name');
      });

      it('should return the original name if no prefix exists', () => {
        expect(xmlUtil.extractLocalName('element')).toBe('element');
      });
      
      it('should handle edge cases correctly', () => {
        expect(xmlUtil.extractLocalName('')).toBe('');
        expect(xmlUtil.extractLocalName(':')).toBe(''); // Empty local name
        expect(xmlUtil.extractLocalName('ns:')).toBe(''); // Empty local name
      });
    });

    describe('createQualifiedName', () => {
      it('should create qualified name from prefix and local name', () => {
        expect(xmlUtil.createQualifiedName('ns', 'element')).toBe('ns:element');
        expect(xmlUtil.createQualifiedName('prefix', 'name')).toBe('prefix:name');
      });

      it('should return just the local name when prefix is null', () => {
        expect(xmlUtil.createQualifiedName(null, 'element')).toBe('element');
      });
      
      it('should handle empty inputs', () => {
        expect(xmlUtil.createQualifiedName('', 'element')).toBe('element');
        expect(xmlUtil.createQualifiedName('ns', '')).toBe('ns:');
      });
    });
  });
});