/*
 * @Author: laixi
 * @Date:   2017-03-22 09:58:26
 * @Last Modified by:   laixi
 * @Last Modified time: 2017-03-24 14:55:58
 */
import _ from 'underscore';
import Backbone, { isRefCycle } from './core';

var viewOptions = ['controller', 'model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events', 'render'];

// 挂载子视图
var mountApi = function(parent, child, nodeName, options) {
  var stack = parent._nodeStacks[nodeName];
  if (!stack) return false; // 如果不存在视图堆栈，返回 false

  var children = parent._nodeChildren || (parent._nodeChildren = {});
  children[child.cid] = {
    node: nodeName,
    view: child
  };
  var $node = parent.$node(nodeName);
  var index = options.index * 1;
  if (!_.isNaN(index) && stack.length > 0 && index < stack.length) {
    if (index <= (-1 * stack.length)) index = 0;
    if (index < 0) index = stack.length + index;
    var anotherChild = stack[index];
    stack.splice(index, 0, child);
    if ($node) anotherChild.$el.before(child.$el);
  } else {
    stack.push(child);
    if ($node) $node.append(child.$el);
  }
  child.parent = parent;
  parent.trigger('mount', child, nodeName);
  child.trigger('attach', parent, nodeName);
  return child;
};

// 卸载子视图
var unmountApi = function(parent, child, nodeName) {
  var stack = _.property(nodeName)(parent._nodeStacks);
  var children = parent._nodeChildren;
  if (!stack || !children) return false;
  var childId = child.cid;

  var position = stack.indexOf(child);
  if (position >= 0) stack.splice(position, 1);

  delete children[childId];

  child.$el.detach();
  child.parent = null;
  parent.trigger('unmount', child, nodeName);
  child.trigger('free', parent, nodeName);
  return child;
};


var View = Backbone.View.extend({

  constructor: function(options) {
    this.cid = _.uniqueId('view');
    this.parent = null; // 初始状态没有父视图
    options || (options = {});
    _.extend(this, _.pick(options, viewOptions));
    this._ensureElement();
    // this.nodes 表示 node 名称与元素路径的映射关系
    this.nodes = _.extend({}, _.result(this, 'nodes'), options.nodes);
    this._initNodeStacks(); // 初始化 node 堆栈
    this._initNodeElements(); // 初始化 node 元素

    var render = this.render || _.noop;
    this.render = function() {
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
  _initNodeElements: function() {
    var that = this;
    var $root = this.$el;
    var elements = {
      root: $root
    };
    var $el;
    _.each(this.nodes, function(nodePath, nodeName) {
      $el = $root.find(nodePath);
      if ($el.length) elements[nodeName] = $el;
    });
    this._nodeElements = elements;
  },

  // 初始化 node 堆栈
  // 用以缓存所有 node 节点下挂载的视图 cid。
  _initNodeStacks: function() {
    var stacks = {
      root: []
    };
    _.each(_.keys(this.nodes), function(nodeName) {
      stacks[nodeName] = [];
    });
    this._nodeStacks = stacks;
  },

  // 渲染视图前，暂时脱离所有子视图
  _detachStacks: function() {
    var that = this;
    _.each(this._nodeStacks, function(stack, nodeName) {
      _.each(stack, function(child) {
        child.$el.detach();
        that.trigger('stack:detach', child, nodeName);
        child.trigger('detached', that, nodeName);
      });
    });
  },

  // 渲染视图后，重新挂载子视图
  _attachStacks: function() {
    var children = this._nodeChildren;
    if (_.isEmpty(children)) return;
    var that = this;
    var map, $node;
    _.each(this._nodeStacks, function(stack) {
      _.each(stack, function(child) {
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

  $node: function(name) {
    return this._nodeElements && this._nodeElements[name];
  },

  // 挂载子视图
  mount: function(child, nodeName, options) {
    if (!child) return false;
    if (isRefCycle(this, child)) return false;
    if (nodeName == null) nodeName = 'root';
    if (!this.hasNode(nodeName)) return false;
    options || (options = {});
    if (options.reset) {
      this.unmount(nodeName);
    }
    child.free(); // 确保 child 是自由的
    return mountApi(this, child, nodeName, options) && this;
  },

  // 将自己挂载到父视图
  attach: function(parent, nodeName, options) {
    if (!parent) return false;
    return parent.mount(this, nodeName, options) && this;
  },

  // 卸载子视图
  unmount: function(node) {
    var children = this._nodeChildren;
    if (!children) return this;
    var that = this;
    var map;
    if (node === void 0) {
      _.each(_.values(children), function(item) {
        unmountApi(that, item.view, item.node);
      });
    } else if (_.isString(node)) {
      var stack = _.clone(_.property(node)(this._nodeStacks));
      _.each(stack, function(child) {
        map = children[child.cid];
        if (map) unmountApi(that, map.view, map.node);
      });
    } else {
      map = children[node.cid];
      if (map) unmountApi(this, map.view, map.node);
    }
    return this;
  },

  // 将自己恢复自由
  free: function() {
    if (this.parent) {
      this.parent.unmount(this);
    }
    return this;
  },

  // 检查 node stack 是否存在
  hasNode: function(name) {
    return _.has(this._nodeStacks, name);
  },

  // 检查是否存在 node 元素
  hasNodeElement: function(name) {
    return _.has(this._nodeElements, name);
  },

  // 获取 node  路径
  getNodePath: function(name) {
    return this.nodes && this.nodes[name];
  },

  // 获取 node 堆栈副本
  getStack: function(nodeName) {
    return nodeName == void 0 ? _.clone(this._nodeStacks) : _.clone(this._nodeStacks[nodeName]);
  },

  // 获取子视图在堆栈中的位置
  // 如果不传任何参数，则返回当前视图在其父视图（如果有的话）堆栈中的位置。
  getStackIndex: function(child) {
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
  getChildByIndex: function(nodeName, index) {
    if (index == null) index = 0;
    if (nodeName && !_.isNaN(index *= 1)) {
      var stack = this.getStack(nodeName);
      if (stack && stack.length > 0) {
        if (index >= stack.length) {
          index = stack.length - 1;
        } else if (index < 0) {
          if (index <= (-1 * stack.length)) {
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
  remove: function() {
    this.free(); // 释放自己
    this._removeElement();
    this.stopForwarding(); // 停止转发
    this.stopListening(); // 停止监听
    this.unmount(); // 卸载子视图
    return this;
  },

  // 更新 nodes
  updateNodes: function() {
    this._detachStacks();
    this._initNodeElements();
    this._attachStacks();
    return this;
  }
});

_.each(['append', 'appendTo', 'detach', 'html', 'prepend', 'prependTo', 'hide', 'show'], function(method) {
  View.prototype[method] = function() {
    return this.$el[method].apply(this.$el, arguments);
  }
});

export default View;
