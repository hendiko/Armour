/*
 * @Author: laixi
 * @Date:   2017-03-14 11:34:34
 * @Last Modified by:   Xavier Yin
 * @Last Modified time: 2017-05-15 10:35:25
 */
import _ from 'underscore';
import Attributes from './attributes';
import Backbone from './core';
import Controller from './controller';
import Events from './events';
import Model from './model';
import View from './view';

Backbone.Attributes = Attributes;
Backbone.Controller = Controller;
Backbone.Model = Model;
Backbone.View = View;

_.extend(Backbone, Events);

_.each(['Model', 'View', 'Collection', 'Router', 'History'], function(klass) {
  _.extend(Backbone[klass].prototype, Events);
});

// 扩展 Model 实例方法，增加 allChanged 和 anyChanged 方法。
_.extend(Model.prototype, _.pick(Attributes, 'allChanged', 'anyChanged'));
Backbone.JVERSION = '0.3.2';
// this is invalid in es6
module.exports = Backbone;