/*
 * @Author: laixi
 * @Date:   2017-03-20 16:04:59
 * @Last Modified by:   laixi
 * @Last Modified time: 2017-03-20 18:38:43
 */
import _ from 'underscore';
import Backbone, { slice, trim } from './core';

var Events = Backbone.Events = {};

// 事件名称分隔符
var eventSplitter = /\s+/;

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
        // TODO
      }
    });
  }

  // todo
};


Events.off = function(name, callback, context) {
  if (!this._events) return this; // 当前没有绑定任何事件
  this._events = eventsApi(offApi, this._events, name, callback, {
    context: context,
    listeners: this._listeners
  });
  return this;
};




/**
 * Events.forward
 */
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

var makeForwardMap = function(original, destination, map) {
  if (!original) return map;
  if (map === void 0) map = {};
  var i = 0;
  var names;
  if (typeof original === 'object') {
    for (names = _.keys(original); i < names.length; i++) {
      map = makeForwardMap(names[i], original[names[i]], map);
    }
  } else if (eventSplitter.test(original)) {
    for (names = original.split(eventSplitter); i < names.length; i++) {
      map = makeForwardMap(names[i], destination, map);
    }
  } else {
    map[original] = formatDestination(destination) || original;
  }
  return map;
};

var offForwardApi = function(forwarder, otherId, fwdId) {
  if (!forwarder) return;
  var forwardings = forwarder._forwardings;
  if (!forwardings) return;
  // todo
};

var forwardApi = function(forwarder, forwardee, map, options) {

};


// signatures:
// forward(obj);  - 原样转发所有事件
// forward(obj, original); - 原样转发指定的 original 事件
// forward(obj, original, destination);  - 将 original 事件转发到 destination。
// forward(obj, {original: destination}); - 将 original 事件转发到 destination。
Events.forward = function(obj, original, destination) {
  if (!obj) return this;
  // todo: if there is no argument passed in.
  return forwardApi(this, obj, makeForwardMap(original, destination));
};


Events.stopForwarding = function(obj, original, destination) {
  if (_.isEmpty(this._forwardings)) return this;
  // todo
};


export default Events;
