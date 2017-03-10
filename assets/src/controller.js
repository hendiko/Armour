/*
 * @Author: laixi
 * @Date:   2017-02-28 15:33:59
 * @Last Modified by:   laixi
 * @Last Modified time: 2017-02-28 16:16:50
 *
 * Backbone.Controller
 */

var _ = require('underscore');
var Backbone = require('./core');
var Attributes = require('./attrs');
var utils = require('./utils');
var slice = utils.slice;
var delegate = utils.delegate;


var Controller = Backbone.Controller = function(attributes, options) {
  var attrs = attributes || {};
  options || (options = {});
  this.cid = _.uniqueId(this.cidPrefix);
  this.attributes = {};
  attrs = _.defaults({}, attrs, _.result(this, 'defaults'));
  this.set(attrs, options);
  this.changed = {};
  this.initialize.apply(this, arguments);
};

Controller.extend = Backbone.Model.extend;

var controllerPrototype = _.extend(Controller.prototype, Attributes, {

  // 覆写 Attributes._handleListeningToAttribute 方法
  _handleListeningToAttribute: function(attr, event) {
    var args = slice.call(arguments, 1);
    this.trigger.apply(this, ['control:' + attr].concat(args));
    this.trigger.apply(this, ['control', attr].concat(args));
  },

  cidPrefix: 'ctrl',

  initialize: function() {},

  // 委托 this.collection
  $collection: function(prop) {
    return delegate(this.collection, prop, slice.call(arguments, 1));
  },

  // 委托 this.controller
  $controller: function(prop) {
    return delegate(this.controller, prop, slice.call(arguments, 1));
  },

  // 委托 this.model
  $model: function(prop) {
    return delegate(this.model, prop, slice.call(arguments, 1));
  },

  // 委托 this.view
  $view: function(prop) {
    return delegate(this.view, prop, slice.call(arguments, 1));
  },


  // 快速委托 this.view 的属性或方法
  // ---------------------------------
  $el: function() {
    return this.view ? this.view.$el : null;
  },

  $findElement: function() {
    return delegate(this.view, '$', arguments);
  }
});

var delegatedRootMethods = ['append', 'appendTo', 'detach', 'html', 'prepend', 'prependTo'];
var delegatedViewMethods = ['remove', 'render', 'setElement'];
var delegatedModelMethods = ['changedAttributes', 'clear', 'destroy', 'escape', 'fetch', 'get', 'has', 'hasChanged', 'matches', 'previous', 'previousAttributes', 'set', 'save', 'toJSON', 'unset', 'url']

_.each(delegatedRootMethods, function(method) {
  controllerPrototype['$' + method] = function() {
    delegate(this.$el(), method, argumnets);
  };
});

_.each(delegatedViewMethods, function(method) {
  controllerPrototype['$' + method] = function() {
    delegate(this.view, method, argumnets);
  };
});

_.each(delegatedModelMethods, function(method) {
  controllerPrototype['$' + method] = function() {
    delegate(this.model, method, argumnets);
  };
});