/*
 * @Author: laixi
 * @Date:   2017-05-27 16:43:46
 * @Last Modified by:   laixi
 * @Last Modified time: 2017-06-05 23:59:59
 */
var View = Backbone.View.extend({

  initialize: function() {
    this.render();
  },

  events: {
    'hello .h1': 'onHello'
  },

  onHello: function() {
    console.log(arguments);
  },

  render: function() {
    this.html(this.template({ view: this.toJSON() }));
  },

  template: _.template('<h1 class="h1"><%- view.title %></h1>')
});

var view = new View({el: $('#app'), data: {title: 'hello world'}});

var view2 = new View({data: {title: 'this is view2'}});

view.mount(view2);