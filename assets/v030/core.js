/*
 * @Author: laixi
 * @Date:   2017-03-14 11:36:31
 * @Last Modified by:   laixi
 * @Last Modified time: 2017-03-22 09:50:55
 */
import Backbone from 'backbone';
import _ from 'underscore';

// 委托获取属性或执行方法。
// 如果 attr 是 obj 的属性，则直接返回该属性值。
// 如果 attr 是 obj 的方法，则以 obj 作为方法的上下文，args 作为方法参数求值。
export function delegate(obj, attr, args) {
  var prop = _.property(attr)(obj);
  return _.isFunction(prop) ? prop.apply(obj, args) : prop;
};

var propTrigger = _.property('trigger');

// 判断给定对象是否具有触发事件的能力
export function isTriggerable(obj) {
  return _.isFunction(propTrigger(obj));
}

export const slice = Array.prototype.slice;

var trimRegexp = /^\s*|\s*$/g

export function trim(str) {
  return str.replace(trimRegexp, '');
}

// 两个对象之间是否存在父子循环引用
export function isRefCycle(parent, child) {
  if (!parent) return false;
  if (child === parent) return true;
  return isRefCycle(parent.parent, child);
}

export var extend = Backbone.Model.extend;

export default Backbone;
