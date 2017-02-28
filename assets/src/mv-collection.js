/*
* @Author: laixi
* @Date:   2017-02-28 15:40:44
* @Last Modified by:   laixi
* @Last Modified time: 2017-02-28 15:46:17
*/


var Backbone = require('./core');
var _ = require('underscore');
var utils = require('./utils');
var slice = utils.slice;

  // Backbone.MVCollection
  // -------------------------

  var setOptions = {
    add: true,
    remove: true,
    merge: true
  };

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

  var Collection = Backbone.Collection;
  var CollectionPrototype = Collection.prototype;

  var MVCollection = module.exports = Backbone.MVCollection = Collection.extend({

    // 添加视图
    _addViewReference: function(model, options) {
      var View = options.view || this.view;
      if (View) {
        var opts = _.defaults({
            model: model
          },
          _.result(options, 'viewOptions'),
          _.result(this, 'viewOptions'));
        var view = new View(opts);
        if (view) {
          this._viewRefs[model.cid] = view;
          if (options.render === true && _.isFunction(view.render)) view.render();
          model.listenTo(view, 'all', this._onViewEvent);
        }
      }
    },

    // 转发 view 事件
    _onViewEvent: function(event) {
      var args = slice.call(arguments, 1);
      this.trigger.apply(this, ['view:' + event].concat(args));
      this.trigger.apply(this, ['view', event].concat(args));
    },

    // 覆写 Backbone.Collection.prototype._removeModels 方法
    // @override
    _removeModels: function(models, options) {
      var removed = [];

      for (var i = 0; i < models; i++) {
        var model = this.get(models[i]);
        if (!model) continue;
        var index = this.indexOf(model);
        this.models.splice(index, 1);
        this.length--;
        if (!options.silent) {
          options.index = index;
          // trigger event `remove:view` if it's necessary.
          model.trigger('remove:view', view, model, this, options);
          model.trigger('remove', model, this, options);
        }
        removed.push(model);
        // remove reference to view.
        this._removeViewReference(model, options);
        this._removeReference(model, options);
      }
      return removed.length ? removed : false;
    },

    // 移除 view 的引用
    _removeViewReference: function(model, options) {
      var view = this._viewRefs[model.cid];
      if (view) {
        model.stopListening(view, 'all', this._onViewEvent);
        // 默认移除视图同时销毁视图
        if (options.removeView !== false) view.remove();
      }
      delete this._viewRefs[model.cid];
      return view;
    },

    // @override
    constructor: function(models, options) {
      options || (options = {});
      if (options.view) this.view = options.view;
      if (options.viewOptions) this.view = options.viewOptions;
      this._viewRefs = {};
      return Collection.prototype.constructor.apply(this, arguments);
    },

    // 获取指定 model 对应的视图
    getView: function(obj) {
      var model = this.get(obj);
      return model ? this._viewRefs[model.cid] : null;
    },

    // @override
    reset: function(models, options) {
      options = options ? _.clone(options) : {};
      if (!options.silent) this.trigger('reset:before', this, options);
      var previousViews = [];
      var view;
      // 遍历现有成员，逐一销毁成员与集合之间的引用关系
      for (var i = 0; i < this.models.length; i++) {
        view = this._removeViewReference(this.models[i], options);
        previousViews.push(view);
        this._removeReference(this.models[i], options);
      }
      // 保留之前的 models 以及 views 引用
      options.previousModels = this.models;
      options.previousViews = previousViews;
      // 重置内部状态（包括更换 this.models）
      this._reset();
      // 调用 add 操作添加成员（add 操作内部是调用 set 操作）
      models = this.add(models, _.extend({
        silent: true
      }, options));
      // 触发 reset 事件
      if (!options.silent) {
        this.trigger('reset', this, options);
        this.trigger('reset:after', this, options);
      }
      return models;
    },

    // @override
    // 设置
    set: function(models, options) {
      if (models == null) return;

      options = _.defaults({}, options, setOptions);
      if (options.parse && !this._isModel(models)) models = this.parse(models, options);

      var singular = !_.isArray(models);
      models = singular ? [models] : models.slice();

      var at = options.at; // 插入新成员的位置
      if (at != null) at = +at; // 将 at 强转为数字类型
      if (at < 0) at += this.length + 1; // 如果 at 是负数，则表示位置是倒数的，将其转换为实际位置。

      var set = []; // 置换的成员容器
      var toAdd = []; // 新添加的成员容器
      var toRemove = []; // 待删除的成员容器
      var modelMap = {}; // 置换成员映射表

      var add = options.add; // 新增标识
      var merge = options.merge; // 合并标识
      var remove = options.remove; // 移除标识

      var sort = false; // 是否需要排序
      var sortable = this.comparator && (at == null) && options.sort !== false;
      var sortAttr = _.isString(this.comparator) ? this.comparator : null; // 如果 comparator 是字符串，则表示使用 model 某个属性作为排序因子

      var model;
      var view;
      var viewRefs = this._viewRefs; // the map of view references
      for (var i = 0; i < models.length; i++) {
        model = models[i];

        var existing = this.get(model);
        if (existing) {
          if (merge && model !== existing) {
            var attrs = this._isModel(model) ? model.attributes : model;
            if (options.parse) attrs = existing.parse(attrs, options);
            existing.set(attrs, options);
            if (sortable && !sort) sort = existing.hasChanged(sortAttr);
          }
          if (!modelMap[existing.cid]) {
            modelMap[existing.cid] = true;
            set.push(existing);
          }
          models[i] = existing;

        } else if (add) {
          model = models[i] = this._prepareModel(model, options);
          if (model) {
            toAdd.push(model);
            this._addViewReference(model, options); // add view
            this._addReference(model, options);
            modelMap[model.cid] = true;
            set.push(model);
          }
        }
      }

      if (remove) {
        for (i = 0; i < this.length; i++) {
          model = this.models[i];
          if (!modelMap[model.cid]) toRemove.push(model);
        }
        if (toRemove.length) this._removeModels(toRemove, options);
      }

      var orderChanged = false;
      var replace = !sortable && add && remove;
      if (set.length && replace) {
        orderChanged = this.length != set.length || _.some(this.models, function(model, index) {
          return model !== set[index];
        });
        this.models.length = 0;
        splice(this.models, set, 0);
        this.length = this.models.length;
      } else if (toAdd.length) {
        if (sortable) sort = true;
        splice(this.models, toAdd, at == null ? this.length : at);
        this.length = this.models.length;
      }

      if (sort) this.sort({
        silent: true
      });

      if (!options.silent) {
        for (i = 0; i < toAdd.length; i++) {
          if (at != null) options.index = at + i;
          model = toAdd[i];
          model.trigger('add', model, this, options);
          // trigger event `add:view` if there is a new view.
          view = viewRefs[model.cid];
          if (view) this.trigger('add:view', view, model, this, options);
        }
        if (sort || orderChanged) this.trigger('sort', this, options);
        if (toAdd.length || toRemove.length) this.trigger('update', this, options);
      }

      return singular ? models[0] : models;
    },

    view: Backbone.View,

    // 获取所有视图
    views: function() {
      var that = this;
      return _.map(arguments.length ? arguments : this.models, function(arg) {
        return that.getView(arg);
      });
    }
  });