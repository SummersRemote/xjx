/**
 * Enhanced pipeline execution framework - Error recovery and advanced monitoring
 * STAGE 6: Configurable error handling, retry logic, performance optimization
 */
import { LoggerFactory } from "./logger";
const logger = LoggerFactory.create();

import { PipelineContext } from "./context";
import { XNode } from "./xnode";
import { SourceHooks, OutputHooks, NodeHooks } from "./hooks";
import { ProcessingError } from "./error";

/**
 * Enhanced error recovery policy for pipeline stages
 * STAGE 6: Comprehensive error handling strategies
 */
export interface ErrorRecoveryPolicy {
  strategy: 'fail-fast' | 'continue-with-warning' | 'fallback-value' | 'retry' | 'skip-and-continue';
  maxRetries?: number;
  retryDelay?: number; // milliseconds
  fallbackValue?: any;
  onRetry?: (attempt: number, error: Error) => void;
  onFallback?: (error: Error) => void;
}

/**
 * Pipeline stage execution metrics
 */
export interface StageMetrics {
  name: string;
  duration: number;
  memory: number;
  retries: number;
  success: boolean;
  errorType?: string;
}

/**
 * Core pipeline stage interface - all operations implement this
 */
export interface PipelineStage<TInput, TOutput> {
  readonly name: string;
  readonly inputType?: string;
  readonly outputType?: string;
  
  // Optional validation before execution
  validate?(input: TInput, context: PipelineContext): void;
  
  // Main execution logic
  execute(input: TInput, context: PipelineContext): TOutput;
  
  // Optional error handling
  onError?(error: Error, input: TInput, context: PipelineContext): TOutput | null;
  
  // STAGE 6: Enhanced error recovery policy
  errorPolicy?: ErrorRecoveryPolicy;
  
  // STAGE 6: Performance optimization hints
  optimizationHints?: {
    cacheable?: boolean;
    expensive?: boolean;
    memoryIntensive?: boolean;
  };
}

/**
 * Unified converter interface extending PipelineStage
 */
export interface UnifiedConverter<TInput, TOutput> extends PipelineStage<TInput, TOutput> {
  readonly name: string;
  readonly inputType: string;
  readonly outputType: string;
}

/**
 * Enhanced pipeline execution engine with error recovery and monitoring
 * STAGE 6: Enterprise-grade pipeline with comprehensive error handling
 */
export class Pipeline {
  
  /**
   * Execute a source operation (input -> XNode) with enhanced error recovery
   */
  static executeSource<T>(
    stage: UnifiedConverter<T, XNode>,
    input: T,
    context: PipelineContext,
    hooks?: SourceHooks<T>
  ): XNode {
    return this.executeStageWithRecovery(
      stage,
      input,
      context,
      (processedInput) => {
        // Execute pipeline beforeStep hook
        context.executeHooks(context.hooks, stage.name, processedInput);
        
        // Process input with beforeTransform hook
        if (hooks?.beforeTransform) {
          try {
            const beforeResult = hooks.beforeTransform(processedInput);
            if (beforeResult !== undefined && beforeResult !== null) {
              processedInput = beforeResult;
              logger.debug(`Applied beforeTransform hook in ${stage.name}`);
            }
          } catch (err) {
            logger.warn(`Error in ${stage.name} beforeTransform hook:`, err);
          }
        }
        
        // Validate input if stage provides validation
        if (stage.validate) {
          stage.validate(processedInput, context);
        }
        
        // Execute main conversion
        let result = stage.execute(processedInput, context);
        
        // Process output with afterTransform hook
        if (hooks?.afterTransform) {
          try {
            const afterResult = hooks.afterTransform(result);
            if (afterResult && typeof afterResult === 'object' && typeof afterResult.name === 'string') {
              result = afterResult;
              logger.debug(`Applied afterTransform hook in ${stage.name}`);
            }
          } catch (err) {
            logger.warn(`Error in ${stage.name} afterTransform hook:`, err);
          }
        }
        
        // Execute pipeline afterStep hook
        context.executeHooks(context.hooks, stage.name, result);
        
        return result;
      }
    );
  }
  
