/*
 * @Author: laixi
 * @Date:   2017-03-20 16:04:59
 * @Last Modified by:   Xavier Yin
 * @Last Modified time: 2017-04-24 10:49:23
 */
import _ from 'underscore';
import Backbone, { slice, trim, eventSplitter } from './core';

var Events = Backbone.Events = {};

// 将不同传参转换为标准传参进行对应函数的调用（iteratee）
var eventsApi = function(iteratee, events, name, callback, opts) {
  var i = 0;
  var names;
  if (name && typeof name === 'object') { // 对象调用格式
    if (callback !== void 0 && 'context' in opts && opts.context === void 0) opts.context = callback;
    for (names = _.keys(name); i < names.length; i++) {
      events = eventsApi(iteratee, events, names[i], name[names[i]], opts);
    }
  } else if (name && eventSplitter.test(name)) { // 多事件调用格式
    for (names = name.split(eventSplitter); i < names.length; i++) {
      events = iteratee(events, names[i], callback, opts);
    }
  } else { // 标准调用格式
    events = iteratee(events, name, callback, opts);
  }
  return events;
};

// iteratee onApi
var onApi = function(events, name, callback, options) {
  if (callback) {
    var handlers = events[name] || (events[name] = []);
    var context = options.context;
    var ctx = options.ctx;
    var listening = options.listening;
    if (listening) listening.count++;
    handlers.push({
      callback: callback,
      context: context,
      ctx: context || ctx, // 上下文优先采用 options.context
      listening: listening
    });
  }
  return events;
};

// internal implementor of Events.on and Events.listenTo.
var internalOn = function(obj, name, callback, context, listening) {
  obj._events = eventsApi(onApi, obj._events || {}, name, callback, {
    context: context,
    ctx: obj,
    listening: listening
  });

  if (listening) { // 如果为真，表示在实现一个 listenTo 操作。
    var listeners = obj._listeners || (obj._listeners = {});
    listeners[listening.id] = listening;
  }

  return obj;
};

Events.on = function(name, callback, context) {
  return internalOn(this, name, callback, context);
};

