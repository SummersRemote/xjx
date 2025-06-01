/**
 * XJX - Main class with unified pipeline context and standardized operations
 */
import { LoggerFactory } from "./core/logger";
const logger = LoggerFactory.create();

import { Configuration, createConfig } from "./core/config";
import { XNode, cloneNode } from "./core/xnode";
import { validate, ValidationError } from "./core/error";
import { UnifiedExtensionContext, TerminalExtensionContext, NonTerminalExtensionContext, BranchContext } from "./core/extension";
import { PipelineHooks, SourceHooks, OutputHooks, NodeHooks } from "./core/hooks";
import { PipelineContext, PipelineContextImpl } from "./core/context";
import { UnifiedConverter, PipelineStage, Pipeline } from "./core/pipeline";

/**
 * Main XJX class - provides the fluent API for XML/JSON transformation with unified pipeline architecture
 */
export class XJX implements UnifiedExtensionContext {
  // Instance properties
  public xnode: XNode | null = null;
  public branchContext: BranchContext | null = null;
  public pipeline: PipelineContext;
  
  // REMOVED: public transforms: Transform[] = []; // DELETED - no longer needed
  
  /**
   * Create a new XJX instance with unified pipeline context
   * @param config Optional configuration
   * @param pipelineHooks Optional pipeline-level hooks for cross-cutting concerns
   */
  constructor(config?: Partial<Configuration>, pipelineHooks?: PipelineHooks) {
    this.pipeline = new PipelineContextImpl(
      createConfig(config),
      pipelineHooks
    );
    
    logger.debug('Created new XJX instance with unified pipeline context', {
      preserveNamespaces: this.pipeline.config.get().preserveNamespaces,
      preserveComments: this.pipeline.config.get().preserveComments,
      preserveTextNodes: this.pipeline.config.get().preserveTextNodes,
      highFidelity: this.pipeline.config.get().strategies.highFidelity,
      hasPipelineHooks: !!pipelineHooks
    });
  }
  
  // --- Standardized Pipeline Operations ---
  
  /**
   * Execute a source operation (input -> XNode) using unified pipeline
   * @param converter Unified converter to execute
   * @param input Input data
   * @param hooks Optional source hooks
   */
  public executeSource<T>(
    converter: UnifiedConverter<T, XNode>, 
    input: T, 
    hooks?: SourceHooks<T>
  ): void {
    this.xnode = Pipeline.executeSource(converter, input, this.pipeline, hooks);
  }
  
  /**
   * Execute an output operation (XNode -> output) using unified pipeline
   * @param converter Unified converter to execute
   * @param hooks Optional output hooks
   * @returns Converted output
   */
  public executeOutput<T>(
    converter: UnifiedConverter<XNode, T>, 
    hooks?: OutputHooks<T>
  ): T {
    this.validateSource();
    return Pipeline.executeOutput(converter, this.xnode as XNode, this.pipeline, hooks);
  }
  
  /**
   * Execute a transform operation (XNode -> XNode) using unified pipeline
   * @param operation Pipeline stage to execute
   * @param hooks Optional node hooks
   */
  public executeTransform(
    operation: PipelineStage<XNode, XNode>, 
    hooks?: NodeHooks
  ): void {
    this.validateSource();
    this.xnode = Pipeline.executeTransform(operation, this.xnode as XNode, this.pipeline, hooks);
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
        this.pipeline.executeHooks(this.pipeline.hooks, name, this.xnode || args[0]);
        
        // Validate source first for terminal extensions (built into executeOutput)
        // Call the implementation method with this context
        const result = method.apply(this, args);
        
        // Execute pipeline afterStep hook
        this.pipeline.executeHooks(this.pipeline.hooks, name, result);
        
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
        this.pipeline.executeHooks(this.pipeline.hooks, name, args[0] || this.xnode);
        
        // Call the implementation method with this context
        method.apply(this, args);
        
        // Execute pipeline afterStep hook
        this.pipeline.executeHooks(this.pipeline.hooks, name, this.xnode);
        
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
   * Clone an XNode using standardized pipeline cloning
   * @param node Node to clone
   * @param deep Whether to clone deeply
   * @returns Cloned node
   */
  public cloneNode(node: XNode, deep: boolean = false): XNode {
    return this.pipeline.cloneNode(node, { 
      strategy: deep ? 'deep' : 'shallow', 
      preserveParent: false 
    });
  }
  
  /**
   * Deep clone a value (legacy utility - kept for compatibility)
   */
  public deepClone<T>(obj: T): T {
    if (obj === undefined || obj === null) {
      return obj;
    }
    return JSON.parse(JSON.stringify(obj));
  }
  
  /**
   * Deep merge two objects (legacy utility - kept for compatibility)
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