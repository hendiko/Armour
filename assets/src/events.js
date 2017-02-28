/*
 * @Author: laixi
 * @Date:   2017-02-28 14:46:14
 * @Last Modified by:   laixi
 * @Last Modified time: 2017-02-28 15:27:21
 */
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
  var _ = require('underscore');
  var Backbone = require('./core');
  var utils = require('./utils');

  var slice = utils.slice;
  var trim = utils.trim;

  var Events = module.exports = Backbone.Events = {};

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
          if (handler.callback.forwarder && listening) {
            removeForwardMap(handler.callback.forwarder, listening.objId, handler.callback.fwdId); // 移除转发关系            
          }
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