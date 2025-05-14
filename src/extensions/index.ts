/**
 * Extensions module
 * 
 * This module registers all the extension methods with the XJX class
 * to provide the fluent API. It has no exports - it's only imported for 
 * its side effects.
 */

  // Import all extensions to ensure they're registered
  
  // Terminal extensions (methods that return a value)
  import './terminal/to-xml';
  import './terminal/to-json';
  import './terminal/to-json-string';
  // import './terminal/get-json-schema';
  // import './terminal/get-path';
  
  // Non-terminal extensions (methods that return the builder for chaining)
  import './nonterminal/from-xml';
  import './nonterminal/from-json';
  import './nonterminal/with-config';
  import './nonterminal/with-transforms';

// No exports - this file is only imported for its side effects