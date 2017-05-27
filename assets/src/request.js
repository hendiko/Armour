/*
 * @Author: laixi
 * @Date:   2017-05-15 15:15:39
 * @Last Modified by:   laixi
 * @Last Modified time: 2017-05-15 17:32:16
 *
 * Backbone.Request 发起 AJAX 请求
 */
import _ from 'underscore';
import Backbone from './core';
import Events from './events';

var urlError = function() {
  throw new Error('A "url" property or function must be specified');
};

var Request = _.extend({

  request: function(options) {
    options || (options = {});
    this.requestError(options);
    this.requestSuccess(options);
    if (!options.url) {
      options.url = _.result(this, 'url') || urlError();
    }
    var xhr = options.xhr = Backbone.ajax(_.defaults(options, { dataType: 'json', parse: true, validate: true }));
    this.trigger('request', this, xhr, options);
    return xhr;
  },

  requestError: function(options) {
    var model = this;
    var error = options.error;
    options.error = function(resp) {
      if (error) error.call(options.context || model, model, resp, options);
      model.trigger('error', model, resp, options);
    };
  },

  requestSuccess: function(options) {
    var model = this;
    var success = options.success;
    var validateResponse = options.validateResponse || model.validateResponse;
    var parseResponse = options.parseResponse || model.parseResponse;
    options.success = function(resp) {
      var error = options.validate && _.isFunction(validateResponse) ? validateResponse.call(model, resp, options) : null;
      if (error) {
        model.trigger('fail', model, error, _.extend(options, { validationError: error }));
      } else {
        var data = options.parse && _.isFunction(parseResponse) ? parseResponse.call(model, resp, options) : resp;
        if (success) success.call(options.context || model, data, options);
        model.trigger('success', model, data, options);
      }
    };
  }

}, Events);

export default Request;
