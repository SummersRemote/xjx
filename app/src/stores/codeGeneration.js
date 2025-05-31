// stores/codeGeneration.js - Fluent API code generation logic

import { hasValidTransform } from './transformHelpers.js';

/**
 * Generate complete fluent API code
 */
export function generateFluentAPI(state) {
  if (!state.isValidPipeline) {
    return '// Invalid pipeline: missing source or output operation';
  }
  
  let code = `import { XJX, toNumber, toBoolean, regex, compose } from 'xjx';\n\n`;
  code += `const config = /* your configuration */;\n`;
  code += `const source = /* your source content */;\n\n`;
  
  if (state.enablePipelineHooks) {
    code += generatePipelineHooksCode(state) + '\n';
  }
  
  const transformerDeclarations = generateTransformerDeclarations(state);
  if (transformerDeclarations) {
    code += transformerDeclarations + '\n';
  }
  
  if (state.enablePipelineHooks) {
    code += `const result = new XJX(config, pipelineHooks)`;
  } else {
    code += `const result = new XJX(config)`;
  }
  
  for (const step of state.allSteps) {
    code += generateStepCode(step);
  }
  
  code += ';';
  return code;
}

/**
 * Generate pipeline hooks code
 */
function generatePipelineHooksCode(state) {
  const hooks = [];
  
  if (state.pipelineHookOptions.logSteps && state.pipelineHookOptions.logTiming) {
    hooks.push(`  beforeStep: (stepName, input) => { console.time(\`Step: \${stepName}\`); logger.info(\`Starting: \${stepName}\`); }`);
    hooks.push(`  afterStep: (stepName, output) => { console.timeEnd(\`Step: \${stepName}\`); logger.info(\`Completed: \${stepName}\`); }`);
  } else if (state.pipelineHookOptions.logSteps) {
    hooks.push(`  beforeStep: (stepName, input) => logger.info(\`Starting: \${stepName}\`)`);
    hooks.push(`  afterStep: (stepName, output) => logger.info(\`Completed: \${stepName}\`)`);
  } else if (state.pipelineHookOptions.logTiming) {
    hooks.push(`  beforeStep: (stepName) => console.time(\`Step: \${stepName}\`)`);
    hooks.push(`  afterStep: (stepName) => console.timeEnd(\`Step: \${stepName}\`)`);
  }
  
  let code = '';
  if (hooks.length > 0) {
    if (state.pipelineHookOptions.logSteps) {
      code += `const { LoggerFactory } = require('xjx');\n`;
      code += `const logger = LoggerFactory.create('Pipeline');\n`;
    }
    code += `const pipelineHooks = {\n${hooks.join(',\n')}\n};\n`;
  }
  
  return code;
}

/**
 * Generate transformer declarations
 */
function generateTransformerDeclarations(state) {
  const declarations = [];
  const usedNames = new Set();
  
  state.allSteps.forEach((step) => {
    const { options } = step;
    
    ['beforeTransform', 'transform', 'afterTransform'].forEach(hookName => {
      if (options[hookName] && hasValidTransform(options[hookName])) {
        const config = options[hookName];
        
        if (config.selectedTransforms && config.transformOrder) {
          config.transformOrder.forEach((transformType) => {
            const baseName = `${transformType}Fn`;
            let varName = baseName;
            let counter = 1;
            
            while (usedNames.has(varName)) {
              varName = `${baseName}${counter}`;
              counter++;
            }
            usedNames.add(varName);
            
            const decl = generateSingleTransformerDeclaration(varName, transformType, config);
            if (decl && !declarations.some(d => d.includes(varName))) {
              declarations.push(decl);
            }
          });
          
          if (config.transformOrder.length > 1) {
            const composedName = `${hookName}ComposedFn`;
            let composedVarName = composedName;
            let counter = 1;
            
            while (usedNames.has(composedVarName)) {
              composedVarName = `${composedName}${counter}`;
              counter++;
            }
            usedNames.add(composedVarName);
            
            const transformRefs = config.transformOrder.map(type => `${type}Fn`).join(', ');
            declarations.push(`const ${composedVarName} = compose(${transformRefs});`);
            
            config._generatedVarName = composedVarName;
          } else if (config.transformOrder.length === 1) {
            config._generatedVarName = `${config.transformOrder[0]}Fn`;
          }
        }
      }
    });
  });
  
  return declarations.length > 0 ? declarations.join('\n') : '';
}

/**
 * Generate single transformer declaration
 */
