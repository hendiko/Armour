/*
 * @Author: laixi
 * @Date:   2017-03-14 15:56:53
 * @Last Modified by:   laixi
 * @Last Modified time: 2017-03-20 15:34:32
 */
var Jackbone = require('../build/jackbone-0.2.0');
var _ = require('underscore');

describe('Jackbone.Controller#event', () => {
  var controller, model;

  beforeEach(() => {
    controller = new Jackbone.Controller();
    model = new Jackbone.Model();
  });

  it('control:attr', () => {
    var ops = {
      callback: function(name, ctx) {
        return ctx;
      }
    };
    spyOn(ops, 'callback').and.returnValue(model);
    controller.on('control:model', ops.callback);
    controller.set('model', model);
    model.trigger('hello', model);
  });

  it('control', () => {
    var ops = {
      callback: function(attr, event, ctx) {
        return ctx;
      }
    };
    spyOn(ops, 'callback').and.returnValue(model);
    controller.on('control', ops.callback);
    controller.set('model', model);
    model.trigger('hello', model);
  });
});


describe('Jackbone.Controller#methods', () => {
  var controller, model, callback;

  beforeEach(() => {
    controller = new Jackbone.Controller();
    model = new Jackbone.Model();
    callback = jasmine.createSpy('callback');
  });

  // 调用 unset 方法，controller 不再监听 attr 
  it('unset', () => {
    controller.on('control', callback);
    controller.set('model', model);
    model.trigger('hello');
    expect(callback).toHaveBeenCalled();
    
    var callback2 = jasmine.createSpy('callback');
    controller.on('control', callback2);
    controller.unset('model', model);
    model.trigger('hello');
    expect(callback2).not.toHaveBeenCalled();
  });
});
