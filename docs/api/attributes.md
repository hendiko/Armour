# Backbone.Attributes

Backbone.Attributes 对象提供属性管理功能，将它扩展到任意对象，使得被扩展对象具有属性管理能力。

```js
var obj = new Foo();
_.extend(obj, Backbone.Attributes);
```

## Properties

### _staticAttributes `Array|null`

在 `_staticAttributes` 中指定的属性，在进行 `set` 操作时，会同时绑定到宿主对象。

```js
var obj = _.extend({}, Backbone.Attributes, {_staticAttributes: ['x']});
obj.set({x: 1});
console.log(obj.x);  // 1
```

### _attributeAlias `String`

默认值为 `attribute`，属性事件前缀。


### _attributes `Object`

保存所有属性。


## Methods


### allChanged(name)

检查指定的属性是否全部都发生了变化。

参数 `name` 表示属性名称，可以为 Array 或 String，如果是字符串，则多个属性以空格分隔。


### anyChanged(name)

检查指定的属性是否至少有一个发生了变化。

参数 `name` 表示属性名称，可以为 Array 或 String，如果是字符串，则多个属性以空格分隔。


### changedAttributes(diff)

如果 `diff` 为否，则返回一个 Object 包含了所有变化的属性，如果没有属性发生变化，则返回 false。
如果 `diff` 为 Object，则检查 `diff` 与原 `_attributes` 的差异，如果有差异，则返回变化属性组成的 Object，否则返回 false。


### clear(options)

清空 `_attributes`。
如果 `options.silent` 为 `true`，则表示静默操作，不会触发 `change` 或 `change:` 事件。


### clone() 

返回一个当前宿主对象的副本。


### destroy()

销毁当前宿主对象，包括清空属性、停止监听事件、停止转发事件、停止观察对象。


### get(name)

`name` 为 `String`，获取属性值。


### has(name)

返回布尔值，表示是否拥有某个属性。


### hasChanged(name)


### previous(name)


### previousAttributes()


### set(key, val, options)


### toJSON()


### unset(attr, options)


### watch(obj, original, destination)


### stopWatching(obj, original, destination)


### preventWatching()


### keys()

### values()

### pairs()

### invert()

### pick()

### omit()

### chain()

### isEmpty()
