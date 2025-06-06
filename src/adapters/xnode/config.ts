/**
 * XML adapter configuration - Self-contained XML-specific settings
 */

/**
 * XML-specific configuration options
 */
export interface XmlConfiguration {
  // Namespace handling
  preserveNamespaces: boolean;
  namespacePrefixHandling: 'preserve' | 'strip' | 'label';
  
  // Content preservation for data filtering
  preserveCDATA: boolean;
  preserveMixedContent: boolean;
  preserveTextNodes: boolean;
  preserveAttributes: boolean;
  preservePrefixedNames: boolean;
  
  // Semantic representation strategy
  attributeHandling: 'attributes' | 'fields'; // How to represent XML attributes in semantic model
  
  // XML-specific formatting
  prettyPrint: boolean;
  declaration: boolean; // Include <?xml declaration
  encoding: string;
}

/**
 * Default XML configuration
 */
export const DEFAULT_XML_CONFIG: XmlConfiguration = {
  // Namespace handling
  preserveNamespaces: true,
  namespacePrefixHandling: 'preserve',
  
  // Content preservation for data filtering
  preserveCDATA: true,
  preserveMixedContent: true,
  preserveTextNodes: true,
  preserveAttributes: true,
  preservePrefixedNames: true,
  
  // Semantic representation
  attributeHandling: 'attributes',
  
  // XML formatting
  prettyPrint: true,
  declaration: true,
  encoding: 'UTF-8'
};

/**
 * Validate XML configuration
 */
export function validateXmlConfig(config: XmlConfiguration): void {
  if (!['attributes', 'fields'].includes(config.attributeHandling)) {
    throw new Error('xml.attributeHandling must be "attributes" or "fields"');
  }

  if (!['preserve', 'strip', 'label'].includes(config.namespacePrefixHandling)) {
    throw new Error('xml.namespacePrefixHandling must be "preserve", "strip", or "label"');
  }

  if (typeof config.prettyPrint !== 'boolean') {
    throw new Error('xml.prettyPrint must be a boolean');
  }

  if (typeof config.declaration !== 'boolean') {
    throw new Error('xml.declaration must be a boolean');
  }

  if (typeof config.preserveNamespaces !== 'boolean') {
    throw new Error('xml.preserveNamespaces must be a boolean');
  }

  if (typeof config.preserveCDATA !== 'boolean') {
    throw new Error('xml.preserveCDATA must be a boolean');
  }

  if (typeof config.preserveMixedContent !== 'boolean') {
    throw new Error('xml.preserveMixedContent must be a boolean');
  }

  if (typeof config.preserveTextNodes !== 'boolean') {
    throw new Error('xml.preserveTextNodes must be a boolean');
  }

  if (typeof config.preserveAttributes !== 'boolean') {
    throw new Error('xml.preserveAttributes must be a boolean');
  }

  if (typeof config.preservePrefixedNames !== 'boolean') {
    throw new Error('xml.preservePrefixedNames must be a boolean');
  }
}