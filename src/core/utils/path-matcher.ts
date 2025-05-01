/**
 * Path matching utilities for transformers
 */

/**
 * Creates a function that checks if a path matches any of the given patterns
 * 
 * Supports:
 * - Exact paths: "root.items.item"
 * - Wildcards: "root.*.item" (matches one level)
 * - Deep wildcards: "root.**.item" (matches any number of levels)
 * - Attribute access: "root.@id"
 * - Array indices: "root.items[0]"
 * 
 * @param patterns One or more path patterns to match
 * @returns Function that checks if a path matches any pattern
 */
export function createPathMatcher(patterns: string | string[]): (path: string) => boolean {
    const patternList = Array.isArray(patterns) ? patterns : [patterns];
    
    // Precompile regex patterns for better performance
    const regexPatterns = patternList.map(pattern => {
      // Order is important! Replace ** first, then *
      let regexStr = pattern
        .replace(/\*\*/g, '(?:.*)')        // ** -> any number of segments
        .replace(/\*/g, '(?:[^.\\[\\]]+)') // * -> anything except dots and brackets
        .replace(/\./g, '\\.')             // Escape dots
        .replace(/\[/g, '\\[')             // Escape opening brackets
        .replace(/\]/g, '\\]')             // Escape closing brackets
        .replace(/@/g, '@');               // @ stays as is for attribute paths
      
      return new RegExp(`^${regexStr}$`);
    });
    
    return (path: string): boolean => {
      // Test against each pattern, return true if any match
      return regexPatterns.some(regex => regex.test(path));
    };
  }