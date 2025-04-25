/**
 * Type definitions for the XJX library
 */
import { ValueTransformer } from '../transforms/ValueTransformer';
/**
 * Configuration interface for the library
 */
export interface Configuration {
    preserveNamespaces: boolean;
    preserveComments: boolean;
    preserveProcessingInstr: boolean;
    preserveCDATA: boolean;
    preserveTextNodes: boolean;
    preserveWhitespace: boolean;
    preserveAttributes: boolean;
    outputOptions: {
        prettyPrint: boolean;
        indent: number;
        compact: boolean;
        json: Record<string, any>;
        xml: {
            declaration: boolean;
        };
    };
    propNames: {
        namespace: string;
        prefix: string;
        attributes: string;
        value: string;
        cdata: string;
        comments: string;
        instruction: string;
        target: string;
        children: string;
    };
    valueTransforms?: ValueTransformer[];
}
export default Configuration;
