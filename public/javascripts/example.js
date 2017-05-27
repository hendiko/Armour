/*
 * @Author: laixi
 * @Date:   2017-05-27 16:43:46
 * @Last Modified by:   laixi
 * @Last Modified time: 2017-05-27 16:54:06
 */
var View = Backbone.View.extend({

  initialize: function() {
    this.render();
  },

  render: function() {
    this.html(this.template({ view: this.toJSON() }));
  },

  template: _.template('<h1><%- view.title %></h1>')
});

var view = new View({el: $('#app'), data: {title: 'hello world'}});
