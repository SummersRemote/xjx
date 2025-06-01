/**
 * Core pipeline context system - Unified resource and configuration management
 */
import { LoggerFactory, Logger } from "./logger";
import { Configuration, createConfig } from "./config";
import { ValidationError } from "./error";
import { XNode, cloneNode } from "./xnode";
import { PipelineHooks } from "./hooks";

/**
 * Clone policy for consistent node cloning across pipeline
 */
export interface ClonePolicy {
  readonly strategy: 'deep' | 'shallow' | 'none';
  readonly preserveParent: boolean;
}

/**
 * Default clone policies for different operations
 */
export const ClonePolicies = {
  BRANCH: { strategy: 'deep', preserveParent: false } as ClonePolicy,
  TRANSFORM: { strategy: 'deep', preserveParent: false } as ClonePolicy,
  OUTPUT: { strategy: 'shallow', preserveParent: true } as ClonePolicy,
  NONE: { strategy: 'none', preserveParent: false } as ClonePolicy
} as const;

/**
 * Configuration manager with validation and merging capabilities
 */
export class ConfigurationManager {
  constructor(private config: Configuration) {}
  
  /**
   * Validate configuration for specific operation
   */
  validate(operation: string): void {
    // Basic validation - can be extended
    if (!this.config) {
      throw new ValidationError(`Configuration required for ${operation}`);
    }
  }
  
  /**
   * Create a copy of this configuration manager
   */
  clone(): ConfigurationManager {
    return new ConfigurationManager(createConfig({}, this.config));
  }
  
  /**
   * Merge configuration updates
   */
  merge(updates: Partial<Configuration>): ConfigurationManager {
    return new ConfigurationManager(createConfig(updates, this.config));
  }
  
  /**
   * Get the current configuration
   */
  get(): Configuration {
    return this.config;
  }
}

/**
 * Performance tracking for pipeline stages
 */
export class PerformanceTracker {
  private stages = new Map<string, { 
    count: number; 
    totalTime: number; 
    avgTime: number; 
    memory: number 
  }>();
  private activeStages = new Map<string, { startTime: number; startMemory: number }>();
  
