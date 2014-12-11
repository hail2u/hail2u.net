'use strict';

module.exports = function (grunt) {
  var taskName = 'preview_blosxom_entry';
  var taskDescription = 'Preview Blosxom entry in default browser.';

  grunt.registerTask(taskName, taskDescription, function () {
    var fs = require('fs');
    var marked = require('marked');
    var path = require('path');

    var done = this.async();
    var file = grunt.option('file');
    var preview = (function () {/*
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">

    <title><%TITLE%> - Weblog - Hail2u.net</title>

    <base href="<%ROOT%>">

    <link href="./favicon.ico" rel="icon">
    <link href="./styles/style.min.css" rel="stylesheet">
    <link href="./fonts/megrim.min.css" rel="stylesheet">
    <link href="./fonts/source-code-pro.min.css" rel="stylesheet">
    <link href="./fonts/source-sans-pro.min.css" rel="stylesheet">
  </head>

  <body class="permalink">
    <header class="global-header" role="banner">
      <h1 class="logo"><a href="./"><img alt="Hail2u.net" src="./images/logo.min.svg"></a></h1>

      <nav class="site-navigation">
        <ul>
          <li><a href="./blog/"><mark>Weblog</mark></a></li>
          <li><a href="./documents/">Documents</a></li>
          <li><a href="./projects/">Projects</a></li>
          <li><a href="./about/">About</a></li>
        </ul>
      </nav>
    </header>

    <main class="main" role="main">
      <article id="<%FN%>">
        <h1><%TITLE%></h1>

        <footer class="section-footer">
          <p>on <time datetime="1976-07-23" pubdate>Jul 23, 1976</time> under <span class=tag"><a href="#">Preview</a></span></p>
        </footer>

        <%BODY%>
      </article>
    </main>

    <aside class="subcontent" role="search">
      <!-- Google Custom Search Engine -->
      <form class="site-search searchbox" action="http://www.google.com/cse">
        <input name="cx" type="hidden" value="partner-pub-8712792805045949:3747342316">
        <input name="ie" type="hidden" value="UTF-8">
        <input class="query" name="q" size="32" type="search">
        <input class="button" name="sa" type="submit" value="Search">
      </form>
    </aside>

    <footer class="global-footer" role="contentinfo">
      <section class="footlinks">
        <ul>
          <li><a href="http://creativecommons.org/licenses/by-nc/3.0/" rel="license">CC BY-NC</a></li>
          <li><a href="./feed" rel="alternate" type="application/rss+xml">RSS</a></li>
        </ul>
      </section>

      <p id="author" class="byline" itemprop="author" itemscope itemtype="http://schema.org/Person">Made by <span itemprop="name"><a href="./about/" rel="author" itemprop="url">Kyo Nagashima</a></span>.</p>
    </footer>
  </body>
</html>
*/}).toString().split('\n').slice(1, -1).join('\n');
    var preview_file = path.resolve(__dirname, '../tmp/__preview.html');
    var root = 'file:///' + path.resolve(__dirname, '../../build/').replace(/\\/g, '/') + '/';

    var fn = path.basename(file, '.txt').replace(/\$/g, '$$');
    var entry = fs.readFileSync(file, 'UTF-8').split('\n');
    var title = entry.shift().replace(/\$/g, '$$$$');
    var body = entry.join('\n').replace(/\$/g, '$$$$');

    if (!/<\/\w+>\s*$/.test(body)) {
      body = marked(body, {
        langPrefix: 'language-'
      });
    }

    body = body.replace(/="\//g, '="./');
    preview = preview.replace(/<%ROOT%>/g, root).replace(/<%FN%>/g, fn).replace(/<%TITLE%>/g, title).replace(/<%BODY%>/g, body);
    fs.writeFileSync(preview_file, preview);
    grunt.log.writeln('File "' + preview_file + '" created.');
    grunt.util.spawn({
      cmd: 'open',
      args: [preview_file]
    }, function (error, result, code) {
      done(error);
    });
  });
};
