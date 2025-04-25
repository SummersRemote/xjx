// Jest setup file for the XJX library tests

// JSDOM environment should already be set up by Jest's testEnvironment configuration,
// but we can add any additional mocks or configuration here if needed.

// In case we need to mock any browser features that JSDOM doesn't provide
if (typeof window !== 'undefined') {
  // If XMLSerializer isn't available in the JSDOM environment, mock it
  if (!window.XMLSerializer) {
    window.XMLSerializer = class XMLSerializer {
      serializeToString(node: Node): string {
        return `<mocked>${node.nodeName}</mocked>`;
      }
    };
  }

  // If DOMParser isn't available in the JSDOM environment, mock it
  if (!window.DOMParser) {
    window.DOMParser = class DOMParser {
      parseFromString(xmlString: string, mimeType: string): Document {
        const document = window.document.implementation.createDocument(null, 'root', null);
        
        // Create a basic document structure for testing
        const mockElement = document.createElement('mockElement');
        mockElement.textContent = xmlString;
        document.documentElement.appendChild(mockElement);
        
        return document;
      }
    };
  }
}

// Silence console errors during tests to keep output clean
jest.spyOn(console, 'error').mockImplementation(() => {});

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});