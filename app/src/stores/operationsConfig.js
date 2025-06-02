// stores/operationsConfig.js - Updated with transformAttr/transformVal defaults

export const availableOperations = {
  // Source operations
  fromXml: { 
    type: 'fromXml', 
    name: 'From XML', 
    category: 'source', 
    description: 'Parse XML string as source',
    terminal: false,
    hookTypes: ['beforeTransform', 'afterTransform']
  },
  fromJson: { 
    type: 'fromJson', 
    name: 'From JSON', 
    category: 'source', 
    description: 'Parse JSON object as source',
    terminal: false,
    hookTypes: ['beforeTransform', 'afterTransform']
  },
  fromXnode: { 
    type: 'fromXnode', 
    name: 'From XNode', 
    category: 'source', 
    description: 'Use XNode array as source',
    terminal: false,
    hookTypes: ['beforeTransform', 'afterTransform']
  },
  
  // Functional operations 
  filter: { 
    type: 'filter', 
    name: 'Filter', 
    category: 'functional', 
    description: 'Keep nodes matching predicate',
    terminal: false,
    hookTypes: []
  },
  map: { 
    type: 'map', 
    name: 'Map/Transform', 
    category: 'functional', 
    description: 'Transform every node',
    terminal: false,
    hookTypes: ['transform', 'beforeTransform', 'afterTransform']
  },
  select: { 
    type: 'select', 
    name: 'Select', 
    category: 'functional', 
    description: 'Collect matching nodes',
    terminal: false,
    hookTypes: []
  },
  branch: { 
    type: 'branch', 
    name: 'Branch', 
    category: 'functional', 
    description: 'Create isolated scope for subset operations',
    terminal: false,
    hookTypes: []
  },
  merge: { 
    type: 'merge', 
    name: 'Merge', 
    category: 'functional', 
    description: 'Merge branch back to parent scope',
    terminal: false,
    hookTypes: []
  },
  withConfig: { 
    type: 'withConfig', 
    name: 'With Config', 
    category: 'functional', 
    description: 'Update configuration mid-pipeline',
    terminal: false,
    hookTypes: []
  },
  reduce: { 
    type: 'reduce', 
    name: 'Reduce', 
    category: 'functional', 
    description: 'Aggregate to single value',
    terminal: true,
    hookTypes: []
  },
  
  // Output operations
  toXml: { 
    type: 'toXml', 
    name: 'To XML DOM', 
    category: 'output', 
    description: 'Convert to XML DOM Document',
    terminal: true,
    hookTypes: ['beforeTransform', 'afterTransform']
  },
  toXmlString: { 
    type: 'toXmlString', 
    name: 'To XML String', 
    category: 'output', 
    description: 'Convert to XML string',
    terminal: true,
    hookTypes: ['beforeTransform', 'afterTransform']
  },
  toJson: { 
    type: 'toJson', 
    name: 'To JSON', 
    category: 'output', 
    description: 'Convert to JSON object',
    terminal: true,
    hookTypes: ['beforeTransform', 'afterTransform']
  },
  toJsonString: { 
    type: 'toJsonString', 
    name: 'To JSON String', 
    category: 'output', 
    description: 'Convert to JSON string',
    terminal: true,
    hookTypes: ['beforeTransform', 'afterTransform']
  },
  toXnode: { 
    type: 'toXnode', 
    name: 'To XNode', 
    category: 'output', 
    description: 'Convert to XNode array',
    terminal: false,
    hookTypes: ['beforeTransform', 'afterTransform']
  }
};

/**
 * Get default options for an operation type
 */
export function getDefaultOptions(type) {
  const operation = availableOperations[type];
  
  if (!operation) return {};
  
  const hookTypes = operation.hookTypes || [];
  const defaultOptions = {};
  
  if (hookTypes.includes('beforeTransform')) {
    defaultOptions.beforeTransform = getDefaultTransformConfig();
  }
  
  if (hookTypes.includes('afterTransform')) {
    defaultOptions.afterTransform = getDefaultTransformConfig();
  }
  
  switch (type) {
    case 'filter':
    case 'select':
    case 'branch':
      defaultOptions.predicate = 'node => node.name === "example"';
      break;
      
    case 'map':
      defaultOptions.transform = getDefaultTransformConfig();
      break;
      
    case 'reduce':
      defaultOptions.reducer = '(acc, node) => acc + 1';
      defaultOptions.initialValue = '0';
      break;
    
    case 'merge':
      // Merge has no configuration options
      break;
      
    case 'withConfig':
      // Default config with commonly changed mid-pipeline settings
      defaultOptions.config = JSON.stringify({
        strategies: {
          highFidelity: false,
          attributeStrategy: "merge",
          textStrategy: "direct",
          arrayStrategy: "multiple",
          emptyElementStrategy: "object"
        },
        properties: {
          attribute: "$attr",
          value: "$val",
          children: "$children"
        },
        formatting: {
          indent: 2,
          pretty: true
        },
        fragmentRoot: "results"
      }, null, 2);
      break;
  }
  
  return defaultOptions;
}

/**
 * Get default transform configuration structure - UPDATED with transformAttr/transformVal
 */
export function getDefaultTransformConfig() {
  return {
    selectedTransforms: [],
    transformOrder: [],
    transforms: {
      toBoolean: {
        trueValues: ['true', 'yes', '1', 'on'],
        falseValues: ['false', 'no', '0', 'off'],
        ignoreCase: true,
        transformAttr: false,  // NEW: Don't transform attributes by default
        transformVal: true     // NEW: Do transform values by default (backward compatibility)
      },
      toNumber: {
        precision: undefined,
        decimalSeparator: '.',
        thousandsSeparator: ',',
        integers: true,
        decimals: true,
        scientific: true,
        transformAttr: false,  // NEW: Don't transform attributes by default
        transformVal: true     // NEW: Do transform values by default (backward compatibility)
      },
      regex: {
        pattern: '',
        replacement: '',
        transformAttr: false,  // NEW: Don't transform attributes by default
        transformVal: true     // NEW: Do transform values by default (backward compatibility)
      },
      custom: {
        customTransformer: ''
      }
    }
  };
}