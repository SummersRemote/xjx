/**
 * XJX - Main class with fluent API and Pipeline Hooks
 */
import { LoggerFactory } from "./core/logger";
const logger = LoggerFactory.create();

import { Configuration, createConfig } from "./core/config";
import { Transform } from "./core/functional";
import { XNode, cloneNode } from "./core/xnode";
import { validate, ValidationError } from "./core/error";
import { Extension, TerminalExtensionContext, NonTerminalExtensionContext } from "./core/extension";
import { PipelineHooks } from "./core/converter";

/**
 * Main XJX class - provides the fluent API for XML/JSON transformation with pipeline hooks
 */
export class XJX implements TerminalExtensionContext, NonTerminalExtensionContext {
  // Instance properties
  public xnode: XNode | null = null;
  public transforms: Transform[] = [];
  public config: Configuration;
  public pipelineHooks?: PipelineHooks;
  
  /**
   * Create a new XJX instance
   * @param config Optional configuration
   * @param pipelineHooks Optional pipeline-level hooks for cross-cutting concerns
   */
  constructor(config?: Partial<Configuration>, pipelineHooks?: PipelineHooks) {
    this.config = createConfig(config);
    this.pipelineHooks = pipelineHooks;
    
    logger.debug('Created new XJX instance with configuration', {
      preserveNamespaces: this.config.preserveNamespaces,
      preserveComments: this.config.preserveComments,
      preserveTextNodes: this.config.preserveTextNodes,
      highFidelity: this.config.strategies.highFidelity,
      hasPipelineHooks: !!pipelineHooks
    });
  }
  
  /**
   * Execute pipeline hook before a step
   * @param stepName Name of the step being executed
   * @param input Input to the step
   * @returns Potentially modified input
   */
  public executeBeforeStepHook(stepName: string, input: any): any {
    if (this.pipelineHooks?.beforeStep) {
      try {
        this.pipelineHooks.beforeStep(stepName, input);
      } catch (err) {
        logger.warn(`Error in pipeline beforeStep hook for ${stepName}:`, err);
      }
    }
    return input;
  }
  
  /**
   * Execute pipeline hook after a step
   * @param stepName Name of the step that was executed
   * @param output Output from the step
   * @returns Potentially modified output
   */
  public executeAfterStepHook(stepName: string, output: any): any {
    if (this.pipelineHooks?.afterStep) {
      try {
        this.pipelineHooks.afterStep(stepName, output);
      } catch (err) {
        logger.warn(`Error in pipeline afterStep hook for ${stepName}:`, err);
      }
    }
    return output;
  }
  
  /**
   * Register a terminal extension method (returns a value)
   * @param name Extension name (e.g., 'toXml')
   * @param method Implementation function
   */
  public static registerTerminalExtension(name: string, method: (this: TerminalExtensionContext, ...args: any[]) => any): void {
    try {
      // Validate inputs
      validate(typeof name === "string" && name.length > 0, "Extension name must be a non-empty string");
      validate(typeof method === "function", "Extension method must be a function");
      
      logger.debug('Registering terminal extension', { name });
      
      // Add method to XJX prototype
      (XJX.prototype as any)[name] = function(...args: any[]): any {
        // Execute pipeline beforeStep hook
        this.executeBeforeStepHook(name, this.xnode || args[0]);
        
        // Validate source first for terminal extensions
        this.validateSource();
        
        // Call the implementation method with this context
        const result = method.apply(this, args);
        
        // Execute pipeline afterStep hook
        this.executeAfterStepHook(name, result);
        
        return result;
      };
      
      logger.debug('Terminal extension registered', { name });
    } catch (err) {
      logger.error(`Failed to register terminal extension ${name}`, { error: err });
      throw err;
    }
  }

  /**
   * Register a non-terminal extension method (returns this for chaining)
   * @param name Extension name (e.g., 'fromXml')
   * @param method Implementation function
   */
  public static registerNonTerminalExtension(name: string, method: (this: NonTerminalExtensionContext, ...args: any[]) => void): void {
    try {
      // Validate inputs
      validate(typeof name === "string" && name.length > 0, "Extension name must be a non-empty string");
      validate(typeof method === "function", "Extension method must be a function");
      
      logger.debug('Registering non-terminal extension', { name });
      
      // Add method to XJX prototype that returns this
      (XJX.prototype as any)[name] = function(...args: any[]): XJX {
        // Execute pipeline beforeStep hook
        this.executeBeforeStepHook(name, args[0] || this.xnode);
        
        // Call the implementation method with this context
        method.apply(this, args);
        
        // Execute pipeline afterStep hook
        this.executeAfterStepHook(name, this.xnode);
        
        // Return this for chaining
        return this;
      };
      
      logger.debug('Non-terminal extension registered', { name });
    } catch (err) {
      logger.error(`Failed to register non-terminal extension ${name}`, { error: err });
      throw err;
    }
  }
  
  // --- Utility Methods ---
  
  /**
   * Validate that a source has been set before transformation
   * @throws Error if no source has been set
   */
  public validateSource(): void {
    if (!this.xnode) {
      throw new ValidationError('No source set: call fromXml(), fromJson(), or fromXnode() before transformation');
    }
  }
  
  /**
   * Clone an XNode
   * @param node Node to clone
   * @param deep Whether to clone deeply
   * @returns Cloned node
   */
  public cloneNode(node: XNode, deep: boolean = false): XNode {
    return cloneNode(node, deep);
  }
  
  /**
   * Deep clone a value
   */
  public deepClone<T>(obj: T): T {
    if (obj === undefined || obj === null) {
      return obj;
    }
    return JSON.parse(JSON.stringify(obj));
  }
  
  /**
   * Deep merge two objects
   */
  public deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    if (!source || typeof source !== 'object' || source === null) {
      return this.deepClone(target);
    }

    if (!target || typeof target !== 'object' || target === null) {
      return this.deepClone(source) as T;
    }

    const result = this.deepClone(target);

    Object.keys(source).forEach((key) => {
      const sourceValue = source[key as keyof Partial<T>];
      const targetValue = result[key as keyof T];

      if (
        sourceValue !== null &&
        targetValue !== null &&
        typeof sourceValue === 'object' &&
        typeof targetValue === 'object' &&
        !Array.isArray(sourceValue) &&
        !Array.isArray(targetValue)
      ) {
        (result[key as keyof T] as any) = this.deepMerge(
          targetValue as Record<string, any>,
          sourceValue as Record<string, any>
        );
      } else {
        (result[key as keyof T] as any) = this.deepClone(sourceValue);
      }
    });

    return result;
  }
}

export default XJX;