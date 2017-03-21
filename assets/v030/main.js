/*
 * @Author: laixi
 * @Date:   2017-03-14 11:34:34
 * @Last Modified by:   laixi
 * @Last Modified time: 2017-03-21 23:58:43
 */
import Application from './application';
import Backbone from './core';
import Events from './events';
import _ from 'underscore';

Backbone.Application = Application;

_.extend(Backbone, Events);



_.each(['Model', 'View', 'Collection', 'Router', 'History'], function(klass) {
  _.extend(Backbone[klass].prototype, Events);
});

// this is invalid in es6
module.exports =  Backbone;