/*
 * @Author: laixi
 * @Date:   2017-03-22 09:26:45
 * @Last Modified by:   Xavier Yin
 * @Last Modified time: 2017-03-23 23:54:38
 */
import Attributes from './attributes';
import { extend, delegate, slice } from './core';
import _ from 'underscore';

var Controller = function(attributes, options) {
  this.cid = _.uniqueId(this.cidPrefix);
  this._attributes = {};
  this.set(_.defaults({}, attributes, _.result(this, 'defaults')), options);
  this.changed = {}; // reset this.changed to an empty object
  this.initialize.apply(this, arguments);
};

Controller.extend = extend;

var prototype = _.extend(Controller.prototype, Attributes, {
  _attributeAlias: 'control',
  _staticAttributes: ['collection', 'view', 'model'],

  cidPrefix: 'ctrl',

  initialize: function() {},

  // 委托 attribute 求值。
  // @param attr: 属性名
  // @param prop: 委托属性或方法
  delegate: function(attr, prop) {
    var val = this.get(attr);
    if (val) {
      return delegate(val, prop, slice.call(arguments, 2));
    }
  },

  // 委托 this.collection
  $collection: function(prop) {
    return delegate(this.collection, prop, slice.call(arguments, 1));
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
  }
});

export default Controller;
