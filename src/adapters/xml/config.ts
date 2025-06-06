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