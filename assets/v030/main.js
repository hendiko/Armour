/*
 * @Author: laixi
 * @Date:   2017-03-14 11:34:34
 * @Last Modified by:   laixi
 * @Last Modified time: 2017-05-17 13:57:15
 */
import _ from 'underscore';
import Attributes from './attributes';
import Backbone from './core';
import Controller from './controller';
import Events from './events';
import Model from './model';
import Request from './request';
import View from './view';

Backbone.Attributes = Attributes;
Backbone.Controller = Controller;
Backbone.Model = Model;
Backbone.Request = Request;
Backbone.View = View;
Backbone.Collection = Backbone.Collection.extend({
  model: Model
});

_.extend(Backbone, Events);

_.each(['Model', 'View', 'Collection', 'Router', 'History'], function(klass) {
  _.extend(Backbone[klass].prototype, Events);
});

// 扩展 Model 实例方法，增加 allChanged 和 anyChanged 方法。
_.extend(Model.prototype, _.pick(Attributes, 'allChanged', 'anyChanged'));
Backbone.JVERSION = '0.3.4';
// this is invalid in es6
module.exports = Backbone;
