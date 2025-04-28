/**
 * Basic JSON primitive types
 */
export type JSONPrimitive = string | number | boolean | null;
/**
 * JSON array type (recursive definition)
 */
export type JSONArray = JSONValue[];
/**
 * JSON object type (recursive definition)
 */
export interface JSONObject {
    [key: string]: JSONValue;
}
/**
 * Combined JSON value type that can be any valid JSON structure
 */
export type JSONValue = JSONPrimitive | JSONArray | JSONObject;
/**
 * Type for XML-in-JSON structure based on the library's configuration
 * This is a generic template that will use the actual property names from config
 */
export interface XMLJSONNode {
    [tagName: string]: XMLJSONElement;
}
/**
 * Structure of an XML element in JSON representation
 */
export interface XMLJSONElement {
    [key: string]: JSONValue | XMLJSONNode[];
}
