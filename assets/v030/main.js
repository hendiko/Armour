/*
 * @Author: laixi
 * @Date:   2017-03-14 11:34:34
 * @Last Modified by:   laixi
 * @Last Modified time: 2017-03-22 18:07:44
 */
import _ from 'underscore';
import Application from './application';
import Attributes from './attributes';
import Backbone from './core';
import Controller from './controller';
import Events from './events';
import Model from './model';
import View from './view';

Backbone.Application = Application;
Backbone.Attributes = Attributes;
Backbone.Controller = Controller;
Backbone.Model = Model;
Backbone.View = View;

_.extend(Backbone, Events);

_.each(['Model', 'View', 'Collection', 'Router', 'History'], function(klass) {
  _.extend(Backbone[klass].prototype, Events);
});

// this is invalid in es6
module.exports = Backbone;