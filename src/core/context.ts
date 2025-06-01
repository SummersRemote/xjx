/**
 * Enhanced pipeline context system - Advanced features for enterprise deployment
 * STAGE 6: Performance monitoring, resource management, error recovery
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
 * Performance report interface
 */
export interface PerformanceReport {
  totalStages: number;
  totalTime: number;
  averageTime: number;
  slowestStages: Array<{ name: string; avgTime: number; count: number }>;
  memoryPeaks: Array<{ name: string; memory: number }>;
  recommendations: string[];
}

/**
 * Resource usage report
 */
export interface ResourceReport {
  documents: number;
  callbacks: number;
  nodes: number;
  isCleanupNeeded: boolean;
  memoryEstimate: number;
}

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
 * Enhanced performance tracking for pipeline stages
 * STAGE 6: Advanced monitoring with recommendations
 */
export class PerformanceTracker {
  private stages = new Map<string, { 
    count: number; 
    totalTime: number; 
    avgTime: number; 
    memory: number;
    minTime: number;
    maxTime: number;
  }>();
  private activeStages = new Map<string, { startTime: number; startMemory: number }>();
  private sessionStartTime = performance.now();
  
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
      memory: 0,
      minTime: Infinity,
      maxTime: 0
    };
    
    existing.count++;
    existing.totalTime += duration;
    existing.avgTime = existing.totalTime / existing.count;
    existing.memory = Math.max(existing.memory, memory);
    existing.minTime = Math.min(existing.minTime, duration);
    existing.maxTime = Math.max(existing.maxTime, duration);
    
    this.stages.set(stageName, existing);
    this.activeStages.delete(stageId);
    
    return { duration, memory };
  }
  
  /**
   * Get comprehensive performance report with recommendations
   */
  getPerformanceReport(): PerformanceReport {
    const totalTime = performance.now() - this.sessionStartTime;
    const stages = Array.from(this.stages.entries());
    
    const slowestStages = stages
      .map(([name, stats]) => ({ name, avgTime: stats.avgTime, count: stats.count }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 5);
    
    const memoryPeaks = stages
      .map(([name, stats]) => ({ name, memory: stats.memory }))
      .sort((a, b) => b.memory - a.memory)
      .slice(0, 5);
    
    // Generate performance recommendations
    const recommendations: string[] = [];
    
    // Check for slow stages
    const slowThreshold = 100; // ms
    slowestStages.forEach(stage => {
      if (stage.avgTime > slowThreshold) {
        recommendations.push(`Consider optimizing ${stage.name} stage (avg: ${stage.avgTime.toFixed(2)}ms)`);
      }
    });
    
    // Check for memory usage
    const memoryThreshold = 1024 * 1024; // 1MB
    memoryPeaks.forEach(stage => {
      if (stage.memory > memoryThreshold) {
        recommendations.push(`High memory usage in ${stage.name} stage (${(stage.memory / 1024 / 1024).toFixed(2)}MB)`);
      }
    });
    
    // Check for frequent operations
    stages.forEach(([name, stats]) => {
      if (stats.count > 100) {
        recommendations.push(`High frequency operation: ${name} (${stats.count} calls)`);
      }
    });
    
    return {
      totalStages: stages.length,
      totalTime,
      averageTime: stages.length > 0 ? stages.reduce((sum, [, stats]) => sum + stats.avgTime, 0) / stages.length : 0,
      slowestStages,
      memoryPeaks,
      recommendations
    };
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
    this.sessionStartTime = performance.now();
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
 * Enhanced resource management for automatic cleanup and monitoring
 * STAGE 6: Advanced resource tracking and leak detection
 */
export class ResourceManager {
  private resources = new WeakSet<any>();
  private documentRefs = new Set<Document>();
  private nodeRefs = new WeakSet<XNode>();
  private cleanupCallbacks = new Set<() => void>();
  private resourceCounter = 0;
  private maxResources = 1000; // Configurable threshold
  
  /**
   * Register a DOM document for cleanup
   */
  registerDOMDocument(doc: Document): void {
    this.documentRefs.add(doc);
    this.resourceCounter++;
    this.checkResourceLimits();
  }
  
  /**
   * Register an XNode for tracking
   */
  registerXNode(node: XNode): void {
    this.nodeRefs.add(node);
    this.resourceCounter++;
    this.checkResourceLimits();
  }
  
  /**
   * Register a cleanup callback
   */
  registerCleanupCallback(callback: () => void): void {
    this.cleanupCallbacks.add(callback);
  }
  
  /**
   * Set maximum resource threshold
   */
  setMaxResources(max: number): void {
    this.maxResources = max;
  }
  
  /**
   * Check if resource limits are being approached
   */
  private checkResourceLimits(): void {
    if (this.resourceCounter > this.maxResources * 0.8) {
      console.warn(`Resource usage approaching limit: ${this.resourceCounter}/${this.maxResources}`);
    }
    
    if (this.resourceCounter > this.maxResources) {
      console.error(`Resource limit exceeded: ${this.resourceCounter}/${this.maxResources}. Consider calling cleanup().`);
      // Auto-cleanup if severely over limit
      if (this.resourceCounter > this.maxResources * 1.5) {
        this.cleanup();
      }
    }
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
        // Ignore cleanup errors but log them
        console.warn('Resource cleanup callback error:', err);
      }
    }
    
    // Clear document references
    this.documentRefs.clear();
    this.cleanupCallbacks.clear();
    this.resourceCounter = 0;
  }
  
  /**
   * Check if cleanup is needed based on resource count
   */
  isCleanupNeeded(): boolean {
    return this.documentRefs.size > 10 || this.cleanupCallbacks.size > 50 || this.resourceCounter > this.maxResources * 0.7;
  }
  
  /**
   * Get comprehensive resource report
   */
  getResourceReport(): ResourceReport {
    return {
      documents: this.documentRefs.size,
      callbacks: this.cleanupCallbacks.size,
      nodes: this.resourceCounter,
      isCleanupNeeded: this.isCleanupNeeded(),
      memoryEstimate: this.estimateMemoryUsage()
    };
  }
  
  /**
   * Estimate memory usage of tracked resources
   */
  private estimateMemoryUsage(): number {
    // Rough estimates: document ~50KB, callback ~1KB, node ~2KB
    return (this.documentRefs.size * 50 * 1024) + 
           (this.cleanupCallbacks.size * 1024) + 
           (this.resourceCounter * 2 * 1024);
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
  
  // STAGE 6: Advanced features
  getPerformanceReport(): PerformanceReport;
  getResourceReport(): ResourceReport;
  optimizeResources(): void;
}

/**
 * Implementation of PipelineContext with advanced features
 * STAGE 6: Enhanced with monitoring and optimization
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
    const stageId = this.performance.startStage('clone');
    
    try {
      let result: XNode;
      
      switch (policy.strategy) {
        case 'deep':
          result = cloneNode(node, true);
          if (!policy.preserveParent) {
            result.parent = undefined;
          }
          this.resources.registerXNode(result);
          break;
          
        case 'shallow':
          result = cloneNode(node, false);
          if (!policy.preserveParent) {
            result.parent = undefined;
          }
          this.resources.registerXNode(result);
          break;
          
        case 'none':
        default:
          result = node;
          break;
      }
      
      return result;
    } finally {
      this.performance.endStage(stageId);
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
  
  /**
   * Get comprehensive performance report
   */
  getPerformanceReport(): PerformanceReport {
    return this.performance.getPerformanceReport();
  }
  
  /**
   * Get resource usage report
   */
  getResourceReport(): ResourceReport {
    return this.resources.getResourceReport();
  }
  
  /**
   * Optimize resources by cleaning up and resetting counters
   */
  optimizeResources(): void {
    const report = this.resources.getResourceReport();
    
    if (report.isCleanupNeeded) {
      this.logger.info('Optimizing pipeline resources', {
        documentsCleared: report.documents,
        callbacksCleared: report.callbacks,
        memoryFreed: `${(report.memoryEstimate / 1024 / 1024).toFixed(2)}MB`
      });
      
      this.resources.cleanup();
    }
  }
}