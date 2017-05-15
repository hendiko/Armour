# 2017-03-21 v0.3.0 developing

1. 修复被监听者调用 off() 方法不能清除 forwardOnce 生成的绑定关系。 
2. Attributes 和 Model 实例增加 anyChange 与 allChange 方法。
3. Attributes 实例增加 underscore 方法。
4. View 对象更新：
  4.1. 初始化参数增加 options.props 参数，表示挂载时获取父视图数据。
  4.2. mount 方法增加 options.watch = true 参数，表示是否要观察父视图属性变化。
  4.3. remove 方法增加 options.remove = true 参数，表示视图销毁时同时销毁子视图。
  4.4. 增加父视图向子视图广播(broadcast)以及子视图向父视图冒泡(propagate)。
  4.5. 初始化视图时增加 options.data 参数支持，表示初始化视图属性。
  4.6. 默认混合 Attributes 对象，无需再额外扩展。
  4.7. events 与 nodes 支持 @ 语法。(v0.3.1)
  4.8. View 增加委托事件过滤机制，默认一个事件只被一个 View 处理。(v0.3.2)
5. 新增 Backbone.Request 对象。(v0.3.3)

Todos: 

1. View 优化事件委托，支持动态修改 events 属性使用 @ 语法。

# 2017-03-14 v0.1.0 released

1. 以 CommonJS 编写 Jackbone 源码。
2. Jackbone 作为 Backbone 插件存在。
3. Jackbone 实现的组件：application, attrs, controller, events, model, mv-collection, view。
