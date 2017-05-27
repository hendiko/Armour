/*
 * @Author: laixi
 * @Date:   2017-03-22 15:46:44
 * @Last Modified by:   Xavier Yin
 * @Last Modified time: 2017-03-25 10:03:24
 */
import _ from 'underscore';
import Backbone, { makeMap } from './core';


// 封装异常
var wrapError = function(model, options) {
  var error = options.error;
  options.error = function(resp) {
    if (error) error.call(options.context, model, resp, options);
    model.trigger('error', model, resp, options);
  };
};

var Model = Backbone.Model.extend({

  // @override
  destroy: function(options) {
    options = options ? _.clone(options) : {};
    var model = this;
    var success = options.success;
    var wait = options.wait;

    // 销毁模型（停止监听事件，触发 destroy 事件）
    // 停止转发、观察与监听。
    var destroy = function() {
      model.stopForwarding();
      model.stopWatching();
      model.stopListening();
      model.trigger('destroy', model, model.collection, options);
    };

    // 封装 success 回调
    // 该回调会在请求成功后立即执行，请求成功即被视为操作成功。
    options.success = function(resp) {
      if (wait) destroy();
      if (success) success.call(options.context, model, resp, options);
      // 如果 model.isNew() 为假，才有可能会触发 sync 事件。
      if (!model.isNew()) model.trigger('sync', model, resp, options);
    };

    var xhr = false;
    // 如果模型数据不存在于远端（按照 Backbone 设计理论），
    // 则无需与远端进行数据同步操作，直接执行 success 回调。（理论上也不触发 sync 事件）
    if (this.isNew()) {
      _.defer(options.success);
    } else {
      // 封装异常回调
      wrapError(this, options);
      // 与远端同步
      xhr = this.sync('delete', this, options);
    }
    // 如果不等待，则立即销毁模型。
    if (!wait) destroy();
    return xhr;
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
  },

  // @override
  // 设置属性方法。
  set: function(key, val, options) {
    if (key == null) return this;
    var attrs;
    if (typeof key === 'object') {
      attrs = key;
      options = val;
    } else {
      (attrs = {})[key] = val;
    }
    options || (options = {});
    // 防止 watchee 执行 set 方法时修改了 attrs 或 opts
    // 先准备一个副本。
    var attributes = _.clone(attrs);
    var opts = _.clone(options);

    if (!this._validate(attrs, options)) return false;
    var unset = options.unset;
    var silent = options.silent; // 如果为 true，不触发任何 `change` 事件。
    var changes = []; // 发生变化属性名称列表

    var changing = this._changing;
    this._changing = true;

    if (!changing) {
      this._previousAttributes = _.clone(this.attributes); // 保存操作前的属性哈希副本
      this.changed = {}; // （初始）设置变化属性哈希
    }

    var current = this.attributes; // 当前属性哈希
    var changed = this.changed; // 当前变化属性哈希
    var prev = this._previousAttributes; // 操作前属性哈希


    // 遍历输入哈希，更新或删除哈希值
    for (var attr in attrs) {
      val = attrs[attr];
      // 当前属性值不等于输入属性值时，在变化属性名列表中记录属性名称
      if (!_.isEqual(current[attr], val)) changes.push(attr);

      // 操作前属性值不等于输入属性值时，记录变化属性值，否则移除变化属性名。
      // （因为 set 可以内嵌，this.changed 保存所有内嵌 set 操作结束后的属性变化状态）
      if (!_.isEqual(prev[attr], val)) {
        changed[attr] = val;
      } else {
        delete changed[attr];
      }

      // 如果 options.unset 为真，则从当前属性哈希中移除属性，否则更新当前属性哈希。
      unset ? delete current[attr] : current[attr] = val;
    }

    // 更新模型 id，因为 set 可能会更改 idAttribute 指定的主键值。
    this.id = this.get(this.idAttribute);

    // Trigger all relevant attribute changes.
    // 如果 set 不是静默操作，则需要通知第三方自身属性的变化。
    if (!silent) {
      if (changes.length) this._pending = options;
      for (var i = 0; i < changes.length; i++) {
        this.trigger('change:' + changes[i], this, current[changes[i]], options);
      }
    }

    // You might be wondering why there's a `while` loop here. Changes can
    // be recursively nested within `"change"` events.
    // 
    // changing 为真，表示本次 set 为递归操作，主动 set 操作尚未结束，立即返回。
    if (changing) return this;


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
          // 此处使用 changed[original] 作为变更值传递给 watcher。
          // 另外一种看法是可以选择使用 attributes[original] 传递给 watcher。
          // 因为 attributes 值在 set 过程中发生变化，如果支持 attributes[original]，
          // 即意味着必须认同 watcher 在 set 过程中也可能更改 attributes。
          // 但如果使用 attributes[original] 可能会导致观察意图被误解，
          // 因为changed 中发生变化的属性未必存在于  attributes 中。
          // 所以最终使用 changed[original]。
          if (_.has(changed, original)) memo[destination] = changed[original];
          return memo;
        }, {});
        watcher.set(data, _.clone(opts));
      }
    });

    // 本行以下代码只有在主动 set 操作中才会执行。
    // 如果非静默 set，则需要触发 `change` 事件。
    if (!silent) {
      // 当 this._pending 为真时，表示有属性变化，需要触发 `change` 事件。
      // 并且 this._pending 值就是输入参数 options。
      while (this._pending) {
        options = this._pending;
        this._pending = false;
        this.trigger('change', this, options);
      }
    }
    this._pending = false; // 重置为 false 表示属性没有变化了。
    this._changing = false; // 设置为 false 表示主动 set 操作结束。
    return this;
  }
});

export default Model;
