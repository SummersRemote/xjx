// stores/pipelineStore.js - Simplified without node targeting
import { defineStore } from 'pinia';

export const usePipelineStore = defineStore('pipeline', {
  state: () => ({
    // Fixed source and output operations with defaults
    sourceOperation: { type: 'fromXml', options: {} },
    outputOperation: { type: 'toJson', options: {} },
    
    // Dynamic functional operations between source and output
    functionalSteps: [],
    
    sourceContent: '<root>\n  <example>Hello World</example>\n  <count>42</count>\n  <active>true</active>\n</root>',
    resultContent: '',
    
    // Available operations with hook support info
    availableOperations: {
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
    },
    
    isProcessing: false,
    error: null,
    
    // Pipeline-level hooks
    enablePipelineHooks: false,
    pipelineHookOptions: {
      logSteps: false,
      logTiming: false
    }
  }),
  
  getters: {
    isValidPipeline() {
      return this.sourceOperation.type && this.outputOperation.type;
    },
    
    sourceOperations() {
      return Object.entries(this.availableOperations)
        .filter(([_, op]) => op.category === 'source')
        .map(([key, op]) => ({ ...op, value: key }));
    },
    
    functionalOperations() {
      return Object.entries(this.availableOperations)
        .filter(([_, op]) => op.category === 'functional')
        .map(([key, op]) => ({ ...op, value: key }));
    },
    
    outputOperations() {
      return Object.entries(this.availableOperations)
        .filter(([_, op]) => op.category === 'output')
        .map(([key, op]) => ({ ...op, value: key }));
    },
    
    // Combine all operations for the pipeline execution
    allSteps() {
      return [
        { id: 'source', ...this.sourceOperation },
        ...this.functionalSteps,
        { id: 'output', ...this.outputOperation }
      ];
    }
  },
  
  actions: {
    updateSourceOperation(type, options = {}) {
      this.sourceOperation = {
        type,
        options: { ...this.getDefaultOptions(type), ...options }
      };
    },
    
    updateOutputOperation(type, options = {}) {
      this.outputOperation = {
        type,
        options: { ...this.getDefaultOptions(type), ...options }
      };
    },
    
    addFunctionalStep(type, position = -1, options = {}) {
      const newStep = {
        id: Date.now(),
        type: type,
        options: { ...this.getDefaultOptions(type), ...options }
      };
      
      if (position === -1) {
        this.functionalSteps.push(newStep);
      } else {
        this.functionalSteps.splice(position, 0, newStep);
      }
      
      return newStep.id;
    },
    
    removeFunctionalStep(id) {
      const index = this.functionalSteps.findIndex(s => s.id === id);
      if (index >= 0) {
        this.functionalSteps.splice(index, 1);
      }
    },
    
    updateFunctionalStep(id, options) {
      const step = this.functionalSteps.find(s => s.id === id);
      if (step) {
        step.options = { ...step.options, ...options };
      }
    },
    
    moveFunctionalStep(id, direction) {
      const index = this.functionalSteps.findIndex(s => s.id === id);
      if (index < 0) return;
      
      if (direction === 'up' && index > 0) {
        [this.functionalSteps[index], this.functionalSteps[index - 1]] = 
        [this.functionalSteps[index - 1], this.functionalSteps[index]];
      } else if (direction === 'down' && index < this.functionalSteps.length - 1) {
        [this.functionalSteps[index], this.functionalSteps[index + 1]] = 
        [this.functionalSteps[index + 1], this.functionalSteps[index]];
      }
    },
    
    resetPipeline() {
      this.sourceOperation = { type: 'fromXml', options: {} };
      this.outputOperation = { type: 'toJson', options: {} };
      this.functionalSteps = [];
    },
    
    swapSourceResult() {
      const temp = this.sourceContent;
      this.sourceContent = this.resultContent;
      this.resultContent = temp;
    },
    
    updateSourceContent(content) {
      this.sourceContent = content;
    },
    
    updateResultContent(content) {
      this.resultContent = content;
    },
    
    updatePipelineHooks(options) {
      this.pipelineHookOptions = { ...this.pipelineHookOptions, ...options };
    },
    
    async executePipeline() {
      if (!this.isValidPipeline) {
        throw new Error('Pipeline must have both source and output operations');
      }
      
      this.isProcessing = true;
      this.error = null;
      
      try {
        // Import XJX library
        const { XJX, toNumber, toBoolean, regex } = await import("../../../dist/esm/index.js");
        
        // Create pipeline hooks if enabled
        const pipelineHooks = this.enablePipelineHooks ? this.createPipelineHooks() : undefined;
        
        // Create XJX instance with config and pipeline hooks
        const configStore = useConfigStore();
        let builder = new XJX()
          .withLogLevel(configStore.logLevel)
          .withConfig(configStore.config);
        
        // If we have pipeline hooks, create a new instance with them
        if (pipelineHooks) {
          builder = new XJX(configStore.config, pipelineHooks)
            .withLogLevel(configStore.logLevel);
        }
        
        // Apply each step in the pipeline
        for (const step of this.allSteps) {
          builder = this.applyStep(builder, step, { toNumber, toBoolean, regex });
        }
           
        // Execute the final operation to get result
        const result = await this.executeTerminalOperation(builder);
               
        // Update result content based on the result type
        if (typeof result === 'string') {
          this.resultContent = result;
        } else if (typeof result === 'object') {
          this.resultContent = JSON.stringify(result, null, 2);
        } else {
          this.resultContent = String(result);
        }
        
      } catch (err) {
        this.error = err.message;
      } finally {
        this.isProcessing = false;
      }
    },
    
    createPipelineHooks() {
      let logger;
      
      // Compose hooks based on selected options
      const hooks = {};
      
      if (this.pipelineHookOptions.logSteps && this.pipelineHookOptions.logTiming) {
        // Both logging and timing enabled - compose them
        hooks.beforeStep = async (stepName, input) => {
          if (!logger) {
            const { LoggerFactory } = await import("../../../dist/esm/index.js");
            logger = LoggerFactory.create('Pipeline');
          }
          console.time(`Step: ${stepName}`);
          logger.info(`Starting step: ${stepName}`, {
            inputType: Array.isArray(input) ? 'array' : typeof input
          });
        };
        
        hooks.afterStep = async (stepName, output) => {
          if (!logger) {
            const { LoggerFactory } = await import("../../../dist/esm/index.js");
            logger = LoggerFactory.create('Pipeline');
          }
          console.timeEnd(`Step: ${stepName}`);
          logger.info(`Completed step: ${stepName}`, {
            outputType: Array.isArray(output) ? 'array' : typeof output
          });
        };
      } else if (this.pipelineHookOptions.logSteps) {
        // Only step logging
        hooks.beforeStep = async (stepName, input) => {
          if (!logger) {
            const { LoggerFactory } = await import("../../../dist/esm/index.js");
            logger = LoggerFactory.create('Pipeline');
          }
          logger.info(`Starting step: ${stepName}`, {
            inputType: Array.isArray(input) ? 'array' : typeof input
          });
        };
        
        hooks.afterStep = async (stepName, output) => {
          if (!logger) {
            const { LoggerFactory } = await import("../../../dist/esm/index.js");
            logger = LoggerFactory.create('Pipeline');
          }
          logger.info(`Completed step: ${stepName}`, {
            outputType: Array.isArray(output) ? 'array' : typeof output
          });
        };
      } else if (this.pipelineHookOptions.logTiming) {
        // Only timing
        hooks.beforeStep = (stepName) => {
          console.time(`Step: ${stepName}`);
        };
        
        hooks.afterStep = (stepName) => {
          console.timeEnd(`Step: ${stepName}`);
        };
      }
      
      return hooks;
    },
    
    applyStep(builder, step, transforms) {
      const { type, options } = step;
            
      switch (type) {
        case 'fromXml': {
          const sourceHooks = this.createSourceHooks(options, transforms);
          return builder.fromXml(this.sourceContent, sourceHooks);
        }
          
        case 'fromJson': {
          try {
            const jsonSource = JSON.parse(this.sourceContent);
            const sourceHooks = this.createSourceHooks(options, transforms);
            return builder.fromJson(jsonSource, sourceHooks);
          } catch (err) {
            throw new Error('Invalid JSON in source content');
          }
        }
          
        case 'fromXnode': {
          const sourceHooks = this.createSourceHooks(options, transforms);
          return builder.fromXml(this.sourceContent, sourceHooks);
        }
          
        case 'filter': {
          const filterPredicate = this.createFunction(options.predicate || 'node => true');
          return builder.filter(filterPredicate);
        }
          
        case 'map': {
          const mainTransform = this.createTransformerFromConfig(options.transform, transforms);
          const nodeHooks = this.createNodeHooks(options, transforms);
          
          if (mainTransform) {
            return builder.map(mainTransform, nodeHooks);
          } else {
            return builder.map(node => node, nodeHooks);
          }
        }
          
        case 'select': {
          const selectPredicate = this.createFunction(options.predicate || 'node => true');
          return builder.select(selectPredicate);
        }
          
        case 'reduce': {
          const reducer = this.createFunction(options.reducer || '(acc, node) => acc + 1');
          const initialValue = this.parseInitialValue(options.initialValue || '0');
          return builder.reduce(initialValue, reducer);
        }
          
        case 'toXml':
        case 'toXmlString':
        case 'toJson':
        case 'toJsonString':
        case 'toXnode': {
          return builder;
        }
          
        default:
          throw new Error(`Unknown operation type: ${type}`);
      }
    },
    
    createSourceHooks(options, transforms) {
      if (!options) return undefined;
      
      const hooks = {};
      
      if (options.beforeTransform && this.hasValidTransform(options.beforeTransform)) {
        hooks.beforeTransform = this.createTransformerFromConfig(options.beforeTransform, transforms);
      }
      
      if (options.afterTransform && this.hasValidTransform(options.afterTransform)) {
        hooks.afterTransform = this.createTransformerFromConfig(options.afterTransform, transforms);
      }
      
      return Object.keys(hooks).length > 0 ? hooks : undefined;
    },
    
    createNodeHooks(options, transforms) {
      if (!options) return undefined;
      
      const hooks = {};
      
      if (options.beforeTransform && this.hasValidTransform(options.beforeTransform)) {
        hooks.beforeTransform = this.createTransformerFromConfig(options.beforeTransform, transforms);
      }
      
      if (options.afterTransform && this.hasValidTransform(options.afterTransform)) {
        hooks.afterTransform = this.createTransformerFromConfig(options.afterTransform, transforms);
      }
      
      return Object.keys(hooks).length > 0 ? hooks : undefined;
    },
    
    createTransformerFromConfig(config, transforms) {
      if (!config) return undefined;
      
      if (config.selectedTransforms && Array.isArray(config.selectedTransforms) && config.selectedTransforms.length > 0) {
        return this.createComposedTransformer(config, transforms);
      }
      
      const { transformType, transformOptions, customTransformer } = config;
      
      if (customTransformer && customTransformer.trim()) {
        return this.createFunction(customTransformer);
      }
      
      if (transformType && transforms[transformType]) {
        return transforms[transformType](transformOptions || {});
      }
      
      return undefined;
    },
    
    createComposedTransformer(config, transforms) {
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
            transformFn = transforms.toBoolean(options);
            break;
          }
          
          case 'toNumber': {
            const options = config.transforms?.toNumber || {};
            transformFn = transforms.toNumber(options);
            break;
          }
          
          case 'regex': {
            const regexConfig = config.transforms?.regex;
            if (regexConfig?.pattern && regexConfig?.replacement !== undefined) {
              transformFn = transforms.regex(regexConfig.pattern, regexConfig.replacement);
            }
            break;
          }
          
          case 'custom': {
            const customConfig = config.transforms?.custom;
            if (customConfig?.customTransformer?.trim()) {
              transformFn = this.createFunction(customConfig.customTransformer);
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
    },
    
    hasValidTransform(config) {
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
    },
    
    async executeTerminalOperation(builder) {
      const { type, options } = this.outputOperation;
      
      const transforms = { toNumber: null, toBoolean: null, regex: null };
      const outputHooks = this.createOutputHooks(options, transforms);
      
      switch (type) {
        case 'toXml':
          return '[XML DOM Document]';
        case 'toXmlString':
          return builder.toXmlString(outputHooks);
        case 'toJson':
          return builder.toJson(outputHooks);
        case 'toJsonString':
          return builder.toJsonString(outputHooks);
        case 'toXnode': {
          const nodes = builder.toXnode(outputHooks);
          return `[${nodes.length} XNode(s)]`;
        }
        case 'reduce':
          return builder;
        default:
          throw new Error(`Unknown terminal operation: ${type}`);
      }
    },
    
    createOutputHooks(options, transforms) {
      if (!options) return undefined;
      
      const hooks = {};
      
      if (options.beforeTransform && this.hasValidTransform(options.beforeTransform)) {
        hooks.beforeTransform = this.createTransformerFromConfig(options.beforeTransform, transforms);
      }
      
      if (options.afterTransform && this.hasValidTransform(options.afterTransform)) {
        hooks.afterTransform = this.createTransformerFromConfig(options.afterTransform, transforms);
      }
      
      return Object.keys(hooks).length > 0 ? hooks : undefined;
    },
    
    createFunction(functionString) {
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
    },
    
    parseInitialValue(value) {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    },
    
    getDefaultOptions(type) {
      const operation = this.availableOperations[type];
      
      if (!operation) return {};
      
      const hookTypes = operation.hookTypes || [];
      const defaultOptions = {};
      
      if (hookTypes.includes('beforeTransform')) {
        defaultOptions.beforeTransform = this.getDefaultTransformConfig();
      }
      
      if (hookTypes.includes('afterTransform')) {
        defaultOptions.afterTransform = this.getDefaultTransformConfig();
      }
      
      switch (type) {
        case 'filter':
        case 'select':
          defaultOptions.predicate = 'node => node.name === "example"';
          break;
          
        case 'map':
          defaultOptions.transform = this.getDefaultTransformConfig();
          break;
          
        case 'reduce':
          defaultOptions.reducer = '(acc, node) => acc + 1';
          defaultOptions.initialValue = '0';
          break;
      }
      
      return defaultOptions;
    },
    
    getDefaultTransformConfig() {
      return {
        selectedTransforms: [],
        transformOrder: [],
        transforms: {
          toBoolean: {
            trueValues: ['true', 'yes', '1', 'on'],
            falseValues: ['false', 'no', '0', 'off'],
            ignoreCase: true
          },
          toNumber: {
            precision: undefined,
            decimalSeparator: '.',
            thousandsSeparator: ',',
            integers: true,
            decimals: true,
            scientific: true
          },
          regex: {
            pattern: '',
            replacement: ''
          },
          custom: {
            customTransformer: ''
          }
        }
      };
    },
    
    generateFluentAPI() {
      if (!this.isValidPipeline) {
        return '// Invalid pipeline: missing source or output operation';
      }
      
      let code = `import { XJX, toNumber, toBoolean, regex, compose } from 'xjx';\n\n`;
      code += `const config = /* your configuration */;\n`;
      code += `const source = /* your source content */;\n\n`;
      
      if (this.enablePipelineHooks) {
        code += this.generatePipelineHooksCode() + '\n';
      }
      
      const transformerDeclarations = this.generateTransformerDeclarations();
      if (transformerDeclarations) {
        code += transformerDeclarations + '\n';
      }
      
      if (this.enablePipelineHooks) {
        code += `const result = new XJX(config, pipelineHooks)`;
      } else {
        code += `const result = new XJX(config)`;
      }
      
      for (const step of this.allSteps) {
        code += this.generateStepCode(step);
      }
      
      code += ';';
      return code;
    },
    
    generatePipelineHooksCode() {
      const hooks = [];
      
      if (this.pipelineHookOptions.logSteps && this.pipelineHookOptions.logTiming) {
        hooks.push(`  beforeStep: (stepName, input) => { console.time(\`Step: \${stepName}\`); logger.info(\`Starting: \${stepName}\`); }`);
        hooks.push(`  afterStep: (stepName, output) => { console.timeEnd(\`Step: \${stepName}\`); logger.info(\`Completed: \${stepName}\`); }`);
      } else if (this.pipelineHookOptions.logSteps) {
        hooks.push(`  beforeStep: (stepName, input) => logger.info(\`Starting: \${stepName}\`)`);
        hooks.push(`  afterStep: (stepName, output) => logger.info(\`Completed: \${stepName}\`)`);
      } else if (this.pipelineHookOptions.logTiming) {
        hooks.push(`  beforeStep: (stepName) => console.time(\`Step: \${stepName}\`)`);
        hooks.push(`  afterStep: (stepName) => console.timeEnd(\`Step: \${stepName}\`)`);
      }
      
      let code = '';
      if (hooks.length > 0) {
        if (this.pipelineHookOptions.logSteps) {
          code += `const { LoggerFactory } = require('xjx');\n`;
          code += `const logger = LoggerFactory.create('Pipeline');\n`;
        }
        code += `const pipelineHooks = {\n${hooks.join(',\n')}\n};\n`;
      }
      
      return code;
    },
    
    generateTransformerDeclarations() {
      const declarations = [];
      const usedNames = new Set();
      
      this.allSteps.forEach((step) => {
        const { options } = step;
        
        ['beforeTransform', 'transform', 'afterTransform'].forEach(hookName => {
          if (options[hookName] && this.hasValidTransform(options[hookName])) {
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
                
                const decl = this.generateSingleTransformerDeclaration(varName, transformType, config);
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
    },
    
    generateSingleTransformerDeclaration(varName, transformType, config) {
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
    },
    
    generateStepCode(step) {
      const { type, options } = step;
      
      switch (type) {
        case 'fromXml':
        case 'fromJson':
        case 'fromXnode': {
          const hooks = this.generateHooksCode(options, ['beforeTransform', 'afterTransform']);
          return hooks ? `\n  .${type}(source, ${hooks})` : `\n  .${type}(source)`;
        }
          
        case 'filter':
        case 'select':
          return `\n  .${type}(${options.predicate || 'node => true'})`;
          
        case 'map': {
          const mainTransform = this.generateTransformCode(options.transform);
          const hooks = this.generateHooksCode(options, ['beforeTransform', 'afterTransform']);
          
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
          const hooks = this.generateHooksCode(options, ['beforeTransform', 'afterTransform']);
          return hooks ? `\n  .${type}(${hooks})` : `\n  .${type}()`;
        }
          
        default:
          return `\n  ./* unknown: ${type} */`;
      }
    },
    
    generateHooksCode(options, hookNames) {
      const hooks = [];
      
      hookNames.forEach(hookName => {
        if (options[hookName] && this.hasValidTransform(options[hookName])) {
          const hookCode = this.generateTransformCode(options[hookName]);
          if (hookCode) {
            hooks.push(`${hookName}: ${hookCode}`);
          }
        }
      });
      
      return hooks.length > 0 ? `{${hooks.join(', ')}}` : '';
    },
    
    generateTransformCode(config) {
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
        const optionsStr = this.generateOptionsString(config.transformOptions);
        return optionsStr ? `${config.transformType}(${optionsStr})` : `${config.transformType}()`;
      } else if (config.customTransformer?.trim()) {
        return config.customTransformer;
      }
      
      return '';
    },
    
    generateOptionsString(options) {
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
  }
});

// Import config store to avoid circular dependency
import { useConfigStore } from './configStore';