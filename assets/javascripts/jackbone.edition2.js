/*
 * @Author: laixi
 * @Date:   2017-02-09 13:49:11
 * @Last Modified by:   laixi
 * @Last Modified time: 2017-02-20 14:52:49
 *
 * todo: 
 * 1. stopForwarding 和 stopListening, stopWatching 应保持同时销毁
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

  var trim = function(regexp) {
    return function(str) {
      return str.replace(regexp, '');
    };
  }(/^\s*|\s*$/g);

  // Backbone.Events - 事件
  // -------------------------

  // A module that can be mixed in to *any object* in order to provide it with
  // a custom event channel. You may bind a callback to an event with `on` or
  // remove with `off`; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  // Events 所有事件行为都保存在 obj._events 属性中，
  // 无论是 on 还是 listenTo，事件行为都是保存在事件触发者身上，
  // listenTo 其实只是 on 的另一种调用形式。
  // 所以，当 events.off() 方法会解绑所有事件，同时也会解除所有被监听关系。（即监听者无法再继续监听）
  // events.stopListening() 停止监听所有事件，从被监听者身上解除事件处理。
  // 
  // obj._listeningTo 是保存对被监听对象的引用。
  // obj._listenId 是每个事件触发者自己身份的 ID，当自己被其他人监听时，用以标识自己身份。
  // obj._listeners 是所有对自己进行监听的对象引用映射。
  // 
  // Backbone.Events 的 listenTo 与 stopListening 方法实现原理：
  // 
  var Events = Backbone.Events = {};

  // Regular expression used to split event strings.
  // 正则表达式：多个事件名以空格分隔。
  var eventSplitter = /\s+/;

  // Iterates over the standard `event, callback` (as well as the fancy multiple
  // space-separated events `"change blur", callback` and jQuery-style event
  // maps `{event: callback}`).
  // 
  // 遍历定义的事件。
  // 
  // iteratee 是迭代函数，即 onApi, offApi, triggerApi, onceMap 函数
  // eventsApi 作用是将 events, name, callback, opts 参数整理成标准格式传递给 iteratee 调用。
  var eventsApi = function(iteratee, events, name, callback, opts) {
    var i = 0,
      names;
    if (name && typeof name === 'object') {
      // Handle event maps.
      if (callback !== void 0 && 'context' in opts && opts.context === void 0) opts.context = callback;
      for (names = _.keys(name); i < names.length; i++) {
        events = eventsApi(iteratee, events, names[i], name[names[i]], opts);
      }
    } else if (name && eventSplitter.test(name)) {
      // Handle space separated event names by delegating them individually.
      for (names = name.split(eventSplitter); i < names.length; i++) {
        events = iteratee(events, names[i], callback, opts);
      }
    } else {
      // Finally, standard events.
      //    events 事件映射表；
      //    name 事件名称；
      //    callback 事件处理函数；
      //    opts 额外参数
      events = iteratee(events, name, callback, opts);
    }
    return events;
  };

  // Bind an event to a `callback` function. Passing `"all"` will bind
  // the callback to all events fired.
  // 绑定事件
  Events.on = function(name, callback, context) {
    return internalOn(this, name, callback, context);
  };

  // Guard the `listening` argument from the public API.
  // 内部绑定事件函数，它是 Events.on, Events.listenTo 公开 API 内部真正实现事件绑定的函数
  // 因此它比 Events.on, Events.listenTo 多一个参数 listening，
  // 该参数为真，表示它正实现 listenTo 方法；否则表示它正式实现 on 方法。
  var internalOn = function(obj, name, callback, context, listening) {
    // 执行 eventsApi 
    obj._events = eventsApi(onApi, obj._events || {}, name, callback, {
      context: context,
      ctx: obj,
      listening: listening
    });

    // 如果当前是实现 listenTo 方法，需要在被监听者的 _listeners 中，添加监听者的引用关系。
    if (listening) {
      var listeners = obj._listeners || (obj._listeners = {});
      // listening.id 是监听者的 _listenId。
      listeners[listening.id] = listening;
    }

    return obj;
  };

  // Inversion-of-control versions of `on`. Tell *this* object to listen to
  // an event in another object... keeping track of what it's listening to
  // for easier unbinding later.
  // Events.on 操作的逆操作，表示监听另一个对象的事件，并保持对该对象的引用，以便解绑事件。
  Events.listenTo = function(obj, name, callback) {
    // 如果 obj 为否，则终止 listenTo 操作。
    if (!obj) return this;
    // 被监听对象应该有一个唯一的监听 ID，即 _listenId，用以标识被监听者身份。
    var id = obj._listenId || (obj._listenId = _.uniqueId('l'));
    // _listeningTo 是监听行为映射表，该表用以保存所有被监听者的引用。
    var listeningTo = this._listeningTo || (this._listeningTo = {});
    var listening = listeningTo[id];

    // This object is not listening to any other events on `obj` yet.
    // Setup the necessary references to track the listening callbacks.
    // 如果被监听者是首次被当前监听者监听，应初始化监听引用。
    if (!listening) {
      // 监听者的监听 ID
      var thisId = this._listenId || (this._listenId = _.uniqueId('l'));
      // 监听引用保存的字段：
      //    obj: 被监听对象。
      //    objId: 被监听对象的监听 ID。
      //    id: 监听者监听 ID。
      //    listeningTo: 监听映射表。
      //    count: 监听者对被监听者监听的次数
      listening = listeningTo[id] = {
        obj: obj,
        objId: id,
        id: thisId,
        listeningTo: listeningTo,
        count: 0
      };
    }

    // Bind callbacks on obj, and keep track of them on listening.
    internalOn(obj, name, callback, this, listening);
    return this;
  };

  // The reducing API that adds a callback to the `events` object.
  // 绑定事件
  var onApi = function(events, name, callback, options) {
    // 只有给定事件处理函数才进行事件绑定
    if (callback) {
      // handlers 是事件处理函数组成的数组
      var handlers = events[name] || (events[name] = []);
      // context 事件处理函数上下文（用户给出），ctx 事件触发者（默认上下文），listening 监听引用关系表
      var context = options.context,
        ctx = options.ctx,
        listening = options.listening;
      // 监听计数加一。
      if (listening) listening.count++;
      // 事件处理函数集合增加一个事件处理
      handlers.push({
        callback: callback,
        context: context,
        ctx: context || ctx,
        listening: listening
      });
    }
    return events;
  };

  // Remove one or many callbacks. If `context` is null, removes all
  // callbacks with that function. If `callback` is null, removes all
  // callbacks for the event. If `name` is null, removes all bound
  // callbacks for all events.
  // 解绑事件
  Events.off = function(name, callback, context) {
    if (!this._events) return this;
    this._events = eventsApi(offApi, this._events, name, callback, {
      context: context,
      // 所有监听者引用表
      listeners: this._listeners
    });
    return this;
  };

  // Tell this object to stop listening to either specific events ... or
  // to every object it's currently listening to.
  // 停止监听
  Events.stopListening = function(obj, name, callback) {
    // 被监听者引用表
    var listeningTo = this._listeningTo;
    if (!listeningTo) return this;

    // 需要被停止监听者 ID 集合（没有指定被监听者，则默认所有被监听者）
    var ids = obj ? [obj._listenId] : _.keys(listeningTo);

    // 遍历被停止监听者 ID，逐个解除监听。
    for (var i = 0; i < ids.length; i++) {
      var listening = listeningTo[ids[i]];

      // If listening doesn't exist, this object is not currently
      // listening to obj. Break out early.
      // 如果 listening 不存在，表示当前没有监听行为。
      if (!listening) break;
      // 被监听者从自身解除事件行为。
      listening.obj.off(name, callback, this);
    }
    // 当没有监听任何对象时，将 _listeningTo 属性置为 void 0。
    if (_.isEmpty(listeningTo)) this._listeningTo = void 0;

    return this;
  };

  // The reducing API that removes a callback from the `events` object.
  var offApi = function(events, name, callback, options) {
    // events 不存在，终止 off 操作
    if (!events) return;

    var i = 0,
      listening;
    // context 指定上下文，listeners 监听者
    var context = options.context,
      listeners = options.listeners;

    // Delete all events listeners and "drop" events.
    // 没有给定任何事件名、事件回调或上下文，则移除所有监听者，以及事件。
    if (!name && !callback && !context) {
      // 生成所有监听者 id。
      var ids = _.keys(listeners);
      // 遍历所有监听者 id，逐一接触引用关系
      for (; i < ids.length; i++) {
        listening = listeners[ids[i]];
        delete listeners[listening.id]; // 移除监听者引用
        delete listening.listeningTo[listening.objId]; // 移除监听关系
      }
      // laixi: jackbone feature
      _.each(events['all'], function(handler) {
        if (handler.callback.forwarder) {
          removeForwardMap(handler.callback.forwarder, handler.listening.objId, handler.callback.fwdId); // 移除转发关系           
        }
      });
      return;
    }

    // 如果没有指定事件名称，则移除全部事件
    var names = name ? [name] : _.keys(events);
    for (; i < names.length; i++) {
      name = names[i];
      var handlers = events[name];

      // Bail out if there are no events stored.
      // 如果没有回调函数，终止本次循环
      if (!handlers) break;

      // Replace events if there are any remaining.  Otherwise, clean up.
      var remaining = [];
      for (var j = 0; j < handlers.length; j++) {
        var handler = handlers[j];
        if (
          callback && callback !== handler.callback &&
          callback !== handler.callback._callback ||
          context && context !== handler.context
        ) {
          remaining.push(handler);
        } else {
          listening = handler.listening;
          // laixi: jackbone feature
          removeForwardMap(handler.callback.forwarder, listening.objId, handler.callback.fwdId); // 移除转发关系
          if (listening && --listening.count === 0) {
            delete listeners[listening.id];
            delete listening.listeningTo[listening.objId];
          }
        }
      }

      // Update tail event if the list has any events.  Otherwise, clean up.
      if (remaining.length) {
        events[name] = remaining;
      } else {
        delete events[name];
      }
    }
    if (_.size(events)) return events;
  };

  // Bind an event to only be triggered a single time. After the first time
  // the callback is invoked, its listener will be removed. If multiple events
  // are passed in using the space-separated syntax, the handler will fire
  // once for each event, not once for a combination of all events.
  Events.once = function(name, callback, context) {
    // Map the event into a `{event: once}` object.
    var events = eventsApi(onceMap, {}, name, callback, _.bind(this.off, this));
    return this.on(events, void 0, context);
  };

  // Inversion-of-control versions of `once`.
  Events.listenToOnce = function(obj, name, callback) {
    // Map the event into a `{event: once}` object.
    var events = eventsApi(onceMap, {}, name, callback, _.bind(this.stopListening, this, obj));
    return this.listenTo(obj, events);
  };

  // Reduces the event callbacks into a map of `{event: onceWrapper}`.
  // `offer` unbinds the `onceWrapper` after it has been called.
  var onceMap = function(map, name, callback, offer) {
    if (callback) {
      var once = map[name] = _.once(function() {
        offer(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
    }
    return map;
  };

  // Trigger one or many events, firing all bound callbacks. Callbacks are
  // passed the same arguments as `trigger` is, apart from the event name
  // (unless you're listening on `"all"`, which will cause your callback to
  // receive the true name of the event as the first argument).
  Events.trigger = function(name) {
    if (!this._events) return this;

    var length = Math.max(0, arguments.length - 1);
    var args = Array(length);
    for (var i = 0; i < length; i++) args[i] = arguments[i + 1];

    eventsApi(triggerApi, this._events, name, void 0, args);
    return this;
  };

  // Handles triggering the appropriate event callbacks.
  var triggerApi = function(objEvents, name, cb, args) {
    if (objEvents) {
      var events = objEvents[name];
      var allEvents = objEvents.all;
      if (events && allEvents) allEvents = allEvents.slice();
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, [name].concat(args));
    }
    return objEvents;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1,
      l = events.length,
      a1 = args[0],
      a2 = args[1],
      a3 = args[2];
    switch (args.length) {
      case 0:
        while (++i < l)(ev = events[i]).callback.call(ev.ctx);
        return;
      case 1:
        while (++i < l)(ev = events[i]).callback.call(ev.ctx, a1);
        return;
      case 2:
        while (++i < l)(ev = events[i]).callback.call(ev.ctx, a1, a2);
        return;
      case 3:
        while (++i < l)(ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
        return;
      default:
        while (++i < l)(ev = events[i]).callback.apply(ev.ctx, args);
        return;
    }
  };


  // Forwarding
  // ------------

  // 事件转发作业 ID
  var forwardId = function() {
    return _.uniqueId('fwd');
  };

  // 转发事件处理函数
  var forwardCallback = function(original, destination, event) {
    var args = slice.call(arguments, 2);
    if (original && original !== event) return;
    if (original && original === event) args[0] = destination || original;
    this.trigger.apply(this, args);
  };

  // 移除转发映射关系
  var removeForwardMap = function(forwarder, otherId, fwdId) {
    if (!forwarder) return;
    var forwardings = forwarder._forwardings;
    if (!forwardings) return;
    // 如果未指定 otherId，则移除所有。
    if (otherId == null) {
      forwarder._forwardings = void 0;
      return;
    }
    // 如果未指定 fwdId，则移除 otherId。
    if (fwdId == null) {
      delete forwardings[otherId];
      return;
    }
    var maps = forwardings[otherId];
    if (!maps) return;
    delete maps[fwdId];

    if (_.isEmpty(maps)) delete forwardings[otherId];
    if (_.isEmpty(forwardings)) forwarder._forwardings = void 0;
  };

  // 转发事件 API
  var forwardApi = function(me, other, original, destination, options) {
    if (!options) options = {};
    var fwdId = forwardId();
    var otherId = other._listenId || (other._listenId = _.uniqueId('l'));
    var callback = _.partial(forwardCallback, original, destination);
    callback.fwdId = fwdId;
    callback.forwarder = me;
    var forwardings = me._forwardings || (me._forwardings = {});
    var forwardingMaps = forwardings[otherId] || (forwardings[otherId] = {});
    forwardingMaps[fwdId] = {
      fwdId: fwdId,
      original: original,
      destination: destination,
      callback: callback,
      other: other
    };
    if (options.once) { // 如果指定单次转发
      me.listenToOnce(other, 'all', function() {
        callback.apply(this, arguments);
        removeForwardMap(me, otherId, fwdId);
      });
    } else {
      me.listenTo(other, 'all', callback);
    }
  };

  var toMap = function(name) {
    if (_.isEmpty(name)) return null;
    var map = {};
    if (_.isString(name)) {
      map[name] = null;
    } else {
      map = name;
    }
    _.each(map, function(destination, original) {
      if (destination && _.isString(destination)) {
        destination = trim(destination).split(eventSplitter)[0] || null;
      } else {
        destination = null;
      }
      map[original] = destination;
    });
    return map;
  };

  // 转发事件
  Events.forward = function(obj, name, destination) {
    if (!obj) return this;
    var _name = {};
    if (_.isString(name)) {
      _name[name] = destination;
    } else {
      _name = name;
    };
    var map = toMap(_name);
    if (!map) {
      forwardApi(this, obj, null, null);
    } else {
      var that = this;
      _.each(map, function(destination, original) {
        _.each(original.split(eventSplitter), function(name) {
          if (name) forwardApi(that, obj, name, destination);
        });
      });
    }
    return this;
  };

  // 单次转发事件
  Events.forwardOnce = function(obj, name, destination) {
    if (!obj) return this;
    var _name = {};
    if (_.isString(name)) {
      _name[name] = destination;
    } else {
      _name = name;
    };
    var map = toMap(_name);
    if (!map) {
      forwardApi(this, obj, null, null, {
        once: true
      });
    } else {
      var that = this;
      _.each(map, function(destination, original) {
        _.each(original.split(eventSplitter), function(name) {
          if (name) forwardApi(that, obj, name, destination, {
            once: true
          });
        });
      });
    }
    return this;
  };

  // 停止事件转发
  // 如果 obj 为 null，将在所有 obj 中筛选目标；
  // 如果 name 为 null，将移除所有转发。 
  Events.stopForwarding = function(obj, name, destination) {
    if (_.isEmpty(this._forwardings)) return this;
    var forwardings = this._forwardings;
    if (obj) {
      forwardings = [forwardings[obj._listenId]];
    } else {
      forwardings = _.values(forwardings);
    }
    var _name = {};
    if (_.isString(name)) {
      _name[name] = destination;
    } else {
      _name = name;
    };
    var map = toMap(_name);
    if (map) {
      map = _.reduce(map, function(memo, destination, original) {
        _.each(original.split(eventSplitter), function(n) {
          if (n) memo.push([n, destination]);
        });
        return memo;
      }, []);
      if (map.length === 0) map = null;
    }

    forwardings = _.reduce(forwardings, function(memo, forwarding) {
      _.each(_.values(forwarding), function(fwd) {
        if (map) {
          _.each(map, function(m) {
            if (fwd.original === m[0] && fwd.destination === m[1]) memo.push([fwd.other, fwd.callback]);
          });
        } else {
          memo.push([fwd.other, fwd.callback]);
        }
      });
      return memo;
    }, []);

    var that = this;
    _.each(forwardings, function(fwd) {
      that.stopListening(fwd[0], 'all', fwd[1]);
    });

    return this;
  };

  // Aliases for backwards compatibility.
  // bind 作为 on 别名，unbind 作为 off 别名。（为向后兼容）
  Events.bind = Events.on;
  Events.unbind = Events.off;

  // Allow the `Backbone` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  _.extend(Backbone, Events);
  _.each(['Model', 'View', 'Collection', 'Router', 'History'], function(klass) {
    _.extend(Backbone[klass].prototype, Events);
  });


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


  // Backbone.Model
  // ===========
  // 
  // watcher._watchings, watchee._watchers
  // 
  _.extend(Backbone.Model.prototype, {

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


  // View
  // ------
  // todo: continue to work on this object.

  var wrapper = function(ctx, method, options) {
    var fn = ctx[method] || _.noop;
    options || (options = {});
    var before = options.before;
    var done = options.done;
    var after = options.after;
    return function() {
      var args = _.toArray(arguments);

      if (before) before.apply(this, args);
      ctx.trigger.apply(this, [method + ':before', ctx].concat(args));

      var result = fn.apply(ctx, args);

      if (done) done.apply(this, args);
      ctx.trigger.apply(this, [method, ctx].concat(args));

      if (after) after.apply(this, args);
      ctx.trigger.apply(this, [method + ':after', ctx].concat(args));
      return result;
    };
  };

  var viewOptions = ['controller', 'model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

  var View = Backbone.View = Backbone.View.extend({

    _nodeRefs: null,

    _nodeViews: null,

    _nodeElements: null,

    _viewRefs: null,

    // 缓存节点 jQuery 对象
    _cacheNodeElements: function() {
      var nodes = this.nodes;
      var that = this;
      var cache = this._nodeElements || (this._nodeElements = {});
      var $selector;
      _.each(nodes, function(selector, node) {
        $selector = that.$(selector);
        if ($selector.length) cache[node] = $selector;
      });
      return this;
    },

    nodes: null,

    parent: null,

    children: null,

    constructor: function(options) {
      // 生成唯一标识
      this.cid = _.uniqueId('view');

      options || (options = {});
      // 绑定实例属性
      _.extend(this, _.pick(options, viewOptions));
      // 创建根节点
      this._ensureElement();

      this._nodeRefs = {};

      // 子节点
      this.nodes = _.extend({}, this.nodes, options.nodes);

      // wrap methods
      this.render = wrapper(this, 'render', {
        done: this._cacheNodeElements
      });
      this.remove = wrapper(this, 'remove');
      this.initialize.apply(this, arguments);
    },

    // 激活子节点
    activate: function(node, view, options) {},

    // 绑定到父视图
    attach: function() {},

    // 停用子节点
    deactivate: function(node, view, options) {},

    // 从父视图脱离
    detach: function() {},

    // 返回缓存的 node jQuery 对象
    getNode: function(nodeName) {
      return this._nodeElements && this._nodeElements[nodeName];
    },

    getNodePath: function(nodeName) {
      return this.nodes[nodeName];
    },

    // 是否存在给定名称 Node
    hasNode: function(nodeName) {
      return _.has(this.nodes, nodeName);
    },

    // 挂载子视图
    mount: function(node, views, options) {
      if (!path || !view) return this;
      if (!_.isArray(view)) view = [view];
    },

    removeNode: function(nodeName, options) {
      // todo: 移除 node 同时移除 node 下所有视图
      var nodes = this.nodes;
      var names = nodeName ? [nodeName] : _.keys(nodes);
      _.each(names, function(name) {
        delete nodes[name];
      });
      return this;
    },

    // setNode: function(nodeName, nodePath, options) {
    //   // todo: 新设置的节点只能在下次渲染后生效
    //   // todo: 更改 nodePath 时，是否需要重新挂载该 node 下的视图？
    //   var attrs;
    //   if (typeof nodeName === 'object') {
    //     attrs = nodeName;
    //     options = nodePath;
    //   } else {
    //     (attrs = {})[nodeName] = nodePath;
    //   }
    //   var nodes = this.nodes || (this.nodes = {});
    //   _.each(attrs, function(val, key) {
    //     if (key && val) {
    //       nodes[key] = val;
    //     }
    //   });
    //   return this;
    // },

    // 卸载子视图
    unmount: function(path, views, options) {}
  });


  // MVCollection
  // ------------

  var setOptions = {
    add: true,
    remove: true,
    merge: true
  };
  // 将数组 insert 成员，依次插入到数组 array 的 at 位置。
  // 例如：
  // var a = [1,2,3], b = [4,5,6];
  // splice(a, b, 1);
  // 数组 a 变成 [1, 4, 5, 6, 2, 3]
  var splice = function(array, insert, at) {
    // 确保 at 是符合 array 长度的合法位置（不小于 0，不大于 array 长度）。
    at = Math.min(Math.max(at, 0), array.length);
    // 生成切片后半部分等长 Array。
    var tail = Array(array.length - at);
    // 计算待插入 Array 长度
    var length = insert.length;
    // 将 array 后半部分成员复制到容器 tail。
    for (var i = 0; i < tail.length; i++) tail[i] = array[i + at];
    // 将 insert 成员依次插入到 array 的后半部分。  
    for (i = 0; i < length; i++) array[i + at] = insert[i];
    // 将 tail 中成员依次继续插入到 array 尾部。
    for (i = 0; i < tail.length; i++) array[i + length + at] = tail[i];
  };

  var Collection = Backbone.Collection;
  var CollectionPrototype = Collection.prototype;

  var MVCollection = Backbone.MVCollection = Collection.extend({

    // 添加视图
    _addViewReference: function(model, options) {
      var View = options.view || this.view;
      if (View) {
        var opts = _.defaults({
            model: model
          },
          _.result(options, 'viewOptions'),
          _.result(this, 'viewOptions'));
        var view = new View(opts);
        if (view) {
          this._viewRefs[model.cid] = view;
          if (options.render === true && _.isFunction(view.render)) view.render();
          model.listenTo(view, 'all', this._onViewEvent);
        }
      }
    },

    // 转发 view 事件
    _onViewEvent: function(event) {
      var args = slice.call(arguments, 1);
      this.trigger.apply(this, ['view:' + event].concat(args));
      this.trigger.apply(this, ['view', event].concat(args));
    },

    // 覆写 Backbone.Collection.prototype._removeModels 方法
    // @override
    _removeModels: function(models, options) {
      var removed = [];

      for (var i = 0; i < models; i++) {
        var model = this.get(models[i]);
        if (!model) continue;
        var index = this.indexOf(model);
        this.models.splice(index, 1);
        this.length--;
        if (!options.silent) {
          options.index = index;
          // trigger event `remove:view` if it's necessary.
          model.trigger('remove:view', view, model, this, options);
          model.trigger('remove', model, this, options);
        }
        removed.push(model);
        // remove reference to view.
        this._removeViewReference(model, options);
        this._removeReference(model, options);
      }
      return removed.length ? removed : false;
    },

    // 移除 view 的引用
    _removeViewReference: function(model, options) {
      var view = this._viewRefs[model.cid];
      if (view) {
        model.stopListening(view, 'all', this._onViewEvent);
        // 默认移除视图同时销毁视图
        if (options.removeView !== false) view.remove();
      }
      delete this._viewRefs[model.cid];
      return view;
    },

    // @override
    constructor: function(models, options) {
      options || (options = {});
      if (options.view) this.view = options.view;
      if (options.viewOptions) this.view = options.viewOptions;
      this._viewRefs = {};
      return Collection.prototype.constructor.apply(this, arguments);
    },

    // 获取指定 model 对应的视图
    getView: function(obj) {
      var model = this.get(obj);
      return model ? this._viewRefs[model.cid] : null;
    },

    // @override
    reset: function(models, options) {
      options = options ? _.clone(options) : {};
      if (!options.silent) this.trigger('reset:before', this, options);
      var previousViews = [];
      var view;
      // 遍历现有成员，逐一销毁成员与集合之间的引用关系
      for (var i = 0; i < this.models.length; i++) {
        view = this._removeViewReference(this.models[i], options);
        previousViews.push(view);
        this._removeReference(this.models[i], options);
      }
      // 保留之前的 models 以及 views 引用
      options.previousModels = this.models;
      options.previousViews = previousViews;
      // 重置内部状态（包括更换 this.models）
      this._reset();
      // 调用 add 操作添加成员（add 操作内部是调用 set 操作）
      models = this.add(models, _.extend({
        silent: true
      }, options));
      // 触发 reset 事件
      if (!options.silent) {
        this.trigger('reset', this, options);
        this.trigger('reset:after', this, options);
      }
      return models;
    },

    // @override
    // 设置
    set: function(models, options) {
      if (models == null) return;

      options = _.defaults({}, options, setOptions);
      if (options.parse && !this._isModel(models)) models = this.parse(models, options);

      var singular = !_.isArray(models);
      models = singular ? [models] : models.slice();

      var at = options.at; // 插入新成员的位置
      if (at != null) at = +at; // 将 at 强转为数字类型
      if (at < 0) at += this.length + 1; // 如果 at 是负数，则表示位置是倒数的，将其转换为实际位置。

      var set = []; // 置换的成员容器
      var toAdd = []; // 新添加的成员容器
      var toRemove = []; // 待删除的成员容器
      var modelMap = {}; // 置换成员映射表

      var add = options.add; // 新增标识
      var merge = options.merge; // 合并标识
      var remove = options.remove; // 移除标识

      var sort = false; // 是否需要排序
      var sortable = this.comparator && (at == null) && options.sort !== false;
      var sortAttr = _.isString(this.comparator) ? this.comparator : null; // 如果 comparator 是字符串，则表示使用 model 某个属性作为排序因子

      var model;
      var view;
      var viewRefs = this._viewRefs; // the map of view references
      for (var i = 0; i < models.length; i++) {
        model = models[i];

        var existing = this.get(model);
        if (existing) {
          if (merge && model !== existing) {
            var attrs = this._isModel(model) ? model.attributes : model;
            if (options.parse) attrs = existing.parse(attrs, options);
            existing.set(attrs, options);
            if (sortable && !sort) sort = existing.hasChanged(sortAttr);
          }
          if (!modelMap[existing.cid]) {
            modelMap[existing.cid] = true;
            set.push(existing);
          }
          models[i] = existing;

        } else if (add) {
          model = models[i] = this._prepareModel(model, options);
          if (model) {
            toAdd.push(model);
            this._addViewReference(model, options); // add view
            this._addReference(model, options);
            modelMap[model.cid] = true;
            set.push(model);
          }
        }
      }

      if (remove) {
        for (i = 0; i < this.length; i++) {
          model = this.models[i];
          if (!modelMap[model.cid]) toRemove.push(model);
        }
        if (toRemove.length) this._removeModels(toRemove, options);
      }

      var orderChanged = false;
      var replace = !sortable && add && remove;
      if (set.length && replace) {
        orderChanged = this.length != set.length || _.some(this.models, function(model, index) {
          return model !== set[index];
        });
        this.models.length = 0;
        splice(this.models, set, 0);
        this.length = this.models.length;
      } else if (toAdd.length) {
        if (sortable) sort = true;
        splice(this.models, toAdd, at == null ? this.length : at);
        this.length = this.models.length;
      }

      if (sort) this.sort({
        silent: true
      });

      if (!options.silent) {
        for (i = 0; i < toAdd.length; i++) {
          if (at != null) options.index = at + i;
          model = toAdd[i];
          model.trigger('add', model, this, options);
          // trigger event `add:view` if there is a new view.
          view = viewRefs[model.cid];
          if (view) this.trigger('add:view', view, model, this, options);
        }
        if (sort || orderChanged) this.trigger('sort', this, options);
        if (toAdd.length || toRemove.length) this.trigger('update', this, options);
      }

      return singular ? models[0] : models;
    },

    view: Backbone.View,

    // 获取所有视图
    views: function() {
      var that = this;
      return _.map(arguments.length ? arguments : this.models, function(arg) {
        return that.getView(arg);
      });
    }
  });

  return Backbone;
}));