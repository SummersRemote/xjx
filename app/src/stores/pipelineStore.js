// stores/pipelineStore.js - Updated for new hook system
import { defineStore } from 'pinia';

export const usePipelineStore = defineStore('pipeline', {
  state: () => ({
    steps: [
      // Default pipeline: fromXml -> toJson
      { id: 1, type: 'fromXml', options: {} },
      { id: 2, type: 'toJson', options: {} }
    ],
    
    sourceContent: '<root>\n  <example>Hello World</example>\n  <count>42</count>\n  <active>true</active>\n</root>',
    resultContent: '',
    
    // Available operations with new hook support info
    availableOperations: {
      // Source operations (support SourceHooks: before/after)
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
        description: 'Keep nodes matching predicate (maintains hierarchy)',
        terminal: false,
        hookTypes: [] // No hooks for predicates
      },
      map: { 
        type: 'map', 
        name: 'Map/Transform', 
        category: 'functional', 
        description: 'Transform every node with primary transform + optional hooks',
        terminal: false,
        hookTypes: ['beforeTransform', 'afterTransform'] // Before/after hooks + main transform
      },
      select: { 
        type: 'select', 
        name: 'Select', 
        category: 'functional', 
        description: 'Collect matching nodes (flattened)',
        terminal: false,
        hookTypes: [] // No hooks for predicates
      },
      reduce: { 
        type: 'reduce', 
        name: 'Reduce', 
        category: 'functional', 
        description: 'Aggregate to single value (simple, no hooks)',
        terminal: true,
        hookTypes: [] // No hooks - keep simple
      },
      
      // Output operations (support OutputHooks: before/after)
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
        description: 'Convert to formatted XML string',
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
        description: 'Convert to formatted JSON string',
        terminal: true,
        hookTypes: ['beforeTransform', 'afterTransform']
      },
      toXnode: { 
        type: 'toXnode', 
        name: 'To XNode', 
        category: 'output', 
        description: 'Convert to XNode array (allows further processing)',
        terminal: false,
        hookTypes: ['beforeTransform', 'afterTransform']
      }
    },
    
    isProcessing: false,
    error: null,
    
    // Pipeline-level hooks for logging/monitoring
    enablePipelineHooks: false,
    pipelineHookOptions: {
      logSteps: false,
      logTiming: false,
      logMemory: false
    }
  }),
  
  getters: {
    hasSourceOperation() {
      return this.steps.some(step => this.availableOperations[step.type]?.category === 'source');
    },
    
    hasOutputOperation() {
      return this.steps.some(step => 
        this.availableOperations[step.type]?.category === 'output' ||
        this.availableOperations[step.type]?.terminal === true
      );
    },
    
    isValidPipeline() {
      return this.hasSourceOperation && this.hasOutputOperation;
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
    }
  },
  
  actions: {
    addStep(type, options = {}) {
      const newStep = {
        id: Date.now(),
        type: type,
        options: { ...this.getDefaultOptions(type), ...options }
      };
      
      this.steps.push(newStep);
    },
    
    removeStep(id) {
      const index = this.steps.findIndex(s => s.id === id);
      if (index >= 0) {
        this.steps.splice(index, 1);
      }
    },
    
    updateStep(id, options) {
      const step = this.steps.find(s => s.id === id);
      if (step) {
        step.options = { ...step.options, ...options };
      }
    },
    
    moveStep(id, direction) {
      const index = this.steps.findIndex(s => s.id === id);
      if (index < 0) return;
      
      if (direction === 'up' && index > 0) {
        [this.steps[index], this.steps[index - 1]] = [this.steps[index - 1], this.steps[index]];
      } else if (direction === 'down' && index < this.steps.length - 1) {
        [this.steps[index], this.steps[index + 1]] = [this.steps[index + 1], this.steps[index]];
      }
    },
    
    clearSteps() {
      this.steps = [
        { id: Date.now(), type: 'fromXml', options: {} },
        { id: Date.now() + 1, type: 'toJson', options: {} }
      ];
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
        const { XJX, toNumber, toBoolean, regex, compose } = await import("../../../dist/esm/index.js");
        
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
        for (const [index, step] of this.steps.entries()) {
          builder = this.applyStep(builder, step, { toNumber, toBoolean, regex, compose });
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
      const hooks = {};
      
      if (this.pipelineHookOptions.logSteps) {
        hooks.beforeStep = (stepName, input) => {
          console.log(`🚀 [PIPELINE] Starting step: ${stepName}`);
          console.log(`📥 [PIPELINE] Input type: ${Array.isArray(input) ? 'array' : typeof input}`);
        };
        
        hooks.afterStep = (stepName, output) => {
          console.log(`✅ [PIPELINE] Completed step: ${stepName}`);
          console.log(`📤 [PIPELINE] Output type: ${Array.isArray(output) ? 'array' : typeof output}`);
        };
      }
      
      if (this.pipelineHookOptions.logTiming) {
        const originalBefore = hooks.beforeStep;
        const originalAfter = hooks.afterStep;
        
        hooks.beforeStep = (stepName, input) => {
          console.time(`⏱️  ${stepName}`);
          if (originalBefore) originalBefore(stepName, input);
        };
        
        hooks.afterStep = (stepName, output) => {
          console.timeEnd(`⏱️  ${stepName}`);
          if (originalAfter) originalAfter(stepName, output);
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
          // NEW: map(transform, hooks) - transform is primary, hooks are optional
          const mainTransform = this.createTransformerFromConfig(options.transform, transforms);
          const nodeHooks = this.createNodeHooks(options, transforms);
          
          if (mainTransform) {
            return builder.map(mainTransform, nodeHooks);
          } else {
            // Fallback identity transform if no main transform specified
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
          // These are handled by executeTerminalOperation
          return builder;
        }
          
        default:
          throw new Error(`Unknown operation type: ${type}`);
      }
    },
    
    createSourceHooks(options, transforms) {
      if (!options) return undefined;
      
      const hooks = {};
      
      // Create beforeTransform hook
      if (options.beforeTransform) {
        hooks.beforeTransform = this.createTransformerFromConfig(options.beforeTransform, transforms);
      }
      
      // Create afterTransform hook
      if (options.afterTransform) {
        hooks.afterTransform = this.createTransformerFromConfig(options.afterTransform, transforms);
      }
      
      return Object.keys(hooks).length > 0 ? hooks : undefined;
    },
    
    createNodeHooks(options, transforms) {
      if (!options) return undefined;
      
      const hooks = {};
      
      // Create beforeTransform hook for map
      if (options.beforeTransform) {
        hooks.beforeTransform = this.createTransformerFromConfig(options.beforeTransform, transforms);
      }
      
      // Create afterTransform hook for map
      if (options.afterTransform) {
        hooks.afterTransform = this.createTransformerFromConfig(options.afterTransform, transforms);
      }
      
      return Object.keys(hooks).length > 0 ? hooks : undefined;
    },
    
    createTransformerFromConfig(config, transforms) {
      if (!config) return undefined;
      
      const { transformType, transformOptions, customTransformer } = config;
      
      // Use custom transformer if provided
      if (customTransformer && customTransformer.trim()) {
        return this.createFunction(customTransformer);
      }
      
      // Use node transform if specified
      if (transformType && transforms[transformType]) {
        return transforms[transformType](transformOptions || {});
      }
      
      return undefined;
    },
    
    async executeTerminalOperation(builder) {
      // Find the last terminal operation in the pipeline
      const terminalStep = [...this.steps].reverse().find(step => 
        this.availableOperations[step.type]?.terminal === true ||
        this.availableOperations[step.type]?.category === 'output'
      );
      
      if (!terminalStep) {
        throw new Error('No terminal operation found');
      }
      
      // Create output hooks if configured
      const outputHooks = this.createSourceHooks(terminalStep.options, {});
      
      switch (terminalStep.type) {
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
          throw new Error(`Unknown terminal operation: ${terminalStep.type}`);
      }
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
        return () => true; // Fallback
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
      
      // Create default hook structure based on operation type
      if (hookTypes.includes('beforeTransform')) {
        defaultOptions.beforeTransform = {
          transformType: null,
          transformOptions: {},
          customTransformer: ''
        };
      }
      
      if (hookTypes.includes('afterTransform')) {
        defaultOptions.afterTransform = {
          transformType: null,
          transformOptions: {},
          customTransformer: ''
        };
      }
      
      // Special defaults for specific operation types
      switch (type) {
        case 'filter':
        case 'select':
          defaultOptions.predicate = 'node => node.name === "example"';
          break;
          
        case 'map':
          // For map, we also need the main transform
          defaultOptions.transform = {
            transformType: null,
            transformOptions: {},
            customTransformer: ''
          };
          break;
          
        case 'reduce':
          defaultOptions.reducer = '(acc, node) => acc + 1';
          defaultOptions.initialValue = '0';
          break;
      }
      
      return defaultOptions;
    },
    
    generateFluentAPI() {
      if (!this.isValidPipeline) {
        return '// Invalid pipeline: missing source or output operation';
      }
      
      let code = `import { XJX, toNumber, toBoolean, regex, compose } from 'xjx';\n\n`;
      code += `const config = /* your configuration */;\n`;
      code += `const source = /* your source content */;\n\n`;
      
      // Add pipeline hooks if enabled
      if (this.enablePipelineHooks) {
        code += this.generatePipelineHooksCode() + '\n';
      }
      
      // Add transformer function declarations
      const transformerDeclarations = this.generateTransformerDeclarations();
      if (transformerDeclarations) {
        code += transformerDeclarations + '\n';
      }
      
      // Create XJX instance
      if (this.enablePipelineHooks) {
        code += `const result = new XJX(config, pipelineHooks)`;
      } else {
        code += `const result = new XJX(config)`;
      }
      
      for (const step of this.steps) {
        code += this.generateStepCode(step);
      }
      
      code += ';';
      return code;
    },
    
    generatePipelineHooksCode() {
      const hooks = [];
      
      if (this.pipelineHookOptions.logSteps) {
        hooks.push(`  beforeStep: (stepName, input) => console.log(\`🚀 Starting: \${stepName}\`)`);
        hooks.push(`  afterStep: (stepName, output) => console.log(\`✅ Completed: \${stepName}\`)`);
      }
      
      if (this.pipelineHookOptions.logTiming) {
        hooks.push(`  beforeStep: (stepName) => console.time(stepName)`);
        hooks.push(`  afterStep: (stepName) => console.timeEnd(stepName)`);
      }
      
      return hooks.length > 0 
        ? `const pipelineHooks = {\n${hooks.join(',\n')}\n};\n`
        : '';
    },
    
    generateTransformerDeclarations() {
      const declarations = [];
      
      this.steps.forEach(step => {
        const { options } = step;
        
        // Check for transformers in hooks
        ['beforeTransform', 'transform', 'afterTransform'].forEach(hookName => {
          if (options[hookName]?.transformType) {
            const decl = this.generateTransformerDeclaration(`${hookName}Fn`, options[hookName]);
            if (decl && !declarations.includes(decl)) {
              declarations.push(decl);
            }
          }
        });
      });
      
      return declarations.length > 0 ? declarations.join('\n') : '';
    },
    
    generateTransformerDeclaration(varName, config) {
      const { transformType, transformOptions } = config;
      
      if (!transformType) return '';
      
      const cleanOptions = { ...transformOptions };
      Object.keys(cleanOptions).forEach(key => {
        if (cleanOptions[key] === undefined || cleanOptions[key] === '') {
          delete cleanOptions[key];
        }
      });
      
      const optionsStr = Object.keys(cleanOptions).length > 0 
        ? JSON.stringify(cleanOptions) 
        : '';
      
      return optionsStr 
        ? `const ${varName} = ${transformType}(${optionsStr});`
        : `const ${varName} = ${transformType}();`;
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
        if (options[hookName]) {
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
      
      if (config.transformType) {
        return `${config.transformType}Fn`;
      } else if (config.customTransformer?.trim()) {
        return config.customTransformer;
      }
      
      return '';
    }
  }
});

// Import config store to avoid circular dependency
import { useConfigStore } from './configStore';