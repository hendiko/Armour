/*
 * @Author: laixi
 * @Date:   2017-02-28 15:31:25
 * @Last Modified by:   laixi
 * @Last Modified time: 2017-02-28 16:22:42
 *
 * Backbone.Model
 * ===========
 *
 * 增强原 Backbone.Model 类，增加了 `watch` 和 `stopWatching` 实例方法。
 * `watch` 方法用以在不同模型之间同步数据，`stopWatching` 方法用以停止不同模型之间的数据同步。
 * 
 * `watch` 方法与 `change` 事件的区别：
 * 使用 `watch` 方法可以将数据同步逻辑与数据修改逻辑分隔开，
 * 数据同步用以解决模型之间数据一致性的需求，类似于数据表外键的同步。
 * 而 `change` 事件应被用于更关注数据发生变化后，应处理的其他逻辑事务，例如 UI 渲染。
 * 
 * 观察者(watcher) 的 `_watchings` 字段用以保存所有外键关系。
 * 被观察者 (watchee) 的 `_watchers` 字段用以保存所有观察者的引用。
 * 
 */
var _ = require('underscore');
var Backbone = require('./core');
var utils = require('./utils');
var wrapError = utils.wrapError;


module.exports = Backbone.Model;

_.extend(Backbone.Model.prototype, {

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
  //    4. watch(obj, [original1, original2, ...]);
  // 
  // 未指定 original, 或者 original == null，表示同步所有字段。
  // 为指定 destination，表示同步起点与终点字段名称相同。
  // watch(obj) 表示同步所有字段，
  // 此时继续调用 watch(obj, original, destination)，表示停止同步所有字段，仅同步给定字段。
  // 如果继续调用 watch(obj, original, destination)，表示增加（或更新）同步字段。 
  watch: function(obj, original, destination) {
    if (!obj) return this;
    var map = {};
    if (original == null) {
      map = null;
    } else if (_.isString(original)) {
      map[original] = _.isString(destination) ? destination : null;
    } else if (_.isArray(original)) {
      map = _.reduce(original, function(memo, name) {
        if (_.isString(name)) memo[name] = null;
        return memo;
      }, {});
    } else {
      map = original;
    }

    if (!this._watchings) this._watchings = {};
    if (!obj._watchers) obj._watchers = {};
    if (!this._listenId) this._listenId = _.uniqueId('l');
    if (!obj._listenId) obj._listenId = _.uniqueId('l');

    var watchings = this._watchings;
    var watchers = obj._watchers;

    var watching = watchings[obj._listenId] || (watchings[obj._listenId] = {
      obj: obj
    });
    var watch = watching['watch'];
    watching['watch'] = map == null ? null : _.extend({}, watch, map);

    if (!watchers[this._listenId]) {
      watchers[this._listenId] = this;
    }

    return this;
  },

  // @param obj (可选) 被观察者，如果为给定 obj，则停止观察所有被观察者。
  stopWatching: function(obj) {
    var watchings = this._watchings;
    if (!watchings) return this;
    var maps = obj ? [watchings[obj._listenId]] : _.values(watchings);

    var watchee;
    var thisId = this._listenId;
    _.each(maps, function(map) {
      if (map) {
        watchee = map.obj;
        if (watchee._watchers) {
          delete watchee._watchers[thisId];
        }
        if (_.isEmpty(watchee._watchers)) watchee._watchers = void 0;
        delete watchings[watchee._listenId];
      }
    });
    if (_.isEmpty(watchings)) this._watchings = void 0;
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
        var data = _.reduce(watch, function(memo, val, key) {
          if (val == null) val = key;
          if (_.has(changed, key)) memo[val] = changed[key];
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