// Events.listenTo 本质是通过 obj 的 on 方法来实现的。
Events.listenTo = function(obj, name, callback) {
  if (!obj) return this;
  var id = obj._listenId || (obj._listenId = _.uniqueId('l'));
  var listeningTo = this._listeningTo || (this._listeningTo = {});
  var listening = listeningTo[id];

  if (!listening) { // 初次监听 obj 对象
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


var offApi = function(events, name, callback, options) {
  if (!events) return;

  var i = 0;
  var listening;
  var context = options.context;
  var listeners = options.listeners;

  // usecase: model.off();
  if (!name && !callback && !context) {
    var ids = _.keys(listeners);
    for (; i < ids.length; i++) {
      listening = listeners[ids[i]];
      delete listeners[listening.id];
      delete listening.listeningTo[listening.objId];
    }

    // jackbone: remove refereneces regard to forward
    _.each(events['all'], function(handler) {
      if (handler.callback.forwarder) {
        removeForwardMap(handler.callback.forwarder, handler.callback.objId, handler.callback.fwdId);
      }
    });
    return;
  }

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
        // Jackbone:
        //  解除监听关系的同时，检查该监听关系是否是转发关系。
        //  如果是，解除转发关系。
        if (handler.callback.forwarder) {
          removeForwardMap(handler.callback.forwarder, handler.callback.objId, handler.callback.fwdId); // 移除转发关系
        }
        listening = handler.listening;
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


Events.off = function(name, callback, context) {
  if (!this._events) return this; // 当前没有绑定任何事件
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

Events.once = function(name, callback, context) {
  var events = eventsApi(onceMap, {}, name, callback, _.bind(this.off, this));
  return this.on(events, void 0, context);
};

Events.listenToOnce = function(obj, name, callback) {
  var events = eventsApi(onceMap, {}, name, callback, _.bind(this.stopListening, this, obj));
  return this.listenTo(obj, events);
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


Events.trigger = function(name) {
  if (!this._events) return this;

  var length = Math.max(0, arguments.length - 1);
  var args = Array(length);
  for (var i = 0; i < length; i++) args[i] = arguments[i + 1];

  eventsApi(triggerApi, this._events, name, void 0, args);
  return this;
};


/**
 * ===============
 *      Events.forward
 * ===============
 */

// 转发 ID
var forwardId = function() {
  return _.uniqueId('fwd');
};

// 格式化 destination 参数
var formatDestination = function(destination) {
  if (!_.isString(destination)) return null;
  destination = trim(destination);
  if (!destination) return null;
  return destination.split(eventSplitter)[0];
};

/** 解析转发起始事件与目的地事件之前的映射关系 */
var makeForwardMap = function(original, destination, map) {
  if (!original) return map;
  if (map === void 0) map = {};
  var i = 0;
  var names;
  if (_.isArray(original)) {
    for (i in original) {
      map = makeForwardMap(original[i], destination, map);
    }
  } else if (typeof original === 'object') {
    for (names = _.keys(original); i < names.length; i++) {
      map = makeForwardMap(names[i], original[names[i]], map);
    }
  } else if (eventSplitter.test(original)) {
    for (names = original.split(eventSplitter); i < names.length; i++) {
      map = makeForwardMap(names[i], destination, map);
    }
  } else {
    original = trim(original);
    if (original) map[original] = formatDestination(destination) || original;
  }
  return map;
};

// 移除转发映射关系
var removeForwardMap = function(forwarder, objId, fwdId) {
  if (!forwarder) return;
  var forwardings = forwarder._forwardings;
  if (!forwardings) return;
  if (objId == null) {
    forwarder._forwardings = void 0;
    return;
  }
  if (fwdId == null) {
    delete forwardings[objId];
    return;
  }
  var maps = forwardings[objId];
  if (!maps) return;
  delete maps[fwdId];

  if (_.isEmpty(maps)) delete forwardings[objId];
  if (_.isEmpty(forwardings)) forwarder._forwardings = void 0;
};

// 转发回调
var forwardCallback = function(original, destination, event) {
  var args = slice.call(arguments, 2);
  if (original && original !== event) return;
  if (original && original === event) args[0] = destination || original;
  this.trigger.apply(this, args);
};

var forwardApi = function(me, other, original, destination, options) {
  if (!options) options = {};
  var fwdId = forwardId();
  var objId = other._listenId || (other._listenId = _.uniqueId('l'));
  var fn = _.partial(forwardCallback, original, destination);
  var callback;
  if (options.once) {
    callback = function() {
      fn.apply(me, arguments);
      removeForwardMap(me, objId, fwdId);
    };
  } else {
    callback = fn;
  }
  callback.fwdId = fwdId;
  callback.forwarder = me;
  callback.objId = objId;
  var forwardings = me.forwardings || (me._forwardings = {});
  var forwardingMaps = forwardings[objId] || (forwardings[objId] = {});
  forwardingMaps[fwdId] = {
    fwdId: fwdId,
    original: original,
    destination: destination,
    callback: callback,
    other: other
  };
  if (options.once) {
    me.listenToOnce(other, 'all', callback);
  } else {
    me.listenTo(other, 'all', callback);
  }
};

// signatures:
// forward(obj);  - 原样转发所有事件
// forward(obj, original); - 原样转发指定的 original 事件
// forward(obj, original, destination);  - 将 original 事件转发到 destination。
// forward(obj, {original: destination}); - 将 original 事件转发到 destination。
Events.forward = function(obj, original, destination) {
  if (!obj) return this;
  var map = makeForwardMap(original, destination);
  if (map === void 0) {
    forwardApi(this, obj, null, null);
  } else {
    var that = this;
    _.each(map, function(dest, origin) {
      forwardApi(that, obj, origin, dest);
    });
  }
  return this;
};

// signatures:
// forwardOnce(obj);  - 原样转发所有事件
// forwardOnce(obj, original); - 原样转发指定的 original 事件
// forwardOnce(obj, original, destination);  - 将 original 事件转发到 destination。
// forwardOnce(obj, {original: destination}); - 将 original 事件转发到 destination。
Events.forwardOnce = function(obj, original, destination) {
  if (!obj) return this;
  var map = makeForwardMap(original, destination);
  if (map === void 0) {
    forwardApi(this, obj, null, null, { once: true });
  } else {
    var that = this;
    _.each(map, function(dest, origin) {
      forwardApi(that, obj, origin, dest, { once: true });
    });
  }
  return this;
};

/**
 * stopForwarding();
 * stopForwarding(obj);
 * stopForwarding(original);
 * stopForwarding(original, destination);
 * stopForwarding({original: destination});
 */
Events.stopForwarding = function(obj, original, destination) {
  if (_.isEmpty(this._forwardings)) return this;
  var forwardings = this._forwardings;
  if (obj) {
    forwardings = forwardings[obj._listenId];
    if (_.isEmpty(forwardings)) return this;
    forwardings = [forwardings];
  } else {
    forwardings = _.values(forwardings);
  }
  var map = makeForwardMap(original, destination);

  forwardings = _.reduce(forwardings, function(memo, forwarding) {
    _.each(_.values(forwarding), function(fwd) {
      if (map) {
        _.each(map, function(dest, origin) {
          if (fwd.original === origin && fwd.destination === dest) memo.push([fwd.other, fwd.callback]);
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

Events.bind = Events.on;
Events.unbind = Events.off;

export default Events;
