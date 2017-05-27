/*
 * @Author: laixi
 * @Date:   2017-05-27 14:36:03
 * @Last Modified by:   laixi
 * @Last Modified time: 2017-05-27 16:54:52
 */
import _ from 'lodash';
import del from 'del';
import gulp from 'gulp';
import rename from 'gulp-rename';
import sequence from 'gulp-run-sequence';
import uglifyPlugin from 'uglifyjs-webpack-plugin';
import webpack from 'webpack-stream';

var config = {
  version: '0.3.0-alpha',
  name: 'jackbone',
  filepath: 'assets/src/main.js',
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

gulp.task('jackbone:build', () => {
  return gulp.src(config.filepath, { base: 'assets/src' })
    .pipe(webpack(config.build()))
    .pipe(gulp.dest('build'));
});

gulp.task('jackbone:release', () => {
  return gulp.src(config.filepath, { base: 'assets/src' })
    .pipe(webpack(config.release()))
    .pipe(gulp.dest('build'));
});

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

gulp.task('clean', () => {
  return del('build/*');
});

gulp.task('build', ['clean'], (cb) => {
  return sequence(['jackbone:build', 'jackbone:release', 'copy'], cb);
});

gulp.task('release', ['build'], () => {
  return gulp.src('build/' + config.name + '*.js', { base: 'build' })
    .pipe(gulp.dest('dist'));
});

gulp.task('default', ['build']);
