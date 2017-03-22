/*
 * @Author: laixi
 * @Date:   2017-03-14 15:14:45
 * @Last Modified by:   laixi
 * @Last Modified time: 2017-03-22 18:08:49
 */
var Jackbone = require('../build/jackbone-0.3.0');
var _ = require('underscore');

describe('Jackbone.Model#watch.', function() {
  var foo, bar;

  beforeEach(() => {
    foo = new Jackbone.Model();
    bar = new Jackbone.Model();
  });

  it('watch(obj)', () => {
    foo.watch(bar);
    bar.set({ x: 1, y: 2 });
    expect(foo.toJSON()).toEqual(bar.toJSON());
  });

  it('watch(obj, original[, destination])', () => {
    foo.watch(bar, 'x');
    bar.set({ x: 1, y: 2 });
    expect(foo.get('x')).toEqual(bar.get('x'));

    foo.watch(bar, 'x', 'X');
    bar.set({ x: 10, y: 20 });
    expect(foo.get('x')).not.toEqual(bar.get('x'));
    expect(foo.get('X')).toEqual(bar.get('x'));
  });

  it('watch(obj, {original: destination})', () => {
    foo.watch(bar, { x: 'X' });
    bar.set({ x: 1, y: 2 });
    expect(foo.get('X')).toEqual(bar.get('x'));
  });

  it('watch(obj, [original1, original2])', () => {
    foo.watch(bar, ['x', 'y', 'z']);
    bar.set({ x: 1, y: 2, z: 3 });
    expect(foo.toJSON()).toEqual(bar.toJSON());
  });
});

describe('Jackbone.Model#stopWatching.', () => {
  var foo, bar, hee;

  beforeEach(() => {
    foo = new Jackbone.Model();
    bar = new Jackbone.Model();
    hee = new Jackbone.Model();
  });

  it('stopWatching()', () => {
    foo.watch(bar).watch(hee);
    bar.set({ x: 1 });
    expect(foo.get('x')).toEqual(bar.get('x'));
    hee.set({ y: 2 });
    expect(foo.get('y')).toEqual(hee.get('y'));

    foo.stopWatching();
    bar.set({ x: 10 });
    hee.set({ y: 20 });
    expect(foo.get('x')).not.toEqual(bar.get('x'));
    expect(foo.get('y')).not.toEqual(hee.get('y'));
  });

  it('stopWatching(obj)', () => {
    foo.watch(bar).watch(hee);
    bar.set({ x: 1 });
    expect(foo.get('x')).toEqual(bar.get('x'));
    hee.set({ y: 2 });
    expect(foo.get('y')).toEqual(hee.get('y'));

    foo.stopWatching(bar);
    bar.set({ x: 10 });
    hee.set({ y: 20 });
    expect(foo.get('x')).not.toEqual(bar.get('x'));
    expect(foo.get('y')).toEqual(hee.get('y'));
  });
});
