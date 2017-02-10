/*
 * @Author: laixi
 * @Date:   2017-02-09 13:49:11
 * @Last Modified by:   laixi
 * @Last Modified time: 2017-02-10 18:25:17
 *
 * 
 */
(function(factory) {
  // `self`(known as `window`) in browser, or `global` on the server.
  var root = (typeof self == 'object' && self.self == self && self) ||
    (typeof global == 'object' && global.global == global && global);

  // AMD 环境
  if (typeof define === 'function' && define.amd) {
    define(['underscore', 'jquery', 'backbone', 'exports'], function(_, $, Backbone, exports) {
      root.Jackbone = factory(root, exports, _, $, Backbone);
    });
  } else if (typeof exports !== 'undefined') {
    // NodeJS 或 CommonJS 环境
    var _ = require('underscore');
    var Backbone = require('backbone');
    var $;
    try {
      $ = require('jquery');
    } catch (e) {
      // do nothing
    }
    return factory(root, exports, _, $, Backbone);
  } else {
    // 全局环境
    root.Jackbone = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender || root.$), root.Backbone);
  }

}(function(root, Jackbone, _, $, Backbone) {

  // 声明 underscore 副本
  _ = _.clone(_);

  _.extend(Jackbone, Backbone);
  // 保留对原始 Backbone 的引用
  Jackbone.Backbone = Backbone;
  Backbone = Jackbone;

  // 委托获取属性或执行方法。
  // 如果 attr 是 obj 的属性，则直接返回该属性值。
  // 如果 attr 是 obj 的方法，则以 obj 作为方法的上下文，args 作为方法参数求值。
  var delegate = function(obj, attr, args) {
    var value = _.property(attr)(obj);
    return _.isFunction(value) ? value.apply(obj, args) : value;
  };

  // 判断给定对象是否具有触发事件的能力
  var isTriggerable = (function(fn) {
    return function(obj) {
      return _.isFunction(fn(obj));
    };
  }(_.property('trigger')));

  // 切片函数
  var slice = Array.prototype.slice;


  // Attributes
  // ==============

  var Attributes = _.extend({

    _attributeHandlers: {},

    // 转发 attribute 对象触发的事件
    // 转发事件：
    //  `attribute:attr` : 第一个参数是事件名称，其后是事件参数。
    //  `attribute` : 第一个参数是 attribute 名称，然后是事件名称，然后是事件参数。
    _handleListeningToAttribute: function(attr, event) {
      var args = slice.call(arguments, 1);
      this.trigger.apply(this, ['attribute:' + attr].concat(args));
      this.trigger.apply(this, ['attribute', attr].concat(args));
    },

    // 监听并转发 attribute 触发的事件
    _listenToAttribute: function(attr, value) {
      // 停止对旧对象的监听。
      var prev = this.previous(attr);
      var handlers = this._attributeHandlers;
      var handler = handlers[attr];
      // 如果 handler 存在，表示正在对 prev 进行监听，
      // 因此必须取消监听，同时删除 handler。
      if (handler) {
        this.stopListening(prev, 'all', handler);
        delete handlers[attr];
      }
      // 只监听具有事件能力的对象。
      if (isTriggerable(value)) {
        handler = handlers[attr] = _.partial(this._handleListeningToAttribute, attr);
        this.listenTo(value, 'all', handler);
      }
      return this;
    },

    // 检查 attributes 是否发生变化（diff 为假），或是否会发生变化（diff 为真）
    changedAttributes: function(diff) {
      if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
      var old = this._changing ? this._previousAttributes : (this.attributes || (this.attributes = {}));
      var changed = {};
      for (var attr in diff) {
        var val = diff[attr];
        if (_.isEqual(old[attr], val)) continue;
        changed[attr] = val;
      }
      return _.size(changed) ? changed : false;
    },

    // 清空 attributes
    clear: function(options) {
      var attrs = {};
      for (var key in this.attributes) attrs[key] = void 0;
      return this.set(attrs, _.extend({}, options, {
        unset: true
      }));
    },

    // 克隆
    clone: function() {
      return new this.constructor(this.attributes);
    },

    // 委托 attribute 求值。
    // @param attr: 属性名
    // @param prop: 委托属性或方法
    delegate: function(attr, prop) {
      var val = this.get(attr);
      if (val) {
        return delegate(val, prop, slice.call(arguments, 2));
      }
    },

    // 销毁
    destroy: function() {
      // 清空 attributes（同时停止对所有 attribute 的监听行为）
      this.clear();
      // 停止所有监听（非 attributes 对象）
      this.stopListening();
      return this;
    },

    // 读取 attribute
    get: function(attr) {
      return this.attributes && this.attributes[attr];
    },

    // 判断是否有用某个 attribute
    has: function(attr) {
      return this.get(attr) != null;
    },

    // 判断 attributes 或 attribute 是否发生变化
    hasChanged: function(attr) {
      if (attr == null) return !_.isEmpty(this.changed);
      return _.has(this.changed, attr);
    },

    // 读取 attribute 变化前的值
    previous: function(attr) {
      if (attr == null || !this._previousAttributes) return null;
      return this._previousAttributes[attr];
    },

    // 读取变化前的 attributes
    previousAttributes: function() {
      return _.clone(this._previousAttributes);
    },

    // 设置 attributes
    set: function(key, val, options) {
      if (key == null) return this;

      var attrs;
      if (typeof key === 'object') {
        attrs = key;
      } else {
        (attrs = {})[key] = val;
      }

      options || (options = {});
      this.attributes || (this.attributes = {});

      var unset = options.unset;
      var silent = options.silent;
      var changes = [];

      var changing = this._changing;
      this._changing = true;

      if (!changing) {
        this._previousAttributes = _.clone(this.attributes);
        this.changed = {};
      }

      var current = this.attributes;
      var changed = this.changed;
      var prev = this._previousAttributes;

      for (var attr in attrs) {
        val = attrs[attr];
        if (!_.isEqual(current[attr], val)) changes.push(attr);

        if (!_.isEqual(prev[attr], val)) {
          changed[attr] = val;
        } else {
          delete changed[attr];
        }
        unset ? delete current[attr] : current[attr] = val;
      }

      var i;
      var props = ['collection', 'controller', 'model', 'view'];
      for (i in props) {
        this[props[i]] = this.get(props[i]);
      }

      for (i = 0; i < changes.length; i++) {
        this._listenToAttribute(changes[i], current[changes[i]]);
      }

      if (!silent) {
        if (changes.length) this._pending = options;
        for (i = 0; i < changes.length; i++) {
          this.trigger('change:' + changes[i], this, current[changes[i]], options);
        }
      }

      if (changing) return this;
      if (!silent) {
        while (this._pending) {
          this._pending = false;
          this.trigger('change', this, options);
        }
      }
      this._pending = false;
      this._changing = false;
      return this;
    },

    // 获取 attributes 副本
    toJSON: function(options) {
      return _.clone(this.attributes);
    },

    // 移除 attribute
    unset: function(attr, options) {
      return this.set(attr, void 0, _.extend({}, options, {
        unset: true
      }));
    }
  }, Backbone.Events);



  // Backbone.Controller
  // ==============

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


  // Backbone.Application
  // -----------------------

  var Application = Backbone.Application = function(options) {
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

  // 检查 App 挂载是否会导致循环引用
  var isRefCycle = function(parent, child) {
    if (!parent) return false;
    if (child === parent) return true;
    return isRefCycle(parent.parent, child);
  };

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

  return Backbone;
}));