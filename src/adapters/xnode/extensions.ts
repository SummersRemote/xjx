/**
 * XNode adapter extensions registration
 */
import { XJX } from "../../XJX";
import { fromXnode } from "./source";
import { toXnode } from "./output";

// Register XNode source extensions
XJX.registerNonTerminalExtension("fromXnode", fromXnode);

// Register XNode output extensions
XJX.registerTerminalExtension("toXnode", toXnode);