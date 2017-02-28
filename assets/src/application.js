/*
* @Author: laixi
* @Date:   2017-02-28 15:36:17
* @Last Modified by:   laixi
* @Last Modified time: 2017-02-28 15:49:09
*/
var _ = require('underscore');
var Backbone = require('./core');
var utils = require('./utils');
var delegate = utils.delegate;
var slice = utils.slice;
var isRefCycle = utils.isRefCycle;

  // Backbone.Application
  // -----------------------

  var Application = module.exports = Backbone.Application = function(options) {
    options || (options = {});
    this.cid = _.uniqueId(this.cidPrefix);

    this.configuration = _.extend({}, _.result(this, 'configuration'), _.result(options, 'config'));

    var components = _.extend({}, _.result(this, 'components'), _.result(options, 'components'));
    this.components = {};
    this.set(components);

    var children = _.extend({}, _.result(this, 'children'), _.result(options, 'children'));
    this.children = {};
    var that = this;
    _.each(children, function(value, key) {
      that.mount(key, value);
    });

    var start = this.start || _.noop;
    var that = this;
    var wrap = function() {
      this._hasStarted = true;
      return start.apply(this, arguments);
    };
    this.start = _.once(wrap);
    this.initialize.apply(this, arguments);
  };

  Application.extend = Backbone.Model.extend;

  var applicationPrototype = _.extend(Application.prototype, Backbone.Events, {

    _stopPropagation: false,

    cidPrefix: 'app',

    parent: null,

    initialize: function() {},

    start: function() {},

    _propagate: function(event, args, options) {
      options || (options = {});
      this.trigger('msg', event, args, options);
      if (this._stopPropagation || options.stopPropagation === true) return this;
      var parent = this.parent;
      if (parent) {
        parent._propagate.apply(parent, arguments);
      }
      return this;
    },

    attach: function(path, parent) {
      if (path && parent) {
        parent.mount(path, this);
      }
      return this;
    },

    broadcast: function(event, args, options) {
      if (!_.isString(event) || !event) return this;
      options || (options = {});
      if (options.slient !== true) this.trigger('broadcast', event, args, options);
      if (this._stopPropagation || options.stopPropagation === true) return this;
      var parent = this.parent;
      if (parent) {
        if (options.once) options.stopPropagation = true;
        parent._propagate(event, args, options);
      }
      return this;
    },

    child: function(path) {
      return this.children && this.children[path];
    },

    clear: function() {
      var that = this;
      _.each(_.keys(this.children), function(path) {
        that.unmount(path);
      });
      return this;
    },

    destroy: function() {
      this.stopForwarding();
      this.stopListening();
      this.detach();
      this.clear();
    },

    detach: function() {
      var parent = this.parent;
      if (parent) {
        parent.unmount(this);
      }
      return this;
    },

    // 是否允许广播扩散
    enablePropagation: function(bool) {
      if (bool == null) return !this._stopPropagation;
      this._stopPropagation = !bool;
    },

    get: function(key) {
      return this.components && this.components[key];
    },

    hasChildren: function() {
      return !_.isEmpty(this.children);
    },

    hasParent: function() {
      return !!this.parent;
    },

    hasStarted: function() {
      return !!this._hasStarted;
    },

    mount: function(path, child) {
      if (!_.isString(path) || !path || !child) return this;
      if (isRefCycle(this, child)) throw Error('Reference Cycle Error');
      child.detach(); // 确保 child 没有挂载到其他 app
      this.unmount(path); // 清理挂载点
      this.children[path] = child;
      child.parent = this;
      return this;
    },

    set: function(key, val) {
      var attrs;
      if (typeof key === 'object') {
        attrs = key;
      } else {
        (attrs = {})[key] = val;
      }
      _.extend(this.components, attrs);
      return this;
    },

    setConfig: function(key, val) {
      var attrs;
      if (typeof key === 'object') {
        attrs = key;
      } else {
        (attrs = {})[key] = val;
      }
      _.extend(this.configuration, attrs);
      return this;
    },

    unmount: function(child) {
      var children = this.children;
      var flag = _.isString(child);
      _.each(_.pairs(children), function(pair) {
        if (flag ? child === pair[0] : child === pair[1]) {
          pair[1].parent = null;
          delete children[pair[0]];
        }
      });
      return this;
    },

    $child: function(path, prop) {
      return delegate(this.child(path), prop, slice.call(arguments, 2));
    },

    $component: function(component, prop) {
      return delegate(this.get(component), prop, slice.call(arguments, 2));
    },

    $config: function(key, options) {
      options || (options = {});
      var config = this.configuration;
      if (_.has(config, key)) return config[key];
      if (options.own !== true && this.parent) {
        return this.parent.$config(key, options);
      }
    },

    $get: function(key, options) {
      options || (options = {});
      var components = this.components;
      if (_.has(components, key)) return components[key];
      if (options.own !== true && this.parent) {
        return this.parent.get(key, options);
      }
    },

    $parent: function(prop) {
      return delegate(this.parent, prop, slice.call(arguments, 1));
    }
  });