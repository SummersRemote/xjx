/**
 * Transforms module - Functional transform factories
 *
 * This module provides transform factories for converting data between formats.
 * All transforms are simple functions that can be composed together.
 */

// Core transform types and utilities
export {
  Transform,
  TransformOptions,
  TransformIntent,
  compose,
  createTransform
} from '../core/transform';

// Number transform
export {
  toNumber,
  NumberOptions
} from './number-transform';

// Boolean transform
export {
  toBoolean,
  BooleanOptions
} from './boolean-transform';

// Regex transform
export {
  regex,
  regexMulti,
  RegexOptions
} from './regex-transform';

/**
 * Quick reference for the functional transform system:
 * 
 * ```typescript
 * // Simple usage with defaults
 * xjx.fromXml(xml)
 *    .select(node => node.name === 'price')
 *    .transform(toNumber())
 *    .filter(node => node.value > 100)
 *    .toXml();
 * 
 * // With parameters
 * xjx.fromXml(xml)
 *    .select(node => node.name === 'price')
 *    .transform(toNumber({ precision: 2, thousandsSeparator: '.' }))
 *    .toXml();
 * 
 * // Create reusable configured transforms
 * const currencyTransform = toNumber({ precision: 2 });
 * const yesNoBoolean = toBoolean({ trueValues: ['yes'], falseValues: ['no'] });
 * const sanitizePhone = regex(/[^\d]/g, '');
 * 
 * // Use them anywhere
 * xjx.transform(currencyTransform);
 * xjx.transform(yesNoBoolean);
 * xjx.transform(sanitizePhone);
 * 
 * // Compose transforms
 * const processPrice = compose(
 *   regex(/[^\d.]/g, ''),  // Remove non-digits
 *   toNumber({ precision: 2 }),
 *   (value) => value * 1.1  // Add 10% markup
 * );
 * 
 * xjx.transform(processPrice);
 * ```
 */