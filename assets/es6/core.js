/*
 * @Author: laixi
 * @Date:   2017-03-10 16:01:45
 * @Last Modified by:   laixi
 * @Last Modified time: 2017-03-10 16:23:57
 */
import _ from 'underscore';
import $ from 'jquery';

export var Backbone = {
  // Current version of the library. Keep in sync with `package.json`.
  VERSION: '1.2.3',

  // For Backbone's purposes, jQuery, Zepto, Ender, or My Library (kidding) owns
  // the `$` variable.
  $,

  // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
  // will fake `"PATCH"`, `"PUT"` and `"DELETE"` requests via the `_method` parameter and
  // set a `X-Http-Method-Override` header.
  emulateHTTP: false,

  // Turn on `emulateJSON` to support legacy servers that can't deal with direct
  // `application/json` requests ... this will encode the body as
  // `application/x-www-form-urlencoded` instead and will send the model in a
  // form param named `model`.
  emulateJSON: false
};

// Create a local reference to a common array method we'll want to use later.
export var slice = Array.prototype.slice;


// Proxy Backbone class methods to Underscore functions, wrapping the model's
// `attributes` object or collection's `models` array behind the scenes.
//
// collection.filter(function(model) { return model.get('age') > 10 });
// collection.each(this.addView);
//
// `Function#apply` can be slow so we use the method's arg count, if we know it.
export function addMethod(length, method, attribute) {
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
}

export function addUnderscoreMethods(Class, methods, attribute) {
  _.each(methods, function(length, method) {
    if (_[method]) Class.prototype[method] = addMethod(length, method, attribute);
  });
}

// Support `collection.sortBy('attr')` and `collection.findWhere({id: 1})`.
export function cb(iteratee, instance) {
  if (_.isFunction(iteratee)) return iteratee;
  if (_.isObject(iteratee) && !instance._isModel(iteratee)) return modelMatcher(iteratee);
  if (_.isString(iteratee)) return function(model) {
    return model.get(iteratee);
  };
  return iteratee;
}

export function modelMatcher(attrs) {
  var matcher = _.matches(attrs);
  return function(model) {
    return matcher(model.attributes);
  };
}


// Jackbone utils
// =========


// 委托获取属性或执行方法。
// 如果 attr 是 obj 的属性，则直接返回该属性值。
// 如果 attr 是 obj 的方法，则以 obj 作为方法的上下文，args 作为方法参数求值。
export function delegate(obj, attr, args) {
  var value = _.property(attr)(obj);
  return _.isFunction(value) ? value.apply(obj, args) : value;
}

var _propertyTrigger = _.property('trigger');

// 判断给定对象是否具有触发事件的能力
export function isTriggerable(obj) {
  return _.isFunction(fn(obj));
}

var _regexp = /^\s*|\s*$/g;

// 去除首尾空白字符
export function trim(str) {
  return str.replace(_regexp, '');
}

// 判断是否形成父子对象循环引用
export function isRefCycle(parent, child) {
  if (!parent) return false;
  if (child === parent) return true;
  return isRefCycle(parent.parent, child);
}


export { _, $ };
