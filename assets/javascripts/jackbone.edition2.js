/*
 * @Author: laixi
 * @Date:   2017-02-09 13:49:11
 * @Last Modified by:   laixi
 * @Last Modified time: 2017-02-09 16:57:32
 *
 * 
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
    } catch(e) {
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
    return _.isFunction(value) ? value.apply(obj, args): value;
  };

  // 判断给定对象是否具有触发事件的能力
  var isTriggerable = (function(fn) {
    return function(obj) {
      return _.isFunction(fn(obj));
    };
  }(_.property('trigger')));

  // 检查 App 挂载是否会导致循环引用
  var isRefCycle = function(parent, child) {
    if (!parent) return false;
    if (child === parent) return true;
    return isRefCycle(parent.parent, child);
  }


  // 切片函数

  return Backbone;

}));