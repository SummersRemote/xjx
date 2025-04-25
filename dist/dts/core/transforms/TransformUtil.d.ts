/**
 * Utilities for applying value transformations
 */
import { Configuration } from '../types/types';
import { TransformContext, TransformDirection } from './ValueTransformer';
/**
 * Utility for applying value transformations
 */
export declare class TransformUtil {
    private config;
    /**
     * Create a new TransformUtil
     * @param config Configuration
     */
    constructor(config: Configuration);
    /**
     * Apply transforms to a value
     * @param value Value to transform
     * @param context Transformation context
     * @returns Transformed value
     */
    applyTransforms(value: any, context: TransformContext): any;
    /**
     * Create a transform context
     * @param direction Direction of transformation
     * @param nodeName Name of the current node
     * @param nodeType DOM node type
     * @param options Additional context options
     * @returns Transform context
     */
    createContext(direction: TransformDirection, nodeName: string, nodeType: number, options?: {
        path?: string;
        namespace?: string;
        prefix?: string;
        isAttribute?: boolean;
        attributeName?: string;
        parent?: TransformContext;
    }): TransformContext;
    /**
     * Get a user-friendly node type name for debugging
     * @param nodeType DOM node type
     * @returns String representation of node type
     */
    getNodeTypeName(nodeType: number): string;
}
