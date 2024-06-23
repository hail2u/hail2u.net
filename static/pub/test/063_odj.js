/**
 * odj.js - On-Demand JavaScript
 *
 * Copyright (c) 2006 Kyo Nagashima <kyo@hail2u.net>
 * This library licensed under MIT license:
 * http://opensource.org/licenses/mit-license.php
 */

function onDemandJavaScript() {
  this.head = document.getElementsByTagName('head').item(0);
  this.counter = onDemandJavaScript.counter;
  onDemandJavaScript.counter++;
}

onDemandJavaScript.prototype = {
  request: function (url, callback, callbackParamName) {
    var self = this;

    onDemandJavaScript.jsonpCallbacks[this.counter] = function() {
      self._remove();
      callback.apply(self, arguments);
    }

    this._add(url + (url.indexOf('?') > 0 ? '&' : '?') + 'nocache=' + (new Date()).getTime() + '&' + callbackParamName + '=' + encodeURIComponent("onDemandJavaScript.jsonpCallbacks[" + this.counter + "]"));
  },

  _add: function (url) {
    var script = document.createElement("script");
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", url);
    script.setAttribute("charset", "UTF-8");
    this.head.appendChild(script);
    this._script = script;
  },

  _remove: function () {
    delete onDemandJavaScript.jsonpCallbacks[this.counter];
    this.head.removeChild(this._script);
  }
};

onDemandJavaScript.counter = 0;
onDemandJavaScript.jsonpCallbacks = [];
