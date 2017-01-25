/*
 * @Author: laixi
 * @Date:   2017-01-24 16:02:01
 * @Last Modified by:   laixi
 * @Last Modified time: 2017-01-25 17:49:48
 */
define(function(require, exports, module) {
  var _ = require('underscore');
  var Backbone = require('backbone');

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


  // 检查 App 挂载是否会形成死循环
  var isClosed = function(parent, child) {
    if (!parent) return false;
    if (child === parent) return true;
    return isClosed(parent.parent, child);
  };


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

    // 清空控制器属性
    clear: function(options) {
      var attrs = {};
      for (var key in this.attributes) attrs[key] = void 0;
      return this.set(attrs, _.extend({}, options, {
        unset: true
      }));
    },

    // 与 Model 同名方法意义相同
    clone: function() {
      return new this.constructor(this.attributes);
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
    },

    // 销毁
    destroy: function() {
      this.clear();
      this.stopListening();
      this.off();
      return this;
    },

    // 获取控制器属性
    get: function(attr) {
      return this.attributes[attr];
    },

    // 与 Model 同名方法意义相同
    hasChanged: function(attr) {
      if (attr == null) return !_.isEmpty(this.changed);
      return _.has(this.changed, attr);
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
      this.collection = this.get('collection');
      this.controller = this.get('controller');
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

    // 与 Model 同名方法意义相同
    toJSON: function(options) {
      return _.clone(this.attributes);
    },

    // 移除控制器属性
    unset: function(attr, options) {
      return this.set(attr, void 0, _.extend({}, options, {
        unset: true
      }));
    }
  }, Backbone.Events);


  // Backbone.Controller
  // ----------------------

  // MVC 之 Controller
  // attributes 可以是任何属性哈希，如果 attributes 中含有 model 或 view，
  // 它们同时会被直接绑定到 controller。
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

  _.extend(Controller.prototype, attributesPrototype, {

    cidPrefix: 'ctl',

    idAttribute: 'id',

    initialize: function() {},

    // 委托 this.collection 处理事务的快捷方式
    $collection: function(prop) {
      return delegate.call(this, this.collection, prop, slice.call(arguments, 1));
    },

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

    $changedAttributes: function() {
      return delegate.call(this, this.model, 'changedAttributes', arguments);
    },

    $clear: function() {
      return delegate.call(this, this.model, 'clear', arguments);
    },

    $destroy: function() {
      return delegate.call(this, this.model, 'destroy', arguments);
    },

    $escape: function() {
      return delegate.call(this, this.model, 'escape', arguments);
    },

    $fetch: function() {
      return delegate.call(this, this.model, 'fetch', arguments);
    },

    $get: function() {
      return delegate.call(this, this.model, 'get', arguments);
    },

    $has: function() {
      return delegate.call(this, this.model, 'has', arguments);
    },

    $hasChanged: function() {
      return delegate.call(this, this.model, 'hasChanged', arguments);
    },

    $matches: function() {
      return delegate.call(this, this.model, 'matches', arguments);
    },

    $previous: function() {
      return delegate.call(this, this.model, 'previous', arguments);
    },

    $previousAttributes: function() {
      return delegate.call(this, this.model, 'previousAttributes', arguments);
    },

    $set: function() {
      return delegate.call(this, this.model, 'set', arguments);
    },

    $save: function() {
      return delegate.call(this, this.model, 'save', arguments);
    },

    $toJSON: function() {
      return _.result(this.model, 'toJSON');
    },

    $unset: function() {
      return delegate.call(this, this.model, 'unset', arguments);
    },

    $url: function() {
      return delegate.call(this, this.model, 'url', arguments);
    },

    // 直接委托 this.view 处理事务的快捷方式
    // -----------------------------------------

    // 返回视图根节点
    $el: function() {
      return this.view ? this.view.$el : null;
    },

    $append: function() {
      return delegate.call(this, this.$el(), 'append', arguments);
    },

    $appendTo: function() {
      return delegate.call(this, this.$el(), 'appendTo', arguments);
    },

    $detach: function() {
      return delegate.call(this, this.$el(), 'detach', argumnets);
    },

    // 查找视图内元素，委托 view.$ 
    $findElement: function() {
      return delegate.call(this, this.view, '$', arguments);
    },

    // 直接获取或设置视图 HTML
    $html: function() {
      return delegate.call(this, this.$el(), 'html', arguments);
    },

    $prepend: function() {
      return delegate.call(this, this.$el(), 'prepend', arguments);
    },

    $prependTo: function() {
      return delegate.call(this, this.$el(), 'prependTo', arguments);
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
    }
  });


  // Backbone.Application
  // -----------------------

  var Application = Backbone.Application = function(options) {
    options || (options = {});
    this.deps = _.extend({}, options.deps, _.result(this, 'deps'));
    this.config = _.extend({}, options.config, _.result(this, 'config'));
    this.children = _.extend({}, options.children);
    this.cid = _.uniqueId(this.cidPrefix);

    this.attributes = {};
    var attrs = _.defaults({}, options.attributes, _.result(this, 'defaults'));
    this.set(attrs);
    this.initialize.apply(this, arguments);
  };

  Application.extend = Backbone.Model.extend;

  _.extend(Application.prototype, attributesPrototype, {

    __started: false,

    cidPrefix: 'app',

    idAttribute: 'id',

    parent: null, // 父 App

    initialize: function() {},

    // 挂载到父 Application
    attach: function(name, app) {
      app.mount(this, name);
      return this;
    },

    // 广播
    broadcast: function(event, args, options) {
      if (!_.isString(event) || !event) return this;
      options || (options = {});
      var up = !!options.up;
      var recursive = !!options.recursive;

      var apps = up ? (this.parent ? [this.parent] : null) : _.values(this.children);
      _.each(apps, function(app) {
        app.trigger.call(app, event, args);
        if (recursive) {
          app.broadcast.call(app, event, args, options);
        }
      });
      return this;
    },

    // 查找子应用
    child: function(path) {
      return _.property(path)(this.children);
    },

    // 设置配置
    conf: function(key, val) {
      var attrs;
      if (typeof key === 'object') {
        attrs = key;
      } else {
        (attrs = {})[key] = val;
      }
      _.extend(this.config, attrs);
      return this;
    },

    // 设置依赖
    dep: function(key, val) {
      var attrs;
      if (typeof key === 'object') {
        attrs = key;
      } else {
        (attrs = {})[key] = val;
      }
      _.extend(this.deps, attrs);
      return this;
    },

    // 销毁
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

    // 是否挂载了子 app。
    hasChildren: function() {
      return !_.isEmpty(this.children);
    },

    // 是否被挂载到其他 app。
    hasParent: function() {
      return !!this.parent;
    },

    // 是否启动过
    hasStarted: function() {
      return !!this.__started;
    },

    // 启动
    // 如果 options.silent 为真，则只启动自己，不启动子应用
    kickoff: function(args, options) {
      if (this.hasStarted()) return this;
      this.__started = true;
      options || (options = {});
      this.trigger('before:start', args, options);
      if (!options.silent) {
        _.each(this.children, function(child) {
          child.kickoff(args, options);
        });
      }
      this.start(args, options);
      this.trigger('after:start', args, options);
      return this;
    },

    // 挂载 App
    // path 表示挂载路径，一个 app 只能同时挂载到一个挂载点。
    mount: function(path, app) {
      if (!_.isString(path) || !path || !app) return this;
      // 不允许循环挂载
      if (isClosed(this, app)) throw Error('it is a closed cycle, detach first.');
      app.detach(); // 首先确保自由身
      this.unmount(path); // 确保挂载点空闲
      this.children[path] = app;
      app.parent = this;
      return this;
    },



    // 开始
    start: function(args, options) {},

    // 卸载 App
    // child 可以是挂载路径 path，或挂载的 app。
    unmount: function(child) {
      var children = this.children;
      var flag = _.isString(child);
      var that = this;
      _.each(_.pairs(children), function(pair) {
        if (flag ? child == pair[0] : child === pair[1]) {
          pair[1].parent = null;
          delete children[pair[0]];
        }
      });
      return this;
    },

    // 委托子应用处理事务
    $child: function(path, attr) {
      return delegate.call(this, this.child(path), attr, slice.call(arguments, 2));
    },

    // 获取配置，如果本地配置不存在，则递归从父应用获取。
    $config: function(key) {
      var config = this.config;
      if (_.has(config, key)) return config[key];
      var parent = this.parent;
      if (parent) {
        return parent.$config(key);
      }
    },

    // 获取依赖，如果本地依赖不存在，则递归从父应用获取。
    $deps: function(key) {
      var deps = this.deps;
      if (_.has(deps, key)) return deps[key];
      var parent = this.parent;
      if (parent) {
        return parent.$deps(key);
      }
    },

    // 委托父应用处理事务
    $parent: function(attr) {
      return delegate.call(this, this.parent, attr, slice.call(arguments, 1));
    }
  });


  // Backbone.View
  // ----------------

  var viewPrototype = Backbone.View.prototype;
  var View = Backbone.View = Backbone.View.extend({
    constructor: function(options) {
      _.extend(this, _.pick(options, ['controller']));
      viewPrototype.constructor.apply(this, arguments);
    }
  });

  module.exports = Backbone;

});