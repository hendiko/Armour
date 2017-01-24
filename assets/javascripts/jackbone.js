/*
 * @Author: laixi
 * @Date:   2017-01-24 16:02:01
 * @Last Modified by:   Xavier Yin
 * @Last Modified time: 2017-01-24 22:34:25
 */
(function(factory) {

  // Establish the root object, `window` (`self`) in the browser, or `global` on the server.
  // We use `self` instead of `window` for `WebWorker` support.
  var root = (typeof self == 'object' && self.self == self && self) ||
    (typeof global == 'object' && global.global == global && global);

  // Set up Backbone appropriately for the environment. Start with AMD.
  if (typeof define === 'function' && define.amd) {
    define(['underscore', 'jquery', 'exports'], function(_, $, exports) {
      // Export global even in AMD case in case this script is loaded with
      // others that may still expect a global Backbone.
      root.Backbone = factory(root, exports, _, $);
    });

    // Next for Node.js or CommonJS. jQuery may not be needed as a module.
  } else if (typeof exports !== 'undefined') {
    var _ = require('underscore'),
      $;
    try {
      $ = require('jquery');
    } catch (e) {}
    factory(root, exports, _, $);

    // Finally, as a browser global.
  } else {
    root.Backbone = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender || root.$));
  }

}(function(root, Backbone, _, $) {

  // 委托获取属性或执行方法。
  // 如果 attr 是 obj 的属性，则直接返回该属性值。
  // 如果 attr 是 obj 的方法，则以 obj 作为方法的上下文，args 作为方法参数求值。
  var delegate = function(obj, attr, args) {
    var prop = _.property(attr)(obj);
    return _.isFunction(prop) ? prop.apply(obj, args) : prop;
  };

  // 判断给定对象是否具有触发事件的能力
  var isTriggerable = (function(fn) {
    return function(obj) {
      return _.isFunction(fn(obj));
    };
  }(_.property('trigger')));

  // 切片函数
  var slice = Array.prototype.slice;



  // Attributes Prototype
  // ---------------------
  // 实现一个类似于 Backbone.Model 管理 model.attributes 的效果
  // 注意：应确保扩展对象拥有一个 attributes 属性，例如： `extendedObject.attributes = {}`。

  var attributesPrototype = _.extend({

    // 转发属性对象触发的事件
    // 转发后的事件第一个参数为 '属性名::事件名'。
    _forwardEvents: (function() {
      var callback = function(attr, event) {
        var args = slice.call(arguments, 1);
        args[0] = attr + '::' + event;
        this.trigger.apply(this, args);
      };

      // 当设置控制器属性时，应停止转发具有事件能力的旧属性事件，
      // 同时转发新属性的事件。
      return function(attr, prop) {
        var prev = this.previous(attr);
        if (isTriggerable(prev)) this.stopListening(prev, 'all');
        if (isTriggerable(prop)) {
          this.listenTo(prop, 'all', _.partial(callback, attr));
        }
        return this;
      };
    }()),

    destroy: function() {
      this.clear();
      this.stopListening();
      this.off();
      return this;
    },

    // 设置控制器属性哈希
    set: function(key, val, options) {
      if (key == null) return this;

      var attrs;
      if (typeof key === 'object') {
        attrs = key;
      } else {
        (attrs = {})[key] = val;
      }

      options || (options = {});

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

      this.id = this.get(_.result(this, 'idAttribute', 'id'));
      this.model = this.get('model');
      this.view = this.get('view');

      // 转发 Controller 属性可能触发的事件
      if (changes.length) {
        for (var i = 0; i < changes.length; i++) {
          this._forwardEvents(changes[i], current[changes[i]]);
        }
      }

      if (!silent) {
        if (changes.length) this._pending = options;
        for (var i = 0; i < changes.length; i++) {
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

    // 获取控制器属性
    get: function(attr) {
      return this.attributes[attr];
    },

    // 移除控制器属性
    unset: function(attr, options) {
      return this.set(attr, void 0, _.extend({}, options, {
        unset: true
      }));
    },

    // 清空控制器属性
    clear: function(options) {
      var attrs = {};
      for (var key in this.attributes) attrs[key] = void 0;
      return this.set(attrs, _.extend({}, options, {
        unset: true
      }));
    },

    // 与 Model 同名方法意义相同
    hasChanged: function(attr) {
      if (attr == null) return !_.isEmpty(this.changed);
      return _.has(this.changed, attr);
    },

    // 与 Model 同名方法意义相同
    changedAttributes: function(diff) {
      if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
      var old = this._changing ? this._previousAttributes : this.attributes;
      var changed = {};
      for (var attr in diff) {
        var val = diff[attr];
        if (_.isEqual(old[attr], val)) continue;
        changed[attr] = val;
      }
      return _.size(changed) ? changed : false;
    },

    // 与 Model 同名方法意义相同
    previous: function(attr) {
      if (attr == null || !this._previousAttributes) return null;
      return this._previousAttributes[attr];
    },

    // 与 Model 同名方法意义相同
    previousAttributes: function() {
      return _.clone(this._previousAttributes);
    },

    // 与 Model 同名方法意义相同
    clone: function() {
      return new this.constructor(this.attributes);
    },

    // 与 Model 同名方法意义相同
    toJSON: function(options) {
      return _.clone(this.attributes);
    },

    // 查找 attr 属性作为委托对象，
    // 如果 name 是委托对象的一个属性，则直接返回属性值。
    // 如果 name 是委托对象的一个方法，则调用该方法求值。
    // name 之后的参数都是传递给委托对象的方法参数。
    delegate: function(attr, name) {
      var prop = this.get(attr);
      if (prop) {
        return delegate.call(this, prop, name, slice.call(arguments, 2));
      }
    }
  }, Backbone.Events);



  // Backbone.Controller
  // ----------------------

  // MVC 之 Controller
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

  _.extend(Controller.prototype, attributesPrototype, {

    idAttribute: 'id',

    cidPrefix: 'ctl',

    initialize: function() {},

    // 委托 this.model 处理事务的快捷方式
    $model: function(name) {
      return delegate.call(this, this.model, name, slice.call(arguments, 1));
    },

    // 委托 this.view 处理事务的快捷方式
    $view: function(name) {
      return delegate.call(this, this.view, name, slice.call(arguments, 1));
    },

    // 直接委托 this.model 处理事务的快捷方式
    // -----------------------------------------

    $set: function() {
      return delegate.call(this, this.model, 'set', arguments);
    },

    $get: function() {
      return delegate.call(this, this.model, 'get', arguments);
    },

    $escape: function() {
      return delegate.call(this, this.model, 'escape', arguments);
    },

    $has: function() {
      return delegate.call(this, this.model, 'has', arguments);
    },

    $matches: function() {
      return delegate.call(this, this.model, 'matches', arguments);
    },

    $unset: function() {
      return delegate.call(this, this.model, 'unset', arguments);
    },

    $clear: function() {
      return delegate.call(this, this.model, 'clear', arguments);
    },

    $hasChanged: function() {
      return delegate.call(this, this.model, 'hasChanged', arguments);
    },

    $changedAttributes: function() {
      return delegate.call(this, this.model, 'changedAttributes', arguments);
    },

    $previous: function() {
      return delegate.call(this, this.model, 'previous', arguments);
    },

    $previousAttributes: function() {
      return delegate.call(this, this.model, 'previousAttributes', arguments);
    },

    $fetch: function() {
      return delegate.call(this, this.model, 'fetch', arguments);
    },

    $save: function() {
      return delegate.call(this, this.model, 'save', arguments);
    },

    $destroy: function() {
      return delegate.call(this, this.model, 'destroy', arguments);
    },

    $url: function() {
      return delegate.call(this, this.model, 'url', arguments);
    },

    $toJSON: function() {
      return _.result(this.model, 'toJSON');
    },

    // 直接委托 this.view 处理事务的快捷方式
    // -----------------------------------------

    // 返回视图根节点
    $el: function() {
      return this.view ? this.view.$el : null;
    },

    // 销毁视图
    $remove: function() {
      return delegate.call(this, this.view, 'remove', arguments);
    },

    // 渲染视图
    $render: function() {
      return delegate.call(this, this.view, 'render', arguments);
    },

    // 设置视图根节点
    $setElement: function() {
      return delegate.call(this, this.view, 'setElement', arguments);
    },

    // 查找视图内元素，委托 view.$ 
    $findElement: function() {
      return delegate.call(this, this.view, '$', arguments);
    },

    // 直接获取或设置视图 HTML
    $html: function() {
      return delegate.call(this, this.$el(), 'html', arguments);
    }
  });

  Controller.extend = Backbone.Model.extend;


  // Backbone.Application
  // -----------------------

  var Application = Backbone.Application = function(options) {
    options || (options = {});
    this.deps = _.extend({}, options.deps);
    this.config = _.extend({}, options.config);
    this.children = _.extend({}, options.children);
    this.cid = _.uniqueId(this.cidPrefix);

    this.attributes = {};
    var attrs = _.defaults({}, options.attributes, _.result(this, 'defaults'));
    this.set(attrs);
    this.initialize.apply(this, arguments);
  };

  _.extend(Application.prototype, attributesPrototype, {

    __started: false,

    idAttribute: 'id',

    cidPrefix: 'app',

    initialize: function() {},

    // 父 App
    parent: null,

    // 挂载到父 Application
    attach: function(name, app) {
      app.mount(this, name);
      return this;
    },

    destroy: function() {
      this.clear();
      this.stopListening();
      this.off();
      this.detach();
      var that = this;
      _.each(_.keys(this.children), function(name) {
        that.unmount(name);
      });
      return this;
    },

    // 从父 App 脱离
    detach: function() {
      var parent = this.parent;
      if (parent) {
        parent.unmount(this);
      }
      return this;
    },

    broadcast: function() {
      var args = _.toArray(arguments);
      args.unshift('broadcast');
      var apps = _.values(this.children);
      this.parent && apps.unshift(this.parent);
      _.each(apps, function(app) {
        app.trigger.apply(app, args);
      });
    },

    // 挂载 App
    mount: function(name, app) {
      // 不允许循环挂载
      if (this.parent && this.parent === app) return this;
      app.detach(); // 首先确保自由身
      this.unmount(name); // 确保挂载点空闲
      this.children[name] = app;
      app.parent = this;
      return this;
    },

    // 卸载 App
    unmount: function(name) {
      var children = this.children;
      var flag = _.isString(name);
      var that = this;
      _.each(_.pairs(children), function(pair) {
        if (flag ? name == pair[0] : name === pair[1]) {
          pair[1].parent = null;
          delete children[pair[0]];
        }
      });
      return this;
    },

    hasParent: function() {
      return !!this.parent;
    },

    hasChildren: function() {
      return !_.isEmpty(this.children);
    },

    // 如果 options.silent 为真，则只启动自己，不启动子应用
    kickoff: function(options) {
      if (this.__started) return this;
      this.__started = true;
      var args = slice.call(arguments, 0);
      var eventArgs = slice.call(arguments, 0);

      eventArgs[0] = 'before:start';
      this.trigger.apply(this, eventArgs);

      options || (options = {});

      if (!options.silent) {
        _.each(this.children, function(child) {
          child.kickoff.apply(child, args);
        });
      }

      this.start.apply(this, slice.call(eventArgs, 1));

      eventArgs[0] = 'after:start';
      this.trigger.apply(this, eventArgs);
      return this;
    },

    start: function() {},

    child: function(name) {
      return _.property(name)(this.children);
    },

    $app: function(appName, attr) {
      return delegate.call(this, this.child(appName), attr, slice.call(arguments, 2));
    },

    $parent: function(attr) {
      return delegate.call(this, this.parent, attr, slice.call(arguments, 1));
    },

    $config: function(name, options) {
      var config = this.config;
      if (_.has(config, name)) return config[name];
      var parent = this.parent;
      if (parent) {
        return parent.$config(name);
      }
    },

    $deps: function(name, options) {
      var deps = this.deps;
      if (_.has(deps, name)) return deps[name];
      var parent = this.parent;
      if (parent) {
        return parent.$deps(name);
      }
    }
  });

  Application.extend = Backbone.Model.extend;
}));