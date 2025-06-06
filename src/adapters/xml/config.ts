/**
 * XML adapter configuration - Separated source and output configurations
 */

/**
 * XML source-specific configuration options (parsing)
 */
export interface XmlSourceConfiguration {
  // Namespace handling during parsing
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
}

/**
 * XML output-specific configuration options (serialization)
 */
export interface XmlOutputConfiguration {
  // XML-specific formatting
  prettyPrint: boolean;
  declaration: boolean; // Include <?xml declaration
  encoding: string;
  
  // Namespace handling during output
  preserveNamespaces: boolean;
  namespacePrefixHandling: 'preserve' | 'strip' | 'label';
  preservePrefixedNames: boolean;
}

/**
 * Default XML source configuration
 */
export const DEFAULT_XML_SOURCE_CONFIG: XmlSourceConfiguration = {
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
  attributeHandling: 'attributes'
};

/**
 * Default XML output configuration
 */
export const DEFAULT_XML_OUTPUT_CONFIG: XmlOutputConfiguration = {
  // XML formatting
  prettyPrint: true,
  declaration: true,
  encoding: 'UTF-8',
  
  // Namespace handling for output
  preserveNamespaces: true,
  namespacePrefixHandling: 'preserve',
  preservePrefixedNames: true
};

/**
 * Validate XML source configuration
 */
export function validateXmlSourceConfig(config: XmlSourceConfiguration): void {
  if (!['attributes', 'fields'].includes(config.attributeHandling)) {
    throw new Error('xml.source.attributeHandling must be "attributes" or "fields"');
  }

  if (!['preserve', 'strip', 'label'].includes(config.namespacePrefixHandling)) {
    throw new Error('xml.source.namespacePrefixHandling must be "preserve", "strip", or "label"');
  }

  if (typeof config.preserveNamespaces !== 'boolean') {
    throw new Error('xml.source.preserveNamespaces must be a boolean');
  }

  if (typeof config.preserveCDATA !== 'boolean') {
    throw new Error('xml.source.preserveCDATA must be a boolean');
  }

  if (typeof config.preserveMixedContent !== 'boolean') {
    throw new Error('xml.source.preserveMixedContent must be a boolean');
  }

  if (typeof config.preserveTextNodes !== 'boolean') {
    throw new Error('xml.source.preserveTextNodes must be a boolean');
  }

  if (typeof config.preserveAttributes !== 'boolean') {
    throw new Error('xml.source.preserveAttributes must be a boolean');
  }

  if (typeof config.preservePrefixedNames !== 'boolean') {
    throw new Error('xml.source.preservePrefixedNames must be a boolean');
  }
}

/**
 * Validate XML output configuration
 */
export function validateXmlOutputConfig(config: XmlOutputConfiguration): void {
  if (typeof config.prettyPrint !== 'boolean') {
    throw new Error('xml.output.prettyPrint must be a boolean');
  }

  if (typeof config.declaration !== 'boolean') {
    throw new Error('xml.output.declaration must be a boolean');
  }

  if (typeof config.preserveNamespaces !== 'boolean') {
    throw new Error('xml.output.preserveNamespaces must be a boolean');
  }

  if (!['preserve', 'strip', 'label'].includes(config.namespacePrefixHandling)) {
    throw new Error('xml.output.namespacePrefixHandling must be "preserve", "strip", or "label"');
  }

  if (typeof config.preservePrefixedNames !== 'boolean') {
    throw new Error('xml.output.preservePrefixedNames must be a boolean');
  }
}