  /**
   * Start tracking a pipeline stage
   */
  startStage(name: string): string {
    const stageId = `${name}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    this.activeStages.set(stageId, {
      startTime: performance.now(),
      startMemory: this.getMemoryUsage()
    });
    
    return stageId;
  }
  
  /**
   * End tracking a pipeline stage
   */
  endStage(stageId: string): { duration: number; memory: number } {
    const active = this.activeStages.get(stageId);
    if (!active) {
      return { duration: 0, memory: 0 };
    }
    
    const duration = performance.now() - active.startTime;
    const memory = this.getMemoryUsage() - active.startMemory;
    
    // Extract stage name from stageId
    const stageName = stageId.split('_')[0];
    
    // Update stage statistics
    const existing = this.stages.get(stageName) || { 
      count: 0, 
      totalTime: 0, 
      avgTime: 0, 
      memory: 0 
    };
    
    existing.count++;
    existing.totalTime += duration;
    existing.avgTime = existing.totalTime / existing.count;
    existing.memory = Math.max(existing.memory, memory);
    
    this.stages.set(stageName, existing);
    this.activeStages.delete(stageId);
    
    return { duration, memory };
  }
  
  /**
   * Get performance metrics for all stages
   */
  getMetrics(): Record<string, any> {
    const metrics: Record<string, any> = {};
    
    for (const [name, stats] of this.stages) {
      metrics[name] = { ...stats };
    }
    
    return metrics;
  }
  
  /**
   * Get stages sorted by average execution time
   */
  getSlowestStages(): Array<{ name: string; avgTime: number }> {
    return Array.from(this.stages.entries())
      .map(([name, stats]) => ({ name, avgTime: stats.avgTime }))
      .sort((a, b) => b.avgTime - a.avgTime);
  }
  
  /**
   * Reset all performance metrics
   */
  reset(): void {
    this.stages.clear();
    this.activeStages.clear();
  }
  
  /**
   * Get current memory usage (browser/Node.js compatible)
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    
    // Browser fallback - less accurate
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize || 0;
    }
    
    return 0;
  }
}

/**
 * Resource management for automatic cleanup
 */
export class ResourceManager {
  private resources = new WeakSet<any>();
  private documentRefs = new Set<Document>();
  private cleanupCallbacks = new Set<() => void>();
  
  /**
   * Register a DOM document for cleanup
   */
  registerDOMDocument(doc: Document): void {
    this.documentRefs.add(doc);
  }
  
  /**
   * Register an XNode for tracking
   */
  registerXNode(node: XNode): void {
    this.resources.add(node);
  }
  
  /**
   * Register a cleanup callback
   */
  registerCleanupCallback(callback: () => void): void {
    this.cleanupCallbacks.add(callback);
  }
  
  /**
   * Clean up all registered resources
   */
  cleanup(): void {
    // Execute cleanup callbacks
    for (const callback of this.cleanupCallbacks) {
      try {
        callback();
      } catch (err) {
        // Ignore cleanup errors
      }
    }
    
    // Clear document references
    this.documentRefs.clear();
    this.cleanupCallbacks.clear();
  }
  
  /**
   * Check if cleanup is needed based on resource count
   */
  isCleanupNeeded(): boolean {
    return this.documentRefs.size > 10 || this.cleanupCallbacks.size > 50;
  }
  
  /**
   * Get count of managed resources
   */
  getResourceCount(): { documents: number; callbacks: number } {
    return {
      documents: this.documentRefs.size,
      callbacks: this.cleanupCallbacks.size
    };
  }
}

/**
 * Unified pipeline context providing all services to pipeline stages
 */
export interface PipelineContext {
  config: ConfigurationManager;
  performance: PerformanceTracker;
  logger: Logger;
  resources: ResourceManager;
  hooks?: PipelineHooks;
  
  // Standard operations available everywhere
  validateInput(condition: boolean, message: string): void;
  cloneNode(node: XNode, policy?: ClonePolicy): XNode;
  executeHooks<T>(hooks: any, stage: string, input: T): T;
}

/**
 * Implementation of PipelineContext
 */
export class PipelineContextImpl implements PipelineContext {
  public config: ConfigurationManager;
  public performance: PerformanceTracker;
  public logger: Logger;
  public resources: ResourceManager;
  public hooks?: PipelineHooks;
  
  constructor(
    config: Configuration,
    pipelineHooks?: PipelineHooks
  ) {
    this.config = new ConfigurationManager(config);
    this.performance = new PerformanceTracker();
    this.logger = LoggerFactory.create();
    this.resources = new ResourceManager();
    this.hooks = pipelineHooks;
  }
  
  /**
   * Validate input conditions with consistent error handling
   */
  validateInput(condition: boolean, message: string): void {
    if (!condition) {
      throw new ValidationError(message);
    }
  }
  
  /**
   * Clone XNode with consistent policy application
   */
  cloneNode(node: XNode, policy: ClonePolicy = ClonePolicies.TRANSFORM): XNode {
    switch (policy.strategy) {
      case 'deep':
        const cloned = cloneNode(node, true);
        if (!policy.preserveParent) {
          cloned.parent = undefined;
        }
        this.resources.registerXNode(cloned);
        return cloned;
        
      case 'shallow':
        const shallow = cloneNode(node, false);
        if (!policy.preserveParent) {
          shallow.parent = undefined;
        }
        this.resources.registerXNode(shallow);
        return shallow;
        
      case 'none':
      default:
        return node;
    }
  }
  
  /**
   * Execute hooks with consistent error handling and logging
   */
  executeHooks<T>(hooks: any, stage: string, input: T): T {
    if (!hooks) return input;
    
    let result = input;
    
    try {
      if (hooks.beforeStep) {
        hooks.beforeStep(stage, input);
      }
      
      if (hooks.afterStep) {
        hooks.afterStep(stage, result);
      }
    } catch (err) {
      this.logger.warn(`Error in pipeline hooks for ${stage}:`, err);
    }
    
    return result;
  }
}