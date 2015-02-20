'use strict';

module.exports = function (grunt) {
  var taskName = 'blosxom';
  var taskDescription = 'Generate Blosxom files.';

  grunt.registerMultiTask(taskName, taskDescription, function () {
    var ProgressBar = require('progress');
    var async = require('async');
    var fs = require('fs-extra');
    var marked = require('marked');
    var path = require('path');
    var spawn = require('child_process').spawnSync;
    var which = require('which').sync;

    var done = this.async();
    var options = this.options({
      all: false,
      feed: false,
      index: false,
      preview: false,
      reindex: false
    });
    var args = ['blosxom.cgi'];
    var bar;
    var entry = grunt.option('file');
    var files = [];
    var fileCache = path.resolve(options.rootdir, 'plugins/state/files_index.dat');
    var num = 1;

    if (options.preview) {
      var preview = `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">
    <meta content="width=device-width" name="viewport">

    <title><%TITLE%> - Weblog - Hail2u.net</title>

    <link href="/apple-touch-icon.png" rel="apple-touch-icon" type="image/png">
    <link href="/feed" rel="alternate" type="application/rss+xml">

    <link href="/styles/style.min.css" rel="stylesheet">

    <script async src="/scripts/main.min.js"></script>
  </head>

  <body>
    <header class="global-header" role="banner">
      <nav>
        <a class="logo" href="/"><img alt="Hail2u.net" src="/images/logo.min.svg"></a>

        <ul class="site-navigation">
          <li><a href="/blog/"><mark>Weblog</mark></a></li>
          <li><a href="/documents/">Documents</a></li>
          <li><a href="/about/">About</a></li>
        </ul>
      </nav>
    </header>

    <main class="content">
      <article id="<%FN%>" role="main">
        <h1 class="first-heading"><%TITLE%></h1>

        <footer class="section-footer">
          <p>on <time datetime="1976-07-23">Jul 23, 1976</time> under <span class="tag"><a href="#">Preview</a></span></p>
        </footer>

        <%BODY%>
      </article>
    </main>

    <footer class="global-footer" role="contentinfo">
      <section class="footlinks">
        <ul>
          <li><a href="http://creativecommons.org/licenses/by-nc/4.0/" rel="license">CC BY-NC</a></li>
          <li><a href="https://twitter.com/hail2unet">Twitter</a></li>
          <li><a href="https://www.facebook.com/hail2u.net">Facebook</a></li>
          <li><a href="http://u2liah.tumblr.com/">Tumblr</a></li>
          <li><a href="/feed" rel="alternate" type="application/rss+xml">RSS</a></li>
        </ul>
      </section>

      <p id="author" class="byline" itemprop="author" itemscope itemtype="http://schema.org/Person">Made by <span itemprop="name"><a href="https://kyonagashima.com/" rel="author" itemprop="url">Kyo Nagashima</a></span>.</p>
    </footer>

    <aside class="subcontent">
      <!-- Google Custom Search Engine -->
      <form class="site-search" action="https://www.google.com/cse" role="search">

        <input name="cx" type="hidden" value="partner-pub-8712792805045949:3747342316">
        <input name="ie" type="hidden" value="UTF-8">
        <input class="query" name="q" size="32" type="search">
        <input class="button" name="sa" type="submit" value="Search">
      </form>
    </aside>
  </body>
</html>`;
      var filePreview = path.resolve(process.cwd(), 'tmp/__preview.html');
      var body = fs.readFileSync(entry, 'UTF-8').split('\n');
      var title = body.shift().replace(/\$/g, '$$$$');
      body = body.join('\n').replace(/\$/g, '$$$$');

      if (!/<\/\w+>\s*$/.test(body)) {
        body = marked(body, {
          langPrefix: 'language-'
        });
      }

      body = body.replace(/(href|src)="\/images\//g, '$1="../src/img/');
      preview = preview.replace(/<%TITLE%>/g, title).replace(/<%BODY%>/g, body).replace(/="\//g, '="../build/');
      fs.outputFileSync(filePreview, preview);
      grunt.log.writeln('File "' + filePreview + '" created.');
      return done(spawn(which('open'), [filePreview]).error);
    }

    if (options.feed) {
      files.push('index.rss');
    }

    if (options.reindex) {
      args.push('reindex=1');
    }

    if (options.all) {
      fs.readdirSync(options.datadir).forEach(function (dir) {
        if (dir === 'themes') {
          return;
        }

        files.push(dir + '\\index.html');
      });

      if (!options.index) {
        fs.readFileSync(
          fileCache,
          'utf8'
        ).split(/\r?\n/).forEach(function (file) {
          if (file === '') {
            return;
          }

          file = path.relative(options.datadir, file.split('=>')[0]);
          files.push(file);
        });
      }

      bar = new ProgressBar('Rebuilding [:bar] :percent :elapsed', {
        total: files.length,
        width: 32
      });
    } else if (entry) {
      var i = 0;
      var n = 'image';
      var images = fs.readFileSync(entry, 'utf-8').match(/\bsrc=".*?"/g);

      if (path.resolve(entry) === path.normalize(entry)) {
        entry = path.relative(options.datadir, entry);
        files.unshift(entry);
      }

      if (options.index) {
        entry = path.join(path.dirname(entry), 'index.html');
        files.push(entry);
      }

      if (images) {
        images.forEach(function (image) {
          image = image.replace(/^src="\/images\/blog\/(.*?)"$/, '$1');
          var src = options.imgdir + image;
          var dest = options.staticimgdir + image;

          if (fs.statSync(src).isFile()) {
            fs.copySync(src, dest);
            i++;
            grunt.verbose.writeln('Image "' + src + '" copied to "' + dest + '".');
          }
        });

        if (i > 1) {
          n += 's';
        }

        grunt.log.writeln(i + ' ' + n + ' copied.');
      } else {
        grunt.log.writeln('Image not found.');
      }
    }

    files = files.map(function (file) {
      return file.replace(/\.txt$/, '.html').replace(/\\/g, '/');
    });

    if (files.length > 8) {
      num = 8;
    }

    async.eachLimit(files, num, function (file, next) {
      var child = spawn(
        which('C:/perl/bin/perl'),
        args.concat('path=/' + file), {
          cwd: options.rootdir,
          encoding: 'utf8',
          env: {
            BLOSXOM_CONFIG_DIR: path.resolve(options.rootdir)
          }
        }
      );

      if (child.error) {
        return next(child.error);
      }

      if (file === 'index.rss') {
        file = 'feed';
      }

      var contents = child.stdout.replace(
        /^[\s\S]*?\r?\n\r?\n/,
        ''
      ).replace(
        /\b(href|src)(=")(https?:\/\/hail2u\.net\/)/g,
        '$1$2/'
      ).trim() + '\n';
      file = options.staticdir + file;
      fs.outputFileSync(file, contents);

      if (bar) {
        bar.tick();
      } else {
        grunt.log.writeln('File "' + file + '" created.');
      }

      if (num === 1 && args.length === 2) {
        args.pop();
      }

      next();
    }, function (error) {
      done(error);
    });
  });
};
