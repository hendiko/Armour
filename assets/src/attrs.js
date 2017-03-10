/*
 * @Author: laixi
 * @Date:   2017-02-28 15:28:03
 * @Last Modified by:   laixi
 * @Last Modified time: 2017-02-28 16:21:22
 *
 * Attributes
 */
var _ = require('underscore');
var utils = require('./utils');
var Events = require('./events');

var slice = utils.slice;
var delegate = utils.delegate;
var isTriggerable = utils.isTriggerable;

var Attributes = module.exports = _.extend({

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
}, Events);