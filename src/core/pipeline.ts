/**
 * Pipeline execution framework - Unified stage execution with hooks
 */
import { LoggerFactory } from "./logger";
const logger = LoggerFactory.create();

import { PipelineContext } from "./context";
import { XNode } from "./xnode";
import { SourceHooks, OutputHooks, NodeHooks } from "./hooks";
import { ProcessingError } from "./error";

/**
 * Error recovery policy for pipeline stages
 */
export interface ErrorRecoveryPolicy {
  strategy: 'fail-fast' | 'continue-with-warning' | 'fallback-value' | 'retry';
  maxRetries?: number;
  fallbackValue?: any;
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
  
  // Optional error recovery policy
  errorPolicy?: ErrorRecoveryPolicy;
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
 * Main pipeline execution engine
 */
export class Pipeline {
  
  /**
   * Execute a source operation (input -> XNode)
   */
  static executeSource<T>(
    stage: UnifiedConverter<T, XNode>,
    input: T,
    context: PipelineContext,
    hooks?: SourceHooks<T>
  ): XNode {
    const stageId = context.performance.startStage(stage.name);
    
    try {
      logger.debug(`Executing source stage: ${stage.name}`, {
        inputType: stage.inputType,
        hasHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
      });
      
      // Execute pipeline beforeStep hook
      context.executeHooks(context.hooks, stage.name, input);
      
      // Process input with beforeTransform hook
      let processedInput = input;
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
      
      logger.debug(`Successfully completed source stage: ${stage.name}`, {
        resultNodeName: result.name,
        resultNodeType: result.type
      });
      
      return result;
      
    } catch (error) {
      return this.handleStageError(stage, error as Error, input, context);
    } finally {
      const metrics = context.performance.endStage(stageId);
      logger.debug(`Stage ${stage.name} completed in ${metrics.duration.toFixed(2)}ms`);
    }
  }
  
  /**
   * Execute an output operation (XNode -> output)
   */
  static executeOutput<T>(
    stage: UnifiedConverter<XNode, T>,
    input: XNode,
    context: PipelineContext,
    hooks?: OutputHooks<T>
  ): T {
    const stageId = context.performance.startStage(stage.name);
    
    try {
      logger.debug(`Executing output stage: ${stage.name}`, {
        outputType: stage.outputType,
        hasHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
      });
      
      // Execute pipeline beforeStep hook
      context.executeHooks(context.hooks, stage.name, input);
      
      // Process input with beforeTransform hook
      let processedInput = input;
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
      
      logger.debug(`Successfully completed output stage: ${stage.name}`, {
        resultType: typeof result
      });
      
      return result;
      
    } catch (error) {
      return this.handleStageError(stage, error as Error, input, context);
    } finally {
      const metrics = context.performance.endStage(stageId);
      logger.debug(`Stage ${stage.name} completed in ${metrics.duration.toFixed(2)}ms`);
    }
  }
  
  /**
   * Execute a transform operation (XNode -> XNode)
   */
  static executeTransform(
    stage: PipelineStage<XNode, XNode>,
    input: XNode,
    context: PipelineContext,
    hooks?: NodeHooks
  ): XNode {
    const stageId = context.performance.startStage(stage.name);
    
    try {
      logger.debug(`Executing transform stage: ${stage.name}`, {
        hasHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
      });
      
      // Execute pipeline beforeStep hook
      context.executeHooks(context.hooks, stage.name, input);
      
      // Process input with beforeTransform hook
      let processedInput = input;
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
      
      logger.debug(`Successfully completed transform stage: ${stage.name}`, {
        resultNodeName: result.name
      });
      
      return result;
      
    } catch (error) {
      return this.handleStageError(stage, error as Error, input, context);
    } finally {
      const metrics = context.performance.endStage(stageId);
      logger.debug(`Stage ${stage.name} completed in ${metrics.duration.toFixed(2)}ms`);
    }
  }
  
  /**
   * Handle stage execution errors with configurable recovery
   */
  private static handleStageError<TInput, TOutput>(
    stage: PipelineStage<TInput, TOutput>,
    error: Error,
    input: TInput,
    context: PipelineContext
  ): TOutput {
    logger.error(`Error in pipeline stage ${stage.name}:`, error);
    
    // Try stage-specific error handler first
    if (stage.onError) {
      try {
        const recovered = stage.onError(error, input, context);
        if (recovered !== null) {
          logger.warn(`Stage ${stage.name} recovered from error using onError handler`);
          return recovered;
        }
      } catch (recoveryError) {
        logger.error(`Error in ${stage.name} error recovery:`, recoveryError);
      }
    }
    
    // Apply error recovery policy if available
    const policy = stage.errorPolicy;
    if (policy) {
      switch (policy.strategy) {
        case 'continue-with-warning':
          logger.warn(`Continuing ${stage.name} with warning due to error policy`);
          if (policy.fallbackValue !== undefined) {
            return policy.fallbackValue;
          }
          break;
          
        case 'fallback-value':
          if (policy.fallbackValue !== undefined) {
            logger.warn(`Using fallback value for ${stage.name} due to error`);
            return policy.fallbackValue;
          }
          break;
          
        case 'retry':
          // For simplicity, not implementing retry logic in this stage
          logger.warn(`Retry policy specified for ${stage.name} but not implemented`);
          break;
          
        case 'fail-fast':
        default:
          // Fall through to throwing the error
          break;
      }
    }
    
    // Create a more informative error
    if (error instanceof ProcessingError) {
      throw error;
    }
    
    throw new ProcessingError(
      `Pipeline stage ${stage.name} failed: ${error.message}`,
      input
    );
  }
}