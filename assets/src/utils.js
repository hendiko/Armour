/*
 * @Author: laixi
 * @Date:   2017-02-28 14:45:59
 * @Last Modified by:   laixi
 * @Last Modified time: 2017-02-28 17:24:54
 *
 * utils
 */
var _ = require('underscore');

// 委托获取属性或执行方法。
// 如果 attr 是 obj 的属性，则直接返回该属性值。
// 如果 attr 是 obj 的方法，则以 obj 作为方法的上下文，args 作为方法参数求值。
exports.delegate = function(obj, attr, args) {
  var value = _.property(attr)(obj);
  return _.isFunction(value) ? value.apply(obj, args) : value;
};

// 判断给定对象是否具有触发事件的能力
exports.isTriggerable = (function(fn) {
  return function(obj) {
    return _.isFunction(fn(obj));
  };
}(_.property('trigger')));

// 切片函数
exports.slice = Array.prototype.slice;

// 去除首尾空白字符
exports.trim = function(regexp) {
  return function(str) {
    return str.replace(regexp, '');
  };
}(/^\s*|\s*$/g);

// 异常封装
exports.wrapError = function(model, options) {
  var error = options.error;
  options.error = function(resp) {
    if (error) error.call(options.context, model, resp, options);
    model.trigger('error', model, resp, options);
  };
};

// 检查 App 挂载是否会导致循环引用
var isRefCycle = function(parent, child) {
  if (!parent) return false;
  if (child === parent) return true;
  return isRefCycle(parent.parent, child);
};

exports.isRefCycle = isRefCycle;