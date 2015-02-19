'use strict';

module.exports = function (grunt) {
  var taskName = 'preview_blosxom_entry';
  var taskDescription = 'Preview Blosxom entry in default browser.';

  grunt.registerTask(taskName, taskDescription, function () {
    var fs = require('fs-extra');
    var marked = require('marked');
    var path = require('path');
    var spawn = require('child_process').spawnSync;
    var which = require('which').sync;

    var file = grunt.option('file');
    var preview = '<!DOCTYPE html>\n' +
      '<html lang="ja">\n' +
      '  <head>\n' +
      '    <meta charset="UTF-8">\n' +
      '\n' +
      '    <title><%TITLE%> - Weblog - Hail2u.net</title>\n' +
      '\n' +
      '    <link href="/favicon.ico" rel="icon">\n' +
      '    <link href="/styles/style.min.css" rel="stylesheet">\n' +
      '\n' +
      '    <script async src="/scripts/main.min.js"></script>\n' +
      '  </head>\n' +
      '\n' +
      '  <body class="permalink">\n' +
      '    <header class="global-header" role="banner">\n' +
      '      <mark class="logo"><img alt="Hail2u.net" src="/images/logo.min.svg"></mark>\n' +
      '    </header>\n' +
      '\n' +
      '    <main class="content" role="main">\n' +
      '      <article id="<%FN%>">\n' +
      '        <h1><%TITLE%></h1>\n' +
      '\n' +
      '        <footer class="section-footer">\n' +
      '          <p>on <time datetime="1976-07-23" pubdate>Jul 23, 1976</time> under <span class=tag"><a href="#">Preview</a></span></p>\n' +
      '        </footer>\n' +
      '\n' +
      '        <%BODY%>\n' +
      '      </article>\n' +
      '    </main>\n' +
      '\n' +
      '    <footer class="global-footer" role="contentinfo">\n' +
      '      <section class="footlinks">\n' +
      '        <ul>\n' +
      '          <li><a href="http://creativecommons.org/licenses/by-nc/4.0/" rel="license">CC BY-NC</a></li>\n' +
      '          <li><a href="https://twitter.com/hail2unet">Twitter</a></li>\n' +
      '          <li><a href="https://www.facebook.com/hail2u.net">Facebook</a></li>\n' +
      '          <li><a href="http://u2liah.tumblr.com/">Tumblr</a></li>\n' +
      '          <li><a href="http://hail2u.net/feed" rel="alternate" type="application/rss+xml">RSS</a></li>\n' +
      '        </ul>\n' +
      '      </section>\n' +
      '\n' +
      '      <p id="author" class="byline" itemprop="author" itemscope itemtype="http://schema.org/Person">Made by <span itemprop="name"><a href="https://kyonagashima.com/" rel="author" itemprop="url">Kyo Nagashima</a></span>.</p>\n' +
      '    </footer>\n' +
      '\n' +
      '    <aside class="subcontent">\n' +
      '      <!-- Google Custom Search Engine -->\n' +
      '      <form class="site-search searchbox" action="https://www.google.com/cse" role="search">\n' +
      '        <input name="cx" type="hidden" value="partner-pub-8712792805045949:3747342316">\n' +
      '        <input name="ie" type="hidden" value="UTF-8">\n' +
      '        <input class="query" name="q" size="32" type="search">\n' +
      '        <input class="button" name="sa" type="submit" value="Search">\n' +
      '      </form>\n' +
      '    </aside>\n' +
      '  </body>\n' +
      '</html>\n';
    var preview_file = path.resolve(process.cwd(), 'tmp/__preview.html');
    var fn = path.basename(file, '.txt').replace(/\$/g, '$$');
    var entry = fs.readFileSync(file, 'UTF-8').split('\n');
    var title = entry.shift().replace(/\$/g, '$$$$');
    var body = entry.join('\n').replace(/\$/g, '$$$$');

    if (!/<\/\w+>\s*$/.test(body)) {
      body = marked(body, {
        langPrefix: 'language-'
      });
    }

    body = body.replace(/(href|src)="\/images\//g, '$1="../src/img/');
    preview = preview.replace(/<%FN%>/g, fn).replace(/<%TITLE%>/g, title).replace(/<%BODY%>/g, body).replace(/="\//g, '="../build/');
    fs.outputFileSync(preview_file, preview);
    grunt.log.writeln('File "' + preview_file + '" created.');
    var child = spawn(which('open'), [preview_file]);

    if (child.error) {
      grunt.fail.warn(child.error);
    }
  });
};
