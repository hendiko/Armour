/*
 * @Author: laixi
 * @Date:   2017-05-27 14:36:03
 * @Last Modified by:   laixi
 * @Last Modified time: 2017-06-05 23:08:59
 */
import _ from 'lodash';
import Backbone from './assets/src/main';
import del from 'del';
import gulp from 'gulp';
import rename from 'gulp-rename';
import sequence from 'run-sequence';
import uglifyPlugin from 'uglifyjs-webpack-plugin';
import webpack from 'webpack-stream';

// config object for webpack
var config = {

  version: Backbone.JACKBONE_VERSION,

  name: 'jackbone',

  filepath: 'assets/src/main.js',

  // get webpack configuration for build
  build: function() {
    return {
      output: {
        filename: this.name + '-' + this.version + '.js',
        library: 'Jackbone',
        libraryTarget: 'umd'
      },
      module: {
        loaders: [{
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
          query: {
            presets: [
              ['es2015', { loose: true }]
            ]
          }
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
  },

  // get webpack configuration for release
  release: function() {
    var options = _.extend(this.build(), {
      plugins: [
        new uglifyPlugin({
          mangle: {
            except: ['$', 'exports', 'require']
          }
        })
      ]
    });
    options.output.filename = this.name + '-' + this.version + '.min.js';
    return options;
  }
};

// build jackbone.js with webpack
gulp.task('jackbone:build', () => {
  return gulp.src(config.filepath, { base: 'assets/src' })
    .pipe(webpack(config.build()))
    .pipe(gulp.dest('build'));
});

// build jackbone.js for release with webpack
gulp.task('jackbone:release', () => {
  return gulp.src(config.filepath, { base: 'assets/src' })
    .pipe(webpack(config.release()))
    .pipe(gulp.dest('build'));
});

// copy dependencies to output directory
gulp.task('copy', () => {
  return gulp.src([
      'node_modules/jquery/dist/jquery.js',
      'node_modules/underscore/underscore.js'
    ])
    .pipe(rename((path) => {
      path.dirname = '';
    }))
    .pipe(gulp.dest('build'));
});

// clean output directory
gulp.task('clean', () => {
  return del('build/*');
});

// build project for development
gulp.task('build', ['clean'], (cb) => {
  return sequence(['jackbone:build', 'jackbone:release', 'copy'], cb);
});

// build project for release
gulp.task('release', ['build'], () => {
  return gulp.src('build/' + config.name + '*.js', { base: 'build' })
    .pipe(gulp.dest('dist'));
});

gulp.task('default', ['build']);
