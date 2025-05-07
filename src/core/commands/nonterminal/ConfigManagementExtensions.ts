/**
 * Core extensions that implement config management methods
 */
import { XJX } from "../../XJX";
import { NonTerminalExtensionContext } from "../../types/extension-types";

/**
 * Reset this builder's configuration to match global configuration
 */
function resetToGlobalConfig(this: NonTerminalExtensionContext) {
  this.config = this.deepClone(this.configProvider.getMutableConfig());
  return this;
}

/**
 * Make this builder's configuration the global default
 */
function makeConfigGlobal(this: NonTerminalExtensionContext) {
  this.configProvider.setConfig(this.deepClone(this.config));
  return this;
}

// Register the extensions
XJX.registerNonTerminalExtension("resetToGlobalConfig", resetToGlobalConfig);
XJX.registerNonTerminalExtension("makeConfigGlobal", makeConfigGlobal);