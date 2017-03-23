/*
 * @Author: laixi
 * @Date:   2017-03-22 00:06:49
 * @Last Modified by:   Xavier Yin
 * @Last Modified time: 2017-03-23 23:47:49
 */
import _ from 'underscore';
import { slice, isTriggerable } from './core';
import Events from './events';


var Attributes = _.extend({

  // 静态属性
  // 当设置静态属性时，它会同时被绑定到宿主。
  _staticAttributes: null,

  _attributeAlias: 'attribute',

  _listenToChangedAttributeCallback: function(attr, event) {
    var args = slice.call(arguments, 1);
    this.trigger.apply(this, [this._attributeAlias + ':' + attr].concat(args));
    this.trigger.apply(this, [this._attributeAlias, attr].concat(args));
  },

  _listenToChangedAttribute: function(attr, value) {
    var prev = this.previous(attr);
    var handlers = this._listeningHandlers || (this._listeningHandlers = {});
    var handler = handlers[attr];
    if (handler) {
      this.stopListening(prev, 'all', handler);
      delete handlers[attr];
    }
    if (isTriggerable(value)) {
      handler = handlers[attr] = _.partial(this._listenToChangedAttributeCallback, attr);
      this.listenTo(value, 'all', handler);
    }
  },

  // 检查 attributes 是否发生变化（diff 为假），或是否会发生变化（diff 为真）
  changedAttributes: function(diff) {
    if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
    var old = this._changing ? this._previousAttributes : (this._attributes || (this._attributes = {}));
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
    for (var key in this._attributes) attrs[key] = void 0;
    return this.set(attrs, _.extend({}, options, {
      unset: true
    }));
  },

  // 克隆
  clone: function() {
    return new this.constructor(this._attributes);
  },

  // 销毁
  destroy: function() {
    // 清空 attributes（同时停止对所有 attribute 的监听行为）
    this.clear();
    // 停止所有监听（非 attributes 对象）
    this.stopListening();
    // 停止所有转发
    this.stopForwarding();
    return this;
  },

  // 读取 attribute
  get: function(attr) {
    return this._attributes && this._attributes[attr];
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

  set: function(key, val, options) {
    if (key == null) return this;

    var attrs;
    if (typeof key === 'object') {
      attrs = key;
    } else {
      (attrs = {})[key] = val;
    }

    options || (options = {});
    this._attributes || (this._attributes = {});

    var unset = options.unset;
    var silent = options.silent;
    var changes = [];

    var changing = this._changing;
    this._changing = true;

    if (!changing) {
      this._previousAttributes = _.clone(this._attributes);
      this.changed = {};
    }

    var current = this._attributes;
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
    var props = this._staticAttributes;
    for (i in props) { // bind static attributes
      this[props[i]] = this.get(props[i]);
    }

    for (i = 0; i < changes.length; i++) { // listen attributes
      this._listenToChangedAttribute(changes[i], current[changes[i]]);
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
    return _.clone(this._attributes);
  },

  // 移除 attribute
  unset: function(attr, options) {
    return this.set(attr, void 0, _.extend({}, options, {
      unset: true
    }));
  }

}, Events);


export default Attributes;
