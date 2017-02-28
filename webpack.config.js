module.exports = {
  entry: './assets/src/main.js',
  output: {
    filename: 'jackbone.js',
    path: './build',
    library: 'Jackbone',
    libraryTarget: 'umd'
  },
  externals: {
    'jquery': {
      root: '$',
      commonjs: 'jquery',
      commonjs2: 'jquery',
      amd: 'jquery'
    },
    'underscore': {
      root: '_',
      commonjs: 'underscore',
      commonjs2: 'underscore',
      amd: 'underscore'
    } 
  }
};
