/**
 * Addon Transforms module - exports additional, non-essential transforms
 * 
 * This barrel file centralizes all addon transform-related exports for easier imports.
 * These transforms are not required for core functionality but provide additional
 * convenience features.
 */

export { CommentTransform, CommentTransformOptions } from './comment-transform';
export { AttributeTransform, AttributeTransformOptions } from './attribute-transform';
export { TextTransform, TextTransformOptions } from './text-transform';
export { 
  ElementTransform, 
  ElementTransformOptions,
  SortChildrenTransform,
  SortChildrenOptions
} from './element-transform';