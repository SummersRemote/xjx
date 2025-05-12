```
// Reset to global config
let builder = XJX.fromXml(xml);
builder.withConfig(XJX.getConfig());

// Make config global
XJX.updateConfig(builder.config);
```