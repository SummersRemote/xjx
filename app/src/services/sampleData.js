// services/sampleData.js

export const xmlSamples = [
    {
      name: "Simple Book",
      description: "Basic XML with attributes",
      content: `<book id="123" isbn="978-0123456789">
    <title>XML Processing Guide</title>
    <author>Jane Smith</author>
    <price currency="USD">29.99</price>
    <available>true</available>
  </book>`
    },
    {
      name: "Mixed Content (HTML-like)",
      description: "Text and elements mixed together",
      content: `<article>
    <title>Understanding XML</title>
    <content>
      <p>This is a <em>paragraph</em> with <strong>mixed content</strong>. 
      It contains both text and <a href="http://example.com">links</a>.</p>
      <p>Another paragraph with <code>code snippets</code> and <span class="highlight">highlighted text</span>.</p>
    </content>
  </article>`
    },
    {
      name: "Multiple Namespaces",
      description: "XML with several namespace declarations",
      content: `<root xmlns="http://example.com/default" 
        xmlns:books="http://example.com/books"
        xmlns:auth="http://example.com/auth">
    <books:catalog>
      <books:book books:id="1">
        <books:title>Namespace Guide</books:title>
        <auth:author auth:verified="true">
          <auth:name>John Doe</auth:name>
          <auth:email>john@example.com</auth:email>
        </auth:author>
      </books:book>
    </books:catalog>
  </root>`
    },
    {
      name: "CDATA and Comments",
      description: "Special XML content types",
      content: `<?xml version="1.0" encoding="UTF-8"?>
  <?xml-stylesheet type="text/xsl" href="style.xsl"?>
  <document>
    <!-- This is a comment about the document -->
    <script type="text/javascript">
      <![CDATA[
      function sayHello() {
        if (x < y && y > z) {
          alert("Hello World!");
        }
      }
      ]]>
    </script>
    <description>
      <![CDATA[This contains <special> characters & symbols that need protection.]]>
    </description>
    <!-- End of document -->
  </document>`
    },
    {
      name: "E-commerce Order",
      description: "Complex nested structure with arrays",
      content: `<order id="ORD-2023-001" status="pending">
    <customer>
      <name>Alice Johnson</name>
      <email>alice@example.com</email>
      <address type="shipping">
        <street>123 Main St</street>
        <city>New York</city>
        <zip>10001</zip>
      </address>
    </customer>
    <items>
      <item id="ITEM-001">
        <name>Laptop Computer</name>
        <quantity>1</quantity>
        <price>999.99</price>
      </item>
      <item id="ITEM-002">
        <name>Wireless Mouse</name>
        <quantity>2</quantity>
        <price>25.50</price>
      </item>
    </items>
    <totals>
      <subtotal>1050.99</subtotal>
      <tax>84.08</tax>
      <shipping>15.00</shipping>
      <total>1150.07</total>
    </totals>
  </order>`
    },
    {
      name: "Empty and Self-closing Elements",
      description: "Various empty element patterns",
      content: `<configuration>
    <database>
      <connection string="server=localhost;db=test" />
      <timeout>30</timeout>
      <retry-count>3</retry-count>
      <features>
        <logging enabled="true"></logging>
        <caching></caching>
        <compression/>
      </features>
    </database>
    <api>
      <endpoints>
        <endpoint path="/users" method="GET" />
        <endpoint path="/orders" method="POST" />
      </endpoints>
    </api>
  </configuration>`
    },
    {
      name: "RSS Feed",
      description: "Real-world XML format example",
      content: `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
      <title>Tech News Feed</title>
      <description>Latest technology news and updates</description>
      <link>https://technews.example.com</link>
      <atom:link href="https://technews.example.com/rss" rel="self" type="application/rss+xml" />
      
      <item>
        <title>New JavaScript Framework Released</title>
        <description><![CDATA[A revolutionary new framework promises to change <em>everything</em> about web development.]]></description>
        <link>https://technews.example.com/js-framework</link>
        <pubDate>Mon, 15 Jan 2024 10:30:00 GMT</pubDate>
        <guid>https://technews.example.com/js-framework</guid>
      </item>
      
      <item>
        <title>AI Breakthrough in Natural Language</title>
        <description>Researchers achieve new milestone in AI language understanding.</description>
        <link>https://technews.example.com/ai-breakthrough</link>
        <pubDate>Sun, 14 Jan 2024 14:22:00 GMT</pubDate>
        <guid>https://technews.example.com/ai-breakthrough</guid>
      </item>
    </channel>
  </rss>`
    },
    {
      name: "Complex Document",
      description: "Comprehensive example with all features",
      content: `<?xml version="1.0" encoding="UTF-8"?>
  <?xml-stylesheet type="text/xsl" href="document.xsl"?>
  <!DOCTYPE document SYSTEM "document.dtd">
  <document xmlns="http://example.com/doc" 
            xmlns:meta="http://example.com/metadata"
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    
    <!-- Document metadata -->
    <meta:info>
      <meta:created>2024-01-15T10:30:00Z</meta:created>
      <meta:author meta:id="author-123">
        <meta:name>Dr. Sarah Wilson</meta:name>
        <meta:credentials verified="true"/>
      </meta:author>
    </meta:info>
  
    <header>
      <title>Advanced XML Processing Techniques</title>
      <abstract>
        This document explores <emphasis>advanced techniques</emphasis> for 
        processing XML data, including <term>namespace handling</term> and 
        <term>mixed content scenarios</term>.
      </abstract>
    </header>
  
    <sections>
      <section id="intro" level="1">
        <heading>Introduction</heading>
        <content>
          <p>XML processing involves many <strong>complex scenarios</strong> that require careful handling.</p>
          <code-block language="xml">
            <![CDATA[
            <example attr="value">
              Text content with <child>nested elements</child>
            </example>
            ]]>
          </code-block>
        </content>
        <subsection id="overview" level="2">
          <heading>Overview</heading>
          <content>Brief overview of topics covered.</content>
        </subsection>
      </section>
    </sections>
  
    <!-- Processing instructions and comments throughout -->
    <?page-break?>
    
    <appendix>
      <references>
        <reference id="ref1" type="book"/>
        <reference id="ref2" type="article"/>
      </references>
    </appendix>
    
    <!-- End of document -->
  </document>`
    }
  ];
  
  export const jsonSamples = [
    {
      name: "Simple User Object",
      description: "Basic JSON object",
      content: {
        "user": {
          "id": 123,
          "name": "John Doe",
          "email": "john@example.com",
          "active": true,
          "age": 30
        }
      }
    },
    {
      name: "Array of Products",
      description: "JSON array with multiple objects",
      content: {
        "products": [
          {
            "id": 1,
            "name": "Laptop",
            "price": 999.99,
            "inStock": true,
            "categories": ["electronics", "computers"]
          },
          {
            "id": 2,
            "name": "Mouse",
            "price": 25.50,
            "inStock": false,
            "categories": ["electronics", "accessories"]
          }
        ]
      }
    },
    {
      name: "Nested Company Structure",
      description: "Deeply nested JSON object",
      content: {
        "company": {
          "name": "TechCorp Inc.",
          "founded": 2010,
          "headquarters": {
            "address": {
              "street": "123 Innovation Drive",
              "city": "San Francisco",
              "state": "CA",
              "zip": "94105"
            },
            "coordinates": {
              "lat": 37.7749,
              "lng": -122.4194
            }
          },
          "departments": [
            {
              "name": "Engineering",
              "employees": 150,
              "manager": {
                "name": "Alice Smith",
                "email": "alice@techcorp.com"
              }
            },
            {
              "name": "Marketing",
              "employees": 75,
              "manager": {
                "name": "Bob Johnson",
                "email": "bob@techcorp.com"
              }
            }
          ]
        }
      }
    },
    {
      name: "XJX High-Fidelity Format",
      description: "JSON in XJX high-fidelity format",
      content: {
        "book": {
          "$attr": [
            { "id": { "$val": "123" } },
            { "isbn": { "$val": "978-0123456789" } }
          ],
          "$children": [
            { "title": { "$val": "XML Processing Guide" } },
            { "author": { "$val": "Jane Smith" } },
            { 
              "price": { 
                "$attr": [
                  { "currency": { "$val": "USD" } }
                ],
                "$val": "29.99" 
              } 
            },
            { "available": { "$val": "true" } }
          ]
        }
      }
    },
    {
      name: "Mixed Data Types",
      description: "Various JSON data types",
      content: {
        "data": {
          "string": "Hello World",
          "number": 42,
          "float": 3.14159,
          "boolean": true,
          "null_value": null,
          "array": [1, 2, 3, "four", false],
          "object": {
            "nested": "value"
          },
          "mixed_array": [
            { "type": "object", "value": 1 },
            { "type": "object", "value": 2 },
            "string_item",
            42,
            true
          ]
        }
      }
    },
    {
      name: "Blog Post with Comments",
      description: "Complex content structure",
      content: {
        "post": {
          "id": "post-123",
          "title": "Understanding JSON Processing",
          "author": {
            "name": "Sarah Wilson",
            "email": "sarah@blogger.com",
            "avatar": "https://example.com/avatar.jpg"
          },
          "content": "This is the main content of the blog post...",
          "tags": ["json", "xml", "programming", "tutorial"],
          "published": "2024-01-15T10:30:00Z",
          "comments": [
            {
              "id": "comment-1",
              "author": "Reader One",
              "text": "Great article! Very helpful.",
              "timestamp": "2024-01-15T11:15:00Z",
              "replies": [
                {
                  "id": "reply-1",
                  "author": "Sarah Wilson",
                  "text": "Thank you for reading!",
                  "timestamp": "2024-01-15T12:00:00Z"
                }
              ]
            }
          ],
          "metadata": {
            "views": 1250,
            "likes": 89,
            "shares": 23
          }
        }
      }
    },
    {
      name: "Configuration Object",
      description: "Application configuration format",
      content: {
        "config": {
          "app": {
            "name": "My Application",
            "version": "1.2.3",
            "debug": false
          },
          "database": {
            "host": "localhost",
            "port": 5432,
            "name": "myapp_db",
            "ssl": true,
            "pool": {
              "min": 2,
              "max": 10
            }
          },
          "api": {
            "endpoints": [
              {
                "path": "/users",
                "methods": ["GET", "POST"],
                "auth": true
              },
              {
                "path": "/public",
                "methods": ["GET"],
                "auth": false
              }
            ],
            "rate_limit": {
              "requests_per_minute": 100,
              "burst": 20
            }
          },
          "features": {
            "email_notifications": true,
            "file_uploads": {
              "enabled": true,
              "max_size": "10MB",
              "allowed_types": ["jpg", "png", "pdf", "doc"]
            },
            "advanced_search": false
          }
        }
      }
    },
    {
      name: "XJX Namespace Format",
      description: "High-fidelity JSON with namespaces",
      content: {
        "root": {
          "$ns": "http://example.com/default",
          "namespaceDeclarations": {
            "": "http://example.com/default",
            "books": "http://example.com/books",
            "auth": "http://example.com/auth"
          },
          "$children": [
            {
              "catalog": {
                "$ns": "http://example.com/books",
                "$pre": "books",
                "$children": [
                  {
                    "book": {
                      "$ns": "http://example.com/books",
                      "$pre": "books",
                      "$attr": [
                        { 
                          "id": { 
                            "$ns": "http://example.com/books", 
                            "$pre": "books", 
                            "$val": "1" 
                          } 
                        }
                      ],
                      "$children": [
                        {
                          "title": {
                            "$ns": "http://example.com/books",
                            "$pre": "books",
                            "$val": "Namespace Guide"
                          }
                        },
                        {
                          "author": {
                            "$ns": "http://example.com/auth",
                            "$pre": "auth",
                            "$attr": [
                              {
                                "verified": {
                                  "$ns": "http://example.com/auth",
                                  "$pre": "auth",
                                  "$val": "true"
                                }
                              }
                            ],
                            "$children": [
                              {
                                "name": {
                                  "$ns": "http://example.com/auth",
                                  "$pre": "auth",
                                  "$val": "John Doe"
                                }
                              }
                            ]
                          }
                        }
                      ]
                    }
                  }
                ]
              }
            }
          ]
        }
      }
    }
  ];
  
  export default {
    xmlSamples,
    jsonSamples
  };