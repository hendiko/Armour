module.exports = {
  entry: {
    '0.2.0': './assets/src/main.js',
    '0.3.0': './assets/v030/main.js'
  },
  output: {
    filename: 'jackbone-[name].js',
    path: './build',
    library: 'Jackbone',
    libraryTarget: 'umd'
  },
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loaders: [`babel-loader?${JSON.stringify({presets: [['es2015', {"loose": true}]]})}`]
      // loader: 'babel-loader',
      // query: {
      //   presets: ['es2015'],
      // }
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
