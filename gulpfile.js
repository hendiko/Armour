/**
 *
 */

'use strict';

var gulp = require('gulp');

gulp.task('js', function() {
  return gulp.src(['assets/javascripts/**/*.js'], {base: 'assets'})
    .pipe(gulp.dest('build/'));
});

gulp.task('deps', function() {
  return gulp.src(['node_modules/vue/dist/vue.js'], {base: 'node_modules'})
    .pipe(gulp.dest('build/libs/'));
});


gulp.task('dev', ['js', 'deps']);
