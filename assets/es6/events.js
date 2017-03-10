/*
 * @Author: laixi
 * @Date:   2017-03-10 16:14:03
 * @Last Modified by:   laixi
 * @Last Modified time: 2017-03-10 16:33:11
 */
import { _, slice, trim, Backbone } from './core';

var Events = Backbone.Events = {};

var eventSplitter = /\s+/;


function eventsApi(iteratee, events, name, callback, opts) {
  let i = 0;
  let names;
  if (name && typeof name === 'object') {
    if (callback !== void 0 && 'context' in opts && opts.context === void 0) opts.context = callback;
    for (names = _.keys(name); i < names.length; i++) {
      events = eventsApi(iteratee, events, names[i], name[names[i]], opts);
    }
  } else if (name && eventSplitter.test(name)) {
    for (names = name.split(eventSplitter); i < names.length; i++) {
      events = iteratee(events, names[i], callback, opts);
    }
  } else {
    events = iteratee(events, name, callback, opts);
  }
  return events;
}

Events.on = function(name, callback, context) {
  return internalOn(this, name, callback, context);
};

var internalOn = function(obj, name, callback, context, listening) {
  obj._events = eventsApi(onApi, obj._events || {}, name, callback, {
    context: context,
    ctx: obj,
    listening: listening
  });

  if (listening) {
    var listeners = obj._listeners || (obj._listeners = {});
    listeners[listening.id] = listening;
  }

  return obj;
};

Events.listenTo = function(obj, name, callback) {
  if (!obj) return this;
  var id = obj._listenId || (obj._listenId = _.uniqueId('l'));
  var listeningTo = this._listeningTo || (this._listeningTo = {});
  var listening = listeningTo[id];

  if (!listening) {
    var thisId = this._listenId || (this._listenId = _.uniqueId('l'));
    listening = listeningTo[id] = {
      obj: obj,
      objId: id,
      id: thisId,
      listeningTo: listeningTo,
      count: 0
    };
  }

  internalOn(obj, name, callback, this, listening);
  return this;
};

var onApi = function(events, name, callback, options) {
  if (callback) {
    var handlers = events[name] || (events[name] = []);
    var context = options.context,
      ctx = options.ctx,
      listening = options.listening;
    if (listening) listening.count++;
    handlers.push({
      callback: callback,
      context: context,
      ctx: context || ctx,
      listening: listening
    });
  }
  return events;
};

Events.off = function(name, callback, context) {
  if (!this._events) return this;
  this._events = eventsApi(offApi, this._events, name, callback, {
    context: context,
    listeners: this._listeners
  });
  return this;
};

Events.stopListening = function(obj, name, callback) {
  var listeningTo = this._listeningTo;
  if (!listeningTo) return this;

  var ids = obj ? [obj._listenId] : _.keys(listeningTo);

  for (var i = 0; i < ids.length; i++) {
    var listening = listeningTo[ids[i]];

    if (!listening) break;
    listening.obj.off(name, callback, this);
  }
  if (_.isEmpty(listeningTo)) this._listeningTo = void 0;

  return this;
};

var offApi = function(events, name, callback, options) {
  if (!events) return;

  var i = 0,
    listening;
  var context = options.context,
    listeners = options.listeners;

  // 当未指定 name, callback, context 时，表示需要接触所有监听关系。
  // Backbone.Events 只需遍历 listenee._listeners，便可逐一解除所有监听关系。
  // 然后返回 void 0，便可直接将 listenee._events 替换为空对象 `{}`。
  // 
  // Jackbone 需要在所有 events 被清空前，遍历 events['all'] 来解除转发关系。
  if (!name && !callback && !context) {
    var ids = _.keys(listeners);
    for (; i < ids.length; i++) {
      listening = listeners[ids[i]];
      delete listeners[listening.id]; // 移除监听者引用
      delete listening.listeningTo[listening.objId]; // 移除监听关系
    }

    // Jackbone:
    // 遍历 all 事件回调对象，如果 callback.forwarder 存在，表示这是一个转发回调，
    // 因此调用 removeForwardMap 来解除转发关系。
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

    if (!handlers) break;

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
        // Jackbone:
        //  解除监听关系的同时，检查该监听关系是否是转发关系。
        //  如果是，解除转发关系。
        if (handler.callback.forwarder) {
          removeForwardMap(handler.callback.forwarder, listening.objId, handler.callback.fwdId); // 移除转发关系            
        }
        if (listening && --listening.count === 0) {
          delete listeners[listening.id];
          delete listening.listeningTo[listening.objId];
        }
      }
    }

    if (remaining.length) {
      events[name] = remaining;
    } else {
      delete events[name];
    }
  }
  if (_.size(events)) return events;
};

Events.once = function(name, callback, context) {
  var events = eventsApi(onceMap, {}, name, callback, _.bind(this.off, this));
  return this.on(events, void 0, context);
};

Events.listenToOnce = function(obj, name, callback) {
  var events = eventsApi(onceMap, {}, name, callback, _.bind(this.stopListening, this, obj));
  return this.listenTo(obj, events);
};

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

Events.trigger = function(name) {
  if (!this._events) return this;

  var length = Math.max(0, arguments.length - 1);
  var args = Array(length);
  for (var i = 0; i < length; i++) args[i] = arguments[i + 1];

  eventsApi(triggerApi, this._events, name, void 0, args);
  return this;
};

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

// ==================================================

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

export { Events };
