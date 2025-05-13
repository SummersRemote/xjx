/**
 * Core extension that implements the withConfig method
 */
import { XJX } from "../../XJX";
import { Configuration } from "../../core/config";
import { NonTerminalExtensionContext } from "../../core/extension";
import { Common } from "../../core/common";

/**
 * Set configuration options
 * @param config Partial configuration to merge with defaults
 */
function withConfig(this: NonTerminalExtensionContext, config: Partial<Configuration>) {
  if (!config || Object.keys(config).length === 0) {
    return this;
  }
  
  // Merge with current config
  this.config = Common.deepMerge(this.config, config);
  return this;
}

// Register the extension
XJX.registerNonTerminalExtension("withConfig", withConfig);