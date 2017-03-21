/*
* @Author: laixi
* @Date:   2017-03-22 00:06:49
* @Last Modified by:   laixi
* @Last Modified time: 2017-03-22 00:43:26
*/
import _ from 'underscore';
import { slice, isTriggerable } from './core';
import Events from './events';


var Attributes = _.extend({

  // 静态属性
  // 当设置静态属性时，它会同时被绑定到宿主。
  _staticAttributes: ['collection', 'controller', 'model', 'view'],

  _attributeAlias: 'attribute',

  _listenToChangedAttributeCallback: function(attr, event) {
    var args = slice.call(arguments, 1);
    this.trigger.apply(this, [this._attributeAlias + ':' + attr].concat(args));
    this.trigger.apply(this, [this._attributeAlias, attr].concat(args));
  }

  _listenToChangedAttribute: function(attr, value) {
    var prev = this.previous(attr);
    var handlers = this._listeningHandlers || (this._listeningHandlers = {});
    var handler = handlers[attr];
    if (handler) {
      this.stopListening(prev, 'all', handler);
      delete handlers[attr];
    }
    if (isTriggerable(value)) {
      handler = handlers[attr] = _.partial(this._listenToChangedAttributeCallback, attr);
      this.listenTo(value, 'all', handler);
    }
  },

  set: function(key, val, options) {
    // todo
  }



}, Events);


export default Attributes;