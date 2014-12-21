#!/usr/bin/env node

/*!
 * mdtoc - The markdown ToC generator
 *
 * Write:
 *
 *     Test
 *     ====
 *     
 *     <!-- #toc -->
 *     <!-- /toc -->
 *     
 *     Foo
 *     ---
 *     
 *     ### Foo Foo
 *     
 *     ### Foo Bar
 *     
 *     Bar
 *     ---
 *     
 *     ### Bar Foo
 *
 * Then run:
 *
 *     $ mdtoc foo.md
 *
 * Get:
 *
 *     Test
 *     ====
 *     
 *     <!-- #toc -->
 *     
 *     * [Foo](#foo)
 *       * [Foo Foo](#foo-foo)
 *       * [Foo Bar](#foo-bar)
 *     * [Bar](#bar)
 *       * [Bar Foo](#bar-foo)
 *     
 *     <!-- /toc -->
 *     
 *     Foo
 *     ---
 *     
 *     ### Foo Foo
 *     
 *     ### Foo Bar
 *     
 *     Bar
 *     ---
 *     
 *     ### Bar Foo
 */

'use strict';

var fs = require('fs');
var marked = require('marked');
var os = require('os');

var file = 'README.md';
var indent = '  ';
console.log(process.argv);

if (process.argv.length > 2) {
  file = process.argv[2];
}

var markdown = fs.readFileSync(file, 'utf8');
var eol = getEol(markdown);
var headings = [];
var renderer = new marked.Renderer();
renderer.heading = function (t, l, r) {
  headings.push({
    l: l,
    r: r
  });

  return;
};
marked(markdown, {
  renderer: renderer
});
fs.writeFileSync(file, markdown.split(eol).map(function (l) {
  if (l === '<!-- #toc -->') {
    this.skip = true;

    return l + eol + eol + buildToc(headings).trim();
  }

  if (l === '<!-- /toc -->') {
    l = eol + l;
    this.skip = false;
  }

  if (this.skip) {
    return undefined;
  }

  return l;
}, {
  skip: false
}).filter(function (l) {
  return l !== undefined;
}).join(eol));

function getEol(s) {
  var cr = '\r';
  var lf = '\n';
  var crlf = '\r\n';

  if (!s) {
    return os.EOL;
  }

  var r = s.split(cr).length;
  var n = s.split(lf).length;
  var rn = s.split(crlf).length;

  if (r === rn && n === rn) {
    return crlf;
  }

  if (r > n) {
    return cr;
  }

  return lf;
}

function buildToc(a) {
  a.shift();

  return a.map(function (v) {
    var i = new Array(Math.max(0, v.l - a[0].l + 1)).join(indent);
    var id = encodeURIComponent(
      v.r.toLowerCase().replace(
        /[<>&+$,/:;=?@\"#{}|^~[\]`\\*()%.!']/g,
        ''
      ).replace(
        /\s/g,
        '-'
      )
    );

    return i + '* [' + v.r + '](#' + id + ')';
  }).join(eol);
}
