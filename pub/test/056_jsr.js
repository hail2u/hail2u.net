// jsr.js - jsonScriptRequest
//
// This class based on jsr_class.js.
// See Also: http://www.xml.com/pub/a/2005/12/21/json-dynamic-script-tag.html
//
// Copyright (c) 2006 Kyo Nagashima <kyo@hail2u.net>
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var jsonScriptRequest = Class.create();

jsonScriptRequest.prototype = {
  initialize: function () {
    this.head = document.getElementsByTagName('head').item(0);
  },

  build: function (url) {
    if (!url.match(/\?/)) url += '?dummy=1';
    this.scriptElement = document.createElement("script");
    this.scriptElement.setAttribute("type",    "text/javascript");
    this.scriptElement.setAttribute("charset", "UTF-8");
    this.scriptElement.setAttribute("src",     url + '&nocache=' + (new Date()).getTime());
  },

  add: function () {
    this.head.appendChild(this.scriptElement);
  },

  remove: function () {
    this.head.removeChild(this.scriptElement);
  }
};
