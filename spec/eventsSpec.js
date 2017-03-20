/*
 * @Author: laixi
 * @Date:   2017-03-10 17:18:58
 * @Last Modified by:   laixi
 * @Last Modified time: 2017-03-14 15:21:33
 */
var Jackbone = require('../build/jackbone-0.2.0');
var _ = require('underscore');

describe('Jackbone Events Testing.', () => {

  var foo = _.extend({ name: 'foo' }, Jackbone.Events);
  var bar = _.extend({ name: 'bar' }, Jackbone.Events);

  // Test Events.forward method without passing a destination argument.
  it('Forward without an explicit destination.', () => {

    foo.forward(bar, 'some:change');

    foo.on('all', (eventName) => {
      expect(eventName).toEqual('some:change');
    });

    bar.trigger('some:change', bar);

    foo.off('all');
  });

  it('Forward with an explicit destination.', () => {

    foo.forward(bar, 'bar:change', 'foo:change');

    foo.on('all', (eventName) => {
      expect(eventName).toEqual('foo:change');
    });

    bar.trigger('bar:change');

    foo.off();
  });

  it('ForwardOnce.', () => {
    var count = 0;
    foo.forwardOnce(bar, 'once');
    foo.on('once', () => {
      count++;
    });
    bar.trigger('once');
    bar.trigger('once');
    expect(count).toEqual(1);
    foo.off();
  });

  it('StopForwarding by passing the only first argument.', () => {
    var count = 0;
    foo.forward(bar, 'test:stopForwarding');
    foo.on('test:stopForwarding', () => {
      count++;
    });
    foo.stopForwarding(bar);
    bar.trigger('test:stopForwarding');
    foo.off();
    expect(count).toEqual(0);
  });

  it('StopForwarding by passing the only first two arguments.', () => {
    var count = 0;
    foo.forward(bar, 'test:stopForwarding');
    foo.on('test:stopForwarding', () => {
      count++;
    });
    foo.stopForwarding(bar, 'test:stopForwarding');
    bar.trigger('test:stopForwarding');
    foo.off();
    expect(count).toEqual(0);
  });

  // Bug: 
  // 如果 foo.forward 显式给定了一个与原事件相同的转发事件名，
  // 则 stopForwarding 方法中也必须显式给定与原事件相同的转发事件名。
  // 期望的是在 stopForwarding 方法中无需显式指定转发事件名。
  it('StopForwarding by passing the all three arguments.', () => {
    var count = 0;
    foo.forward(bar, 'test:stopForwarding');
    foo.on('test:stopForwarding', () => {
      count++;
    });
    foo.stopForwarding(bar, 'test:stopForwarding', 'test:stopForwarding');
    bar.trigger('test:stopForwarding');
    foo.off();
    expect(count).toEqual(0);
  });


  it('StopForwarding by passing the all three arguments which are exactly same as passing in forward.', () => {
    var count = 0;
    foo.forward(bar, 'test:stopForwarding', 'bar:stopForwarding');
    foo.on('bar:stopForwarding', () => {
      count++;
    });
    foo.stopForwarding(bar, 'test:stopForwarding', 'bar:stopForwarding');
    bar.trigger('test:stopForwarding');
    foo.off();
    expect(count).toEqual(0);
  });
});
