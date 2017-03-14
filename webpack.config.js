module.exports = {
  entry: {
    v010: './assets/src/main.js',
    v020: './assets/v020/main.js'
  },
  output: {
    filename: 'jackbone.[name].js',
    path: './build',
    library: 'Jackbone',
    libraryTarget: 'umd'
  },
  module: {
    rules: [{
      test: /\.js$/,
      use: 'babel-loader',
      query: { presets: ['es2015', 'stage-0'] }
    }]
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
