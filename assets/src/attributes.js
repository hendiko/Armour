/*
 * @Author: laixi
 * @Date:   2017-03-22 00:06:49
 * @Last Modified by:   Xavier Yin
 * @Last Modified time: 2017-04-24 17:37:38
 */
import _ from 'underscore';
import { slice, isTriggerable, makeMap, eventSplitter, trim } from './core';
import Events from './events';


var _changedIteratee = function(name) {
  if (_.isString(name)) {
    name = trim(name);
    return name ? name.split(eventSplitter) : [];
  }
  if (!_.isArray(name)) return [];
  return name;
};

var _changedPredicate = function(key) {
  return this.hasOwnProperty(key);
};


var Attributes = _.extend({

  // 静态属性
  // 当设置静态属性时，它会同时被绑定到宿主。
  _staticAttributes: null,

  _attributeAlias: 'attribute',

  _listenToChangedAttributeCallback: function(attr, alias, event) {
    var args = slice.call(arguments, 2);
    // to prevent events propagation
    if (alias != void 0 && alias === event || event.indexOf(alias + ':') === 0) return;
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
      handler = handlers[attr] = _.partial(this._listenToChangedAttributeCallback, attr, value._attributeAlias);
      this.listenTo(value, 'all', handler);
    }
  },

  /** 检查给定的属性名称（数组或者是空格分隔的字符串），是否全部都发生了变化。 */
  allChanged: function(name) {
    var changed = this.changedAttributes();
    if (!changed) return false;
    return _.every(_changedIteratee(name), _changedPredicate, changed);
  },

  /** 检查给定的属性名称（数组或者是空格分隔的字符串），是否至少有一个属性发生了变化。 */
  anyChanged: function(name) {
    var changed = this.changedAttributes();
    if (!changed) return false;
    return _.any(_changedIteratee(name), _changedPredicate, changed);
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
    // 停止所有观察
    this.stopWatching();
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
    var attributes = _.clone(attrs);
    var opts = _.clone(options);

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

    // 同步设置 watcher 数据
    var watchings, watching;
    var objId = this._listenId;
    _.each(this._watchers, function(watcher) {
      watchings = watcher._watchings;
      if (!watchings) return;
      watching = watchings[objId];
      var watch = watching['watch'];
      if (watch == null) {
        watcher.set(_.clone(attributes), _.clone(opts));
      } else {
        var data = _.reduce(watch, function(memo, destination, original) {
          if (_.has(changed, original)) memo[destination] = changed[original];
          return memo;
        }, {});
        watcher.set(data, _.clone(opts));
      }
    });

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
  },

  // @param obj 被观察者。
  // @param original 同步起始字段
  // @param destination 同步终点字段
  // 
  // `watch` 方法支持传参方式：
  //    1. watch(obj);
  //    2. watch(obj, original, destination);
  //    3. watch(obj, {original: destination});
  //    4. watch(obj, [original1, original2, ...], destination);
  // 
  // 未指定 original, 或者 original == null，表示同步所有字段。
  // 为指定 destination，表示同步起点与终点字段名称相同。
  // watch(obj) 表示同步所有字段，
  // 此时继续调用 watch(obj, original, destination)，表示停止同步所有字段，仅同步给定字段。
  // 如果继续调用 watch(obj, original, destination)，表示增加（或更新）同步字段。 
  watch: function(obj, original, destination) {
    if (!obj) return this;

    if (!this._listenId) this._listenId = _.uniqueId('l');
    if (!obj._listenId) obj._listenId = _.uniqueId('l');

    var watchings = this._watchings || (this._watchings = {});
    var watchers = obj._watchers || (obj._watchers = {});
    var watching = watchings[obj._listenId] || (watchings[obj._listenId] = { obj: obj });
    var map = makeMap(original, destination);
    watching['watch'] = map == null ? null : _.defaults(map, watching['watch']);
    watchers[this._listenId] = this;
    return this;
  },

  /**
   * stopWatching();
   * stopWatching(obj);
   * stopWatching(obj, original);
   * stopWatching(obj, [original1, original2, ...], destination);
   * stopWatching(obj, {original: destination});
   *
   * 当 a 观察 b 所有属性时，如果调用 stopWatching，无论如何传参，
   * 都会导致 a 停止观察 b 所有属性。
   */
  stopWatching: function(obj, original, destination) {
    var watchings = this._watchings;
    if (!watchings) return this;
    var iteration = obj ? [watchings[obj._listenId]] : _.values(watchings);

    var watchee;
    var watch;
    var thisId = this._listenId;
    var map = makeMap(original, destination);
    var callback = function(value, key) {
      return map == null ? true : map[key] === value;
    };
    _.each(iteration, function(watching) {
      watch = _.omit(watching.watch, callback);
      if (_.isEmpty(watch)) {
        watchee = watching.obj;
        if (watchee._watchers) delete watchee._watchers[thisId];
        if (_.isEmpty(watchee._watchers)) watchee._watchers = void 0;
        delete watchings[watchee._listenId];
      } else {
        watching.watch = watch;
      }
    });
    if (_.isEmpty(watchings)) this._watchings = void 0;
    return this;
  },

  /** 清除所有观察者，不让其他对象观察自己 */
  preventWatching: function() {
    var watchers = _.values(this._watchers);
    var that = this;
    _.each(watchers, function(watcher) {
      watcher.stopWatching(that);
    });
    return this;
  }


}, Events);


// @Backbone#addMethod
var addMethod = function(length, method, attribute) {
  switch (length) {
    case 1:
      return function() {
        return _[method](this[attribute]);
      };
    case 2:
      return function(value) {
        return _[method](this[attribute], value);
      };
    case 3:
      return function(iteratee, context) {
        return _[method](this[attribute], cb(iteratee, this), context);
      };
    case 4:
      return function(iteratee, defaultVal, context) {
        return _[method](this[attribute], cb(iteratee, this), defaultVal, context);
      };
    default:
      return function() {
        var args = slice.call(arguments);
        args.unshift(this[attribute]);
        return _[method].apply(_, args);
      };
  }
};

var addUnderscoreMethods = function(proto, methods, attribute) {
  _.each(methods, function(length, method) {
    if (_[method]) proto[method] = addMethod(length, method, attribute);
  });
};

var underscoreMethods = {
  keys: 1,
  values: 1,
  pairs: 1,
  invert: 1,
  pick: 0,
  omit: 0,
  chain: 1,
  isEmpty: 1
};

addUnderscoreMethods(Attributes, underscoreMethods, '_attributes');

export default Attributes;
