// stores/pipelineStore.js - Updated with transformer callbacks
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
    
    // Available operations from the actual XJX library
    availableOperations: {
      // Source operations
      fromXml: { 
        type: 'fromXml', 
        name: 'From XML', 
        category: 'source', 
        description: 'Parse XML string as source',
        terminal: false
      },
      fromJson: { 
        type: 'fromJson', 
        name: 'From JSON', 
        category: 'source', 
        description: 'Parse JSON object as source',
        terminal: false
      },
      fromXnode: { 
        type: 'fromXnode', 
        name: 'From XNode', 
        category: 'source', 
        description: 'Use XNode array as source',
        terminal: false
      },
      
      // Functional operations
      filter: { 
        type: 'filter', 
        name: 'Filter', 
        category: 'functional', 
        description: 'Keep nodes matching predicate (maintains hierarchy)',
        terminal: false
      },
      map: { 
        type: 'map', 
        name: 'Map/Transform', 
        category: 'functional', 
        description: 'Transform every node in the document',
        terminal: false
      },
      select: { 
        type: 'select', 
        name: 'Select', 
        category: 'functional', 
        description: 'Collect matching nodes (flattened)',
        terminal: false
      },
      reduce: { 
        type: 'reduce', 
        name: 'Reduce', 
        category: 'functional', 
        description: 'Aggregate to single value (terminal)',
        terminal: true
      },
      
      // Output operations  
      toXml: { 
        type: 'toXml', 
        name: 'To XML DOM', 
        category: 'output', 
        description: 'Convert to XML DOM Document',
        terminal: true
      },
      toXmlString: { 
        type: 'toXmlString', 
        name: 'To XML String', 
        category: 'output', 
        description: 'Convert to formatted XML string',
        terminal: true
      },
      toJson: { 
        type: 'toJson', 
        name: 'To JSON', 
        category: 'output', 
        description: 'Convert to JSON object',
        terminal: true
      },
      toJsonString: { 
        type: 'toJsonString', 
        name: 'To JSON String', 
        category: 'output', 
        description: 'Convert to formatted JSON string',
        terminal: true
      },
      toXnode: { 
        type: 'toXnode', 
        name: 'To XNode', 
        category: 'output', 
        description: 'Convert to XNode array (allows further processing)',
        terminal: false  // Can continue processing
      }
    },
    
    isProcessing: false,
    error: null
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
    
    async executePipeline() {
      if (!this.isValidPipeline) {
        throw new Error('Pipeline must have both source and output operations');
      }
      
      this.isProcessing = true;
      this.error = null;
      
      try {
        
        // Import XJX library
        const { XJX, toNumber, toBoolean, regex, compose } = await import("../../../dist/esm/index.js");
        
        // Create XJX instance with config
        const configStore = useConfigStore();
        let builder = new XJX().withLogLevel(configStore.logLevel).withConfig(configStore.config);
        
        
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
    
    applyStep(builder, step, transforms) {
      const { type, options } = step;
            
      switch (type) {
        case 'fromXml': {
          const beforeFn = this.createTransformerCallback(options.beforeCallback, transforms);
          const afterFn = this.createTransformerCallback(options.afterCallback, transforms);
          return builder.fromXml(this.sourceContent, beforeFn, afterFn);
        }
          
        case 'fromJson': {
          try {
            const jsonSource = JSON.parse(this.sourceContent);
            const beforeFn = this.createTransformerCallback(options.beforeCallback, transforms);
            const afterFn = this.createTransformerCallback(options.afterCallback, transforms);
            return builder.fromJson(jsonSource, undefined, beforeFn, afterFn);
          } catch (err) {
            throw new Error('Invalid JSON in source content');
          }
        }
          
        case 'fromXnode': {
          // For demo purposes, we'll convert current source to XNode first
          const beforeFn = this.createTransformerCallback(options.beforeCallback, transforms);
          const afterFn = this.createTransformerCallback(options.afterCallback, transforms);
          return builder.fromXml(this.sourceContent, beforeFn, afterFn);
        }
          
        case 'filter': {
          const filterPredicate = this.createFunction(options.predicate || 'node => true');
          return builder.filter(filterPredicate);
        }
          
        case 'map': {
          const mapTransformer = this.createTransformer(options, transforms);
          return builder.map(mapTransformer);
        }
          
        case 'select': {
          const selectPredicate = this.createFunction(options.predicate || 'node => true');
          return builder.select(selectPredicate);
        }
          
        case 'reduce': {
          const reducer = this.createFunction(options.reducer || '(acc, node) => acc + 1');
          const initialValue = this.parseInitialValue(options.initialValue || '0');
          return builder.reduce(reducer, initialValue);
        }
          
        case 'toXml':
        case 'toXmlString':
        case 'toJson':
        case 'toJsonString':
        case 'toXnode':
          // These are handled by executeTerminalOperation
          return builder;
          
        default:
          throw new Error(`Unknown operation type: ${type}`);
      }
    },
    
    createTransformerCallback(callbackConfig, transforms) {
      if (!callbackConfig) return undefined;
      
      const { transformType, transformOptions, customTransformer } = callbackConfig;
      
      // Use custom transformer if provided
      if (customTransformer && customTransformer.trim()) {
        return this.createFunction(customTransformer);
      }
      
      // Use node transform if specified
      if (transformType && transforms[transformType]) {
        return transforms[transformType](transformOptions || {});
      }
      
      // No transformer specified
      return undefined;
    },
    
    createTransformer(options, transforms) {
      const { transformType, transformOptions, customTransformer } = options;
      
      // Use custom transformer if provided
      if (customTransformer && customTransformer.trim()) {
        return this.createFunction(customTransformer);
      }
      
      // Use node transform if specified
      if (transformType && transforms[transformType]) {
        return transforms[transformType](transformOptions || {});
      }
      
      // Default identity transformer
      return node => node;
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
      
      switch (terminalStep.type) {
        case 'toXml':
          return '[XML DOM Document]'; // Can't display DOM directly
        case 'toXmlString':
          return builder.toXmlString();
        case 'toJson':
          return builder.toJson();
        case 'toJsonString':
          return builder.toJsonString();
        case 'toXnode': {
          const nodes = builder.toXnode();
          return `[${nodes.length} XNode(s)]`; // Can't display XNodes directly
        }
        case 'reduce':
          // Reduce was already applied in applyStep
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
        return value; // Return as string if not valid JSON
      }
    },
    
    getDefaultOptions(type) {
      switch (type) {
        case 'fromXml':
        case 'fromJson':
        case 'fromXnode':
          return {
            beforeCallback: {
              transformType: null,
              transformOptions: {},
              customTransformer: ''
            },
            afterCallback: {
              transformType: null,
              transformOptions: {},
              customTransformer: ''
            }
          };
          
        case 'filter':
        case 'select':
          return { predicate: 'node => node.name === "example"' };
          
        case 'map':
          return { 
            transformType: null,
            transformOptions: {},
            customTransformer: ''
          };
          
        case 'reduce':
          return { 
            reducer: '(acc, node) => acc + 1', 
            initialValue: '0'
          };
          
        default:
          return {};
      }
    },
    
    generateFluentAPI() {
      if (!this.isValidPipeline) {
        return '// Invalid pipeline: missing source or output operation';
      }
      
      let code = `import { XJX, toNumber, toBoolean, regex, compose } from 'xjx';\n\n`;
      code += `const config = /* your configuration */;\n`;
      code += `const source = /* your source content */;\n\n`;
      
      // Add transformer function declarations if any step uses them
      const transformerDeclarations = this.generateTransformerDeclarations();
      if (transformerDeclarations) {
        code += transformerDeclarations + '\n';
      }
      
      code += `const result = new XJX()\n  .withConfig(config)`;
      
      for (const step of this.steps) {
        code += this.generateStepCode(step);
      }
      
      code += ';';
      return code;
    },
    
    generateTransformerDeclarations() {
      const declarations = [];
      
      // Check all steps for transformer usage
      this.steps.forEach(step => {
        const { options } = step;
        
        // Check source callbacks
        if (options.beforeCallback?.transformType) {
          const decl = this.generateTransformerDeclaration('beforeFn', options.beforeCallback);
          if (decl && !declarations.includes(decl)) {
            declarations.push(decl);
          }
        }
        
        if (options.afterCallback?.transformType) {
          const decl = this.generateTransformerDeclaration('afterFn', options.afterCallback);
          if (decl && !declarations.includes(decl)) {
            declarations.push(decl);
          }
        }
        
        // Check map transformers
        if (options.transformType) {
          const decl = this.generateTransformerDeclaration('transformer', options);
          if (decl && !declarations.includes(decl)) {
            declarations.push(decl);
          }
        }
      });
      
      return declarations.length > 0 ? declarations.join('\n') : '';
    },
    
    generateTransformerDeclaration(varName, config) {
      const { transformType, transformOptions } = config;
      
      if (!transformType) return '';
      
      // Clean up the options object for display
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
          const callbacks = [];
          
          if (options.beforeCallback?.transformType) {
            callbacks.push('beforeFn');
          } else if (options.beforeCallback?.customTransformer?.trim()) {
            callbacks.push(`${options.beforeCallback.customTransformer}`);
          }
          
          if (options.afterCallback?.transformType) {
            callbacks.push('afterFn');
          } else if (options.afterCallback?.customTransformer?.trim()) {
            callbacks.push(`${options.afterCallback.customTransformer}`);
          }
          
          const callbacksStr = callbacks.length > 0 ? `, ${callbacks.join(', ')}` : '';
          return `\n  .${type}(source${callbacksStr})`;
        }
          
        case 'filter':
        case 'select':
          return `\n  .${type}(${options.predicate || 'node => true'})`;
          
        case 'map': {
          if (options.transformType) {
            return `\n  .map(transformer)`;
          } else if (options.customTransformer && options.customTransformer.trim()) {
            return `\n  .map(${options.customTransformer})`;
          } else {
            return `\n  .map(node => node)`;
          }
        }
          
        case 'reduce':
          return `\n  .reduce(${options.reducer || '(acc, node) => acc + 1'}, ${options.initialValue || '0'})`;
          
        case 'toXml':
        case 'toXmlString':
        case 'toJson':
        case 'toJsonString':
        case 'toXnode':
          return `\n  .${type}()`;
          
        default:
          return `\n  ./* unknown: ${type} */`;
      }
    }
  }
});

// Import config store to avoid circular dependency
import { useConfigStore } from './configStore';