// stores/pipelineStore.js - Updated with custom pipeline hooks support
import { defineStore } from 'pinia';
import { availableOperations, getDefaultOptions } from './operationsConfig.js';
import { 
  createFunction, 
  parseInitialValue, 
  createSourceHooks, 
  createNodeHooks, 
  createOutputHooks,
  createTransformerFromConfig,
  hasValidTransform
} from './transformHelpers.js';
import { generateFluentAPI } from './codeGeneration.js';

export const usePipelineStore = defineStore('pipeline', {
  state: () => ({
    // Fixed source and output operations with defaults
    sourceOperation: { type: 'fromXml', options: {} },
    outputOperation: { type: 'toJson', options: {} },
    
    // Dynamic functional operations between source and output
    functionalSteps: [],
    
    sourceContent: `<catalog>
  <products>
    <item id="1" category="electronics">
      <n>Laptop</n>
      <price currency="USD">999.99</price>
      <stock>15</stock>
      <active>true</active>
    </item>
    <item id="2" category="books">
      <n>XML Guide</n>
      <price currency="USD">29.99</price>
      <stock>50</stock>
      <active>true</active>
    </item>
    <item id="3" category="electronics">
      <n>Smartphone</n>
      <price currency="USD">699.99</price>
      <stock>0</stock>
      <active>false</active>
    </item>
  </products>
</catalog>`,
    resultContent: '',
    
    // Available operations imported from config
    availableOperations,
    
    isProcessing: false,
    error: null,
    
    // Pipeline-level hooks - UPDATED with custom hooks support
    enablePipelineHooks: false,
    pipelineHookOptions: {
      // Built-in hook options
      logSteps: false,
      logTiming: false,
      
      // Custom hook functions
      customBeforeStep: '',
      customAfterStep: ''
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
        options: { ...getDefaultOptions(type), ...options }
      };
    },
    
    updateOutputOperation(type, options = {}) {
      this.outputOperation = {
        type,
        options: { ...getDefaultOptions(type), ...options }
      };
    },
    
    addFunctionalStep(type, position = -1, options = {}) {
      const newStep = {
        id: Date.now(),
        type: type,
        options: { ...getDefaultOptions(type), ...options }
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
    
    // Delegate to helper function
    getDefaultOptions(type) {
      return getDefaultOptions(type);
    },
    
    // Delegate to code generation module
    generateFluentAPI() {
      return generateFluentAPI(this);
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
    
    // UPDATED: Enhanced createPipelineHooks with custom hook composition
    createPipelineHooks() {
      let logger;
      const options = this.pipelineHookOptions;
      
      // Parse custom hook functions
      let customBeforeStepFn = null;
      let customAfterStepFn = null;
      
      if (options.customBeforeStep && options.customBeforeStep.trim()) {
        try {
          customBeforeStepFn = createFunction(options.customBeforeStep);
        } catch (err) {
          console.warn('Error parsing custom beforeStep hook:', err);
        }
      }
      
      if (options.customAfterStep && options.customAfterStep.trim()) {
        try {
          customAfterStepFn = createFunction(options.customAfterStep);
        } catch (err) {
          console.warn('Error parsing custom afterStep hook:', err);
        }
      }
      
      // Compose hooks based on selected options
      const hooks = {};
      
      // Create composed beforeStep hook
      if (options.logSteps || options.logTiming || customBeforeStepFn) {
        hooks.beforeStep = async (stepName, input) => {
          // Built-in timing hook
          if (options.logTiming) {
            console.time(`Step: ${stepName}`);
          }
          
          // Built-in logging hook
          if (options.logSteps) {
            if (!logger) {
              const { LoggerFactory } = await import("../../../dist/esm/index.js");
              logger = LoggerFactory.create('Pipeline');
            }
            logger.info(`Starting step: ${stepName}`, {
              inputType: Array.isArray(input) ? 'array' : typeof input
            });
          }
          
          // Custom beforeStep hook
          if (customBeforeStepFn) {
            try {
              customBeforeStepFn(stepName, input);
            } catch (err) {
              console.warn(`Error in custom beforeStep hook for ${stepName}:`, err);
            }
          }
        };
      }
      
      // Create composed afterStep hook
      if (options.logSteps || options.logTiming || customAfterStepFn) {
        hooks.afterStep = async (stepName, output) => {
          // Built-in timing hook
          if (options.logTiming) {
            console.timeEnd(`Step: ${stepName}`);
          }
          
          // Built-in logging hook
          if (options.logSteps) {
            if (!logger) {
              const { LoggerFactory } = await import("../../../dist/esm/index.js");
              logger = LoggerFactory.create('Pipeline');
            }
            logger.info(`Completed step: ${stepName}`, {
              outputType: Array.isArray(output) ? 'array' : typeof output
            });
          }
          
          // Custom afterStep hook
          if (customAfterStepFn) {
            try {
              customAfterStepFn(stepName, output);
            } catch (err) {
              console.warn(`Error in custom afterStep hook for ${stepName}:`, err);
            }
          }
        };
      }
      
      return hooks;
    },
    
applyStep(builder, step, transforms) {
      const { type, options } = step;
            
      switch (type) {
        case 'fromXml': {
          const sourceHooks = createSourceHooks(options, transforms);
          return builder.fromXml(this.sourceContent, sourceHooks);
        }
          
        case 'fromJson': {
          try {
            const jsonSource = JSON.parse(this.sourceContent);
            const sourceHooks = createSourceHooks(options, transforms);
            return builder.fromJson(jsonSource, sourceHooks);
          } catch (err) {
            throw new Error('Invalid JSON in source content');
          }
        }
          
        case 'fromXnode': {
          const sourceHooks = createSourceHooks(options, transforms);
          return builder.fromXml(this.sourceContent, sourceHooks);
        }
          
        case 'filter': {
          const filterPredicate = createFunction(options.predicate || 'node => true');
          return builder.filter(filterPredicate);
        }
          
        case 'map': {
          const mainTransform = createTransformerFromConfig(options.transform, transforms);
          const nodeHooks = createNodeHooks(options, transforms);
          
          if (mainTransform) {
            return builder.map(mainTransform, nodeHooks);
          } else {
            return builder.map(node => node, nodeHooks);
          }
        }
          
        case 'select': {
          const selectPredicate = createFunction(options.predicate || 'node => true');
          return builder.select(selectPredicate);
        }
          
        case 'branch': {
          const branchPredicate = createFunction(options.predicate || 'node => true');
          return builder.branch(branchPredicate);
        }
          
        case 'merge': {
          return builder.merge();
        }
          
        case 'withConfig': {
          try {
            const configUpdate = JSON.parse(options.config || '{}');
            return builder.withConfig(configUpdate);
          } catch (err) {
            throw new Error('Invalid JSON in withConfig: ' + err.message);
          }
        }
          
        case 'reduce': {
          const reducer = createFunction(options.reducer || '(acc, node) => acc + 1');
          const initialValue = parseInitialValue(options.initialValue || '0');
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
    
    async executeTerminalOperation(builder) {
      const { type, options } = this.outputOperation;
      
      const transforms = { toNumber: null, toBoolean: null, regex: null };
      const outputHooks = createOutputHooks(options, transforms);
      
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
    }
  }
});

// Import config store to avoid circular dependency
import { useConfigStore } from './configStore';