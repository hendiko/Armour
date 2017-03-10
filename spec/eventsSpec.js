/*
 * @Author: laixi
 * @Date:   2017-03-10 17:18:58
 * @Last Modified by:   laixi
 * @Last Modified time: 2017-03-10 18:49:53
 */
var Jackbone = require('../build/jackbone');
var _ = require('underscore');

describe('Jackbone Events Testing.', () => {

  var foo = _.extend({ name: 'foo' }, Jackbone.Events);
  var bar = _.extend({ name: 'bar' }, Jackbone.Events);

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
});