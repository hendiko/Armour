//     Backbone.js 1.2.3

//     (c) 2010-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

(function(factory) {

  // Establish the root object, `window` (`self`) in the browser, or `global` on the server.
  // We use `self` instead of `window` for `WebWorker` support.
  var root = (typeof self == 'object' && self.self == self && self) ||
            (typeof global == 'object' && global.global == global && global);

  // Set up Backbone appropriately for the environment. Start with AMD.
  if (typeof define === 'function' && define.amd) {
    define(['underscore', 'jquery', 'exports'], function(_, $, exports) {
      // Export global even in AMD case in case this script is loaded with
      // others that may still expect a global Backbone.
      root.Backbone = factory(root, exports, _, $);
    });

  // Next for Node.js or CommonJS. jQuery may not be needed as a module.
  } else if (typeof exports !== 'undefined') {
    var _ = require('underscore'), $;
    try { $ = require('jquery'); } catch(e) {}
    factory(root, exports, _, $);

  // Finally, as a browser global.
  } else {
    root.Backbone = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender || root.$));
  }

}(function(root, Backbone, _, $) {

  // Initial Setup
  // -------------

  // Save the previous value of the `Backbone` variable, so that it can be
  // restored later on, if `noConflict` is used.
  var previousBackbone = root.Backbone;

  // Create a local reference to a common array method we'll want to use later.
  var slice = Array.prototype.slice;

  // Current version of the library. Keep in sync with `package.json`.
  Backbone.VERSION = '1.2.3';

  // For Backbone's purposes, jQuery, Zepto, Ender, or My Library (kidding) owns
  // the `$` variable.
  Backbone.$ = $;

  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
  // to its previous owner. Returns a reference to this Backbone object.
  Backbone.noConflict = function() {
    root.Backbone = previousBackbone;
    return this;
  };

  // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
  // will fake `"PATCH"`, `"PUT"` and `"DELETE"` requests via the `_method` parameter and
  // set a `X-Http-Method-Override` header.
  Backbone.emulateHTTP = false;

  // Turn on `emulateJSON` to support legacy servers that can't deal with direct
  // `application/json` requests ... this will encode the body as
  // `application/x-www-form-urlencoded` instead and will send the model in a
  // form param named `model`.
  Backbone.emulateJSON = false;

  // Proxy Backbone class methods to Underscore functions, wrapping the model's
  // `attributes` object or collection's `models` array behind the scenes.
  //
  // collection.filter(function(model) { return model.get('age') > 10 });
  // collection.each(this.addView);
  //
  // `Function#apply` can be slow so we use the method's arg count, if we know it.
  var addMethod = function(length, method, attribute) {
    switch (length) {
      case 1: return function() {
        return _[method](this[attribute]);
      };
      case 2: return function(value) {
        return _[method](this[attribute], value);
      };
      case 3: return function(iteratee, context) {
        return _[method](this[attribute], cb(iteratee, this), context);
      };
      case 4: return function(iteratee, defaultVal, context) {
        return _[method](this[attribute], cb(iteratee, this), defaultVal, context);
      };
      default: return function() {
        var args = slice.call(arguments);
        args.unshift(this[attribute]);
        return _[method].apply(_, args);
      };
    }
  };
  // 添加 underscore 方法
  var addUnderscoreMethods = function(Class, methods, attribute) {
    _.each(methods, function(length, method) {
      if (_[method]) Class.prototype[method] = addMethod(length, method, attribute);
    });
  };

  // Support `collection.sortBy('attr')` and `collection.findWhere({id: 1})`.
  var cb = function(iteratee, instance) {
    if (_.isFunction(iteratee)) return iteratee;
    if (_.isObject(iteratee) && !instance._isModel(iteratee)) return modelMatcher(iteratee);
    if (_.isString(iteratee)) return function(model) { return model.get(iteratee); };
    return iteratee;
  };
  var modelMatcher = function(attrs) {
    var matcher = _.matches(attrs);
    return function(model) {
      return matcher(model.attributes);
    };
  };

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
    var i = 0, names;
    if (name && typeof name === 'object') {
      // Handle event maps.
      if (callback !== void 0 && 'context' in opts && opts.context === void 0) opts.context = callback;
      for (names = _.keys(name); i < names.length ; i++) {
        events = eventsApi(iteratee, events, names[i], name[names[i]], opts);
      }
    } else if (name && eventSplitter.test(name)) {
      // Handle space separated event names by delegating them individually.
      for (names = name.split(eventSplitter); i < names.length; i++) {
        events = iteratee(events, names[i], callback, opts);
      }
    } else {
      // Finally, standard events.
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

  // Inversion-of-control versions of `on`. Tell *this* object to listen to
  // an event in another object... keeping track of what it's listening to
  // for easier unbinding later.
  Events.listenTo =  function(obj, name, callback) {
    if (!obj) return this;
    var id = obj._listenId || (obj._listenId = _.uniqueId('l'));
    var listeningTo = this._listeningTo || (this._listeningTo = {});
    var listening = listeningTo[id];

    // This object is not listening to any other events on `obj` yet.
    // Setup the necessary references to track the listening callbacks.
    if (!listening) {
      var thisId = this._listenId || (this._listenId = _.uniqueId('l'));
      listening = listeningTo[id] = {obj: obj, objId: id, id: thisId, listeningTo: listeningTo, count: 0};
    }

    // Bind callbacks on obj, and keep track of them on listening.
    internalOn(obj, name, callback, this, listening);
    return this;
  };

  // The reducing API that adds a callback to the `events` object.
  var onApi = function(events, name, callback, options) {
    if (callback) {
      var handlers = events[name] || (events[name] = []);
      var context = options.context, ctx = options.ctx, listening = options.listening;
      if (listening) listening.count++;

      handlers.push({ callback: callback, context: context, ctx: context || ctx, listening: listening });
    }
    return events;
  };

  // Remove one or many callbacks. If `context` is null, removes all
  // callbacks with that function. If `callback` is null, removes all
  // callbacks for the event. If `name` is null, removes all bound
  // callbacks for all events.
  Events.off =  function(name, callback, context) {
    if (!this._events) return this;
    this._events = eventsApi(offApi, this._events, name, callback, {
        context: context,
        listeners: this._listeners
    });
    return this;
  };

  // Tell this object to stop listening to either specific events ... or
  // to every object it's currently listening to.
  Events.stopListening =  function(obj, name, callback) {
    var listeningTo = this._listeningTo;
    if (!listeningTo) return this;

    var ids = obj ? [obj._listenId] : _.keys(listeningTo);

    for (var i = 0; i < ids.length; i++) {
      var listening = listeningTo[ids[i]];

      // If listening doesn't exist, this object is not currently
      // listening to obj. Break out early.
      if (!listening) break;

      listening.obj.off(name, callback, this);
    }
    if (_.isEmpty(listeningTo)) this._listeningTo = void 0;

    return this;
  };

  // The reducing API that removes a callback from the `events` object.
  var offApi = function(events, name, callback, options) {
    if (!events) return;

    var i = 0, listening;
    var context = options.context, listeners = options.listeners;

    // Delete all events listeners and "drop" events.
    if (!name && !callback && !context) {
      var ids = _.keys(listeners);
      for (; i < ids.length; i++) {
        listening = listeners[ids[i]];
        delete listeners[listening.id];
        delete listening.listeningTo[listening.objId];
      }
      return;
    }

    var names = name ? [name] : _.keys(events);
    for (; i < names.length; i++) {
      name = names[i];
      var handlers = events[name];

      // Bail out if there are no events stored.
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
  Events.once =  function(name, callback, context) {
    // Map the event into a `{event: once}` object.
    var events = eventsApi(onceMap, {}, name, callback, _.bind(this.off, this));
    return this.on(events, void 0, context);
  };

  // Inversion-of-control versions of `once`.
  Events.listenToOnce =  function(obj, name, callback) {
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
  Events.trigger =  function(name) {
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
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args); return;
    }
  };

  // Aliases for backwards compatibility.
  // bind 作为 on 别名，unbind 作为 off 别名。（为向后兼容）
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Allow the `Backbone` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  _.extend(Backbone, Events);


  // Backbone.Model（模型）
  // --------------------------

  // Backbone **Models** are the basic data object in the framework --
  // frequently representing a row in a table in a database on your server.
  // A discrete chunk of data and a bunch of useful, related methods for
  // performing computations and transformations on that data.
  // Create a new model with the specified attributes. A client id (`cid`)
  // is automatically generated and assigned for you.
  // 
  // 默认的 Model 构造函数主要做三件事：
  // 1. 为实例设置 cid 属性；
  // 2. 为实例设置 attributes；
  // 3. 调用实例的 initialize 方法完成初始化。
  // 
  // 注意：
  // 如果给定 attributes，它是通过 set 方法添加到 model 的 attributes。
  // 并且是早于 initialize 方法调用。
  var Model = Backbone.Model = function(attributes, options) {
    var attrs = attributes || {};
    options || (options = {});
    // 生成唯一 cid，cid 表示 client id，是指在本地模型变量的标识，而不是模型所代表数据的唯一标识。
    this.cid = _.uniqueId(this.cidPrefix);
    this.attributes = {};
    // 如果指定了 collection，则直接绑定到模型上。
    if (options.collection) this.collection = options.collection;
    // 默认初始化设置 attributes 是不经过 parse 方法的（parse 方法只有在 fetch/save 等同步数据时才调用）
    // 如果指定 options.parse 为真，则初始化时调用 parse 方法解析 attrs。
    if (options.parse) attrs = this.parse(attrs, options) || {};
    // 初始化 attributes 
    attrs = _.defaults({}, attrs, _.result(this, 'defaults'));
    // 调用 set 方法设置初始属性。
    // 不用担心 set 会触发 change 事件，因为此时还没有调用 initialize 方法
    // 所以通常说来，此时你还来不及绑定任何事件。
    this.set(attrs, options);
    // 调用 set 方法会导致 this.changed 发生变化，
    // Jeremy Ashkenas 的意图是初始化的 Model 不应该含有变化的属性（因为一切都是初始的）
    // 所以需要重新将 this.changed 修改为空对象。
    // 注意：当设置初始 attributes 时，甚至都还没有调用 initialize。
    this.changed = {};
    // 调用初始化方法 initialize。
    this.initialize.apply(this, arguments);
  };

  // Attach all inheritable methods to the Model prototype.
  _.extend(Model.prototype, Events, {

    // 属性哈希，用以保存模型发生变化的属性哈希（只有 set 操作会产生旧属性哈希）
    changed: null,

    // set 操作前验证属性哈希合法性，
    // 如果验证失败，本属性保存验证失败的结果（model.validate 返回值），
    // 否则该属性会被重置为 null。
    validationError: null,

    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
    // CouchDB users may want to set this to `"_id"`.
    idAttribute: 'id',

    // The prefix is used to create the client id which is used to identify models locally.
    // You may want to override this if you're experiencing name clashes with model ids.
    cidPrefix: 'c',

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // 默认实现的 toJSON 方法是复制一份 attributes
    // 但你可以覆写该方法，该方法参数 options 或许用得上。
    // 该 options 与 fetch 方法的 options 参数相同，在未指定 HTTP 请求 data 时，
    // Backbone.sync 会默认使用 `model.toJSON(options)` 来生成 data。
    toJSON: function(options) {
      return _.clone(this.attributes);
    },

    // Proxy `Backbone.sync` by default -- but override this if you need
    // custom syncing semantics for *this* particular model.
    // 
    // 模型同步数据，默认委托 Backbone.sync 方法实现本方法。
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // 获取属性值
    get: function(attr) {
      return this.attributes[attr];
    },

    // 获取 HTML 转义后的属性值。
    escape: function(attr) {
      return _.escape(this.get(attr));
    },

    // 返回 true，如果模型指定 attribute 不为 null 或 undefined。
    has: function(attr) {
      return this.get(attr) != null;
    },

    // 委托 _.iteratee 来判断给定的 attrs 是否是模型 attributes 子集
    // 根据传入 iteratee 参数不同，iteratee 具体实现也不同。
    // 1. attrs 为 void 0。
    //  相当于 _.identity(this.attributes)，返回结果为 true。
    // 2. attrs 为函数。
    //  相当于 attrs(this.attributes);
    // 3. attrs 为对象。
    //  相当于 _.matcher(attrs)(this.attributes)，判断 attrs 是否是 attributes 子集。
    // 4. 其他（主要是指 string）
    //  相当于 _.property(attrs)(this.attributes);
    matches: function(attrs) {
      return !!_.iteratee(attrs, this)(this.attributes);
    },

    // 设置模型属性哈希，触发 `change` 事件。
    // 本方法是模型对象的核心操作，更新模型数据并将属性状态变化通知给外部。
    // Backbone.Model 所有更新 attributes 的操作都是通过 set 方法完成，
    // 例如初始化 initialize(attributes), fetch, save 等。
    // 操作成功返回模型对象自身，操作失败返回 false。
    // 注意：
    // options.slient 为 true，只是表示本次 set 操作不触发 `change` 事件。
    // 但仍然会更新模型的 `this.changed`, `this._previousAttributes` 属性，
    // 因此在调用 `this.hasChanged()`， `this.changedAttributes()` ，`this.previous()`, `this.previousAttributes()` 方式时，
    // 仍然可以识别中属性哈希的变化。
    set: function(key, val, options) {

      // 未指定属性名称的操作属于无效操作。
      // 例如：`model.set()` 或 `model.set(null, options)`。
      // 因此当需要调用 model.parse 方法时，
      // 返回值为 null 或 undefined 将导致模型不设置任何属性哈希。
      if (key == null) return this;

      // 将 `model.set(key, value, options)` 转换为 `model.set({key: value}, options)` 风格。
      var attrs;
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options || (options = {});

      // 正式设置属性哈希前，先验证输入参数。
      // 如果要求验证数据，但验证数据失败，则中止 set 操作。
      // this._validate 方法是通过 this.validate 方法来实现的，
      // 只有定义了 this.validate 方法，才会进行验证，否则默认验证成功。
      // 如果 this.validate 返回值为真，则表示验证失败（返回值就是验证失败原因 this.validationError），
      // 否则验证成功，this.validationError 值设置为 null。
      if (!this._validate(attrs, options)) return false;

      // Extract attributes and options.
      // 
      // 如果 unset 为 true，则从 attributes 中移除 key。
      // 注意：
      // 只有 key 存在于 attributes 中，且 value 不等于 attributes[key] 时，
      // 当 key 被移除时才会触发 `change:key` 事件。
      var unset      = options.unset;   
      var silent     = options.silent;  // 如果为 true，不触发任何 `change` 事件。
      var changes    = [];   // 发生变化属性名称列表

      // 如果为 true，表示模型处于 set 操作中。
      // 因为 set 操作可以内嵌在 set 中，this._changing 相当于操作锁。
      // 而局部变量 changing 可以作为主动 set 的标识，
      // 因为只有主动 set 的 changing 此时为 false，而递归 set 中的 changing 都是 true。  
      var changing   = this._changing;  
      this._changing = true;

      // 如果 set 操作未锁定，则设置相关属性
      if (!changing) {
        this._previousAttributes = _.clone(this.attributes);   // 保存操作前的属性哈希副本
        this.changed = {};  // （初始）设置变化属性哈希
      }

      var current = this.attributes;   // 当前属性哈希
      var changed = this.changed;  // 当前变化属性哈希
      var prev    = this._previousAttributes;   // 操作前属性哈希

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
        // 如果变化属性名称列表不为空，则逐一触发 `change:key` 事件。
        // 并且将输入 options 设置为 this._pending。
        // `this._pending` 可以用来缓存输入 options，
        // 当在递归 set 中有属性变化时，它可以不断被改写。
        // 但只有在主动 set 中临近操作结束时被读取。
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
      this._pending = false;  // 重置为 false 表示属性没有变化了。
      this._changing = false;  // 设置为 false 表示主动 set 操作结束。
      return this;
    },

    // 从模型属性哈希中移除属性，并触发 `change` 事件。
    // （通过调用 set 方法实现）
    unset: function(attr, options) {
      return this.set(attr, void 0, _.extend({}, options, {unset: true}));
    },

    // 从模型属性哈希中移除所有属性，触发 `change` 事件。
    // （通过调用 set 方法实现）
    clear: function(options) {
      var attrs = {};
      for (var key in this.attributes) attrs[key] = void 0;
      return this.set(attrs, _.extend({}, options, {unset: true}));
    },

    // 判断模型对象属性哈希在最后一次 `set` 操作时，是否发生了变化。
    // 或者判断指定的属性在最后一次 `set` 操作时是否发生了变化。
    // 在 set 操作时，使用 options.silent = true 不影响本函数的判断结果。
    hasChanged: function(attr) {
      if (attr == null) return !_.isEmpty(this.changed);
      return _.has(this.changed, attr);
    },

    // 本方法有两个用途：
    // 1. 当不传入任何参数时（或 diff 为否），判断最后一次 set 操作，属性哈希是否发生变化。
    // 如果发生变化，返回变化属性哈希，否则返回 false。
    // 
    // 2. 传一个 Object 对象作为 diff 参数，将其与模型当前属性哈希进行对比，
    // 筛选出于不同于当前属性哈希的属性，如果有筛选结果，则返回筛选结果，否则返回 false。
    // 使用 `model.changedAttributes(someObject)` 可以(预先)判断出 set 哪些值会导致模型的属性哈希发生变化。
    changedAttributes: function(diff) {
      if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
      var old = this._changing ? this._previousAttributes : this.attributes;
      var changed = {};
      for (var attr in diff) {
        var val = diff[attr];
        if (_.isEqual(old[attr], val)) continue;
        changed[attr] = val;
      }
      return _.size(changed) ? changed : false;
    },

    // 返回最后一次 set 之前的指定属性值（无论该属性是否发生过变化）。
    // 不传入参数，或者模型没有进行过 set 操作，返回 null；
    previous: function(attr) {
      if (attr == null || !this._previousAttributes) return null;
      return this._previousAttributes[attr];
    },

    // 返回最后一次 set 前的属性哈希。
    // 如果没有 set 过，则返回 null。
    previousAttributes: function() {
      return _.clone(this._previousAttributes);
    },

    // Fetch the model from the server, merging the response with the model's
    // local attributes. Any changed attributes will trigger a "change" event.
    // fetch 方法主要用于从远端读取数据同步到本地 attributes，如果属性值发生变化，触发 `change` 事件。
    // Backbone 本意是为 REST API 而设计，但也可以兼容非 REST API。
    // 使用非 REST API 时，应该改写 parse 方法，再调用 fetch 方法。
    fetch: function(options) {
      // 远端的响应结果默认需要通过 parse 方法解析才能 set，
      // 可以在 options 中指定 parse 为 false 来解除这一逻辑。
      options = _.extend({parse: true}, options);
      var model = this;

      // 封装 success 操作
      // 无论 options 中是否指定 success 回调，xhr 请求成功后都会有一次 success 回调。
      // 如果有 options.success 回调函数，回调函数会在封装的 success 回调用执行。
      var success = options.success;
      options.success = function(resp) {
        // 如果要求 parse 为真，则远程返回值必须经过 parse 方法解析，否则远程返回值就是响应数据。
        var serverAttrs = options.parse ? model.parse(resp, options) : resp;
        // model.set 方法只有在 validate 失败时才会返回 false。
        // 如果验证失败，则不会进行具有实际意义的 set 操作。
        // 并且触发 invalid 事件。
        if (!model.set(serverAttrs, options)) return false;
        // 如果 set 操作成功，则继续调用原本计划的 success 回调函数。
        // 注意：
        //    此处的 success 回调与原生 jQuery ajax success 回调稍微不同的是，
        //    它的上下文由 options.context 指定。
        if (success) success.call(options.context, model, resp, options);
        // 执行完 success 回调后触发 sync 事件。
        model.trigger('sync', model, resp, options);
      };
      // 封装 options.error 回调，确保 xhr 失败时，触发 model 的 error 事件。
      wrapError(this, options);
      // read 远程数据，默认使用 this.sync 方法实现，
      // this.sync 默认使用 Backbone.sync 方法实现，
      // Backbone.sync 默认使用 Backbone.$ 方法实现，
      // Backbone.$ 默认使用 jQuery.ajax 方法实现。
      return this.sync('read', this, options);
    },

    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    // 
    // 设置 model 的 attributes，并且将 attributes 同步到远端。
    // 如果远端返回的响应值（通过 parse 方法解析后）不同于 attributes，
    // 则再次执行 set 操作。
    save: function(key, val, options) {
      // Handle both `"key", value` and `{key: value}` -style arguments.
      // 处理不同传参方式。
      var attrs;
      if (key == null || typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      // 默认要求进行 validate 和 parse 操作。
      options = _.extend({validate: true, parse: true}, options);
      // 是否等待服务器响应再进行 set 操作的标识。（默认不等待）
      // 等待服务器响应与否的区别是：
      //  一个先 set，后同步数据。
      //  一个是先同步数据，然后 set。
      var wait = options.wait;

      // If we're not waiting and attributes exist, save acts as
      // `set(attr).save(null, opts)` with validation. Otherwise, check if
      // the model will be valid when the attributes, if any, are set.
      // 如果 attrs 为真，且无需等待服务器响应，则立即使用 attrs 进行 set 操作。
      // 注意：
      //    如果不等待服务器响应，set 操作一旦成功会立即触发 `change` 事件，
      //    但随后的服务器响应值会被重新 set 一次，有可能会 set 失败。
      if (attrs && !wait) {
        // 如果 set 操作失败（即 validate 失败），立即返回 false（结束 save 操作）。
        // 注意：什么要求 attrs 也为真才进行 set 操作？
        // 如果不限制 attrs 为真，那么 set 操作会默认成功，则将导致 save 操作不会终止。
        // 那么 save 会将未做任何修改的 attributes 再次同步到远端，这样不符合 save 操作的意图。 
        if (!this.set(attrs, options)) return false;
      } else {
        // 验证 attrs，验证失败则立即终止 save 操作。
        if (!this._validate(attrs, options)) return false;
      }

      // After a successful server-side save, the client is (optionally)
      // updated with the server-side state.
      // 
      // 以下逻辑与 fetch 逻辑相似，开始进行数据同步相关操作。
      var model = this;
      var success = options.success;
      var attributes = this.attributes;
      // 封装 success 回调
      options.success = function(resp) {
        // Ensure attributes are restored during synchronous saves.
        model.attributes = attributes;
        // 解析远端响应值
        var serverAttrs = options.parse ? model.parse(resp, options) : resp;
        // 如果当前 save 操作是需要等待服务器响应的，则合并 attrs 和 serverAttrs 属性，
        // 然后再进行 set 操作。
        if (wait) serverAttrs = _.extend({}, attrs, serverAttrs);
        // 无论是否要求 save 操作等待服务器响应，如果响应值存在（经过可能的 parse 操作后，解析结果不为 null 或 undefined），
        // 则进行 set 操作，set 操作失败（验证失败）会立即终止 save 操作。
        if (serverAttrs && !model.set(serverAttrs, options)) return false;
        // set 成功后，执行可能计划的 success，然后触发 sync 事件。
        if (success) success.call(options.context, model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      // 封装 error 回调
      wrapError(this, options);

      // Set temporary attributes if `{wait: true}` to properly find new ids.
      // 设置临时的 attributes，因为在 Backbone.sync 操作中可能需要将 attributes 同步到远端。
      // 注意：此处是直接修改 attributes，而不是通过 set 操作进行修改，因此不会触发任何事件。
      if (attrs && wait) this.attributes = _.extend({}, attributes, attrs);

      // 根据模型状态选择 REST API 的提交方式
      var method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
      // 如果是 patch 操作，则将 attrs 保存在 options.attrs 中
      // （此处保存 attrs 的意图不是很明确，难道只是为了记录下 patch 的数据，以便满足开发者的个性化操作？）
      if (method === 'patch' && !options.attrs) options.attrs = attrs;
      var xhr = this.sync(method, this, options);

      // Restore attributes.
      // 立刻恢复模型应该拥有的 attributes。
      this.attributes = attributes;

      return xhr;
    },

    // Destroy this model on the server if it was already persisted.
    // Optimistically removes the model from its collection, if it has one.
    // If `wait: true` is passed, waits for the server to respond before removal.
    // 销毁模型（并同步从远端销毁）
    // 如果 options.wait 为真，则等待远端同步成功后，再销毁模型。
    // destroy 操作主要实现：
    //    1. stopListening 所有事件（不包括自身的 on 事件）
    //    2. 触发 destroy 事件（通知 collection 将自己从 collection 中移除）
    //    3. （可选）同步从远端删除数据。（根据 model.isNew() 判断是否要触发 sync 事件）
    //    
    // 注意：
    //  Backbone.sync 期待的是 RESTFUL API，如果使用 emulatedHTTP，
    //  destroy 操作 success 会在 XHR 请求成功后立即执行，
    //  即 XHR 请求成功，即视为远端删除数据成功。
    //  因此在不重写 destroy 的方法前提下，要求远端接口响应必需以 HTTP Status Code（200 或 404）作为操作成功失败的标识，
    //  而不能在响应的 data 中约定操作成功失败代号。
    destroy: function(options) {
      options = options ? _.clone(options) : {};
      var model = this;
      var success = options.success;
      var wait = options.wait;

      // 销毁模型（停止监听事件，触发 destroy 事件）
      var destroy = function() {
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

    // Default URL for the model's representation on the server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    // 生成 model 进行 sync 时的 URL（适用于 RESTFUL API）
    // 默认的 url 方法主要适用于 RESTFUL API，自动生成 URL。
    // 对于非 RESTFUL API，最好重写该方法。
    url: function() {
      var base =
        _.result(this, 'urlRoot') ||
        _.result(this.collection, 'url') ||
        urlError();
      if (this.isNew()) return base;
      var id = this.get(this.idAttribute);
      // 自动补齐 base 末尾的 `/` 符号，然后追加 id
      return base.replace(/[^\/]$/, '$&/') + encodeURIComponent(id);
    },

    // parse 方法存在的意义在于解析远程同步数据时，远端返回的响应对象，
    // 该对象默认是 REST API 返回的数据对象，因此可以直接被 set 方法使用。
    // 但对于非 REST API 接口响应对象，则需要调用 parse 将其响应结果解析后再返回给 set 使用。
    // 所以说，如果直接使用 set 方法设置属性，是无需经过 parse 方法的，只有自动同步远程数据时才需要覆写该方法。 
    // 例如 fetch 方法中调用了 parse 方法解析远端的响应值，fetch 方法中使用 parse 解析结果去做 set 操作，
    // 因此 parse 返回 null 或 undefined 时，set 操作会立即终止。
    parse: function(resp, options) {
      return resp;
    },

    // Create a new model with identical attributes to this one.
    clone: function() {
      return new this.constructor(this.attributes);
    },

    // A model is new if it has never been saved to the server, and lacks an id.
    // 判断一个 model 是否从未保存到远端。
    // 判断依据是查看该 model 的 attributes 是否拥有 this.idAttribute 映射字段。
    // Backbone.Model 的设计意图是 Model 是远端一条数据的抽象对象（例如数据库中某张表里某一行数据），
    // 每个 model 都应该拥有一个主键（对应数据库里数据行的主键值），拥有主键则表示远端已存在该条数据，
    // 否则视该 model 为未保存的数据模型。
    isNew: function() {
      return !this.has(this.idAttribute);
    },

    // Check if the model is currently in a valid state.
    // 检查 model 当前的 attributes 是否处于合法状态（能够通过验证）
    isValid: function(options) {
      return this._validate({}, _.defaults({validate: true}, options));
    },

    // Run validation against the next complete set of model attributes,
    // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
    // 注意：
    // validate 是对模拟 set 成功后的 attributes 进行验证，而不仅仅是对 attrs 进行验证。
    // 也就是说 this.validate(attrs, options) 中的 attrs 是指模拟 set 成功后的 attributes。
    _validate: function(attrs, options) {
      if (!options.validate || !this.validate) return true;
      attrs = _.extend({}, this.attributes, attrs);
      var error = this.validationError = this.validate(attrs, options) || null;
      if (!error) return true;
      this.trigger('invalid', this, error, _.extend(options, {validationError: error}));
      return false;
    }

  });

  // Underscore methods that we want to implement on the Model, mapped to the
  // number of arguments they take.
  var modelMethods = { keys: 1, values: 1, pairs: 1, invert: 1, pick: 0,
      omit: 0, chain: 1, isEmpty: 1 };

  // Mix in each Underscore method as a proxy to `Model#attributes`.
  addUnderscoreMethods(Model, modelMethods, 'attributes');

  // Backbone.Collection
  // -------------------

  // If models tend to represent a single row of data, a Backbone Collection is
  // more analogous to a table full of data ... or a small slice or page of that
  // table, or a collection of rows that belong together for a particular reason
  // -- all of the messages in this particular folder, all of the documents
  // belonging to this particular author, and so on. Collections maintain
  // indexes of their models, both in order, and for lookup by `id`.

  // Create a new **Collection**, perhaps to contain a specific type of `model`.
  // If a `comparator` is specified, the Collection will maintain
  // its models in sort order, as they're added and removed.
  // 
  // Collection 构造函数，可以指定 collection 的 model 类型。
  // 如果给定 `comparator`，当天新增或移除 model 时，collection 会自动维护 models 的排序。
  var Collection = Backbone.Collection = function(models, options) {
    options || (options = {});
    // 如果 options 中包含 model 字段，则直接绑定到 collection。
    if (options.model) this.model = options.model;
    // 如果 options 中包含 comparator 且不为 undefined，则直接绑定到 collection。
    if (options.comparator !== void 0) this.comparator = options.comparator;
    // 重置 collection 的 length, models, _byId 三个属性。
    this._reset();
    // 初始化 collection
    this.initialize.apply(this, arguments);
    // 如果指定了 models, 则静默设置初始 models
    // todo: 
    //   与 model 初始化不同，collection 使用 reset 而不是 set 作为构造初始数据的手段，
    //   且 reset 操作晚于 initialize 操作。作者意图不是很明确。
    //   如此操作的话，则意味着你不应该在 initialize 中对 collection 进行成员增减操作，
    //   否则可能会在构造实例时，被构造参数中的 models 覆写了 collection 成员。
    if (models) this.reset(models, _.extend({silent: true}, options));
  };

  // collection#set 操作的默认选项。
  var setOptions = {add: true, remove: true, merge: true};
  var addOptions = {add: true, remove: false};

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

  // Define the Collection's inheritable methods.
  _.extend(Collection.prototype, Events, {

    // 默认 model 为 Backbone.Model。
    // 大部分情景中你需要重写该属性。
    model: Model,

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // 返回一个数组，成员是 collection 中每个 model 的 JSON 值。
    toJSON: function(options) {
      return this.map(function(model) { return model.toJSON(options); });
    },

    // Proxy `Backbone.sync` by default.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Add a model, or list of models to the set. `models` may be Backbone
    // Models or raw JavaScript objects to be converted to Models, or any
    // combination of the two.
    // 
    // 使用 set 操作往 collection 添加一个或多个成员。
    // models 可以是 Backbone.Model 及其子类实例，或者是纯 Object，或者二者混合组成的数组。
    // 关于 options：
    //    默认 merge 为 false，但允许指定为 true。
    //    强制 add 为 true，remove 为 false，不允许修改。
    // 
    // add 操作的默认行为是在 collection 末尾追加成员，如果成员已经存在，则不追加。
    add: function(models, options) {
      return this.set(models, _.extend({merge: false}, options, addOptions));
    },

    // Remove a model, or a list of models from the set.
    // 
    // 从 collection 中移除一个或一组成员。
    remove: function(models, options) {
      options = _.extend({}, options);
      var singular = !_.isArray(models);
      models = singular ? [models] : _.clone(models);
      // 移除成员
      var removed = this._removeModels(models, options);
      // 如果 remove 操作非静默，并且的确移除了成员，
      // 触发 update 事件。
      if (!options.silent && removed) this.trigger('update', this, options);
      // 返回被移除的成员（们）。
      return singular ? removed[0] : removed;
    },

    // Update a collection by `set`-ing a new list of models, adding new ones,
    // removing models that are no longer present, and merging models that
    // already exist in the collection, as necessary. Similar to **Model#set**,
    // the core operation for updating the data contained by the collection.
    // 
    // 该方法是 collection 操作 models 的核心方法，重要性等同于 Model#set 方法。
    // 该方法用以设置一组新的成员，添加新成员，删除不再具有成员资格的成员，合并已存在的成员。
    // 
    // options:
    //  add: 如果 model 存在于 models 中但不存在于 collection 中，是否要往 collection 中添加该 model。（默认为真）
    //  remove: 如果 model 存在于 collection 中但不存在于 models 中，是否要从 collection 中删除该 model。（默认为真）
    //  merge: 如果 model 存在于 models 中同时也存在于 collection 中，是否要将二者进行合并。（默认为真）
    //  silent: 是否要触发事件（默认为真）
    //  sort: 是否要自动排序（默认为真）
    //  parse: set 操作前是否要经过 parse 方法解析，包括通过纯 Object 生成 Model 实例时，是否要调用 Model.parse 解析（默认为假）
    //  
    //  collection#set 操作的本质是，将目标 models 数组中的数据，合并到内部 models 数组中，
    //  两个数组的数据合并，涉及到求数据交集、求数据并集、是否合并数据的问题。set 操作就是实现了这三个问题的解决方法。
    //  在所有对 models 操作过程中，collection 始终保持对实例 models 的引用一致性（即从来没有更换过 models 数组的指针）
    //  
    //  set 操作中，会对根据每个新增的成员和移除的成员依次触发 add 和 remove 事件。
    //  所以虽然 set 操作可以通过 options 中 add 和 remove 的值，来实现置换整个 collection.models 内部所有成员，
    //  但你的意图是完全置换而不想逐一触发 add 或 remove 事件，那么最好使用 collection#reset 操作，该操作只会触发一个 `reset` 事件。
    //  
    //  如果 models 为 null 或 void 0，会导致 set 操作终止。
    //  但如果 parse 方法返回值为 null 或 void 0，或者 parse 方法返回的数组中包含 null 或 void 0，都会被视为一个合法成员，
    //  collection 会首先寻找该成员是否存在，如果不存在则视为新成员，使用 this.model 来构造新的实例，所以如果该 `成员` 为 null 或 void 0,
    //  新实例也会被构造出来并可能被添加到 collection（除非 model 实例在构造时未能通过合法性验证）。
    //  
    //  注意：
    //  options.parse 对 collection#set 方法有效，而对 model#set 方法无效。
    set: function(models, options) {
      // 如果 models 为 null 或 undefined，终止 set 操作。
      if (models == null) return;

      // 准备 options，默认 add: true, remove: true, merge: true。
      options = _.defaults({}, options, setOptions);
      // 如果 options.parse 为真，且 models 非 Backbone.Model 实例，
      // 则调用 this.parse 方法对 models 进行解析。
      if (options.parse && !this._isModel(models)) models = this.parse(models, options);

      // 如果 models 不是数组，则将其转换为数组。
      // 注意：
      //    此处操作其实是读取了 models 副本，而非原始 models，
      //    以避免后面对 models 的操作会影响到输入的 models。
      var singular = !_.isArray(models);
      models = singular ? [models] : models.slice();

      var at = options.at;  // 插入新成员的位置
      if (at != null) at = +at;  // 将 at 强转为数字类型
      if (at < 0) at += this.length + 1;  // 如果 at 是负数，则表示位置是倒数的，将其转换为实际位置。

      var set = [];  // 置换的成员容器
      var toAdd = [];   // 新添加的成员容器
      var toRemove = [];  // 待删除的成员容器
      var modelMap = {};  // 置换成员映射表

      var add = options.add;   // 新增标识
      var merge = options.merge;   // 合并标识
      var remove = options.remove;  // 移除标识

      var sort = false;   // 是否需要排序
      // 是否具备排序条件（必需定义了 comparator，不能指定插入位置，没有显式声明不排序）
      var sortable = this.comparator && (at == null) && options.sort !== false;  
      var sortAttr = _.isString(this.comparator) ? this.comparator : null;  // 如果 comparator 是字符串，则表示使用 model 某个属性作为排序因子

      // Turn bare objects into model references, and prevent invalid models
      // from being added.
      var model;
      // 遍历 models，处理那些需要被添加到 collection 的 model
      for (var i = 0; i < models.length; i++) {
        model = models[i];

        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        // 查找待添加 model 是否已存在于 collection 中。
        var existing = this.get(model);
        if (existing) {
          // 如果 collection 已保存有目标 model，并且待添加 model 不等于已存在 model。
          // 即待添加的是另一个模型实例或者 Object，且 merge 为真，则合并新的 model。
          if (merge && model !== existing) {
            // 如果待添加 model 为 Backbone.Model 实例，获取它的 attributes 作为 attrs。
            var attrs = this._isModel(model) ? model.attributes : model;
            // 如果 parse 为真，则需要调用 existing 的 parse 方法来解析 attrs，
            // 之后才能对 existing 进行 set 操作。
            if (options.parse) attrs = existing.parse(attrs, options);
            existing.set(attrs, options);
            // 如果具备排序条件，并且没有排序，则重新设定 sort 以标识是否需要排序。
            // 如果 existing 中作为排序的因子属性发生了变化，则需要将 sort 设置为真，表示要排序。
            if (sortable && !sort) sort = existing.hasChanged(sortAttr);
          }
          if (!modelMap[existing.cid]) {
            modelMap[existing.cid] = true;
            set.push(existing);
          }
          // 将 models 中待添加的 model 替换为 existing。
          models[i] = existing;

        // If this is a new, valid model, push it to the `toAdd` list.
        } else if (add) {
          // 如果 options.add 为真，则准备一个待处理的 model。
          model = models[i] = this._prepareModel(model, options);
          // model 只能是一个 Model 实例或者 false，
          // 如果是 false，则表示该 model 不是一个合法的 model，直接忽略。
          if (model) {
            toAdd.push(model);
            // 添加 model 与 collection 之间的引用关系
            this._addReference(model, options);
            modelMap[model.cid] = true;
            set.push(model);
          }
        }
      }

      // Remove stale models.
      // 如果 options.remove 为真，则需要移除 collection.models 中多余的 model。
      if (remove) {
        // 遍历 this.models，筛选中待移除的 model，保存在 toRemove 中
        for (i = 0; i < this.length; i++) {
          model = this.models[i];
          // 如果置换成员映射中不包含该 model，则表示它需要被移除。
          if (!modelMap[model.cid]) toRemove.push(model);
        }
        // 移除多余的 model。
        if (toRemove.length) this._removeModels(toRemove, options);
      }

      // See if sorting is needed, update `length` and splice in new models.
      // 标识成员的顺序是否发生变化，该标识主要充当是否触发 sort 事件的条件因子。
      var orderChanged = false;  
      // 是否直接置换 collection.models
      var replace = !sortable && add && remove;  
      if (set.length && replace) {
        // 如果置换的成员数量与现有成员数量不符，或者任意置换成员与现有成员位置不符，则表示需要重新排序。
        orderChanged = this.length != set.length || _.some(this.models, function(model, index) {
          return model !== set[index];
        });
        // 清空现有所有成员
        this.models.length = 0;
        // 插入置换成员
        splice(this.models, set, 0);
        // 实时维护 length 属性
        this.length = this.models.length;
      } else if (toAdd.length) {
        // 如果具备排序条件，sort 设置为 true
        if (sortable) sort = true;
        // 将新的成员插入到 this.models，如果未指定插入位置，则从最末尾插入。
        splice(this.models, toAdd, at == null ? this.length : at);
        // 实时维护 collection.length 属性
        this.length = this.models.length; 
      }

      // Silently sort the collection if appropriate.
      // 如果需要排序，则静默排序（阻止排序过程中触发 sort 事件）
      if (sort) this.sort({silent: true});

      // Unless silenced, it's time to fire all appropriate add/sort events.
      // 现在来处理一下事件的事情，
      // 如果如非静默操作，需要依次触发可能存在的 add, sort, update 事件。
      if (!options.silent) {
        for (i = 0; i < toAdd.length; i++) {
          if (at != null) options.index = at + i;
          model = toAdd[i];
          model.trigger('add', model, this, options);
        }
        if (sort || orderChanged) this.trigger('sort', this, options);
        if (toAdd.length || toRemove.length) this.trigger('update', this, options);
      }

      // Return the added (or merged) model (or models).
      // 返回单个 model 或 models
      return singular ? models[0] : models;
    },

    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any granular `add` or `remove` events. Fires `reset` when finished.
    // Useful for bulk operations and optimizations.
    // 使用 reset 操作替代 set 操作来重置整个 collection.models，避免触发 add 或 remove 事件，
    // 只有一个 `reset` 事件。
    // 注意：
    //  reset 操作会简单地重新生成一个空数组，并将该数组指针赋值给 collection.models，
    //  而之前的 collection.models 会保留在 options.previousModels 作为参数传递给 reset 事件。
    // 
    // reset 与 set 不同之处在于，set 操作维持 collection.models 指针不变，而 reset 会更换 collection.models 指针。
    reset: function(models, options) {
      options = options ? _.clone(options) : {};
      // 遍历现有成员，逐一销毁成员与集合之间的引用关系
      for (var i = 0; i < this.models.length; i++) {
        this._removeReference(this.models[i], options);
      }
      // 保留之前的 models 引用
      options.previousModels = this.models;
      // 重置内部状态（包括更换 this.models）
      this._reset();
      // 调用 add 操作添加成员（add 操作内部是调用 set 操作）
      models = this.add(models, _.extend({silent: true}, options));
      // 触发 reset 事件
      if (!options.silent) this.trigger('reset', this, options);
      return models;
    },

    // Add a model to the end of the collection.
    // 其实 push 等同于 add，你也可以在 options 中指定 at 作为插入位置。
    // 而且 model 可以是单个也可以是多个。
    push: function(model, options) {
      return this.add(model, _.extend({at: this.length}, options));
    },

    // Remove a model from the end of the collection.
    // 移除最后一个成员。
    pop: function(options) {
      var model = this.at(this.length - 1);
      return this.remove(model, options);
    },

    // Add a model to the beginning of the collection.
    // 在内部 models 数组头部追加成员。
    // 等同于 add 操作，可以通过 options.at 参数修改 unshift 行为
    unshift: function(model, options) {
      return this.add(model, _.extend({at: 0}, options));
    },

    // Remove a model from the beginning of the collection.
    // 移除第一个成员
    shift: function(options) {
      var model = this.at(0);
      return this.remove(model, options);
    },

    // Slice out a sub-array of models from the collection.
    // 对 this.models 进行切片操作。
    slice: function() {
      return slice.apply(this.models, arguments);
    },

    // Get a model from the set by id.
    // 查找成员，obj 可以是一个 id 值，
    // 或者是一个包含 collection.model.prototype.idAttribute 属性的对象，
    // 或者是一个 model 实例。
    // collection 首先尝试使用 id 查找，然后使用 cid 查找。
    get: function(obj) {
      if (obj == null) return void 0;
      var id = this.modelId(this._isModel(obj) ? obj.attributes : obj);
      return this._byId[obj] || this._byId[id] || this._byId[obj.cid];
    },

    // Get the model at the given index.
    // 获取指定位置的成员，如果 at 为负数，表示倒数位置。
    at: function(index) {
      if (index < 0) index += this.length;
      return this.models[index];
    },

    // Return models with matching attributes. Useful for simple cases of
    // `filter`.
    // 查找成员
    where: function(attrs, first) {
      return this[first ? 'find' : 'filter'](attrs);
    },

    // Return the first model with matching attributes. Useful for simple cases
    // of `find`.
    // 查找成员
    findWhere: function(attrs) {
      return this.where(attrs, true);
    },

    // Force the collection to re-sort itself. You don't need to call this under
    // normal circumstances, as the set will maintain sort order as each item
    // is added.
    // 
    // 强制对 collection 成员进行排序，但如果没有声明 comparator，则抛出异常。
    sort: function(options) {
      var comparator = this.comparator;
      if (!comparator) throw new Error('Cannot sort a set without a comparator');
      options || (options = {});

      // length 变量记录 comparator 长度，主要意图是记录 comparator 作为函数时，期待参数的个数。
      var length = comparator.length;
      if (_.isFunction(comparator)) comparator = _.bind(comparator, this);

      // Run sort based on type of `comparator`.
      // 如果 comparator 是一个接受单个参数的函数，或者字符串，
      // 则使用 sortBy 进行（升序）排序，否则对 models 进行原生数组排序。
      if (length === 1 || _.isString(comparator)) {
        this.models = this.sortBy(comparator);
      } else {
        this.models.sort(comparator);
      }
      // 如果 sort 为非静默操作，则触发 sort 事件
      if (!options.silent) this.trigger('sort', this, options);
      return this;
    },

    // Pluck an attribute from each model in the collection.
    // 获取每个成员指定的 attribute。
    // 注意：这里使用 get 方法获取属性，而不是直接使用 _.pluck(this.toJSON(), attr);
    // 这样做避免了直接读取 model.attributes，如果 model 的 get 方法被改写了，也可以正确返回相应的值。
    pluck: function(attr) {
      return _.invoke(this.models, 'get', attr);
    },

    // Fetch the default set of models for this collection, resetting the
    // collection when they arrive. If `reset: true` is passed, the response
    // data will be passed through the `reset` method instead of `set`.
    // 
    // 与 Model#fetch 方法类似，如果 options.reset 为真，则使用 collection.reset 处理远端响应，
    // 否则使用 collection.set 处理远端响应。
    fetch: function(options) {
      options = _.extend({parse: true}, options);
      var success = options.success;
      var collection = this;
      options.success = function(resp) {
        var method = options.reset ? 'reset' : 'set';
        collection[method](resp, options);
        if (success) success.call(options.context, collection, resp, options);
        collection.trigger('sync', collection, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Create a new instance of a model in this collection. Add the model to the
    // collection immediately, unless `wait: true` is passed, in which case we
    // wait for the server to agree.
    // 通过 Model#save 方法实现的创建 model。
    create: function(model, options) {
      options = options ? _.clone(options) : {};
      var wait = options.wait;
      // 准备 model，如果准备 model 失败，则直接终止 create 操作，并返回 false。
      model = this._prepareModel(model, options);
      if (!model) return false;
      // 如果不等待服务器响应，则直接添加 model 到 collection.models。
      // 这意味着，无论 model 是否 validate 与否，它都会被添加到 collection 中。
      // 因为 model 实例化过程中，无论 validate 成功失败，都不能阻止 model 构造完成。
      // 而等待服务器响应，在 model.save 过程中，可以对 attributes 进行合法性验证，
      // 从而阻止 options.success 被调用，也就阻止了非法的 model 被添加到 collection 中。
      if (!wait) this.add(model, options);
      // 否则等到服务器响应成功后再将 model 添加到 collection
      var collection = this;
      var success = options.success;
      options.success = function(model, resp, callbackOpts) {
        if (wait) collection.add(model, callbackOpts);
        if (success) success.call(callbackOpts.context, model, resp, callbackOpts);
      };
      // 通过 model.save 方法实现 create，即 colleciton 本身是不负责真正的 model 数据同步。
      model.save(null, options);
      return model;
    },

    // **parse** converts a response into a list of models to be added to the
    // collection. The default implementation is just to pass it through.
    // 
    // 本方法将远端响应转换为一个列表（待添加成员列表）或者是一个成员对象。
    // parse 返回任何对象（包括 null, undefined），如果不是数组，都会被转换为数组，
    // 然后被 collection 用作查找已存在成员的因子，或者作为 this.model 构造函数的 attributes 参数。
    parse: function(resp, options) {
      return resp;
    },

    // Create a new collection with an identical list of models as this one.
    clone: function() {
      return new this.constructor(this.models, {
        model: this.model,
        comparator: this.comparator
      });
    },

    // Define how to uniquely identify models in the collection.
    // 
    // 该方法主要用于让 collection 给每个成员生成一个唯一标识。
    // collection 内部需要判定成员身份的操作都需要调用该方法。
    modelId: function (attrs) {
      return attrs[this.model.prototype.idAttribute || 'id'];
    },

    // 私有方法，重置 collection 内部状态（主要是 collection 的 length, models, _byId）。
    // 只有在 collection 进行初始化或 reset 操作时才调用该方法。
    _reset: function() {
      // Collection 是实时维护 length 属性，
      // 而不是通过 this.models.length 求值来获取成员长度。
      this.length = 0;
      this.models = [];
      this._byId  = {};
    },

    // Prepare a hash of attributes (or other model) to be added to this
    // collection.
    // 
    // 
    _prepareModel: function(attrs, options) {
      // 如果 attrs 是一个 Backbone.Model 实例，且该模型未属于其他 collection，则为其添加 collection 属性。
      // 这意味着一个 model 不能同时关联到两个 collection。
      if (this._isModel(attrs)) {
        if (!attrs.collection) attrs.collection = this;
        return attrs;
      }
      // 如果 attrs 不是 Backbone.Model 实例，
      // 则使用 this.model 作为构造函数，构造一个 Backbone.Model 实例。
      options = options ? _.clone(options) : {};
      options.collection = this;
      var model = new this.model(attrs, options);
      // 如果构造 model 实例过程中，没有发生数据验证失败，
      // 则表示新构造的 model 是一个合法的 model，直接返回该 model。
      // 否则在 collection 触发 invalid 事件，并返回 false。
      if (!model.validationError) return model;
      this.trigger('invalid', this, model.validationError, options);
      return false;
    },

    // Internal method called by both remove and set.
    // 
    // 私有方法，在 remove 和 set 操作中调用，用以移除成员。
    _removeModels: function(models, options) {
      // 回收被移除成员的容器
      var removed = [];

      // 遍历移除条件对象 models
      for (var i = 0; i < models.length; i++) {
        // 查找待移除成员
        var model = this.get(models[i]);
        // 如未找到则进行下一轮循环
        if (!model) continue;

        // 查找待移除成员的位置，并从 this.models 中将其移除
        var index = this.indexOf(model);
        this.models.splice(index, 1);
        // 将 collection 的 length 属性减一
        this.length--;

        // 如果 remove 操作非静默，则触发 remove 事件。
        // 在 options 中记录被移除成员的位置。
        if (!options.silent) {
          options.index = index;
          model.trigger('remove', model, this, options);
        }

        // 在回收容器中保存被移除成员
        removed.push(model);
        // 销毁被移除成员与 collection 之间的引用关系
        this._removeReference(model, options);
      }
      // 返回 false 表示没有任何成员被移除，否则返回所有被移除成员的集合
      return removed.length ? removed : false;
    },

    // Method for checking whether an object should be considered a model for
    // the purposes of adding to the collection.
    // 
    // 私有方法，检查 model 是否是 Backbone.Model 实例
    _isModel: function (model) {
      return model instanceof Model;
    },

    // Internal method to create a model's ties to a collection.
    // 私有方法，添加成员与集合之间的引用关系。
    _addReference: function(model, options) {
      // 在 this._byId 中添加成员映射关系
      // 首先使用成员的 cid 添加映射，
      // 然后通过 modelId 对成员求值，添加映射关系。
      // 也就是说，通常 collection 会保存对成员的两个引用关系，
      // 一个是通过 cid，另一个是通过 idAttribute。
      this._byId[model.cid] = model;
      var id = this.modelId(model.attributes);
      if (id != null) this._byId[id] = model;
      // 为 model 添加 all 事件回调。
      // 这里是通过成员的 on 方法添加回调，而不是 listenTo 成员，
      // 因此如果成员执行 model.off('all')，那么成员的任何事件都不会再转发到 collection。
      // 很难说此处使用 listenTo 或 on 的优劣，但使用 on，则将事件主动权交到了成员手中。
      model.on('all', this._onModelEvent, this);
    },

    // Internal method to sever a model's ties to a collection.
    // 
    // 私有方法，用以销毁成员与集合之间的引用关系。
    _removeReference: function(model, options) {
      // 依次删除使用 cid 与 idAttribute 对成员进行引用的关系
      delete this._byId[model.cid];
      var id = this.modelId(model.attributes);
      if (id != null) delete this._byId[id];
      // 销毁 model 的 collection 属性
      if (this === model.collection) delete model.collection;
      // 从 model 的 all 事件回调队列中，移除与本 collection 相关的回调函数。
      model.off('all', this._onModelEvent, this);
    },

    // Internal method called every time a model in the set fires an event.
    // Sets need to update their indexes when models change ids. All other
    // events simply proxy through. "add" and "remove" events that originate
    // in other collections are ignored.
    // 
    // 响应成员的 all 事件
    _onModelEvent: function(event, model, collection, options) {
      // add 和 remove 是来自 collection 自身，因此不再转发该两个事件。
      if ((event === 'add' || event === 'remove') && collection !== this) return;
      // 当成员发生 destroy 事件时，从 collection 移除该成员。
      if (event === 'destroy') this.remove(model, options);
      if (event === 'change') {
        // 当成员发生 change 事件时，意味着成员的 id 属性可能发生变化，
        // 所以需要在 collection 中重新检视成员的 idAttribute 引用关系。
        var prevId = this.modelId(model.previousAttributes());
        var id = this.modelId(model.attributes);
        if (prevId !== id) {
          if (prevId != null) delete this._byId[prevId];
          if (id != null) this._byId[id] = model;
        }
      }
      // 转发成员事件
      this.trigger.apply(this, arguments);
    }

  });

  // Underscore methods that we want to implement on the Collection.
  // 90% of the core usefulness of Backbone Collections is actually implemented
  // right here:
  var collectionMethods = { forEach: 3, each: 3, map: 3, collect: 3, reduce: 4,
      foldl: 4, inject: 4, reduceRight: 4, foldr: 4, find: 3, detect: 3, filter: 3,
      select: 3, reject: 3, every: 3, all: 3, some: 3, any: 3, include: 3, includes: 3,
      contains: 3, invoke: 0, max: 3, min: 3, toArray: 1, size: 1, first: 3,
      head: 3, take: 3, initial: 3, rest: 3, tail: 3, drop: 3, last: 3,
      without: 0, difference: 0, indexOf: 3, shuffle: 1, lastIndexOf: 3,
      isEmpty: 1, chain: 1, sample: 3, partition: 3, groupBy: 3, countBy: 3,
      sortBy: 3, indexBy: 3};

  // Mix in each Underscore method as a proxy to `Collection#models`.
  addUnderscoreMethods(Collection, collectionMethods, 'models');

  // Backbone.View
  // -------------

  // Backbone Views are almost more convention than they are actual code. A View
  // is simply a JavaScript object that represents a logical chunk of UI in the
  // DOM. This might be a single item, an entire list, a sidebar or panel, or
  // even the surrounding frame which wraps your whole app. Defining a chunk of
  // UI as a **View** allows you to define your DOM events declaratively, without
  // having to worry about render order ... and makes it easy for the view to
  // react to specific changes in the state of your models.

  // Creating a Backbone.View creates its initial element outside of the DOM,
  // if an existing element is not provided...
  // 
  // 视图构造函数
  var View = Backbone.View = function(options) {
    // 生成唯一标识
    this.cid = _.uniqueId('view');
    // 绑定实例属性
    _.extend(this, _.pick(options, viewOptions));
    // 创建根节点
    this._ensureElement();
    this.initialize.apply(this, arguments);
  };

  // Cached regex to split keys for `delegate`.
  var delegateEventSplitter = /^(\S+)\s*(.*)$/;

  // List of view options to be set as properties.
  var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

  // Set up all inheritable **Backbone.View** properties and methods.
  _.extend(View.prototype, Events, {

    // The default `tagName` of a View's element is `"div"`.
    tagName: 'div',

    // jQuery delegate for element lookup, scoped to DOM elements within the
    // current view. This should be preferred to global lookups where possible.
    // 查询本视图作用域中的元素
    $: function(selector) {
      return this.$el.find(selector);
    },

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // **render** is the core function that your view should override, in order
    // to populate its element (`this.el`), with the appropriate HTML. The
    // convention is for **render** to always return `this`.
    render: function() {
      return this;
    },

    // Remove this view by taking the element out of the DOM, and removing any
    // applicable Backbone.Events listeners.
    // 移除根节点，销毁所有监听事件。
    remove: function() {
      this._removeElement();
      this.stopListening();
      return this;
    },

    // Remove this view's element from the document and all event listeners
    // attached to it. Exposed for subclasses using an alternative DOM
    // manipulation API.
    // 私有方法，移除根节点。
    _removeElement: function() {
      this.$el.remove();
    },

    // Change the view's element (`this.el` property) and re-delegate the
    // view's events on the new element.
    // 设置根节点元素。包括解绑之前节点委托事件，更换根节点，重新委托事件。
    setElement: function(element) {
      this.undelegateEvents();
      this._setElement(element);
      this.delegateEvents();
      return this;
    },

    // Creates the `this.el` and `this.$el` references for this view using the
    // given `el`. `el` can be a CSS selector or an HTML string, a jQuery
    // context or an element. Subclasses can override this to utilize an
    // alternative DOM manipulation API and are only required to set the
    // `this.el` property.
    // 私有方法，设置根节点。
    // 参数 el 可以是一个 DocumentElement，或者是一个 jQuery 实例。
    _setElement: function(el) {
      this.$el = el instanceof Backbone.$ ? el : Backbone.$(el);
      this.el = this.$el[0];
    },

    // Set callbacks, where `this.events` is a hash of
    //
    // *{"event selector": "callback"}*
    //
    //     {
    //       'mousedown .title':  'edit',
    //       'click .button':     'save',
    //       'click .open':       function(e) { ... }
    //     }
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    // Uses event delegation for efficiency.
    // Omitting the selector binds the event to `this.el`.
    // 委托根节点事件，缺省使用 this.events 作为委托事件。
    delegateEvents: function(events) {
      events || (events = _.result(this, 'events'));
      if (!events) return this;
      this.undelegateEvents();
      for (var key in events) {
        var method = events[key];
        if (!_.isFunction(method)) method = this[method];
        if (!method) continue;
        var match = key.match(delegateEventSplitter);
        this.delegate(match[1], match[2], _.bind(method, this));
      }
      return this;
    },

    // Add a single event listener to the view's element (or a child element
    // using `selector`). This only works for delegate-able events: not `focus`,
    // `blur`, and not `change`, `submit`, and `reset` in Internet Explorer.
    // 委托事件给视图根节点
    delegate: function(eventName, selector, listener) {
      this.$el.on(eventName + '.delegateEvents' + this.cid, selector, listener);
      return this;
    },

    // Clears all callbacks previously bound to the view by `delegateEvents`.
    // You usually don't need to use this, but may wish to if you have multiple
    // Backbone views attached to the same DOM element.
    // 清空根节点所有委托事件
    undelegateEvents: function() {
      if (this.$el) this.$el.off('.delegateEvents' + this.cid);
      return this;
    },

    // A finer-grained `undelegateEvents` for removing a single delegated event.
    // `selector` and `listener` are both optional.
    // 利用 jQuery 清除委托事件
    undelegate: function(eventName, selector, listener) {
      this.$el.off(eventName + '.delegateEvents' + this.cid, selector, listener);
      return this;
    },

    // Produces a DOM element to be assigned to your view. Exposed for
    // subclasses using an alternative DOM manipulation API.
    // 创建 DOM 元素（作为根节点使用）
    _createElement: function(tagName) {
      return document.createElement(tagName);
    },

    // Ensure that the View has a DOM element to render into.
    // If `this.el` is a string, pass it through `$()`, take the first
    // matching element, and re-assign it to `el`. Otherwise, create
    // an element from the `id`, `className` and `tagName` properties.
    // 
    // 创建根节点。
    _ensureElement: function() {
      // 如果没有给定根节点，则自动生成一个根节点。
      if (!this.el) {
        var attrs = _.extend({}, _.result(this, 'attributes'));
        // 添加根节点 ID
        if (this.id) attrs.id = _.result(this, 'id');
        // 添加根节点类
        if (this.className) attrs['class'] = _.result(this, 'className');
        // 创建视图根节点
        this.setElement(this._createElement(_.result(this, 'tagName')));
        // 设置根节点 CSS 属性
        this._setAttributes(attrs);
      } else {
        // 使用给定的根节点（Element 或 jQuery 实例）创建视图根节点。
        this.setElement(_.result(this, 'el'));
      }
    },

    // Set attributes from a hash on this view's element.  Exposed for
    // subclasses using an alternative DOM manipulation API.
    // 设置根节点 CSS 属性
    _setAttributes: function(attributes) {
      this.$el.attr(attributes);
    }

  });

  // Backbone.sync
  // -------------

  // Override this function to change the manner in which Backbone persists
  // models to the server. You will be passed the type of request, and the
  // model in question. By default, makes a RESTful Ajax request
  // to the model's `url()`. Some possible customizations could be:
  //
  // * Use `setTimeout` to batch rapid-fire updates into a single request.
  // * Send up the models as XML instead of JSON.
  // * Persist models via WebSockets instead of Ajax.
  //
  // Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
  // as `POST`, with a `_method` parameter containing the true HTTP method,
  // as well as all requests with the body as `application/x-www-form-urlencoded`
  // instead of `application/json` with the model in a param named `model`.
  // Useful when interfacing with server-side languages like **PHP** that make
  // it difficult to read the body of `PUT` requests.
  // 
  // 如果启用 `Backbone.emulatedHTTP` ，那么 Backbone 会将 `PUT` 和 `DELETE` 请求改为 `POST` 请求，
  // 同时增加一个 `_method` 参数用以记录原本的请求方法。 
  Backbone.sync = function(method, model, options) {


    // sync 函数参数 method 取值范围为：create, read, update, delete, patch;
    // 分别映射到 HTTP 请求方法：POST, GET, PUT, DELETE, PATCH
    // 这里是将 sync 的 method 转换为 HTTP 请求方法名。
    var type = methodMap[method];

    // Default options, unless specified.
    _.defaults(options || (options = {}), {
      emulateHTTP: Backbone.emulateHTTP,
      emulateJSON: Backbone.emulateJSON
    });

    // 默认请求 JSON 数据。
    // 局部变量 params 表示最后 ajax 请求参数
    var params = {type: type, dataType: 'json'};

    // 检查是否输入 URL 或者 model 是否自带 URL
    if (!options.url) {
      params.url = _.result(model, 'url') || urlError();
    }

    // Ensure that we have the appropriate request data.
    // 如果 options 未给定 data 字段（即 model.fetch(options) 中的 options）
    // 并且同步的方法是写操作，那么默认的 xhr 请求中 contentType 应为 json。
    // 提交的 data 优先从 options.attrs 读取，其次读取 model.toJSON()。
    if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
      params.contentType = 'application/json';
      params.data = JSON.stringify(options.attrs || model.toJSON(options));
    }

    // 如果设置了 Backbone.emulateJSON 为真，则使用 application/x-www-form-urlencoded 格式提交数据。
    // 注意：
    //  这里并不是将 data 直接编码成 HTML-form 格式，而是将整个 data 封装在 model 字段中提交。
    //  如果不这样做，当 model 为 collection 时，实际的 data 是一个数组，不适宜作为 form 提交。
    if (options.emulateJSON) {
      params.contentType = 'application/x-www-form-urlencoded';
      params.data = params.data ? {model: params.data} : {};
    }

    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    // 如果设置 Backbone.emulateHTTP 为真，且 sync 为写操作，
    // 则统一使用 POST 方法请求，并且将原始请求方法保存在 data._method 字段中。
    // 同时增加 xhr 请求头 X-HTTP-Method-Override。
    if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
      params.type = 'POST';
      if (options.emulateJSON) params.data._method = type;
      var beforeSend = options.beforeSend;
      options.beforeSend = function(xhr) {
        xhr.setRequestHeader('X-HTTP-Method-Override', type);
        if (beforeSend) return beforeSend.apply(this, arguments);
      };
    }

    // Don't process data on a non-GET request.
    // jQeury 的 ajax 方法，如果提交的 data 为非字符串对象，会被默认转换为 query string。
    // 以匹配默认的 application/x-www-form-urlencode 类型文档。
    // 因此对于非 GET 且未要求 emulateJSON 的请求，设置 processData 为否以阻止 jQuery 这一默认行为。
    if (params.type !== 'GET' && !options.emulateJSON) {
      params.processData = false;
    }

    // 重新封装 options 中的 error，将 textStatus 和 errorThrown 记录到 options 中。
    var error = options.error;
    options.error = function(xhr, textStatus, errorThrown) {
      options.textStatus = textStatus;
      options.errorThrown = errorThrown;
      if (error) error.call(options.context, xhr, textStatus, errorThrown);
    };

    // 使用 Backbone.ajax 发起 xhr 请求，并且将 xhr 保存在 options 中。
    var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
    // 发起请求后立即出发 request 事件，告知第三方已发起了一次 xhr 请求。
    model.trigger('request', model, xhr, options);
    return xhr;
  };

  // 默认的 Backbone.sync 中 method 与 http 请求的映射关系。
  // 为什么要自定义一套 Backbone.sync 的方法名而不直接使用 HTTP 请求方法名？
  // 因为这样可以将 Backbone 的同步操作与 HTTP 请求分离开，
  // 因为你也可以通过其他渠道来实现数据同步，例如通过改写 sync 方法来与 local storage 同步数据。
  var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'patch':  'PATCH',
    'delete': 'DELETE',
    'read':   'GET'
  };

  // Set the default implementation of `Backbone.ajax` to proxy through to `$`.
  // Override this if you'd like to use a different library.
  // 默认使用 jQuery.ajax 方法实现数据同步，如果使用其他库，可以改写此同步方法。
  Backbone.ajax = function() {
    return Backbone.$.ajax.apply(Backbone.$, arguments);
  };

  // Backbone.Router - 路由
  // -------------------------

  // Routers map faux-URLs to actions, and fire events when routes are
  // matched. Creating a new one sets its `routes` hash, if not set statically.
  // 
  // Router 构造函数
  var Router = Backbone.Router = function(options) {
    options || (options = {});
    if (options.routes) this.routes = options.routes;
    this._bindRoutes();
    this.initialize.apply(this, arguments);
  };

  // Cached regular expressions for matching named param parts and splatted
  // parts of route strings.
  var optionalParam = /\((.*?)\)/g;
  var namedParam    = /(\(\?)?:\w+/g;
  var splatParam    = /\*\w+/g;
  var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

  // Set up all inheritable **Backbone.Router** properties and methods.
  _.extend(Router.prototype, Events, {

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Manually bind a single named route to a callback. For example:
    //
    //     this.route('search/:query/p:num', 'search', function(query, num) {
    //       ...
    //     });
    //
    // 手动添加路由
    // @param route: 字符串或正则表达式，表示路由路径。
    // @param name: 路由名称，表示路由器处理路由的方法（this[name]），或者 name 就是响应函数（相当于 callback）。
    // @param callback: 如果没有给定 callback，则使用 this[name]，否则使用 callback 作为路由响应函数。 
    route: function(route, name, callback) {
      // 如果 route 不是正则表达式，则将其转换为正则表达式。
      if (!_.isRegExp(route)) route = this._routeToRegExp(route);
      if (_.isFunction(name)) {
        callback = name;
        name = '';
      }
      if (!callback) callback = this[name];
      var router = this;
      // 在 Backbone.history 中添加路由（正则表达式）
      Backbone.history.route(route, function(fragment) {
        var args = router._extractParameters(route, fragment);
        // 如果 router.execute 方法返回 false，则不触发任何事件。
        // 默认 router.execute 方法返回值固定为 void 0，因此一定会触发事件。
        // 如果要阻止触发事件，只能是重写 router.execute 方法。
        if (router.execute(callback, args, name) !== false) {
          // 是的，如果 route 第二个参数为函数，那么 name 就是空字符串。
          // 因此触发的事件是 'route:'。
          // router 触发了两个看似相同的事件，一个是 `route:name`，另一个是 `router`。
          router.trigger.apply(router, ['route:' + name].concat(args));
          router.trigger('route', name, args);
          Backbone.history.trigger('route', router, name, args);
        }
      });
      return this;
    },

    // Execute a route handler with the provided parameters.  This is an
    // excellent place to do pre-route setup or post-route cleanup.
    // 执行路由回调函数。
    execute: function(callback, args, name) {
      if (callback) callback.apply(this, args);
    },

    // Simple proxy to `Backbone.history` to save a fragment into the history.
    navigate: function(fragment, options) {
      Backbone.history.navigate(fragment, options);
      return this;
    },

    // Bind all defined routes to `Backbone.history`. We have to reverse the
    // order of the routes here to support behavior where the most general
    // routes can be defined at the bottom of the route map.
    // 将所有路由绑定到 `Backbone.history`。
    _bindRoutes: function() {
      // 如果未定义路由，则终止绑定操作。
      if (!this.routes) return;
      // 对 this.routes 求值。
      this.routes = _.result(this, 'routes');
      var route, routes = _.keys(this.routes);
      // 遍历 this.routes，逐一添加路由
      while ((route = routes.pop()) != null) {
        this.route(route, this.routes[route]);
      }
    },

    // Convert a route string into a regular expression, suitable for matching
    // against the current location hash.
    _routeToRegExp: function(route) {
      route = route.replace(escapeRegExp, '\\$&')
                   .replace(optionalParam, '(?:$1)?')
                   .replace(namedParam, function(match, optional) {
                     return optional ? match : '([^/?]+)';
                   })
                   .replace(splatParam, '([^?]*?)');
      return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
    },

    // Given a route, and a URL fragment that it matches, return the array of
    // extracted decoded parameters. Empty or unmatched parameters will be
    // treated as `null` to normalize cross-browser behavior.
    // 
    // 从路由路径中提取参数。
    // @param route: 路由正则表达式
    // @param fragment: 被 Backbone.History 确认匹配的 URL 路径。
    _extractParameters: function(route, fragment) {
      var params = route.exec(fragment).slice(1);
      return _.map(params, function(param, i) {
        // Don't decode the search params.
        if (i === params.length - 1) return param || null;
        return param ? decodeURIComponent(param) : null;
      });
    }

  });

  // Backbone.History
  // ----------------

  // Handles cross-browser history management, based on either
  // [pushState](http://diveintohtml5.info/history.html) and real URLs, or
  // [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
  // and URL fragments. If the browser supports neither (old IE, natch),
  // falls back to polling.
  // 
  // 使用 HTML5 History API 或者 onhashchange 事件实现历史记录操作。
  var History = Backbone.History = function() {
    this.handlers = [];
    this.checkUrl = _.bind(this.checkUrl, this);

    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== 'undefined') {
      this.location = window.location;
      this.history = window.history;
    }
  };

  // Cached regex for stripping a leading hash/slash and trailing space.
  // 正则表达式：用以删除字符串头部的 `#` 或 `/` 字符，以及尾部的空白。
  // 例如：'/abc/     '.replace(routeStripper, '') 得到 'abc/'
  var routeStripper = /^[#\/]|\s+$/g;

  // Cached regex for stripping leading and trailing slashes.
  // 正则表达式：删除字符串头尾的 `/` 字符（确保字符串不以 `/` 开头或结尾）
  var rootStripper = /^\/+|\/+$/g;

  // Cached regex for stripping urls of hash.
  // 正则表达式：删除字符串中 '#' 字符（包含井字符）后所有字符。
  var pathStripper = /#.*$/;

  // Has the history handling already been started?
  History.started = false;

  // Set up all inheritable **Backbone.History** properties and methods.
  _.extend(History.prototype, Events, {

    // The default interval to poll for hash changes, if necessary, is
    // twenty times a second.
    interval: 50,

    // Are we at the app root?
    atRoot: function() {
      var path = this.location.pathname.replace(/[^\/]$/, '$&/');
      return path === this.root && !this.getSearch();
    },

    // Does the pathname match the root?
    matchRoot: function() {
      var path = this.decodeFragment(this.location.pathname);
      var root = path.slice(0, this.root.length - 1) + '/';
      return root === this.root;
    },

    // Unicode characters in `location.pathname` are percent encoded so they're
    // decoded for comparison. `%25` should not be decoded since it may be part
    // of an encoded parameter.
    // 将 fragment 从百分号编码解码成 UNICODE，但不解码 `%25`，因为它有可能是被编码的参数。
    decodeFragment: function(fragment) {
      return decodeURI(fragment.replace(/%25/g, '%2525'));
    },

    // In IE6, the hash fragment and search params are incorrect if the
    // fragment contains `?`.
    getSearch: function() {
      var match = this.location.href.replace(/#.*/, '').match(/\?.+/);
      return match ? match[0] : '';
    },

    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash: function(window) {
      var match = (window || this).location.href.match(/#(.*)$/);
      return match ? match[1] : '';
    },

    // Get the pathname and search params, without the root.
    getPath: function() {
      var path = this.decodeFragment(
        this.location.pathname + this.getSearch()
      ).slice(this.root.length - 1);
      return path.charAt(0) === '/' ? path.slice(1) : path;
    },

    // Get the cross-browser normalized URL fragment from the path or hash.
    getFragment: function(fragment) {
      if (fragment == null) {
        if (this._usePushState || !this._wantsHashChange) {
          fragment = this.getPath();
        } else {
          fragment = this.getHash();
        }
      }
      return fragment.replace(routeStripper, '');
    },

    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    // 启动 History 路由，如果当前 URL 匹配到了某条路由，返回 true，否则返回 false。
    start: function(options) {
      // History 是个单例应用，不允许重复启动。
      if (History.started) throw new Error('Backbone.history has already been started');
      History.started = true;

      // Figure out the initial configuration. Do we need an iframe?
      // Is pushState desired ... is it available?
      this.options          = _.extend({root: '/'}, this.options, options);
      this.root             = this.options.root;
      this._wantsHashChange = this.options.hashChange !== false;
      this._hasHashChange   = 'onhashchange' in window && (document.documentMode === void 0 || document.documentMode > 7);
      this._useHashChange   = this._wantsHashChange && this._hasHashChange;
      this._wantsPushState  = !!this.options.pushState;
      this._hasPushState    = !!(this.history && this.history.pushState);
      this._usePushState    = this._wantsPushState && this._hasPushState;
      this.fragment         = this.getFragment();

      // Normalize root to always include a leading and trailing slash.
      this.root = ('/' + this.root + '/').replace(rootStripper, '/');

      // Transition from hashChange to pushState or vice versa if both are
      // requested.
      if (this._wantsHashChange && this._wantsPushState) {

        // If we've started off with a route from a `pushState`-enabled
        // browser, but we're currently in a browser that doesn't support it...
        if (!this._hasPushState && !this.atRoot()) {
          var root = this.root.slice(0, -1) || '/';
          this.location.replace(root + '#' + this.getPath());
          // Return immediately as browser will do redirect to new url
          return true;

        // Or if we've started out with a hash-based route, but we're currently
        // in a browser where it could be `pushState`-based instead...
        } else if (this._hasPushState && this.atRoot()) {
          this.navigate(this.getHash(), {replace: true});
        }

      }

      // Proxy an iframe to handle location events if the browser doesn't
      // support the `hashchange` event, HTML5 history, or the user wants
      // `hashChange` but not `pushState`.
      if (!this._hasHashChange && this._wantsHashChange && !this._usePushState) {
        this.iframe = document.createElement('iframe');
        this.iframe.src = 'javascript:0';
        this.iframe.style.display = 'none';
        this.iframe.tabIndex = -1;
        var body = document.body;
        // Using `appendChild` will throw on IE < 9 if the document is not ready.
        var iWindow = body.insertBefore(this.iframe, body.firstChild).contentWindow;
        iWindow.document.open();
        iWindow.document.close();
        iWindow.location.hash = '#' + this.fragment;
      }

      // Add a cross-platform `addEventListener` shim for older browsers.
      var addEventListener = window.addEventListener || function (eventName, listener) {
        return attachEvent('on' + eventName, listener);
      };

      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._usePushState) {
        addEventListener('popstate', this.checkUrl, false);
      } else if (this._useHashChange && !this.iframe) {
        addEventListener('hashchange', this.checkUrl, false);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
      }

      if (!this.options.silent) return this.loadUrl();
    },

    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop: function() {
      // Add a cross-platform `removeEventListener` shim for older browsers.
      var removeEventListener = window.removeEventListener || function (eventName, listener) {
        return detachEvent('on' + eventName, listener);
      };

      // Remove window listeners.
      if (this._usePushState) {
        removeEventListener('popstate', this.checkUrl, false);
      } else if (this._useHashChange && !this.iframe) {
        removeEventListener('hashchange', this.checkUrl, false);
      }

      // Clean up the iframe if necessary.
      if (this.iframe) {
        document.body.removeChild(this.iframe);
        this.iframe = null;
      }

      // Some environments will throw when clearing an undefined interval.
      if (this._checkUrlInterval) clearInterval(this._checkUrlInterval);
      History.started = false;
    },

    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    route: function(route, callback) {
      this.handlers.unshift({route: route, callback: callback});
    },

    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl: function(e) {
      var current = this.getFragment();

      // If the user pressed the back button, the iframe's hash will have
      // changed and we should use that for comparison.
      if (current === this.fragment && this.iframe) {
        current = this.getHash(this.iframe.contentWindow);
      }

      if (current === this.fragment) return false;
      if (this.iframe) this.navigate(current);
      this.loadUrl();
    },

    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl: function(fragment) {
      // If the root doesn't match, no routes can match either.
      if (!this.matchRoot()) return false;
      fragment = this.fragment = this.getFragment(fragment);
      return _.some(this.handlers, function(handler) {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      });
    },

    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    navigate: function(fragment, options) {
      if (!History.started) return false;
      if (!options || options === true) options = {trigger: !!options};

      // Normalize the fragment.
      fragment = this.getFragment(fragment || '');

      // Don't include a trailing slash on the root.
      var root = this.root;
      if (fragment === '' || fragment.charAt(0) === '?') {
        root = root.slice(0, -1) || '/';
      }
      var url = root + fragment;

      // Strip the hash and decode for matching.
      fragment = this.decodeFragment(fragment.replace(pathStripper, ''));

      if (this.fragment === fragment) return;
      this.fragment = fragment;

      // If pushState is available, we use it to set the fragment as a real URL.
      if (this._usePushState) {
        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

      // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
      } else if (this._wantsHashChange) {
        this._updateHash(this.location, fragment, options.replace);
        if (this.iframe && (fragment !== this.getHash(this.iframe.contentWindow))) {
          var iWindow = this.iframe.contentWindow;

          // Opening and closing the iframe tricks IE7 and earlier to push a
          // history entry on hash-tag change.  When replace is true, we don't
          // want this.
          if (!options.replace) {
            iWindow.document.open();
            iWindow.document.close();
          }

          this._updateHash(iWindow.location, fragment, options.replace);
        }

      // If you've told us that you explicitly don't want fallback hashchange-
      // based history, then `navigate` becomes a page refresh.
      } else {
        return this.location.assign(url);
      }
      if (options.trigger) return this.loadUrl(fragment);
    },

    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    _updateHash: function(location, fragment, replace) {
      if (replace) {
        var href = location.href.replace(/(javascript:|#).*$/, '');
        location.replace(href + '#' + fragment);
      } else {
        // Some browsers require that `hash` contains a leading #.
        location.hash = '#' + fragment;
      }
    }

  });

  // Create the default Backbone.history.
  Backbone.history = new History;

  // Helpers
  // -------

  // Helper function to correctly set up the prototype chain for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  // 扩展父类函数（继承）
  var extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent` constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  };

  // Set up inheritance for the model, collection, router, view and history.
  Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;

  // Throw an error when a URL is needed, and none is supplied.
  // 异常：URL 不存在
  var urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };

  // Wrap an optional error callback with a fallback error event.
  // 封装 error 回调（在 model.fetch 方法中，ajax 的 error 回调）
  // 保证无论是否存在 options.error 回调，都会触发 model 的 error 事件。
  var wrapError = function(model, options) {
    var error = options.error;
    options.error = function(resp) {
      if (error) error.call(options.context, model, resp, options);
      model.trigger('error', model, resp, options);
    };
  };

  return Backbone;

}));
