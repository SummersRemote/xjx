/**
 * Core extension that implements the withConfig method
 */
import { XJX } from "../../XJX";
import { Configuration } from "../../core/types/transform-interfaces";
import { NonTerminalExtensionContext } from "../../core/types/extension-types";
import { CommonUtils } from "xjx/core/utils/common-utils";

/**
 * Set configuration options
 * @param config Partial configuration to merge with defaults
 */
function withConfig(this: NonTerminalExtensionContext, config: Partial<Configuration>) {
  if (!config || Object.keys(config).length === 0) {
    return this;
  }
  
  // Merge with current config
  this.config = CommonUtils.deepMerge(this.config, config);
  return this;
}

// Register the extension
XJX.registerNonTerminalExtension("withConfig", withConfig);