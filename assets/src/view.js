/*
 * @Author: laixi
 * @Date:   2017-02-28 15:38:54
 * @Last Modified by:   laixi
 * @Last Modified time: 2017-03-22 11:04:38
 *
 * Backbone.View
 */
var Backbone = require('./core');
var _ = require('underscore');
var utils = require('./utils');
var isRefCycle = utils.isRefCycle;

var _viewOptions = ['controller', 'model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events', 'render'];

// 卸载节点视图
var unmountNode = function(map) {
  var node = map.node;
  var view = map.view;
  var stack = _.property(node)(this._nodeStacks);
  if (stack) {
    var position = stack.indexOf(view.cid);
    if (position >= 0) stack.splice(position, 1);
  }
  if (this._childNodes) {
    delete this._childNodes[view.cid];
  }
  view.$el.detach();
  view.parent = null;
  this.trigger('unmount', view, node);
  return view;
};

var mountNode = function(node, view, flag) {
  var childNodes = this._childNodes || (this._childNodes = {});
  childNodes[view.cid] = {
    node: node,
    view: view
  };
  var stack = this._nodeStacks[node];
  if (flag) { // laixi: why using this.$el as parent? Is it a bug?
    this.$el.prepend(view.$el);
    stack.unshift(view.cid);
  } else {
    this.$el.append(view.$el);
    stack.push(view.cid);
  }
  view.parent = this;
  this.trigger('mount', view, node);
  return view;
};

// this._$nodes 保存 $node 引用
// this._nodeStacks  保存 node 对应的视图集合
// this._childNodes 保存子视图引用
var View = module.exports = Backbone.View = Backbone.View.extend({

  // 每次渲染视图后，重新生成 $nodes
  _initNodes: function() {
    var $node;
    var that = this;
    var $nodes = _.reduce(this.nodes, function(memo, path, name) {
      $node = that.$(path);
      if ($node.length) memo[name] = $node;
      return memo;
    }, {});
    $nodes['root'] = this.$el;
    this._$nodes = $nodes;
    return this;
  },

  _initNodeStacks: function() {
    var stacks = _.reduce(this.nodes, function(memo, path, node) {
      memo[node] = [];
      return memo;
    }, {});
    stacks['root'] = [];
    this._nodeStacks = stacks;
    return this;
  },

  _detachNodeStacks: function() {
    var nodes = this._childNodes;
    if (_.isEmpty(nodes)) return this;
    var map;
    _.each(this._nodeStacks, function(stack) {
      _.each(stack, function(cid) {
        map = nodes[cid];
        if (map) {
          map.view.$el.detach();
        }
      });
    });
    return this;
  },

  _attachNodeStacks: function() {
    var nodes = this._childNodes;
    if (_.isEmpty(nodes)) return this;
    var map, $node;
    var that = this;
    _.each(this._nodeStacks, function(stack) {
      _.each(stack, function(cid) {
        map = nodes[cid];
        if (map) {
          $node = that.$node(map.node);
          if ($node) {
            $node.append(map.view.$el);
          }
        }
      });
    });
    return this;
  },

  parent: null,

  constructor: function(options) {
    this.cid = _.uniqueId('view');
    options || (options = {});
    _.extend(this, _.pick(options, _viewOptions));
    this._ensureElement();
    this.nodes = _.extend({}, this.nodes, options.nodes);
    this._initNodeStacks();

    var render = this.render || _.noop;
    this.render = function() {
      this._detachNodeStacks();
      this.trigger('render:before', this);

      var result = render.apply(this, arguments);
      this.trigger('render', this);

      this._initNodes();
      this._attachNodeStacks();
      this.trigger('render:after', this);

      return result;
    };

    this.initialize.apply(this, arguments);
  },

  mount: function(view, node, options) {
    if (!view) return false;
    if (isRefCycle(this, view)) throw Error('Reference Cycle Error');
    if (node == null) node = 'root';
    if (!this.hasNode(node)) return false;

    options || (options = {});
    view.detach(); // 确保 view 是自由的视图
    if (options.reset) {
      this.unmount(node);
    }
    mountNode.call(this, node, view, !!options.prepend);
    return this;
  },

  // 移除视图
  unmount: function(node) {
    var childNodes = this._childNodes;
    if (!childNodes) return this;
    var that = this;
    var map;
    if (!node) {
      _.each(_.values(childNodes), _.bind(unmountNode, this));
    } else if (_.isString(node)) {
      var stack = _.clone(_.property(node)(this._nodeStacks));
      _.each(stack, function(cid) {
        map = childNodes[cid];
        if (map) unmountNode.call(that, map);
      });
    } else {
      map = childNodes[node.cid];
      if (map) unmountNode.call(that, map);
    }
    return this;
  },

  // 绑定到其他视图
  attach: function(parent, node, options) {
    if (parent) {
      return parent.mount(this, node, options) || this;
    }
    return this;
  },

  // 脱离其他视图
  detach: function() {
    if (this.parent) {
      this.parent.unmount(this);
    }
    return this;
  },

  // 是否定义了 node 节点（名称为 name）
  hasNode: function(name) {
    return name === 'root' || _.has(this.nodes, name);
  },

  // 获取 $node 对象
  $node: function(name) {
    return this._$nodes && this._$nodes[name];
  },

  // 获取 node 的选择路径
  getNodePath: function(name) {
    return this.nodes && this.nodes[name];
  },

  // @override
  remove: function() {
    this._removeElement();
    this.stopForwarding();
    this.stopListening();
    this.unmount();
    this.detach();
    return this;
  }
});