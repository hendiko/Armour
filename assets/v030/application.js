/*
* @Author: laixi
* @Date:   2017-03-20 15:10:33
* @Last Modified by:   laixi
* @Last Modified time: 2017-03-20 15:15:04
*/
var _ = require('underscore');
var Backbone = require('./core');
var utils = require('./utils');

var delegate = utils.delegate;
var slice = utils.slice;
var isRefCycle = utils.isRefCycle;


var Application = Backbone.Application = function() {};


_.extend(Application.prototype, Backbone.Events, {});

module.exports = Application;