function generateSingleTransformerDeclaration(varName, transformType, config) {
  const transformConfig = config.transforms?.[transformType];
  if (!transformConfig) return '';
  
  let cleanOptions = {};
  
  switch (transformType) {
    case 'toBoolean':
    case 'toNumber':
      cleanOptions = { ...transformConfig };
      break;
      
    case 'regex':
      if (transformConfig.pattern && transformConfig.replacement !== undefined) {
        return `const ${varName} = regex(${JSON.stringify(transformConfig.pattern)}, ${JSON.stringify(transformConfig.replacement)});`;
      }
      return '';
      
    case 'custom':
      if (transformConfig.customTransformer?.trim()) {
        return `const ${varName} = ${transformConfig.customTransformer};`;
      }
      return '';
      
    default:
      return '';
  }
  
  Object.keys(cleanOptions).forEach(key => {
    if (cleanOptions[key] === undefined || cleanOptions[key] === '' || 
        (Array.isArray(cleanOptions[key]) && cleanOptions[key].length === 0)) {
      delete cleanOptions[key];
    }
  });
  
  const optionsStr = Object.keys(cleanOptions).length > 0 ? 
    JSON.stringify(cleanOptions) : '';
  
  return optionsStr ? 
    `const ${varName} = ${transformType}(${optionsStr});` :
    `const ${varName} = ${transformType}();`;
}

/**
 * Generate code for a single step
 */
function generateStepCode(step) {
  const { type, options } = step;
  
  switch (type) {
    case 'fromXml':
    case 'fromJson':
    case 'fromXnode': {
      const hooks = generateHooksCode(options, ['beforeTransform', 'afterTransform']);
      return hooks ? `\n  .${type}(source, ${hooks})` : `\n  .${type}(source)`;
    }
      
    case 'filter':
    case 'select':
    case 'branch':
      return `\n  .${type}(${options.predicate || 'node => true'})`;
      
    case 'merge':
      return `\n  .merge()`;
      
    case 'map': {
      const mainTransform = generateTransformCode(options.transform);
      const hooks = generateHooksCode(options, ['beforeTransform', 'afterTransform']);
      
      if (mainTransform && hooks) {
        return `\n  .map(${mainTransform}, ${hooks})`;
      } else if (mainTransform) {
        return `\n  .map(${mainTransform})`;
      } else {
        return `\n  .map(node => node)`;
      }
    }
      
    case 'reduce':
      return `\n  .reduce(${options.initialValue || '0'}, ${options.reducer || '(acc, node) => acc + 1'})`;
      
    case 'toXml':
    case 'toXmlString':
    case 'toJson':
    case 'toJsonString':
    case 'toXnode': {
      const hooks = generateHooksCode(options, ['beforeTransform', 'afterTransform']);
      return hooks ? `\n  .${type}(${hooks})` : `\n  .${type}()`;
    }
      
    default:
      return `\n  ./* unknown: ${type} */`;
  }
}

/**
 * Generate hooks code
 */
function generateHooksCode(options, hookNames) {
  const hooks = [];
  
  hookNames.forEach(hookName => {
    if (options[hookName] && hasValidTransform(options[hookName])) {
      const hookCode = generateTransformCode(options[hookName]);
      if (hookCode) {
        hooks.push(`${hookName}: ${hookCode}`);
      }
    }
  });
  
  return hooks.length > 0 ? `{${hooks.join(', ')}}` : '';
}

/**
 * Generate transform code
 */
function generateTransformCode(config) {
  if (!config) return '';
  
  if (config._generatedVarName) {
    return config._generatedVarName;
  }
  
  if (config.selectedTransforms && config.transformOrder) {
    if (config.transformOrder.length === 0) {
      return '';
    } else if (config.transformOrder.length === 1) {
      return `${config.transformOrder[0]}Fn`;
    } else {
      const transformRefs = config.transformOrder.map(type => `${type}Fn`).join(', ');
      return `compose(${transformRefs})`;
    }
  }
  
  if (config.transformType) {
    const optionsStr = generateOptionsString(config.transformOptions);
    return optionsStr ? `${config.transformType}(${optionsStr})` : `${config.transformType}()`;
  } else if (config.customTransformer?.trim()) {
    return config.customTransformer;
  }
  
  return '';
}

/**
 * Generate options string
 */
function generateOptionsString(options) {
  if (!options || typeof options !== 'object') return '';
  
  const cleanOptions = { ...options };
  Object.keys(cleanOptions).forEach(key => {
    if (cleanOptions[key] === undefined || cleanOptions[key] === '' || 
        (Array.isArray(cleanOptions[key]) && cleanOptions[key].length === 0)) {
      delete cleanOptions[key];
    }
  });
  
  return Object.keys(cleanOptions).length > 0 
    ? JSON.stringify(cleanOptions) 
    : '';
}