  /**
   * Execute an output operation (XNode -> output) with enhanced error recovery
   */
  static executeOutput<T>(
    stage: UnifiedConverter<XNode, T>,
    input: XNode,
    context: PipelineContext,
    hooks?: OutputHooks<T>
  ): T {
    return this.executeStageWithRecovery(
      stage,
      input,
      context,
      (processedInput) => {
        // Execute pipeline beforeStep hook
        context.executeHooks(context.hooks, stage.name, processedInput);
        
        // Process input with beforeTransform hook
        if (hooks?.beforeTransform) {
          try {
            const beforeResult = hooks.beforeTransform(processedInput);
            if (beforeResult && typeof beforeResult === 'object' && typeof beforeResult.name === 'string') {
              processedInput = beforeResult;
              logger.debug(`Applied beforeTransform hook in ${stage.name}`);
            }
          } catch (err) {
            logger.warn(`Error in ${stage.name} beforeTransform hook:`, err);
          }
        }
        
        // Validate input if stage provides validation
        if (stage.validate) {
          stage.validate(processedInput, context);
        }
        
        // Execute main conversion
        let result = stage.execute(processedInput, context);
        
        // Process output with afterTransform hook
        if (hooks?.afterTransform) {
          try {
            const afterResult = hooks.afterTransform(result);
            if (afterResult !== undefined && afterResult !== null) {
              result = afterResult;
              logger.debug(`Applied afterTransform hook in ${stage.name}`);
            }
          } catch (err) {
            logger.warn(`Error in ${stage.name} afterTransform hook:`, err);
          }
        }
        
        // Execute pipeline afterStep hook
        context.executeHooks(context.hooks, stage.name, result);
        
        return result;
      }
    );
  }
  
  /**
   * Execute a transform operation (XNode -> XNode) with enhanced error recovery
   */
  static executeTransform(
    stage: PipelineStage<XNode, XNode>,
    input: XNode,
    context: PipelineContext,
    hooks?: NodeHooks
  ): XNode {
    return this.executeStageWithRecovery(
      stage,
      input,
      context,
      (processedInput) => {
        // Execute pipeline beforeStep hook
        context.executeHooks(context.hooks, stage.name, processedInput);
        
        // Process input with beforeTransform hook
        if (hooks?.beforeTransform) {
          try {
            const beforeResult = hooks.beforeTransform(processedInput);
            if (beforeResult && typeof beforeResult === 'object' && typeof beforeResult.name === 'string') {
              processedInput = beforeResult;
              logger.debug(`Applied beforeTransform hook in ${stage.name}`);
            }
          } catch (err) {
            logger.warn(`Error in ${stage.name} beforeTransform hook:`, err);
          }
        }
        
        // Validate input if stage provides validation
        if (stage.validate) {
          stage.validate(processedInput, context);
        }
        
        // Execute main transformation
        let result = stage.execute(processedInput, context);
        
        // Process output with afterTransform hook
        if (hooks?.afterTransform) {
          try {
            const afterResult = hooks.afterTransform(result);
            if (afterResult && typeof afterResult === 'object' && typeof afterResult.name === 'string') {
              result = afterResult;
              logger.debug(`Applied afterTransform hook in ${stage.name}`);
            }
          } catch (err) {
            logger.warn(`Error in ${stage.name} afterTransform hook:`, err);
          }
        }
        
        // Execute pipeline afterStep hook
        context.executeHooks(context.hooks, stage.name, result);
        
        return result;
      }
    );
  }
  
