// stores/transformHelpers.js - Updated with transformAttr/transformVal support

/**
 * Create a JavaScript function from a string
 */
export function createFunction(functionString) {
  try {
    let cleanFunctionString = functionString.trim();
    
    if (!cleanFunctionString.startsWith('function') && 
        !cleanFunctionString.startsWith('(') && 
        !cleanFunctionString.includes('=>')) {
      cleanFunctionString = `node => ${cleanFunctionString}`;
    }
    
    return new Function('return ' + cleanFunctionString)();
  } catch (err) {
    console.error('Error creating function from string:', err);
    return () => true;
  }
}

/**
 * Parse initial value for reduce operations
 */
export function parseInitialValue(value) {
  try {
    return JSON.parse(value);
  } catch (e) {
    return value;
  }
}

/**
 * Check if a transform configuration has valid transforms
 */
export function hasValidTransform(config) {
  if (!config) return false;
  
  if (config.selectedTransforms && Array.isArray(config.selectedTransforms)) {
    if (config.selectedTransforms.length === 0) return false;
    
    return config.selectedTransforms.some(transformType => {
      switch (transformType) {
        case 'toBoolean':
        case 'toNumber':
          return true;
          
        case 'regex':
          return config.transforms?.regex?.pattern && 
                 config.transforms?.regex?.replacement !== undefined;
          
        case 'custom':
          return config.transforms?.custom?.customTransformer?.trim();
          
        default:
          return false;
      }
    });
  }
  
  return !!(config.transformType || (config.customTransformer && config.customTransformer.trim()));
}

/**
 * Create a transformer from configuration
 */
export function createTransformerFromConfig(config, transforms) {
  if (!config) return undefined;
  
  if (config.selectedTransforms && Array.isArray(config.selectedTransforms) && config.selectedTransforms.length > 0) {
    return createComposedTransformer(config, transforms);
  }
  
  const { transformType, transformOptions, customTransformer } = config;
  
  if (customTransformer && customTransformer.trim()) {
    return createFunction(customTransformer);
  }
  
  if (transformType && transforms[transformType]) {
    return transforms[transformType](transformOptions || {});
  }
  
  return undefined;
}

/**
 * Create a composed transformer from multiple transform configurations
 */
export function createComposedTransformer(config, transforms) {
  const { selectedTransforms, transformOrder } = config;
  
  if (!transformOrder || transformOrder.length === 0) {
    return undefined;
  }
  
  const transformFunctions = [];
  
  transformOrder.forEach(transformType => {
    let transformFn;
    
    switch (transformType) {
      case 'toBoolean': {
        const options = config.transforms?.toBoolean || {};
        // Include the new transformAttr/transformVal options
        const cleanOptions = cleanTransformOptions(options);
        transformFn = transforms.toBoolean(cleanOptions);
        break;
      }
      
      case 'toNumber': {
        const options = config.transforms?.toNumber || {};
        // Include the new transformAttr/transformVal options
        const cleanOptions = cleanTransformOptions(options);
        transformFn = transforms.toNumber(cleanOptions);
        break;
      }
      
      case 'regex': {
        const regexConfig = config.transforms?.regex;
        if (regexConfig?.pattern && regexConfig?.replacement !== undefined) {
          // Handle the new options parameter for regex
          const regexOptions = {
            transformAttr: regexConfig.transformAttr ?? false,
            transformVal: regexConfig.transformVal ?? true
          };
          transformFn = transforms.regex(regexConfig.pattern, regexConfig.replacement, regexOptions);
        }
        break;
      }
      
      case 'custom': {
        const customConfig = config.transforms?.custom;
        if (customConfig?.customTransformer?.trim()) {
          transformFn = createFunction(customConfig.customTransformer);
        }
        break;
      }
    }
    
    if (transformFn) {
      transformFunctions.push(transformFn);
    }
  });
  
  if (transformFunctions.length === 0) {
    return undefined;
  } else if (transformFunctions.length === 1) {
    return transformFunctions[0];
  } else {
    return (node) => {
      return transformFunctions.reduce((result, transform) => {
        try {
          return transform(result);
        } catch (err) {
          console.warn('Error in composed transform:', err);
          return result;
        }
      }, node);
    };
  }
}

/**
 * Clean transform options by removing undefined values and providing defaults
 */
function cleanTransformOptions(options) {
  const cleaned = { ...options };
  
  // Remove undefined values
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  
  // Ensure transformAttr and transformVal have defaults if not specified
  if (cleaned.transformAttr === undefined) {
    cleaned.transformAttr = false; // Default: don't transform attributes
  }
  
  if (cleaned.transformVal === undefined) {
    cleaned.transformVal = true; // Default: do transform values (backward compatibility)
  }
  
  return cleaned;
}

/**
 * Create source hooks from configuration
 */
export function createSourceHooks(options, transforms) {
  if (!options) return undefined;
  
  const hooks = {};
  
  if (options.beforeTransform && hasValidTransform(options.beforeTransform)) {
    hooks.beforeTransform = createTransformerFromConfig(options.beforeTransform, transforms);
  }
  
  if (options.afterTransform && hasValidTransform(options.afterTransform)) {
    hooks.afterTransform = createTransformerFromConfig(options.afterTransform, transforms);
  }
  
  return Object.keys(hooks).length > 0 ? hooks : undefined;
}

/**
 * Create node hooks from configuration
 */
export function createNodeHooks(options, transforms) {
  if (!options) return undefined;
  
  const hooks = {};
  
  if (options.beforeTransform && hasValidTransform(options.beforeTransform)) {
    hooks.beforeTransform = createTransformerFromConfig(options.beforeTransform, transforms);
  }
  
  if (options.afterTransform && hasValidTransform(options.afterTransform)) {
    hooks.afterTransform = createTransformerFromConfig(options.afterTransform, transforms);
  }
  
  return Object.keys(hooks).length > 0 ? hooks : undefined;
}

/**
 * Create output hooks from configuration
 */
export function createOutputHooks(options, transforms) {
  if (!options) return undefined;
  
  const hooks = {};
  
  if (options.beforeTransform && hasValidTransform(options.beforeTransform)) {
    hooks.beforeTransform = createTransformerFromConfig(options.beforeTransform, transforms);
  }
  
  if (options.afterTransform && hasValidTransform(options.afterTransform)) {
    hooks.afterTransform = createTransformerFromConfig(options.afterTransform, transforms);
  }
  
  return Object.keys(hooks).length > 0 ? hooks : undefined;
}