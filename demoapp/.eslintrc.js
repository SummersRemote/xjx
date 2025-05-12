module.exports = {
    root: true,
    env: {
      node: true,
    },
    extends: [
      'eslint:recommended',
      'plugin:vue/vue3-essential', //Basic rules
      //'plugin:vue/vue3-recommended' // Includes formatting rules
    ],
    rules: {
      // Add or override rules here, e.g.:
      'no-unused-vars': 'warn',
      'vue/no-unused-components': 'warn'
    },
  };