  /**
   * STAGE 6: Enhanced stage execution with comprehensive error recovery
   */
  private static executeStageWithRecovery<TInput, TOutput>(
    stage: PipelineStage<TInput, TOutput>,
    input: TInput,
    context: PipelineContext,
    executor: (input: TInput) => TOutput
  ): TOutput {
    const stageId = context.performance.startStage(stage.name);
    let retries = 0;
    let lastError: Error | null = null;
    
    try {
      logger.debug(`Executing enhanced stage: ${stage.name}`, {
        inputType: stage.inputType,
        hasErrorPolicy: !!stage.errorPolicy,
        hasOptimizationHints: !!stage.optimizationHints
      });
      
      // Check optimization hints
      if (stage.optimizationHints?.memoryIntensive) {
        // Pre-cleanup for memory-intensive operations
        if (context.resources.isCleanupNeeded()) {
          context.optimizeResources();
        }
      }
      
      while (true) {
        try {
          const result = executor(input);
          
          // Log successful execution
          logger.debug(`Successfully completed enhanced stage: ${stage.name}`, {
            retries,
            duration: `${(performance.now() - Date.now()).toFixed(2)}ms`
          });
          
          return result;
          
        } catch (error) {
          lastError = error as Error;
          const policy = stage.errorPolicy;
          
          // If no error policy or fail-fast, handle immediately
          if (!policy || policy.strategy === 'fail-fast') {
            throw error;
          }
          
          // Handle retry strategy
          if (policy.strategy === 'retry' && retries < (policy.maxRetries || 3)) {
            retries++;
            
            logger.warn(`Stage ${stage.name} failed, retrying (${retries}/${policy.maxRetries || 3})`, {
              error: error.message
            });
            
            // Call retry callback if provided
            if (policy.onRetry) {
              try {
                policy.onRetry(retries, error as Error);
              } catch (callbackError) {
                logger.warn(`Error in retry callback for ${stage.name}:`, callbackError);
              }
            }
            
            // Add delay if specified
            if (policy.retryDelay && policy.retryDelay > 0) {
              // Simple blocking delay (in real implementation, might use async)
              const start = Date.now();
              while (Date.now() - start < policy.retryDelay) {
                // Busy wait (for simplicity)
              }
            }
            
            continue; // Retry the operation
          }
          
          // Handle other error strategies
          break;
        }
      }
      
      // If we get here, we've exhausted retries or have a different strategy
      const policy = stage.errorPolicy!;
      
      switch (policy.strategy) {
        case 'continue-with-warning':
          logger.warn(`Stage ${stage.name} failed but continuing with warning`, {
            error: lastError?.message,
            retries
          });
          
          if (policy.fallbackValue !== undefined) {
            return policy.fallbackValue;
          }
          break;
          
        case 'fallback-value':
          if (policy.fallbackValue !== undefined) {
            logger.warn(`Stage ${stage.name} failed, using fallback value`, {
              error: lastError?.message,
              retries
            });
            
            // Call fallback callback if provided
            if (policy.onFallback) {
              try {
                policy.onFallback(lastError!);
              } catch (callbackError) {
                logger.warn(`Error in fallback callback for ${stage.name}:`, callbackError);
              }
            }
            
            return policy.fallbackValue;
          }
          break;
          
        case 'skip-and-continue':
          logger.warn(`Stage ${stage.name} failed, skipping and continuing`, {
            error: lastError?.message,
            retries
          });
          
          // Return input as-is for skip behavior
          if (typeof input === 'object' && input !== null) {
            return input as unknown as TOutput;
          }
          break;
      }
      
      // If no recovery worked, try stage-specific error handler
      if (stage.onError) {
        try {
          const recovered = stage.onError(lastError!, input, context);
          if (recovered !== null) {
            logger.warn(`Stage ${stage.name} recovered from error using onError handler`);
            return recovered;
          }
        } catch (recoveryError) {
          logger.error(`Error in ${stage.name} error recovery:`, recoveryError);
        }
      }
      
      // All recovery attempts failed, throw the original error
      throw lastError || new Error(`Stage ${stage.name} failed with unknown error`);
      
    } finally {
      const metrics = context.performance.endStage(stageId);
      
      // Log stage metrics
      logger.debug(`Stage ${stage.name} metrics`, {
        duration: `${metrics.duration.toFixed(2)}ms`,
        memory: `${(metrics.memory / 1024).toFixed(2)}KB`,
        retries,
        success: !lastError
      });
      
      // Auto-cleanup for expensive operations
      if (stage.optimizationHints?.expensive || stage.optimizationHints?.memoryIntensive) {
        if (context.resources.isCleanupNeeded()) {
          context.optimizeResources();
        }
      }
    }
  }
  
  /**
   * STAGE 6: Get pipeline performance and health report
   */
  static getHealthReport(context: PipelineContext): {
    performance: any;
    resources: any;
    recommendations: string[];
  } {
    const perfReport = context.getPerformanceReport();
    const resourceReport = context.getResourceReport();
    
    const recommendations = [...perfReport.recommendations];
    
    // Add resource-based recommendations
    if (resourceReport.isCleanupNeeded) {
      recommendations.push('Resource cleanup recommended');
    }
    
    if (resourceReport.memoryEstimate > 10 * 1024 * 1024) { // 10MB
      recommendations.push('High memory usage detected, consider optimizing data structures');
    }
    
    return {
      performance: perfReport,
      resources: resourceReport,
      recommendations
    };
  }
}