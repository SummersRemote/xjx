import { defineStore } from "pinia";
import XjxService from "../services/xjxService";

// Default XML example
const DEFAULT_XML = `<?xml version="1.0" encoding="UTF-8"?>
<root xmlns:ns="http://example.org" id="root-id">
  <ns:item id="123">
    <title>Example Item</title>
    <ns:description>This is a <![CDATA[CDATA section with <tags> inside]]> with special characters &amp;</ns:description>
    <!-- This is a comment -->
    <?xml-stylesheet type="text/css" href="style.css"?>
    <empty></empty>
    <tags>
      <tag>XML</tag>
      <tag>JSON</tag>
      <tag>Converter</tag>
    </tags>
  </ns:item>
</root>`;

// Create and export the store
export const useXjxStore = defineStore("xjx", {
  state: () => ({
    // XML and JSON content
    xmlContent: DEFAULT_XML,
    jsonContent: "",

    // Path navigation
    pathInput: "",
    pathResult: "",

    // Configuration options
    config: {
      preserveNamespaces: true,
      preserveComments: true,
      preserveProcessingInstr: true,
      preserveCDATA: true,
      preserveTextNodes: true,
      preserveAttributes: true,
      preserveWhitespace: false,

      outputOptions: {
        prettyPrint: true,
        indent: 2,
        compact: true,
        json: {},
        xml: {
          declaration: true,
        },
      },

      propNames: {
        namespace: "$ns",
        prefix: "$pre",
        attributes: "$attr",
        value: "$val",
        cdata: "$cdata",
        comments: "$cmnt",
        instruction: "$pi",
        target: "$trgt",
        children: "$children",
      },

      // New: Value transformers array (initialized as an empty array)
      valueTransforms: [],
    },

    // Utility state
    isProcessing: false,
    error: null,

    // Notification system
    notification: {
      show: false,
      text: "",
      color: "info",
      timeout: 3000,
    },
  }),

  actions: {
    // Convert XML to JSON
    async convertXmlToJson() {
      this.isProcessing = true;
      this.error = null;

      try {
        // Use the XjxService to convert XML to JSON
        const jsonObj = XjxService.xmlToJson(this.xmlContent, this.config);

        // Format and store the result
        this.jsonContent = JSON.stringify(jsonObj, null, 2);
      } catch (error) {
        this.error = `Error converting XML to JSON: ${error.message}`;
        console.error(error);
      } finally {
        this.isProcessing = false;
      }
    },

    // Convert JSON to XML
    async convertJsonToXml() {
      this.isProcessing = true;
      this.error = null;

      try {
        // Parse JSON content
        const jsonObj = JSON.parse(this.jsonContent);

        // Use the XjxService to convert JSON to XML
        const xmlString = XjxService.jsonToXml(jsonObj, this.config);

        // Store the result
        this.xmlContent = xmlString;
      } catch (error) {
        this.error = `Error converting JSON to XML: ${error.message}`;
        console.error(error);
      } finally {
        this.isProcessing = false;
      }
    },

    // Reset to defaults
    resetToDefault() {
      this.xmlContent = DEFAULT_XML;
      this.jsonContent = "";
      this.pathInput = "";
      this.pathResult = "";
      this.error = null;
      this.config.valueTransforms = []; // Reset transformers

      // Convert the default XML to JSON
      this.convertXmlToJson();
    },

    // Get a value using path
    getPath() {
      this.error = null;

      try {
        if (!this.jsonContent) {
          throw new Error(
            "Please convert XML to JSON first before using getPath"
          );
        }

        const jsonObj = JSON.parse(this.jsonContent);
        const path = this.pathInput.trim();

        if (!path) {
          throw new Error("Please enter a path to navigate");
        }

        // Use the XjxService to get the path
        const result = XjxService.getPath(jsonObj, path, this.config);

        // Format the result for display
        if (result === undefined) {
          this.pathResult = "Path not found";
        } else if (typeof result === "object") {
          this.pathResult = JSON.stringify(result, null, 2);
        } else {
          this.pathResult = String(result);
        }
      } catch (error) {
        this.error = `Error getting path: ${error.message}`;
        this.pathResult = "";
        console.error(error);
      }
    },

    // Clear path navigation
    clearPath() {
      this.pathInput = "";
      this.pathResult = "";
    },

    // Show notification
    showNotification(text, color = "info", timeout = 3000) {
      this.notification = {
        show: true,
        text,
        color,
        timeout,
      };

      // Auto-hide notification after timeout
      setTimeout(() => {
        this.hideNotification();
      }, timeout);
    },

    // Hide notification
    hideNotification() {
      this.notification.show = false;
    },
  }
});
