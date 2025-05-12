module.exports = {
    transpileDependencies: ['vuetify'],
    configureWebpack: {
      resolve: {
        alias: {
          '@': require('path').resolve(__dirname, 'src')
        }
      }
    }
  };