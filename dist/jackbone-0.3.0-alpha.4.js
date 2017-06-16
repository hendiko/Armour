(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("underscore"), require("jquery"));
	else if(typeof define === 'function' && define.amd)
		define(["underscore", "jquery"], factory);
	else if(typeof exports === 'object')
		exports["Jackbone"] = factory(require("underscore"), require("jquery"));
	else
		root["Jackbone"] = factory(root["_"], root["$"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__, __WEBPACK_EXTERNAL_MODULE_5__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var _underscore = __webpack_require__(1);

	var _underscore2 = _interopRequireDefault(_underscore);

	var _attributes = __webpack_require__(2);

	var _attributes2 = _interopRequireDefault(_attributes);

	var _core = __webpack_require__(3);

	var _core2 = _interopRequireDefault(_core);

	var _controller = __webpack_require__(7);

	var _controller2 = _interopRequireDefault(_controller);

	var _events = __webpack_require__(6);

	var _events2 = _interopRequireDefault(_events);

	var _model = __webpack_require__(8);

	var _model2 = _interopRequireDefault(_model);

	var _request = __webpack_require__(9);

	var _request2 = _interopRequireDefault(_request);

	var _view = __webpack_require__(10);

	var _view2 = _interopRequireDefault(_view);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	/*
	 * @Author: laixi
	 * @Date:   2017-03-14 11:34:34
	 * @Last Modified by:   laixi
	 * @Last Modified time: 2017-06-05 22:58:01
	 */
	_core2.default.Attributes = _attributes2.default;
	_core2.default.Controller = _controller2.default;
	_core2.default.Model = _model2.default;
	_core2.default.Request = _request2.default;
	_core2.default.View = _view2.default;
	_core2.default.Collection = _core2.default.Collection.extend({
	  model: _model2.default
	});

	_underscore2.default.extend(_core2.default, _events2.default);

	_underscore2.default.each(['Model', 'View', 'Collection', 'Router', 'History'], function (klass) {
	  _underscore2.default.extend(_core2.default[klass].prototype, _events2.default);
	});

	// 扩展 Model 实例方法，增加 allChanged 和 anyChanged 方法。
	_underscore2.default.extend(_model2.default.prototype, _underscore2.default.pick(_attributes2.default, 'allChanged', 'anyChanged'));
	_core2.default.JACKBONE_VERSION = '0.3.0-alpha.4';
	// this is invalid in es6
	module.exports = _core2.default;

/***/ }),
/* 1 */
/***/ (function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	exports.__esModule = true;

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /*
	                                                                                                                                                                                                                                                                               * @Author: laixi
	                                                                                                                                                                                                                                                                               * @Date:   2017-03-22 00:06:49
	                                                                                                                                                                                                                                                                               * @Last Modified by:   Xavier Yin
	                                                                                                                                                                                                                                                                               * @Last Modified time: 2017-04-24 17:37:38
	                                                                                                                                                                                                                                                                               */


	var _underscore = __webpack_require__(1);

	var _underscore2 = _interopRequireDefault(_underscore);

	var _core = __webpack_require__(3);

	var _events = __webpack_require__(6);

	var _events2 = _interopRequireDefault(_events);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var _changedIteratee = function _changedIteratee(name) {
	  if (_underscore2.default.isString(name)) {
	    name = (0, _core.trim)(name);
	    return name ? name.split(_core.eventSplitter) : [];
	  }
	  if (!_underscore2.default.isArray(name)) return [];
	  return name;
	};

	var _changedPredicate = function _changedPredicate(key) {
	  return this.hasOwnProperty(key);
	};

	var Attributes = _underscore2.default.extend({

	  // 静态属性
	  // 当设置静态属性时，它会同时被绑定到宿主。
	  _staticAttributes: null,

	  _attributeAlias: 'attribute',

	  _listenToChangedAttributeCallback: function _listenToChangedAttributeCallback(attr, alias, event) {
	    var args = _core.slice.call(arguments, 2);
	    // to prevent events propagation
	    if (alias != void 0 && alias === event || event.indexOf(alias + ':') === 0) return;
	    this.trigger.apply(this, [this._attributeAlias + ':' + attr].concat(args));
	    this.trigger.apply(this, [this._attributeAlias, attr].concat(args));
	  },

	  _listenToChangedAttribute: function _listenToChangedAttribute(attr, value) {
	    var prev = this.previous(attr);
	    var handlers = this._listeningHandlers || (this._listeningHandlers = {});
	    var handler = handlers[attr];
	    if (handler) {
	      this.stopListening(prev, 'all', handler);
	      delete handlers[attr];
	    }
	    if ((0, _core.isTriggerable)(value)) {
	      handler = handlers[attr] = _underscore2.default.partial(this._listenToChangedAttributeCallback, attr, value._attributeAlias);
	      this.listenTo(value, 'all', handler);
	    }
	  },

	  /** 检查给定的属性名称（数组或者是空格分隔的字符串），是否全部都发生了变化。 */
	  allChanged: function allChanged(name) {
	    var changed = this.changedAttributes();
	    if (!changed) return false;
	    return _underscore2.default.every(_changedIteratee(name), _changedPredicate, changed);
	  },

	  /** 检查给定的属性名称（数组或者是空格分隔的字符串），是否至少有一个属性发生了变化。 */
	  anyChanged: function anyChanged(name) {
	    var changed = this.changedAttributes();
	    if (!changed) return false;
	    return _underscore2.default.any(_changedIteratee(name), _changedPredicate, changed);
	  },

	  // 检查 attributes 是否发生变化（diff 为假），或是否会发生变化（diff 为真）
	  changedAttributes: function changedAttributes(diff) {
	    if (!diff) return this.hasChanged() ? _underscore2.default.clone(this.changed) : false;
	    var old = this._changing ? this._previousAttributes : this._attributes || (this._attributes = {});
	    var changed = {};
	    for (var attr in diff) {
	      var val = diff[attr];
	      if (_underscore2.default.isEqual(old[attr], val)) continue;
	      changed[attr] = val;
	    }
	    return _underscore2.default.size(changed) ? changed : false;
	  },

	  // 清空 attributes
	  clear: function clear(options) {
	    var attrs = {};
	    for (var key in this._attributes) {
	      attrs[key] = void 0;
	    }return this.set(attrs, _underscore2.default.extend({}, options, {
	      unset: true
	    }));
	  },

	  // 克隆
	  clone: function clone() {
	    return new this.constructor(this._attributes);
	  },

	  // 销毁
	  destroy: function destroy() {
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
	  get: function get(attr) {
	    return this._attributes && this._attributes[attr];
	  },

	  // 判断是否有用某个 attribute
	  has: function has(attr) {
	    return this.get(attr) != null;
	  },

	  // 判断 attributes 或 attribute 是否发生变化
	  hasChanged: function hasChanged(attr) {
	    if (attr == null) return !_underscore2.default.isEmpty(this.changed);
	    return _underscore2.default.has(this.changed, attr);
	  },

	  // 读取 attribute 变化前的值
	  previous: function previous(attr) {
	    if (attr == null || !this._previousAttributes) return null;
	    return this._previousAttributes[attr];
	  },

	  // 读取变化前的 attributes
	  previousAttributes: function previousAttributes() {
	    return _underscore2.default.clone(this._previousAttributes);
	  },

	  set: function set(key, val, options) {
	    if (key == null) return this;

	    var attrs;
	    if ((typeof key === 'undefined' ? 'undefined' : _typeof(key)) === 'object') {
	      attrs = key;
	    } else {
	      (attrs = {})[key] = val;
	    }
	    options || (options = {});
	    var attributes = _underscore2.default.clone(attrs);
	    var opts = _underscore2.default.clone(options);

	    this._attributes || (this._attributes = {});

	    var unset = options.unset;
	    var silent = options.silent;
	    var changes = [];

	    var changing = this._changing;
	    this._changing = true;

	    if (!changing) {
	      this._previousAttributes = _underscore2.default.clone(this._attributes);
	      this.changed = {};
	    }

	    var current = this._attributes;
	    var changed = this.changed;
	    var prev = this._previousAttributes;

	    for (var attr in attrs) {
	      val = attrs[attr];
	      if (!_underscore2.default.isEqual(current[attr], val)) changes.push(attr);

	      if (!_underscore2.default.isEqual(prev[attr], val)) {
	        changed[attr] = val;
	      } else {
	        delete changed[attr];
	      }
	      unset ? delete current[attr] : current[attr] = val;
	    }

	    var i;
	    var props = this._staticAttributes;
	    for (i in props) {
	      // bind static attributes
	      this[props[i]] = this.get(props[i]);
	    }

	    for (i = 0; i < changes.length; i++) {
	      // listen attributes
	      this._listenToChangedAttribute(changes[i], current[changes[i]]);
	    }

	    // 同步设置 watcher 数据
	    var watchings, watching;
	    var objId = this._listenId;
	    _underscore2.default.each(this._watchers, function (watcher) {
	      watchings = watcher._watchings;
	      if (!watchings) return;
	      watching = watchings[objId];
	      var watch = watching['watch'];
	      if (watch == null) {
	        watcher.set(_underscore2.default.clone(attributes), _underscore2.default.clone(opts));
	      } else {
	        var data = _underscore2.default.reduce(watch, function (memo, destination, original) {
	          if (_underscore2.default.has(changed, original)) memo[destination] = changed[original];
	          return memo;
	        }, {});
	        watcher.set(data, _underscore2.default.clone(opts));
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
	  toJSON: function toJSON(options) {
	    return _underscore2.default.clone(this._attributes);
	  },

	  // 移除 attribute
	  unset: function unset(attr, options) {
	    return this.set(attr, void 0, _underscore2.default.extend({}, options, {
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
	  watch: function watch(obj, original, destination) {
	    if (!obj) return this;

	    if (!this._listenId) this._listenId = _underscore2.default.uniqueId('l');
	    if (!obj._listenId) obj._listenId = _underscore2.default.uniqueId('l');

	    var watchings = this._watchings || (this._watchings = {});
	    var watchers = obj._watchers || (obj._watchers = {});
	    var watching = watchings[obj._listenId] || (watchings[obj._listenId] = { obj: obj });
	    var map = (0, _core.makeMap)(original, destination);
	    watching['watch'] = map == null ? null : _underscore2.default.defaults(map, watching['watch']);
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
	  stopWatching: function stopWatching(obj, original, destination) {
	    var watchings = this._watchings;
	    if (!watchings) return this;
	    var iteration = obj ? [watchings[obj._listenId]] : _underscore2.default.values(watchings);

	    var watchee;
	    var watch;
	    var thisId = this._listenId;
	    var map = (0, _core.makeMap)(original, destination);
	    var callback = function callback(value, key) {
	      return map == null ? true : map[key] === value;
	    };
	    _underscore2.default.each(iteration, function (watching) {
	      watch = _underscore2.default.omit(watching.watch, callback);
	      if (_underscore2.default.isEmpty(watch)) {
	        watchee = watching.obj;
	        if (watchee._watchers) delete watchee._watchers[thisId];
	        if (_underscore2.default.isEmpty(watchee._watchers)) watchee._watchers = void 0;
	        delete watchings[watchee._listenId];
	      } else {
	        watching.watch = watch;
	      }
	    });
	    if (_underscore2.default.isEmpty(watchings)) this._watchings = void 0;
	    return this;
	  },

	  /** 清除所有观察者，不让其他对象观察自己 */
	  preventWatching: function preventWatching() {
	    var watchers = _underscore2.default.values(this._watchers);
	    var that = this;
	    _underscore2.default.each(watchers, function (watcher) {
	      watcher.stopWatching(that);
	    });
	    return this;
	  }

	}, _events2.default);

	// @Backbone#addMethod
	var addMethod = function addMethod(length, method, attribute) {
	  switch (length) {
	    case 1:
	      return function () {
	        return _underscore2.default[method](this[attribute]);
	      };
	    case 2:
	      return function (value) {
	        return _underscore2.default[method](this[attribute], value);
	      };
	    case 3:
	      return function (iteratee, context) {
	        return _underscore2.default[method](this[attribute], cb(iteratee, this), context);
	      };
	    case 4:
	      return function (iteratee, defaultVal, context) {
	        return _underscore2.default[method](this[attribute], cb(iteratee, this), defaultVal, context);
	      };
	    default:
	      return function () {
	        var args = _core.slice.call(arguments);
	        args.unshift(this[attribute]);
	        return _underscore2.default[method].apply(_underscore2.default, args);
	      };
	  }
	};

	var addUnderscoreMethods = function addUnderscoreMethods(proto, methods, attribute) {
	  _underscore2.default.each(methods, function (length, method) {
	    if (_underscore2.default[method]) proto[method] = addMethod(length, method, attribute);
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

	exports.default = Attributes;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	exports.__esModule = true;
	exports.extend = exports.slice = exports.eventSplitter = undefined;

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /*
	                                                                                                                                                                                                                                                                               * @Author: laixi
	                                                                                                                                                                                                                                                                               * @Date:   2017-03-14 11:36:31
	                                                                                                                                                                                                                                                                               * @Last Modified by:   Xavier Yin
	                                                                                                                                                                                                                                                                               * @Last Modified time: 2017-04-24 10:46:25
	                                                                                                                                                                                                                                                                               */


	exports.delegate = delegate;
	exports.isTriggerable = isTriggerable;
	exports.trim = trim;
	exports.isRefCycle = isRefCycle;
	exports.makeMap = makeMap;

	var _backbone = __webpack_require__(4);

	var _backbone2 = _interopRequireDefault(_backbone);

	var _underscore = __webpack_require__(1);

	var _underscore2 = _interopRequireDefault(_underscore);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	// 事件名称分隔符
	var eventSplitter = exports.eventSplitter = /\s+/;

	// 委托获取属性或执行方法。
	// 如果 attr 是 obj 的属性，则直接返回该属性值。
	// 如果 attr 是 obj 的方法，则以 obj 作为方法的上下文，args 作为方法参数求值。
	function delegate(obj, attr, args) {
	  var prop = _underscore2.default.property(attr)(obj);
	  return _underscore2.default.isFunction(prop) ? prop.apply(obj, args) : prop;
	};

	var propTrigger = _underscore2.default.property('trigger');

	// 判断给定对象是否具有触发事件的能力
	function isTriggerable(obj) {
	  return _underscore2.default.isFunction(propTrigger(obj));
	}

	var slice = exports.slice = Array.prototype.slice;

	var trimRegexp = /^\s*|\s*$/g;

	function trim(str) {
	  return str.replace(trimRegexp, '');
	}

	// 两个对象之间是否存在父子循环引用
	function isRefCycle(parent, child) {
	  if (!parent) return false;
	  if (child === parent) return true;
	  return isRefCycle(parent.parent, child);
	}

	// 转换属性观察映射关系(处理 watch 方法传参)
	function makeMap(original, destination, map) {
	  if (original == null) return map;
	  if (map === void 0) map = {};
	  var i = 0;
	  var names;
	  if (_underscore2.default.isArray(original)) {
	    for (i in original) {
	      map = makeMap(original[i], destination, map);
	    }
	  } else if ((typeof original === 'undefined' ? 'undefined' : _typeof(original)) === 'object') {
	    for (names = _underscore2.default.keys(original); i < names.length; i++) {
	      map = makeMap(names[i], original[names[i]], map);
	    }
	  } else {
	    map[original] = destination == null ? original : destination;
	  }
	  return map;
	};

	var extend = exports.extend = _backbone2.default.Model.extend;

	exports.default = _backbone2.default;

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(global) {//     Backbone.js 1.3.3

	//     (c) 2010-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	//     Backbone may be freely distributed under the MIT license.
	//     For all details and documentation:
	//     http://backbonejs.org

	(function(factory) {

	  // Establish the root object, `window` (`self`) in the browser, or `global` on the server.
	  // We use `self` instead of `window` for `WebWorker` support.
	  var root = (typeof self == 'object' && self.self === self && self) ||
	            (typeof global == 'object' && global.global === global && global);

	  // Set up Backbone appropriately for the environment. Start with AMD.
	  if (true) {
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(1), __webpack_require__(5), exports], __WEBPACK_AMD_DEFINE_RESULT__ = function(_, $, exports) {
	      // Export global even in AMD case in case this script is loaded with
	      // others that may still expect a global Backbone.
	      root.Backbone = factory(root, exports, _, $);
	    }.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

	  // Next for Node.js or CommonJS. jQuery may not be needed as a module.
	  } else if (typeof exports !== 'undefined') {
	    var _ = require('underscore'), $;
	    try { $ = require('jquery'); } catch (e) {}
	    factory(root, exports, _, $);

	  // Finally, as a browser global.
	  } else {
	    root.Backbone = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender || root.$));
	  }

	})(function(root, Backbone, _, $) {

	  // Initial Setup
	  // -------------

	  // Save the previous value of the `Backbone` variable, so that it can be
	  // restored later on, if `noConflict` is used.
	  var previousBackbone = root.Backbone;

	  // Create a local reference to a common array method we'll want to use later.
	  var slice = Array.prototype.slice;

	  // Current version of the library. Keep in sync with `package.json`.
	  Backbone.VERSION = '1.3.3';

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

	  // Backbone.Events
	  // ---------------

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
	  var eventSplitter = /\s+/;

	  // Iterates over the standard `event, callback` (as well as the fancy multiple
	  // space-separated events `"change blur", callback` and jQuery-style event
	  // maps `{event: callback}`).
	  var eventsApi = function(iteratee, events, name, callback, opts) {
	    var i = 0, names;
	    if (name && typeof name === 'object') {
	      // Handle event maps.
	      if (callback !== void 0 && 'context' in opts && opts.context === void 0) opts.context = callback;
	      for (names = _.keys(name); i < names.length ; i++) {
	        events = eventsApi(iteratee, events, names[i], name[names[i]], opts);
	      }
	    } else if (name && eventSplitter.test(name)) {
	      // Handle space-separated event names by delegating them individually.
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
	  Events.on = function(name, callback, context) {
	    return internalOn(this, name, callback, context);
	  };

	  // Guard the `listening` argument from the public API.
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
	  Events.listenTo = function(obj, name, callback) {
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

	      handlers.push({callback: callback, context: context, ctx: context || ctx, listening: listening});
	    }
	    return events;
	  };

	  // Remove one or many callbacks. If `context` is null, removes all
	  // callbacks with that function. If `callback` is null, removes all
	  // callbacks for the event. If `name` is null, removes all bound
	  // callbacks for all events.
	  Events.off = function(name, callback, context) {
	    if (!this._events) return this;
	    this._events = eventsApi(offApi, this._events, name, callback, {
	      context: context,
	      listeners: this._listeners
	    });
	    return this;
	  };

	  // Tell this object to stop listening to either specific events ... or
	  // to every object it's currently listening to.
	  Events.stopListening = function(obj, name, callback) {
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
	    return events;
	  };

	  // Bind an event to only be triggered a single time. After the first time
	  // the callback is invoked, its listener will be removed. If multiple events
	  // are passed in using the space-separated syntax, the handler will fire
	  // once for each event, not once for a combination of all events.
	  Events.once = function(name, callback, context) {
	    // Map the event into a `{event: once}` object.
	    var events = eventsApi(onceMap, {}, name, callback, _.bind(this.off, this));
	    if (typeof name === 'string' && context == null) callback = void 0;
	    return this.on(events, callback, context);
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
	  var triggerApi = function(objEvents, name, callback, args) {
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
	  Events.bind   = Events.on;
	  Events.unbind = Events.off;

	  // Allow the `Backbone` object to serve as a global event bus, for folks who
	  // want global "pubsub" in a convenient place.
	  _.extend(Backbone, Events);

	  // Backbone.Model
	  // --------------

	  // Backbone **Models** are the basic data object in the framework --
	  // frequently representing a row in a table in a database on your server.
	  // A discrete chunk of data and a bunch of useful, related methods for
	  // performing computations and transformations on that data.

	  // Create a new model with the specified attributes. A client id (`cid`)
	  // is automatically generated and assigned for you.
	  var Model = Backbone.Model = function(attributes, options) {
	    var attrs = attributes || {};
	    options || (options = {});
	    this.cid = _.uniqueId(this.cidPrefix);
	    this.attributes = {};
	    if (options.collection) this.collection = options.collection;
	    if (options.parse) attrs = this.parse(attrs, options) || {};
	    var defaults = _.result(this, 'defaults');
	    attrs = _.defaults(_.extend({}, defaults, attrs), defaults);
	    this.set(attrs, options);
	    this.changed = {};
	    this.initialize.apply(this, arguments);
	  };

	  // Attach all inheritable methods to the Model prototype.
	  _.extend(Model.prototype, Events, {

	    // A hash of attributes whose current and previous value differ.
	    changed: null,

	    // The value returned during the last failed validation.
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

	    // Return a copy of the model's `attributes` object.
	    toJSON: function(options) {
	      return _.clone(this.attributes);
	    },

	    // Proxy `Backbone.sync` by default -- but override this if you need
	    // custom syncing semantics for *this* particular model.
	    sync: function() {
	      return Backbone.sync.apply(this, arguments);
	    },

	    // Get the value of an attribute.
	    get: function(attr) {
	      return this.attributes[attr];
	    },

	    // Get the HTML-escaped value of an attribute.
	    escape: function(attr) {
	      return _.escape(this.get(attr));
	    },

	    // Returns `true` if the attribute contains a value that is not null
	    // or undefined.
	    has: function(attr) {
	      return this.get(attr) != null;
	    },

	    // Special-cased proxy to underscore's `_.matches` method.
	    matches: function(attrs) {
	      return !!_.iteratee(attrs, this)(this.attributes);
	    },

	    // Set a hash of model attributes on the object, firing `"change"`. This is
	    // the core primitive operation of a model, updating the data and notifying
	    // anyone who needs to know about the change in state. The heart of the beast.
	    set: function(key, val, options) {
	      if (key == null) return this;

	      // Handle both `"key", value` and `{key: value}` -style arguments.
	      var attrs;
	      if (typeof key === 'object') {
	        attrs = key;
	        options = val;
	      } else {
	        (attrs = {})[key] = val;
	      }

	      options || (options = {});

	      // Run validation.
	      if (!this._validate(attrs, options)) return false;

	      // Extract attributes and options.
	      var unset      = options.unset;
	      var silent     = options.silent;
	      var changes    = [];
	      var changing   = this._changing;
	      this._changing = true;

	      if (!changing) {
	        this._previousAttributes = _.clone(this.attributes);
	        this.changed = {};
	      }

	      var current = this.attributes;
	      var changed = this.changed;
	      var prev    = this._previousAttributes;

	      // For each `set` attribute, update or delete the current value.
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

	      // Update the `id`.
	      if (this.idAttribute in attrs) this.id = this.get(this.idAttribute);

	      // Trigger all relevant attribute changes.
	      if (!silent) {
	        if (changes.length) this._pending = options;
	        for (var i = 0; i < changes.length; i++) {
	          this.trigger('change:' + changes[i], this, current[changes[i]], options);
	        }
	      }

	      // You might be wondering why there's a `while` loop here. Changes can
	      // be recursively nested within `"change"` events.
	      if (changing) return this;
	      if (!silent) {
	        while (this._pending) {
	          options = this._pending;
	          this._pending = false;
	          this.trigger('change', this, options);
	        }
	      }
	      this._pending = false;
	      this._changing = false;
	      return this;
	    },

	    // Remove an attribute from the model, firing `"change"`. `unset` is a noop
	    // if the attribute doesn't exist.
	    unset: function(attr, options) {
	      return this.set(attr, void 0, _.extend({}, options, {unset: true}));
	    },

	    // Clear all attributes on the model, firing `"change"`.
	    clear: function(options) {
	      var attrs = {};
	      for (var key in this.attributes) attrs[key] = void 0;
	      return this.set(attrs, _.extend({}, options, {unset: true}));
	    },

	    // Determine if the model has changed since the last `"change"` event.
	    // If you specify an attribute name, determine if that attribute has changed.
	    hasChanged: function(attr) {
	      if (attr == null) return !_.isEmpty(this.changed);
	      return _.has(this.changed, attr);
	    },

	    // Return an object containing all the attributes that have changed, or
	    // false if there are no changed attributes. Useful for determining what
	    // parts of a view need to be updated and/or what attributes need to be
	    // persisted to the server. Unset attributes will be set to undefined.
	    // You can also pass an attributes object to diff against the model,
	    // determining if there *would be* a change.
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

	    // Get the previous value of an attribute, recorded at the time the last
	    // `"change"` event was fired.
	    previous: function(attr) {
	      if (attr == null || !this._previousAttributes) return null;
	      return this._previousAttributes[attr];
	    },

	    // Get all of the attributes of the model at the time of the previous
	    // `"change"` event.
	    previousAttributes: function() {
	      return _.clone(this._previousAttributes);
	    },

	    // Fetch the model from the server, merging the response with the model's
	    // local attributes. Any changed attributes will trigger a "change" event.
	    fetch: function(options) {
	      options = _.extend({parse: true}, options);
	      var model = this;
	      var success = options.success;
	      options.success = function(resp) {
	        var serverAttrs = options.parse ? model.parse(resp, options) : resp;
	        if (!model.set(serverAttrs, options)) return false;
	        if (success) success.call(options.context, model, resp, options);
	        model.trigger('sync', model, resp, options);
	      };
	      wrapError(this, options);
	      return this.sync('read', this, options);
	    },

	    // Set a hash of model attributes, and sync the model to the server.
	    // If the server returns an attributes hash that differs, the model's
	    // state will be `set` again.
	    save: function(key, val, options) {
	      // Handle both `"key", value` and `{key: value}` -style arguments.
	      var attrs;
	      if (key == null || typeof key === 'object') {
	        attrs = key;
	        options = val;
	      } else {
	        (attrs = {})[key] = val;
	      }

	      options = _.extend({validate: true, parse: true}, options);
	      var wait = options.wait;

	      // If we're not waiting and attributes exist, save acts as
	      // `set(attr).save(null, opts)` with validation. Otherwise, check if
	      // the model will be valid when the attributes, if any, are set.
	      if (attrs && !wait) {
	        if (!this.set(attrs, options)) return false;
	      } else if (!this._validate(attrs, options)) {
	        return false;
	      }

	      // After a successful server-side save, the client is (optionally)
	      // updated with the server-side state.
	      var model = this;
	      var success = options.success;
	      var attributes = this.attributes;
	      options.success = function(resp) {
	        // Ensure attributes are restored during synchronous saves.
	        model.attributes = attributes;
	        var serverAttrs = options.parse ? model.parse(resp, options) : resp;
	        if (wait) serverAttrs = _.extend({}, attrs, serverAttrs);
	        if (serverAttrs && !model.set(serverAttrs, options)) return false;
	        if (success) success.call(options.context, model, resp, options);
	        model.trigger('sync', model, resp, options);
	      };
	      wrapError(this, options);

	      // Set temporary attributes if `{wait: true}` to properly find new ids.
	      if (attrs && wait) this.attributes = _.extend({}, attributes, attrs);

	      var method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
	      if (method === 'patch' && !options.attrs) options.attrs = attrs;
	      var xhr = this.sync(method, this, options);

	      // Restore attributes.
	      this.attributes = attributes;

	      return xhr;
	    },

	    // Destroy this model on the server if it was already persisted.
	    // Optimistically removes the model from its collection, if it has one.
	    // If `wait: true` is passed, waits for the server to respond before removal.
	    destroy: function(options) {
	      options = options ? _.clone(options) : {};
	      var model = this;
	      var success = options.success;
	      var wait = options.wait;

	      var destroy = function() {
	        model.stopListening();
	        model.trigger('destroy', model, model.collection, options);
	      };

	      options.success = function(resp) {
	        if (wait) destroy();
	        if (success) success.call(options.context, model, resp, options);
	        if (!model.isNew()) model.trigger('sync', model, resp, options);
	      };

	      var xhr = false;
	      if (this.isNew()) {
	        _.defer(options.success);
	      } else {
	        wrapError(this, options);
	        xhr = this.sync('delete', this, options);
	      }
	      if (!wait) destroy();
	      return xhr;
	    },

	    // Default URL for the model's representation on the server -- if you're
	    // using Backbone's restful methods, override this to change the endpoint
	    // that will be called.
	    url: function() {
	      var base =
	        _.result(this, 'urlRoot') ||
	        _.result(this.collection, 'url') ||
	        urlError();
	      if (this.isNew()) return base;
	      var id = this.get(this.idAttribute);
	      return base.replace(/[^\/]$/, '$&/') + encodeURIComponent(id);
	    },

	    // **parse** converts a response into the hash of attributes to be `set` on
	    // the model. The default implementation is just to pass the response along.
	    parse: function(resp, options) {
	      return resp;
	    },

	    // Create a new model with identical attributes to this one.
	    clone: function() {
	      return new this.constructor(this.attributes);
	    },

	    // A model is new if it has never been saved to the server, and lacks an id.
	    isNew: function() {
	      return !this.has(this.idAttribute);
	    },

	    // Check if the model is currently in a valid state.
	    isValid: function(options) {
	      return this._validate({}, _.extend({}, options, {validate: true}));
	    },

	    // Run validation against the next complete set of model attributes,
	    // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
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
	  var modelMethods = {keys: 1, values: 1, pairs: 1, invert: 1, pick: 0,
	      omit: 0, chain: 1, isEmpty: 1};

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
	  var Collection = Backbone.Collection = function(models, options) {
	    options || (options = {});
	    if (options.model) this.model = options.model;
	    if (options.comparator !== void 0) this.comparator = options.comparator;
	    this._reset();
	    this.initialize.apply(this, arguments);
	    if (models) this.reset(models, _.extend({silent: true}, options));
	  };

	  // Default options for `Collection#set`.
	  var setOptions = {add: true, remove: true, merge: true};
	  var addOptions = {add: true, remove: false};

	  // Splices `insert` into `array` at index `at`.
	  var splice = function(array, insert, at) {
	    at = Math.min(Math.max(at, 0), array.length);
	    var tail = Array(array.length - at);
	    var length = insert.length;
	    var i;
	    for (i = 0; i < tail.length; i++) tail[i] = array[i + at];
	    for (i = 0; i < length; i++) array[i + at] = insert[i];
	    for (i = 0; i < tail.length; i++) array[i + length + at] = tail[i];
	  };

	  // Define the Collection's inheritable methods.
	  _.extend(Collection.prototype, Events, {

	    // The default model for a collection is just a **Backbone.Model**.
	    // This should be overridden in most cases.
	    model: Model,

	    // Initialize is an empty function by default. Override it with your own
	    // initialization logic.
	    initialize: function(){},

	    // The JSON representation of a Collection is an array of the
	    // models' attributes.
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
	    add: function(models, options) {
	      return this.set(models, _.extend({merge: false}, options, addOptions));
	    },

	    // Remove a model, or a list of models from the set.
	    remove: function(models, options) {
	      options = _.extend({}, options);
	      var singular = !_.isArray(models);
	      models = singular ? [models] : models.slice();
	      var removed = this._removeModels(models, options);
	      if (!options.silent && removed.length) {
	        options.changes = {added: [], merged: [], removed: removed};
	        this.trigger('update', this, options);
	      }
	      return singular ? removed[0] : removed;
	    },

	    // Update a collection by `set`-ing a new list of models, adding new ones,
	    // removing models that are no longer present, and merging models that
	    // already exist in the collection, as necessary. Similar to **Model#set**,
	    // the core operation for updating the data contained by the collection.
	    set: function(models, options) {
	      if (models == null) return;

	      options = _.extend({}, setOptions, options);
	      if (options.parse && !this._isModel(models)) {
	        models = this.parse(models, options) || [];
	      }

	      var singular = !_.isArray(models);
	      models = singular ? [models] : models.slice();

	      var at = options.at;
	      if (at != null) at = +at;
	      if (at > this.length) at = this.length;
	      if (at < 0) at += this.length + 1;

	      var set = [];
	      var toAdd = [];
	      var toMerge = [];
	      var toRemove = [];
	      var modelMap = {};

	      var add = options.add;
	      var merge = options.merge;
	      var remove = options.remove;

	      var sort = false;
	      var sortable = this.comparator && at == null && options.sort !== false;
	      var sortAttr = _.isString(this.comparator) ? this.comparator : null;

	      // Turn bare objects into model references, and prevent invalid models
	      // from being added.
	      var model, i;
	      for (i = 0; i < models.length; i++) {
	        model = models[i];

	        // If a duplicate is found, prevent it from being added and
	        // optionally merge it into the existing model.
	        var existing = this.get(model);
	        if (existing) {
	          if (merge && model !== existing) {
	            var attrs = this._isModel(model) ? model.attributes : model;
	            if (options.parse) attrs = existing.parse(attrs, options);
	            existing.set(attrs, options);
	            toMerge.push(existing);
	            if (sortable && !sort) sort = existing.hasChanged(sortAttr);
	          }
	          if (!modelMap[existing.cid]) {
	            modelMap[existing.cid] = true;
	            set.push(existing);
	          }
	          models[i] = existing;

	        // If this is a new, valid model, push it to the `toAdd` list.
	        } else if (add) {
	          model = models[i] = this._prepareModel(model, options);
	          if (model) {
	            toAdd.push(model);
	            this._addReference(model, options);
	            modelMap[model.cid] = true;
	            set.push(model);
	          }
	        }
	      }

	      // Remove stale models.
	      if (remove) {
	        for (i = 0; i < this.length; i++) {
	          model = this.models[i];
	          if (!modelMap[model.cid]) toRemove.push(model);
	        }
	        if (toRemove.length) this._removeModels(toRemove, options);
	      }

	      // See if sorting is needed, update `length` and splice in new models.
	      var orderChanged = false;
	      var replace = !sortable && add && remove;
	      if (set.length && replace) {
	        orderChanged = this.length !== set.length || _.some(this.models, function(m, index) {
	          return m !== set[index];
	        });
	        this.models.length = 0;
	        splice(this.models, set, 0);
	        this.length = this.models.length;
	      } else if (toAdd.length) {
	        if (sortable) sort = true;
	        splice(this.models, toAdd, at == null ? this.length : at);
	        this.length = this.models.length;
	      }

	      // Silently sort the collection if appropriate.
	      if (sort) this.sort({silent: true});

	      // Unless silenced, it's time to fire all appropriate add/sort/update events.
	      if (!options.silent) {
	        for (i = 0; i < toAdd.length; i++) {
	          if (at != null) options.index = at + i;
	          model = toAdd[i];
	          model.trigger('add', model, this, options);
	        }
	        if (sort || orderChanged) this.trigger('sort', this, options);
	        if (toAdd.length || toRemove.length || toMerge.length) {
	          options.changes = {
	            added: toAdd,
	            removed: toRemove,
	            merged: toMerge
	          };
	          this.trigger('update', this, options);
	        }
	      }

	      // Return the added (or merged) model (or models).
	      return singular ? models[0] : models;
	    },

	    // When you have more items than you want to add or remove individually,
	    // you can reset the entire set with a new list of models, without firing
	    // any granular `add` or `remove` events. Fires `reset` when finished.
	    // Useful for bulk operations and optimizations.
	    reset: function(models, options) {
	      options = options ? _.clone(options) : {};
	      for (var i = 0; i < this.models.length; i++) {
	        this._removeReference(this.models[i], options);
	      }
	      options.previousModels = this.models;
	      this._reset();
	      models = this.add(models, _.extend({silent: true}, options));
	      if (!options.silent) this.trigger('reset', this, options);
	      return models;
	    },

	    // Add a model to the end of the collection.
	    push: function(model, options) {
	      return this.add(model, _.extend({at: this.length}, options));
	    },

	    // Remove a model from the end of the collection.
	    pop: function(options) {
	      var model = this.at(this.length - 1);
	      return this.remove(model, options);
	    },

	    // Add a model to the beginning of the collection.
	    unshift: function(model, options) {
	      return this.add(model, _.extend({at: 0}, options));
	    },

	    // Remove a model from the beginning of the collection.
	    shift: function(options) {
	      var model = this.at(0);
	      return this.remove(model, options);
	    },

	    // Slice out a sub-array of models from the collection.
	    slice: function() {
	      return slice.apply(this.models, arguments);
	    },

	    // Get a model from the set by id, cid, model object with id or cid
	    // properties, or an attributes object that is transformed through modelId.
	    get: function(obj) {
	      if (obj == null) return void 0;
	      return this._byId[obj] ||
	        this._byId[this.modelId(obj.attributes || obj)] ||
	        obj.cid && this._byId[obj.cid];
	    },

	    // Returns `true` if the model is in the collection.
	    has: function(obj) {
	      return this.get(obj) != null;
	    },

	    // Get the model at the given index.
	    at: function(index) {
	      if (index < 0) index += this.length;
	      return this.models[index];
	    },

	    // Return models with matching attributes. Useful for simple cases of
	    // `filter`.
	    where: function(attrs, first) {
	      return this[first ? 'find' : 'filter'](attrs);
	    },

	    // Return the first model with matching attributes. Useful for simple cases
	    // of `find`.
	    findWhere: function(attrs) {
	      return this.where(attrs, true);
	    },

	    // Force the collection to re-sort itself. You don't need to call this under
	    // normal circumstances, as the set will maintain sort order as each item
	    // is added.
	    sort: function(options) {
	      var comparator = this.comparator;
	      if (!comparator) throw new Error('Cannot sort a set without a comparator');
	      options || (options = {});

	      var length = comparator.length;
	      if (_.isFunction(comparator)) comparator = _.bind(comparator, this);

	      // Run sort based on type of `comparator`.
	      if (length === 1 || _.isString(comparator)) {
	        this.models = this.sortBy(comparator);
	      } else {
	        this.models.sort(comparator);
	      }
	      if (!options.silent) this.trigger('sort', this, options);
	      return this;
	    },

	    // Pluck an attribute from each model in the collection.
	    pluck: function(attr) {
	      return this.map(attr + '');
	    },

	    // Fetch the default set of models for this collection, resetting the
	    // collection when they arrive. If `reset: true` is passed, the response
	    // data will be passed through the `reset` method instead of `set`.
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
	    create: function(model, options) {
	      options = options ? _.clone(options) : {};
	      var wait = options.wait;
	      model = this._prepareModel(model, options);
	      if (!model) return false;
	      if (!wait) this.add(model, options);
	      var collection = this;
	      var success = options.success;
	      options.success = function(m, resp, callbackOpts) {
	        if (wait) collection.add(m, callbackOpts);
	        if (success) success.call(callbackOpts.context, m, resp, callbackOpts);
	      };
	      model.save(null, options);
	      return model;
	    },

	    // **parse** converts a response into a list of models to be added to the
	    // collection. The default implementation is just to pass it through.
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
	    modelId: function(attrs) {
	      return attrs[this.model.prototype.idAttribute || 'id'];
	    },

	    // Private method to reset all internal state. Called when the collection
	    // is first initialized or reset.
	    _reset: function() {
	      this.length = 0;
	      this.models = [];
	      this._byId  = {};
	    },

	    // Prepare a hash of attributes (or other model) to be added to this
	    // collection.
	    _prepareModel: function(attrs, options) {
	      if (this._isModel(attrs)) {
	        if (!attrs.collection) attrs.collection = this;
	        return attrs;
	      }
	      options = options ? _.clone(options) : {};
	      options.collection = this;
	      var model = new this.model(attrs, options);
	      if (!model.validationError) return model;
	      this.trigger('invalid', this, model.validationError, options);
	      return false;
	    },

	    // Internal method called by both remove and set.
	    _removeModels: function(models, options) {
	      var removed = [];
	      for (var i = 0; i < models.length; i++) {
	        var model = this.get(models[i]);
	        if (!model) continue;

	        var index = this.indexOf(model);
	        this.models.splice(index, 1);
	        this.length--;

	        // Remove references before triggering 'remove' event to prevent an
	        // infinite loop. #3693
	        delete this._byId[model.cid];
	        var id = this.modelId(model.attributes);
	        if (id != null) delete this._byId[id];

	        if (!options.silent) {
	          options.index = index;
	          model.trigger('remove', model, this, options);
	        }

	        removed.push(model);
	        this._removeReference(model, options);
	      }
	      return removed;
	    },

	    // Method for checking whether an object should be considered a model for
	    // the purposes of adding to the collection.
	    _isModel: function(model) {
	      return model instanceof Model;
	    },

	    // Internal method to create a model's ties to a collection.
	    _addReference: function(model, options) {
	      this._byId[model.cid] = model;
	      var id = this.modelId(model.attributes);
	      if (id != null) this._byId[id] = model;
	      model.on('all', this._onModelEvent, this);
	    },

	    // Internal method to sever a model's ties to a collection.
	    _removeReference: function(model, options) {
	      delete this._byId[model.cid];
	      var id = this.modelId(model.attributes);
	      if (id != null) delete this._byId[id];
	      if (this === model.collection) delete model.collection;
	      model.off('all', this._onModelEvent, this);
	    },

	    // Internal method called every time a model in the set fires an event.
	    // Sets need to update their indexes when models change ids. All other
	    // events simply proxy through. "add" and "remove" events that originate
	    // in other collections are ignored.
	    _onModelEvent: function(event, model, collection, options) {
	      if (model) {
	        if ((event === 'add' || event === 'remove') && collection !== this) return;
	        if (event === 'destroy') this.remove(model, options);
	        if (event === 'change') {
	          var prevId = this.modelId(model.previousAttributes());
	          var id = this.modelId(model.attributes);
	          if (prevId !== id) {
	            if (prevId != null) delete this._byId[prevId];
	            if (id != null) this._byId[id] = model;
	          }
	        }
	      }
	      this.trigger.apply(this, arguments);
	    }

	  });

	  // Underscore methods that we want to implement on the Collection.
	  // 90% of the core usefulness of Backbone Collections is actually implemented
	  // right here:
	  var collectionMethods = {forEach: 3, each: 3, map: 3, collect: 3, reduce: 0,
	      foldl: 0, inject: 0, reduceRight: 0, foldr: 0, find: 3, detect: 3, filter: 3,
	      select: 3, reject: 3, every: 3, all: 3, some: 3, any: 3, include: 3, includes: 3,
	      contains: 3, invoke: 0, max: 3, min: 3, toArray: 1, size: 1, first: 3,
	      head: 3, take: 3, initial: 3, rest: 3, tail: 3, drop: 3, last: 3,
	      without: 0, difference: 0, indexOf: 3, shuffle: 1, lastIndexOf: 3,
	      isEmpty: 1, chain: 1, sample: 3, partition: 3, groupBy: 3, countBy: 3,
	      sortBy: 3, indexBy: 3, findIndex: 3, findLastIndex: 3};

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
	  var View = Backbone.View = function(options) {
	    this.cid = _.uniqueId('view');
	    _.extend(this, _.pick(options, viewOptions));
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
	    remove: function() {
	      this._removeElement();
	      this.stopListening();
	      return this;
	    },

	    // Remove this view's element from the document and all event listeners
	    // attached to it. Exposed for subclasses using an alternative DOM
	    // manipulation API.
	    _removeElement: function() {
	      this.$el.remove();
	    },

	    // Change the view's element (`this.el` property) and re-delegate the
	    // view's events on the new element.
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
	    delegate: function(eventName, selector, listener) {
	      this.$el.on(eventName + '.delegateEvents' + this.cid, selector, listener);
	      return this;
	    },

	    // Clears all callbacks previously bound to the view by `delegateEvents`.
	    // You usually don't need to use this, but may wish to if you have multiple
	    // Backbone views attached to the same DOM element.
	    undelegateEvents: function() {
	      if (this.$el) this.$el.off('.delegateEvents' + this.cid);
	      return this;
	    },

	    // A finer-grained `undelegateEvents` for removing a single delegated event.
	    // `selector` and `listener` are both optional.
	    undelegate: function(eventName, selector, listener) {
	      this.$el.off(eventName + '.delegateEvents' + this.cid, selector, listener);
	      return this;
	    },

	    // Produces a DOM element to be assigned to your view. Exposed for
	    // subclasses using an alternative DOM manipulation API.
	    _createElement: function(tagName) {
	      return document.createElement(tagName);
	    },

	    // Ensure that the View has a DOM element to render into.
	    // If `this.el` is a string, pass it through `$()`, take the first
	    // matching element, and re-assign it to `el`. Otherwise, create
	    // an element from the `id`, `className` and `tagName` properties.
	    _ensureElement: function() {
	      if (!this.el) {
	        var attrs = _.extend({}, _.result(this, 'attributes'));
	        if (this.id) attrs.id = _.result(this, 'id');
	        if (this.className) attrs['class'] = _.result(this, 'className');
	        this.setElement(this._createElement(_.result(this, 'tagName')));
	        this._setAttributes(attrs);
	      } else {
	        this.setElement(_.result(this, 'el'));
	      }
	    },

	    // Set attributes from a hash on this view's element.  Exposed for
	    // subclasses using an alternative DOM manipulation API.
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
	  Backbone.sync = function(method, model, options) {
	    var type = methodMap[method];

	    // Default options, unless specified.
	    _.defaults(options || (options = {}), {
	      emulateHTTP: Backbone.emulateHTTP,
	      emulateJSON: Backbone.emulateJSON
	    });

	    // Default JSON-request options.
	    var params = {type: type, dataType: 'json'};

	    // Ensure that we have a URL.
	    if (!options.url) {
	      params.url = _.result(model, 'url') || urlError();
	    }

	    // Ensure that we have the appropriate request data.
	    if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
	      params.contentType = 'application/json';
	      params.data = JSON.stringify(options.attrs || model.toJSON(options));
	    }

	    // For older servers, emulate JSON by encoding the request into an HTML-form.
	    if (options.emulateJSON) {
	      params.contentType = 'application/x-www-form-urlencoded';
	      params.data = params.data ? {model: params.data} : {};
	    }

	    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
	    // And an `X-HTTP-Method-Override` header.
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
	    if (params.type !== 'GET' && !options.emulateJSON) {
	      params.processData = false;
	    }

	    // Pass along `textStatus` and `errorThrown` from jQuery.
	    var error = options.error;
	    options.error = function(xhr, textStatus, errorThrown) {
	      options.textStatus = textStatus;
	      options.errorThrown = errorThrown;
	      if (error) error.call(options.context, xhr, textStatus, errorThrown);
	    };

	    // Make the request, allowing the user to override any Ajax options.
	    var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
	    model.trigger('request', model, xhr, options);
	    return xhr;
	  };

	  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
	  var methodMap = {
	    'create': 'POST',
	    'update': 'PUT',
	    'patch': 'PATCH',
	    'delete': 'DELETE',
	    'read': 'GET'
	  };

	  // Set the default implementation of `Backbone.ajax` to proxy through to `$`.
	  // Override this if you'd like to use a different library.
	  Backbone.ajax = function() {
	    return Backbone.$.ajax.apply(Backbone.$, arguments);
	  };

	  // Backbone.Router
	  // ---------------

	  // Routers map faux-URLs to actions, and fire events when routes are
	  // matched. Creating a new one sets its `routes` hash, if not set statically.
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
	    route: function(route, name, callback) {
	      if (!_.isRegExp(route)) route = this._routeToRegExp(route);
	      if (_.isFunction(name)) {
	        callback = name;
	        name = '';
	      }
	      if (!callback) callback = this[name];
	      var router = this;
	      Backbone.history.route(route, function(fragment) {
	        var args = router._extractParameters(route, fragment);
	        if (router.execute(callback, args, name) !== false) {
	          router.trigger.apply(router, ['route:' + name].concat(args));
	          router.trigger('route', name, args);
	          Backbone.history.trigger('route', router, name, args);
	        }
	      });
	      return this;
	    },

	    // Execute a route handler with the provided parameters.  This is an
	    // excellent place to do pre-route setup or post-route cleanup.
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
	    _bindRoutes: function() {
	      if (!this.routes) return;
	      this.routes = _.result(this, 'routes');
	      var route, routes = _.keys(this.routes);
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
	  var routeStripper = /^[#\/]|\s+$/g;

	  // Cached regex for stripping leading and trailing slashes.
	  var rootStripper = /^\/+|\/+$/g;

	  // Cached regex for stripping urls of hash.
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
	      var rootPath = path.slice(0, this.root.length - 1) + '/';
	      return rootPath === this.root;
	    },

	    // Unicode characters in `location.pathname` are percent encoded so they're
	    // decoded for comparison. `%25` should not be decoded since it may be part
	    // of an encoded parameter.
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
	    start: function(options) {
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
	          var rootPath = this.root.slice(0, -1) || '/';
	          this.location.replace(rootPath + '#' + this.getPath());
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
	      var addEventListener = window.addEventListener || function(eventName, listener) {
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
	      var removeEventListener = window.removeEventListener || function(eventName, listener) {
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
	      var rootPath = this.root;
	      if (fragment === '' || fragment.charAt(0) === '?') {
	        rootPath = rootPath.slice(0, -1) || '/';
	      }
	      var url = rootPath + fragment;

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
	        if (this.iframe && fragment !== this.getHash(this.iframe.contentWindow)) {
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
	    // `parent`'s constructor function and add the prototype properties.
	    child.prototype = _.create(parent.prototype, protoProps);
	    child.prototype.constructor = child;

	    // Set a convenience property in case the parent's prototype is needed
	    // later.
	    child.__super__ = parent.prototype;

	    return child;
	  };

	  // Set up inheritance for the model, collection, router, view and history.
	  Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;

	  // Throw an error when a URL is needed, and none is supplied.
	  var urlError = function() {
	    throw new Error('A "url" property or function must be specified');
	  };

	  // Wrap an optional error callback with a fallback error event.
	  var wrapError = function(model, options) {
	    var error = options.error;
	    options.error = function(resp) {
	      if (error) error.call(options.context, model, resp, options);
	      model.trigger('error', model, resp, options);
	    };
	  };

	  return Backbone;
	});

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ }),
/* 5 */
/***/ (function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_5__;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	exports.__esModule = true;

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /*
	                                                                                                                                                                                                                                                                               * @Author: laixi
	                                                                                                                                                                                                                                                                               * @Date:   2017-03-20 16:04:59
	                                                                                                                                                                                                                                                                               * @Last Modified by:   Xavier Yin
	                                                                                                                                                                                                                                                                               * @Last Modified time: 2017-04-24 10:49:23
	                                                                                                                                                                                                                                                                               */


	var _underscore = __webpack_require__(1);

	var _underscore2 = _interopRequireDefault(_underscore);

	var _core = __webpack_require__(3);

	var _core2 = _interopRequireDefault(_core);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var Events = _core2.default.Events = {};

	// 将不同传参转换为标准传参进行对应函数的调用（iteratee）
	var eventsApi = function eventsApi(iteratee, events, name, callback, opts) {
	  var i = 0;
	  var names;
	  if (name && (typeof name === 'undefined' ? 'undefined' : _typeof(name)) === 'object') {
	    // 对象调用格式
	    if (callback !== void 0 && 'context' in opts && opts.context === void 0) opts.context = callback;
	    for (names = _underscore2.default.keys(name); i < names.length; i++) {
	      events = eventsApi(iteratee, events, names[i], name[names[i]], opts);
	    }
	  } else if (name && _core.eventSplitter.test(name)) {
	    // 多事件调用格式
	    for (names = name.split(_core.eventSplitter); i < names.length; i++) {
	      events = iteratee(events, names[i], callback, opts);
	    }
	  } else {
	    // 标准调用格式
	    events = iteratee(events, name, callback, opts);
	  }
	  return events;
	};

	// iteratee onApi
	var onApi = function onApi(events, name, callback, options) {
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
	var internalOn = function internalOn(obj, name, callback, context, listening) {
	  obj._events = eventsApi(onApi, obj._events || {}, name, callback, {
	    context: context,
	    ctx: obj,
	    listening: listening
	  });

	  if (listening) {
	    // 如果为真，表示在实现一个 listenTo 操作。
	    var listeners = obj._listeners || (obj._listeners = {});
	    listeners[listening.id] = listening;
	  }

	  return obj;
	};

	Events.on = function (name, callback, context) {
	  return internalOn(this, name, callback, context);
	};

	// Events.listenTo 本质是通过 obj 的 on 方法来实现的。
	Events.listenTo = function (obj, name, callback) {
	  if (!obj) return this;
	  var id = obj._listenId || (obj._listenId = _underscore2.default.uniqueId('l'));
	  var listeningTo = this._listeningTo || (this._listeningTo = {});
	  var listening = listeningTo[id];

	  if (!listening) {
	    // 初次监听 obj 对象
	    var thisId = this._listenId || (this._listenId = _underscore2.default.uniqueId('l'));
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

	var offApi = function offApi(events, name, callback, options) {
	  if (!events) return;

	  var i = 0;
	  var listening;
	  var context = options.context;
	  var listeners = options.listeners;

	  // usecase: model.off();
	  if (!name && !callback && !context) {
	    var ids = _underscore2.default.keys(listeners);
	    for (; i < ids.length; i++) {
	      listening = listeners[ids[i]];
	      delete listeners[listening.id];
	      delete listening.listeningTo[listening.objId];
	    }

	    // jackbone: remove refereneces regard to forward
	    _underscore2.default.each(events['all'], function (handler) {
	      if (handler.callback.forwarder) {
	        removeForwardMap(handler.callback.forwarder, handler.callback.objId, handler.callback.fwdId);
	      }
	    });
	    return;
	  }

	  var names = name ? [name] : _underscore2.default.keys(events);
	  for (; i < names.length; i++) {
	    name = names[i];
	    var handlers = events[name];
	    if (!handlers) break;
	    var remaining = [];
	    for (var j = 0; j < handlers.length; j++) {
	      var handler = handlers[j];
	      if (callback && callback !== handler.callback && callback !== handler.callback._callback || context && context !== handler.context) {
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
	  if (_underscore2.default.size(events)) return events;
	};

	Events.off = function (name, callback, context) {
	  if (!this._events) return this; // 当前没有绑定任何事件
	  this._events = eventsApi(offApi, this._events, name, callback, {
	    context: context,
	    listeners: this._listeners
	  });
	  return this;
	};

	Events.stopListening = function (obj, name, callback) {
	  var listeningTo = this._listeningTo;
	  if (!listeningTo) return this;

	  var ids = obj ? [obj._listenId] : _underscore2.default.keys(listeningTo);

	  for (var i = 0; i < ids.length; i++) {
	    var listening = listeningTo[ids[i]];

	    if (!listening) break;
	    listening.obj.off(name, callback, this);
	  }
	  if (_underscore2.default.isEmpty(listeningTo)) this._listeningTo = void 0;

	  return this;
	};

	var onceMap = function onceMap(map, name, callback, offer) {
	  if (callback) {
	    var once = map[name] = _underscore2.default.once(function () {
	      offer(name, once);
	      callback.apply(this, arguments);
	    });
	    once._callback = callback;
	  }
	  return map;
	};

	Events.once = function (name, callback, context) {
	  var events = eventsApi(onceMap, {}, name, callback, _underscore2.default.bind(this.off, this));
	  return this.on(events, void 0, context);
	};

	Events.listenToOnce = function (obj, name, callback) {
	  var events = eventsApi(onceMap, {}, name, callback, _underscore2.default.bind(this.stopListening, this, obj));
	  return this.listenTo(obj, events);
	};

	var triggerEvents = function triggerEvents(events, args) {
	  var ev,
	      i = -1,
	      l = events.length,
	      a1 = args[0],
	      a2 = args[1],
	      a3 = args[2];
	  switch (args.length) {
	    case 0:
	      while (++i < l) {
	        (ev = events[i]).callback.call(ev.ctx);
	      }return;
	    case 1:
	      while (++i < l) {
	        (ev = events[i]).callback.call(ev.ctx, a1);
	      }return;
	    case 2:
	      while (++i < l) {
	        (ev = events[i]).callback.call(ev.ctx, a1, a2);
	      }return;
	    case 3:
	      while (++i < l) {
	        (ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
	      }return;
	    default:
	      while (++i < l) {
	        (ev = events[i]).callback.apply(ev.ctx, args);
	      }return;
	  }
	};

	var triggerApi = function triggerApi(objEvents, name, cb, args) {
	  if (objEvents) {
	    var events = objEvents[name];
	    var allEvents = objEvents.all;
	    if (events && allEvents) allEvents = allEvents.slice();
	    if (events) triggerEvents(events, args);
	    if (allEvents) triggerEvents(allEvents, [name].concat(args));
	  }
	  return objEvents;
	};

	Events.trigger = function (name) {
	  if (!this._events) return this;

	  var length = Math.max(0, arguments.length - 1);
	  var args = Array(length);
	  for (var i = 0; i < length; i++) {
	    args[i] = arguments[i + 1];
	  }eventsApi(triggerApi, this._events, name, void 0, args);
	  return this;
	};

	/**
	 * ===============
	 *      Events.forward
	 * ===============
	 */

	// 转发 ID
	var forwardId = function forwardId() {
	  return _underscore2.default.uniqueId('fwd');
	};

	// 格式化 destination 参数
	var formatDestination = function formatDestination(destination) {
	  if (!_underscore2.default.isString(destination)) return null;
	  destination = (0, _core.trim)(destination);
	  if (!destination) return null;
	  return destination.split(_core.eventSplitter)[0];
	};

	/** 解析转发起始事件与目的地事件之前的映射关系 */
	var makeForwardMap = function makeForwardMap(original, destination, map) {
	  if (!original) return map;
	  if (map === void 0) map = {};
	  var i = 0;
	  var names;
	  if (_underscore2.default.isArray(original)) {
	    for (i in original) {
	      map = makeForwardMap(original[i], destination, map);
	    }
	  } else if ((typeof original === 'undefined' ? 'undefined' : _typeof(original)) === 'object') {
	    for (names = _underscore2.default.keys(original); i < names.length; i++) {
	      map = makeForwardMap(names[i], original[names[i]], map);
	    }
	  } else if (_core.eventSplitter.test(original)) {
	    for (names = original.split(_core.eventSplitter); i < names.length; i++) {
	      map = makeForwardMap(names[i], destination, map);
	    }
	  } else {
	    original = (0, _core.trim)(original);
	    if (original) map[original] = formatDestination(destination) || original;
	  }
	  return map;
	};

	// 移除转发映射关系
	var removeForwardMap = function removeForwardMap(forwarder, objId, fwdId) {
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

	  if (_underscore2.default.isEmpty(maps)) delete forwardings[objId];
	  if (_underscore2.default.isEmpty(forwardings)) forwarder._forwardings = void 0;
	};

	// 转发回调
	var forwardCallback = function forwardCallback(original, destination, event) {
	  var args = _core.slice.call(arguments, 2);
	  if (original && original !== event) return;
	  if (original && original === event) args[0] = destination || original;
	  this.trigger.apply(this, args);
	};

	var forwardApi = function forwardApi(me, other, original, destination, options) {
	  if (!options) options = {};
	  var fwdId = forwardId();
	  var objId = other._listenId || (other._listenId = _underscore2.default.uniqueId('l'));
	  var fn = _underscore2.default.partial(forwardCallback, original, destination);
	  var callback;
	  if (options.once) {
	    callback = function callback() {
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
	Events.forward = function (obj, original, destination) {
	  if (!obj) return this;
	  var map = makeForwardMap(original, destination);
	  if (map === void 0) {
	    forwardApi(this, obj, null, null);
	  } else {
	    var that = this;
	    _underscore2.default.each(map, function (dest, origin) {
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
	Events.forwardOnce = function (obj, original, destination) {
	  if (!obj) return this;
	  var map = makeForwardMap(original, destination);
	  if (map === void 0) {
	    forwardApi(this, obj, null, null, { once: true });
	  } else {
	    var that = this;
	    _underscore2.default.each(map, function (dest, origin) {
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
	Events.stopForwarding = function (obj, original, destination) {
	  if (_underscore2.default.isEmpty(this._forwardings)) return this;
	  var forwardings = this._forwardings;
	  if (obj) {
	    forwardings = forwardings[obj._listenId];
	    if (_underscore2.default.isEmpty(forwardings)) return this;
	    forwardings = [forwardings];
	  } else {
	    forwardings = _underscore2.default.values(forwardings);
	  }
	  var map = makeForwardMap(original, destination);

	  forwardings = _underscore2.default.reduce(forwardings, function (memo, forwarding) {
	    _underscore2.default.each(_underscore2.default.values(forwarding), function (fwd) {
	      if (map) {
	        _underscore2.default.each(map, function (dest, origin) {
	          if (fwd.original === origin && fwd.destination === dest) memo.push([fwd.other, fwd.callback]);
	        });
	      } else {
	        memo.push([fwd.other, fwd.callback]);
	      }
	    });
	    return memo;
	  }, []);

	  var that = this;
	  _underscore2.default.each(forwardings, function (fwd) {
	    that.stopListening(fwd[0], 'all', fwd[1]);
	  });

	  return this;
	};

	Events.bind = Events.on;
	Events.unbind = Events.off;

	exports.default = Events;

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	exports.__esModule = true;

	var _attributes = __webpack_require__(2);

	var _attributes2 = _interopRequireDefault(_attributes);

	var _core = __webpack_require__(3);

	var _underscore = __webpack_require__(1);

	var _underscore2 = _interopRequireDefault(_underscore);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var Controller = function Controller(attributes, options) {
	  this.cid = _underscore2.default.uniqueId(this.cidPrefix);
	  this._attributes = {};
	  this.set(_underscore2.default.defaults({}, attributes, _underscore2.default.result(this, 'defaults')), options);
	  this.changed = {}; // reset this.changed to an empty object
	  this.initialize.apply(this, arguments);
	}; /*
	    * @Author: laixi
	    * @Date:   2017-03-22 09:26:45
	    * @Last Modified by:   Xavier Yin
	    * @Last Modified time: 2017-03-23 23:54:38
	    */


	Controller.extend = _core.extend;

	var prototype = _underscore2.default.extend(Controller.prototype, _attributes2.default, {
	  _attributeAlias: 'control',
	  _staticAttributes: ['collection', 'view', 'model'],

	  cidPrefix: 'ctrl',

	  initialize: function initialize() {},

	  // 委托 attribute 求值。
	  // @param attr: 属性名
	  // @param prop: 委托属性或方法
	  delegate: function delegate(attr, prop) {
	    var val = this.get(attr);
	    if (val) {
	      return (0, _core.delegate)(val, prop, _core.slice.call(arguments, 2));
	    }
	  },

	  // 委托 this.collection
	  $collection: function $collection(prop) {
	    return (0, _core.delegate)(this.collection, prop, _core.slice.call(arguments, 1));
	  },

	  // 委托 this.model
	  $model: function $model(prop) {
	    return (0, _core.delegate)(this.model, prop, _core.slice.call(arguments, 1));
	  },

	  // 委托 this.view
	  $view: function $view(prop) {
	    return (0, _core.delegate)(this.view, prop, _core.slice.call(arguments, 1));
	  },

	  // 快速委托 this.view 的属性或方法
	  // ---------------------------------
	  $el: function $el() {
	    return this.view ? this.view.$el : null;
	  }
	});

	exports.default = Controller;

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	exports.__esModule = true;

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /*
	                                                                                                                                                                                                                                                                               * @Author: laixi
	                                                                                                                                                                                                                                                                               * @Date:   2017-03-22 15:46:44
	                                                                                                                                                                                                                                                                               * @Last Modified by:   Xavier Yin
	                                                                                                                                                                                                                                                                               * @Last Modified time: 2017-03-25 10:03:24
	                                                                                                                                                                                                                                                                               */


	var _underscore = __webpack_require__(1);

	var _underscore2 = _interopRequireDefault(_underscore);

	var _core = __webpack_require__(3);

	var _core2 = _interopRequireDefault(_core);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	// 封装异常
	var wrapError = function wrapError(model, options) {
	  var error = options.error;
	  options.error = function (resp) {
	    if (error) error.call(options.context, model, resp, options);
	    model.trigger('error', model, resp, options);
	  };
	};

	var Model = _core2.default.Model.extend({

	  // @override
	  destroy: function destroy(options) {
	    options = options ? _underscore2.default.clone(options) : {};
	    var model = this;
	    var success = options.success;
	    var wait = options.wait;

	    // 销毁模型（停止监听事件，触发 destroy 事件）
	    // 停止转发、观察与监听。
	    var destroy = function destroy() {
	      model.stopForwarding();
	      model.stopWatching();
	      model.stopListening();
	      model.trigger('destroy', model, model.collection, options);
	    };

	    // 封装 success 回调
	    // 该回调会在请求成功后立即执行，请求成功即被视为操作成功。
	    options.success = function (resp) {
	      if (wait) destroy();
	      if (success) success.call(options.context, model, resp, options);
	      // 如果 model.isNew() 为假，才有可能会触发 sync 事件。
	      if (!model.isNew()) model.trigger('sync', model, resp, options);
	    };

	    var xhr = false;
	    // 如果模型数据不存在于远端（按照 Backbone 设计理论），
	    // 则无需与远端进行数据同步操作，直接执行 success 回调。（理论上也不触发 sync 事件）
	    if (this.isNew()) {
	      _underscore2.default.defer(options.success);
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
	  watch: function watch(obj, original, destination) {
	    if (!obj) return this;

	    if (!this._listenId) this._listenId = _underscore2.default.uniqueId('l');
	    if (!obj._listenId) obj._listenId = _underscore2.default.uniqueId('l');

	    var watchings = this._watchings || (this._watchings = {});
	    var watchers = obj._watchers || (obj._watchers = {});
	    var watching = watchings[obj._listenId] || (watchings[obj._listenId] = { obj: obj });
	    var map = (0, _core.makeMap)(original, destination);
	    watching['watch'] = map == null ? null : _underscore2.default.defaults(map, watching['watch']);
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
	  stopWatching: function stopWatching(obj, original, destination) {
	    var watchings = this._watchings;
	    if (!watchings) return this;
	    var iteration = obj ? [watchings[obj._listenId]] : _underscore2.default.values(watchings);

	    var watchee;
	    var watch;
	    var thisId = this._listenId;
	    var map = (0, _core.makeMap)(original, destination);
	    var callback = function callback(value, key) {
	      return map == null ? true : map[key] === value;
	    };
	    _underscore2.default.each(iteration, function (watching) {
	      watch = _underscore2.default.omit(watching.watch, callback);
	      if (_underscore2.default.isEmpty(watch)) {
	        watchee = watching.obj;
	        if (watchee._watchers) delete watchee._watchers[thisId];
	        if (_underscore2.default.isEmpty(watchee._watchers)) watchee._watchers = void 0;
	        delete watchings[watchee._listenId];
	      } else {
	        watching.watch = watch;
	      }
	    });
	    if (_underscore2.default.isEmpty(watchings)) this._watchings = void 0;
	    return this;
	  },

	  /** 清除所有观察者，不让其他对象观察自己 */
	  preventWatching: function preventWatching() {
	    var watchers = _underscore2.default.values(this._watchers);
	    var that = this;
	    _underscore2.default.each(watchers, function (watcher) {
	      watcher.stopWatching(that);
	    });
	    return this;
	  },

	  // @override
	  // 设置属性方法。
	  set: function set(key, val, options) {
	    if (key == null) return this;
	    var attrs;
	    if ((typeof key === 'undefined' ? 'undefined' : _typeof(key)) === 'object') {
	      attrs = key;
	      options = val;
	    } else {
	      (attrs = {})[key] = val;
	    }
	    options || (options = {});
	    // 防止 watchee 执行 set 方法时修改了 attrs 或 opts
	    // 先准备一个副本。
	    var attributes = _underscore2.default.clone(attrs);
	    var opts = _underscore2.default.clone(options);

	    if (!this._validate(attrs, options)) return false;
	    var unset = options.unset;
	    var silent = options.silent; // 如果为 true，不触发任何 `change` 事件。
	    var changes = []; // 发生变化属性名称列表

	    var changing = this._changing;
	    this._changing = true;

	    if (!changing) {
	      this._previousAttributes = _underscore2.default.clone(this.attributes); // 保存操作前的属性哈希副本
	      this.changed = {}; // （初始）设置变化属性哈希
	    }

	    var current = this.attributes; // 当前属性哈希
	    var changed = this.changed; // 当前变化属性哈希
	    var prev = this._previousAttributes; // 操作前属性哈希


	    // 遍历输入哈希，更新或删除哈希值
	    for (var attr in attrs) {
	      val = attrs[attr];
	      // 当前属性值不等于输入属性值时，在变化属性名列表中记录属性名称
	      if (!_underscore2.default.isEqual(current[attr], val)) changes.push(attr);

	      // 操作前属性值不等于输入属性值时，记录变化属性值，否则移除变化属性名。
	      // （因为 set 可以内嵌，this.changed 保存所有内嵌 set 操作结束后的属性变化状态）
	      if (!_underscore2.default.isEqual(prev[attr], val)) {
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
	    _underscore2.default.each(this._watchers, function (watcher) {
	      watchings = watcher._watchings;
	      if (!watchings) return;
	      watching = watchings[objId];
	      var watch = watching['watch'];
	      if (watch == null) {
	        watcher.set(_underscore2.default.clone(attributes), _underscore2.default.clone(opts));
	      } else {
	        var data = _underscore2.default.reduce(watch, function (memo, destination, original) {
	          // 此处使用 changed[original] 作为变更值传递给 watcher。
	          // 另外一种看法是可以选择使用 attributes[original] 传递给 watcher。
	          // 因为 attributes 值在 set 过程中发生变化，如果支持 attributes[original]，
	          // 即意味着必须认同 watcher 在 set 过程中也可能更改 attributes。
	          // 但如果使用 attributes[original] 可能会导致观察意图被误解，
	          // 因为changed 中发生变化的属性未必存在于  attributes 中。
	          // 所以最终使用 changed[original]。
	          if (_underscore2.default.has(changed, original)) memo[destination] = changed[original];
	          return memo;
	        }, {});
	        watcher.set(data, _underscore2.default.clone(opts));
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

	exports.default = Model;

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	exports.__esModule = true;

	var _underscore = __webpack_require__(1);

	var _underscore2 = _interopRequireDefault(_underscore);

	var _core = __webpack_require__(3);

	var _core2 = _interopRequireDefault(_core);

	var _events = __webpack_require__(6);

	var _events2 = _interopRequireDefault(_events);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var urlError = function urlError() {
	  throw new Error('A "url" property or function must be specified');
	}; /*
	    * @Author: laixi
	    * @Date:   2017-05-15 15:15:39
	    * @Last Modified by:   laixi
	    * @Last Modified time: 2017-05-15 17:32:16
	    *
	    * Backbone.Request 发起 AJAX 请求
	    */


	var Request = _underscore2.default.extend({

	  request: function request(options) {
	    options || (options = {});
	    this.requestError(options);
	    this.requestSuccess(options);
	    if (!options.url) {
	      options.url = _underscore2.default.result(this, 'url') || urlError();
	    }
	    var xhr = options.xhr = _core2.default.ajax(_underscore2.default.defaults(options, { dataType: 'json', parse: true, validate: true }));
	    this.trigger('request', this, xhr, options);
	    return xhr;
	  },

	  requestError: function requestError(options) {
	    var model = this;
	    var error = options.error;
	    options.error = function (resp) {
	      if (error) error.call(options.context || model, model, resp, options);
	      model.trigger('error', model, resp, options);
	    };
	  },

	  requestSuccess: function requestSuccess(options) {
	    var model = this;
	    var success = options.success;
	    var validateResponse = options.validateResponse || model.validateResponse;
	    var parseResponse = options.parseResponse || model.parseResponse;
	    options.success = function (resp) {
	      var error = options.validate && _underscore2.default.isFunction(validateResponse) ? validateResponse.call(model, resp, options) : null;
	      if (error) {
	        model.trigger('fail', model, error, _underscore2.default.extend(options, { validationError: error }));
	      } else {
	        var data = options.parse && _underscore2.default.isFunction(parseResponse) ? parseResponse.call(model, resp, options) : resp;
	        if (success) success.call(options.context || model, data, options);
	        model.trigger('success', model, data, options);
	      }
	    };
	  }

	}, _events2.default);

	exports.default = Request;

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	exports.__esModule = true;

	var _underscore = __webpack_require__(1);

	var _underscore2 = _interopRequireDefault(_underscore);

	var _core = __webpack_require__(3);

	var _core2 = _interopRequireDefault(_core);

	var _attributes = __webpack_require__(2);

	var _attributes2 = _interopRequireDefault(_attributes);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var viewOptions = ['controller', 'model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events', 'render', 'props'];

	// 挂载子视图
	/*
	 * @Author: laixi
	 * @Date:   2017-03-22 09:58:26
	 * @Last Modified by:   laixi
	 * @Last Modified time: 2017-06-06 00:04:48
	 */
	var mountApi = function mountApi(parent, child, nodeName, options) {
	  var stack = parent._nodeStacks[nodeName];
	  if (!stack) return false; // 如果不存在视图堆栈，返回 false

	  var children = parent._nodeChildren || (parent._nodeChildren = {});
	  children[child.cid] = {
	    node: nodeName,
	    view: child
	  };
	  var $node = parent.$node(nodeName);
	  var index = options.index * 1;
	  if (!_underscore2.default.isNaN(index) && stack.length > 0 && index < stack.length) {
	    if (index <= -1 * stack.length) index = 0;
	    if (index < 0) index = stack.length + index;
	    var anotherChild = stack[index];
	    stack.splice(index, 0, child);
	    if ($node) anotherChild.$el.before(child.$el);
	  } else {
	    stack.push(child);
	    if ($node) $node.append(child.$el);
	  }
	  child.parent = parent;
	  watchApi(parent, child, options);
	  parent.trigger('mount', child, nodeName, options);
	  child.trigger('attach', parent, nodeName, options);
	  return child;
	};

	// 卸载子视图
	var unmountApi = function unmountApi(parent, child, nodeName, options) {
	  var stack = _underscore2.default.property(nodeName)(parent._nodeStacks);
	  var children = parent._nodeChildren;
	  if (!stack || !children) return false;
	  options || (options = {});
	  var childId = child.cid;

	  var position = stack.indexOf(child);
	  if (position >= 0) stack.splice(position, 1);

	  delete children[childId];

	  child.parent = null;
	  child.$el.detach();
	  stopWatchingApi(parent, child);
	  parent.trigger('unmount', child, nodeName, options);
	  child.trigger('free', parent, nodeName, options);
	  if (options.remove) child.remove(options);
	  return child;
	};

	var onParentChange = function onParentChange(model, options) {
	  this.set(_underscore2.default.pick(model.changedAttributes(), this.props), options);
	};

	var watchApi = function watchApi(parent, child, options) {
	  child.set(_underscore2.default.pick(parent.toJSON(), child.props));
	  if (options.watch === true) child.listenTo(parent, 'change', onParentChange);
	};

	var stopWatchingApi = function stopWatchingApi(parent, child) {
	  child.stopListening(parent, 'change', onParentChange);
	};

	var attrSelector = /(@)([\w-]+)/;
	// Cached regex to split keys for `delegate`.
	var delegateEventSplitter = /^(\S+)\s*(.*)$/;

	var makeEvents = function () {

	  var iteratee = function iteratee(memo, val, key) {
	    memo[(0, _core.trim)(key).replace(attrSelector, '[at="$2"]')] = val;
	    return memo;
	  };

	  return function (events) {
	    return _underscore2.default.reduce(events, iteratee, {});
	  };
	}();

	var View = _core2.default.View.extend(_attributes2.default).extend({

	  constructor: function constructor(options) {
	    this.cid = _underscore2.default.uniqueId('view');
	    this._attributes = {};
	    this.parent = null; // 初始状态没有父视图
	    options || (options = {});
	    _underscore2.default.extend(this, _underscore2.default.pick(options, viewOptions));
	    this.props = _underscore2.default.isArray(this.props) ? _underscore2.default.clone(this.props) : [];
	    this.set(_underscore2.default.defaults({}, options.data, _underscore2.default.result(this, 'defaults')), options);
	    this.changed = {}; // reset this.changed to an empty object.

	    this._ensureElement();
	    // this.nodes 表示 node 名称与元素路径的映射关系
	    this.nodes = this._initNodes(_underscore2.default.extend({}, _underscore2.default.result(this, 'nodes'), options.nodes));
	    this._initNodeStacks(); // 初始化 node 堆栈
	    this._initNodeElements(); // 初始化 node 元素

	    var render = this.render || _underscore2.default.noop;
	    this.render = function () {
	      this._detachStacks();
	      this.trigger('render:before', this);

	      var result = render.apply(this, arguments);
	      this.trigger('render', this);

	      this._initNodeElements();
	      this._attachStacks();
	      this.trigger('render:after', this);

	      return result;
	    };

	    this.initialize.apply(this, arguments);
	  },

	  // 初始化 node 元素
	  // 每次渲染后初始化 node 元素
	  _initNodeElements: function _initNodeElements() {
	    var that = this;
	    var $root = this.$el;
	    var elements = {
	      root: $root
	    };
	    var $el;
	    _underscore2.default.each(this.nodes, function (nodePath, nodeName) {
	      $el = $root.find(nodePath);
	      if ($el.length) elements[nodeName] = $el;
	    });
	    this._nodeElements = elements;
	  },

	  // 初始化 node 堆栈
	  // 用以缓存所有 node 节点下挂载的视图 cid。
	  _initNodeStacks: function _initNodeStacks() {
	    var stacks = {
	      root: []
	    };
	    _underscore2.default.each(_underscore2.default.keys(this.nodes), function (nodeName) {
	      stacks[nodeName] = [];
	    });
	    this._nodeStacks = stacks;
	  },

	  // 初始化 nodes 属性
	  // 支持简写 {bar: '@foo'}，表示 {bar: '[node="foo"]'}。
	  _initNodes: function _initNodes(nodes) {
	    return _underscore2.default.mapObject(nodes, function (val, key) {
	      return (0, _core.trim)(val).replace(attrSelector, '[node="$2"]');
	    });
	  },

	  // 渲染视图前，暂时脱离所有子视图
	  _detachStacks: function _detachStacks() {
	    var that = this;
	    _underscore2.default.each(this._nodeStacks, function (stack, nodeName) {
	      _underscore2.default.each(stack, function (child) {
	        child.$el.detach();
	        that.trigger('stack:detach', child, nodeName);
	        child.trigger('detached', that, nodeName);
	      });
	    });
	  },

	  // 渲染视图后，重新挂载子视图
	  _attachStacks: function _attachStacks() {
	    var children = this._nodeChildren;
	    if (_underscore2.default.isEmpty(children)) return;
	    var that = this;
	    var map, $node;
	    _underscore2.default.each(this._nodeStacks, function (stack) {
	      _underscore2.default.each(stack, function (child) {
	        map = children[child.cid];
	        $node = that.$node(map.node);
	        if ($node) {
	          $node.append(child.$el);
	          that.trigger('stack:attach', child, map.node);
	          child.trigger('attached', that, map.node);
	        }
	      });
	    });
	  },

	  $node: function $node(name) {
	    return this._nodeElements && this._nodeElements[name];
	  },

	  // 封装委托事件的回调函数，决定是否执行回调函数。
	  _wrapDelegateEventHandler: function _wrapDelegateEventHandler(method) {
	    return function (e) {
	      var result = _underscore2.default.isFunction(this.delegateEventFilter) ? this.delegateEventFilter(e) : e;
	      if (!result) return;
	      var args = _underscore2.default.toArray(arguments);
	      args[0] = result;
	      method.apply(this, args);
	    };
	  },

	  // 委托事件过滤器
	  // 每个 DOM 事件默认只应被处理一次（距离自己最近的一个 View 来处理）
	  delegateEventFilter: function delegateEventFilter(e) {
	    if (e.originalEvent) {
	      if (e.originalEvent.originalView) return;
	      e.originalEvent.originalView = this;
	    } else {
	      if (e.originalView) return;
	      e.originalView = this;
	    }
	    return e;
	  },

	  delegateEvents: function delegateEvents(events) {
	    events || (events = makeEvents(_underscore2.default.result(this, 'events')));
	    if (!events) return this;
	    this.undelegateEvents();
	    for (var key in events) {
	      var method = events[key];
	      if (!_underscore2.default.isFunction(method)) method = this[method];
	      if (!method) continue;
	      var match = key.match(delegateEventSplitter);
	      this.delegate(match[1], match[2], _underscore2.default.bind(this._wrapDelegateEventHandler(method), this));
	    }
	    return this;
	  },

	  // 挂载子视图
	  // options.reset 表示挂载子视图前将节点现有的视图卸载。
	  // options.remove 如果为真，表示卸载视图的同时销毁视图。
	  // options.watch
	  mount: function mount(child, nodeName, options) {
	    if (!child) return false;
	    if ((0, _core.isRefCycle)(this, child)) return false;
	    if (nodeName == null) nodeName = 'root';
	    if (!this.hasNode(nodeName)) return false;
	    options || (options = {});
	    if (options.reset) {
	      this.unmount(nodeName, options);
	    }
	    child.free(); // 确保 child 是自由的
	    return mountApi(this, child, nodeName, options) && this;
	  },

	  // 将自己挂载到父视图
	  attach: function attach(parent, nodeName, options) {
	    if (!parent) return false;
	    return parent.mount(this, nodeName, options) && this;
	  },

	  // 事件向下传播
	  broadcast: function broadcast(event, args, options) {
	    options || (options = {});
	    _underscore2.default.defaults(options, { target: this, currentTarget: this });
	    var result = this.broadcastParser(event, args, options);
	    if (!result) return this;
	    event = result.event;
	    args = result.args;
	    options = result.options || {};
	    if (!event || !_underscore2.default.isString(event) || options.silent || !this.propagationFilter(event, args, options)) return this;
	    this.trigger(event, args, options);
	    _underscore2.default.extend(options, { currentTarget: this });
	    var stacks = [];
	    if (!_underscore2.default.isString(options.node)) {
	      stacks = _underscore2.default.values(this.getStack());
	    } else {
	      var that = this;
	      var stack;
	      _underscore2.default.each(options.node.split(_core.eventSplitter), function (nodeName) {
	        stack = that.getStack(nodeName);
	        if (stack) stacks.push(stack);
	      });
	    }
	    _underscore2.default.each(stacks, function (stack) {
	      _underscore2.default.each(stack, function (child) {
	        child.broadcast(event, args, _underscore2.default.clone(options));
	      });
	    });
	  },

	  // @unstable
	  broadcastParser: function broadcastParser(event, args, options) {
	    return { event: event, args: args, options: options };
	  },

	  // @unstable
	  broadcastFilter: function broadcastFilter(event, args, options) {
	    return true;
	  },

	  // 事件冒泡
	  propagate: function propagate(event, args, options) {
	    options || (options = {});
	    _underscore2.default.defaults(options, { target: this, currentTarget: this });
	    var result = this.propagationParser(event, args, options);
	    if (!result) return this;
	    event = result.event;
	    args = result.args;
	    options = result.options;
	    if (!event || !_underscore2.default.isString(event) || options.silent || !this.propagationFilter(event, args, options)) return this;
	    this.trigger(event, args, options);
	    if (this.parent) {
	      _underscore2.default.extend(options, { currentTarget: this });
	      // 不再传递 _.clone(args)，而是直接使用 args 作为参数传递。
	      // 使用 _.clone(args) 传递，如果 args 是一个类实例，例如 view 的实例。
	      // 会导致被传递的参数实际上并不是原 view。
	      if (options.parent) {
	        this.parent.trigger(event, args, _underscore2.default.clone(options));
	      } else {
	        this.parent.propagate(event, args, _underscore2.default.clone(options));
	      }
	    }
	  },

	  // @unstable
	  propagationParser: function propagationParser(event, args, options) {
	    return { event: event, args: args, options: options };
	  },

	  // @unstable
	  // 过滤事件冒泡，如果返回值为否，则该事件冒泡将被阻止。否则继续事件冒泡。
	  propagationFilter: function propagationFilter(event, args, options) {
	    return true;
	  },

	  // 卸载子视图
	  unmount: function unmount(node, options) {
	    var children = this._nodeChildren;
	    if (!children) return this;
	    var that = this;
	    var map;
	    if (node == void 0) {
	      _underscore2.default.each(_underscore2.default.values(children), function (item) {
	        unmountApi(that, item.view, item.node, options);
	      });
	    } else if (_underscore2.default.isString(node)) {
	      var stack = _underscore2.default.clone(_underscore2.default.property(node)(this._nodeStacks));
	      _underscore2.default.each(stack, function (child) {
	        map = children[child.cid];
	        if (map) unmountApi(that, map.view, map.node, options);
	      });
	    } else {
	      map = children[node.cid];
	      if (map) unmountApi(this, map.view, map.node, options);
	    }
	    return this;
	  },

	  // 将自己恢复自由
	  free: function free() {
	    if (this.parent) {
	      this.parent.unmount(this);
	    }
	    return this;
	  },

	  // 检查 node stack 是否存在
	  hasNode: function hasNode(name) {
	    return _underscore2.default.has(this._nodeStacks, name);
	  },

	  // 检查是否存在 node 元素
	  hasNodeElement: function hasNodeElement(name) {
	    return _underscore2.default.has(this._nodeElements, name);
	  },

	  // 获取 node  路径
	  getNodePath: function getNodePath(name) {
	    return this.nodes && this.nodes[name];
	  },

	  // 获取 node 堆栈副本
	  getStack: function getStack(nodeName) {
	    return nodeName == void 0 ? _underscore2.default.clone(this._nodeStacks) : _underscore2.default.clone(this._nodeStacks[nodeName]);
	  },

	  // 获取子视图在堆栈中的位置
	  // 如果不传任何参数，则返回当前视图在其父视图（如果有的话）堆栈中的位置。
	  getStackIndex: function getStackIndex(child) {
	    if (child) {
	      if (child.parent === this) {
	        var map = this._nodeChildren[child.cid];
	        var stack = this.getStack(map.node);
	        return stack.indexOf(child);
	      }
	    } else if (this.parent) {
	      return this.parent.getStackIndex(this);
	    }
	  },

	  // 根据堆栈索引获取子视图
	  getChildByIndex: function getChildByIndex(nodeName, index) {
	    if (index == null) index = 0;
	    if (nodeName && !_underscore2.default.isNaN(index *= 1)) {
	      var stack = this.getStack(nodeName);
	      if (stack && stack.length > 0) {
	        if (index >= stack.length) {
	          index = stack.length - 1;
	        } else if (index < 0) {
	          if (index <= -1 * stack.length) {
	            index = 0;
	          } else {
	            index += stack.length;
	          }
	        }
	        return stack[index];
	      }
	    }
	  },

	  // @override
	  remove: function remove(options) {
	    this.free(); // 释放自己
	    this._removeElement();
	    this.stopListening();
	    this.stopForwarding();
	    this.stopWatching();
	    this.unmount(null, options); // 卸载子视图
	    return this;
	  },

	  // 更新 nodes
	  updateNodes: function updateNodes() {
	    this._detachStacks();
	    this._initNodeElements();
	    this._attachStacks();
	    return this;
	  }
	});

	_underscore2.default.each(['append', 'appendTo', 'detach', 'html', 'prepend', 'prependTo', 'hide', 'show', 'attr', 'css', 'addClass', 'removeClass'], function (method) {
	  View.prototype[method] = function () {
	    return this.$el[method].apply(this.$el, arguments);
	  };
	});

	exports.default = View;

/***/ })
/******/ ])
});
;