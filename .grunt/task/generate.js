/* jshint node:true */
'use strict';

module.exports = function (grunt) {
  var taskName = 'generate';
  var taskDescription = 'Generate files.';

  grunt.registerMultiTask(taskName, taskDescription, function () {
    var _ = require('lodash');
    var async = require('async');
    var fs = require('fs');
    var hbs = require('handlebars');
    var parseXML = require('xml2js').parseString;
    var path = require('path');
    var sprintf = require('sprintf').sprintf;

    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var categoryNames = {
      'Blog': 'blog',
      'Blosxom': 'blosxom',
      'Coding': 'coding',
      'Gadget': 'gadget',
      'Game': 'game',
      'Internet': 'internet',
      'Media': 'media',
      'Miscellaneous': 'misc',
      'RSS': 'rss',
      'Software': 'software',
      'Sports': 'sports',
      'Web Design': 'webdesign',
    };

    var done = this.async();
    var dirTemplate = this.data.cwd;
    var metadataBase = grunt.file.readJSON(dirTemplate + 'metadata.json');
    var partials = _loadSharedPartials();

    async.each(this.files, function (file, next) {
      var fileTemplate = file.src[0];

      if (!grunt.file.exists(fileTemplate)) {
        grunt.log.warn('Source file "' + fileTemplate + '" not found.');

        return next();
      }

      dirTemplate = path.dirname(fileTemplate);
      var metadata = _extendData(fileTemplate);
      var template = grunt.file.read(fileTemplate);
      var render = hbs.compile(template);
      var rendered = render(metadata, {
        partials: partials
      });
      rendered = rendered.replace(/^[ \t]+$\n/gm, '');
      grunt.file.write(file.dest, rendered);
      grunt.log.writeln('File "' + file.dest + '" created.');
      next();
    }, function (error) {
      done(error);
    });

    function _loadSharedPartials() {
      var dir = path.join(dirTemplate, 'shared');
      var partials = {};

      var files = fs.readdirSync(dir);

      for (var i = 0, l = files.length; i < l; i++) {
        var file = files[i];
        var name = path.basename(file, '.mustache');
        partials[name] = grunt.file.read(path.join(dir, file)).replace(/\n$/, '');
      }

      return partials;
    }

    function _extendData(file) {
      var data = _.extend({}, metadataBase);
      var fileMetadata = file.replace(/\.\w+$/, '.json');

      if (grunt.file.isFile(fileMetadata)) {
        _.extend(data, grunt.file.readJSON(fileMetadata));
      }

      switch (file) {
        case '.grunt/html/index.mustache': {
          data.updates = _loadRSS('feed');
          data.updates.item = data.updates.item.slice(0, 5);
          data.articles = _loadRSS('blog/feed');
          data.articles.item = data.articles.item.slice(0, 6);
          data.articles.first = data.articles.item.shift();
          var imgs = data.articles.first['content:encoded'].match(/<img.*?>/g);

          if (imgs) {
            var img = imgs[0].replace(/src="http:\/\/hail2u\.net/, 'src="');
            data.articles.first.image = img;
            data.articles.first.hasImage = true;
          }

          break;
        }

        case '.grunt/html/blog/index.mustache': {
          data.articles = _loadArticles('.grunt/weblog/plugins/state/files_index.dat');

          break;
        }
      }

      return data;
    }

    function _loadRSS(file) {
      var feed = {};

      parseXML(grunt.file.read(file), {
        trim: true,
        explicitArray: false
      }, function (error, data) {
        if (error) {
          grunt.fail.warn(error);
        }

        feed = data.rss.channel;
      });

      feed.item.forEach(function (val) {
        if (val.link) {
          val.link = val.link.replace('http://hail2u.net/', '/');
        }

        if (val.pubDate) {
          var date = new Date(val.pubDate);
          var yy = date.getFullYear();
          var mm = date.getMonth();
          var dd = date.getDate();
          var hh = date.getHours();
          var nn = date.getMinutes();
          var ss = date.getSeconds();
          val.strPubDate = monthNames[mm] + ' ' + dd + ', ' + yy;
          val.html5PubDate = sprintf(
            '%04d-%02d-%02dT%02d:%02d:%02d+09:00',
            yy, mm + 1, dd, hh, nn, ss
          );
        }

        if (val.category) {
          val.cat = categoryNames[val.category];
        }
      });

      return feed;
    }

    function _loadArticles(data) {
      var cache = path.join(path.dirname(data), 'articles.json');
      var articles = JSON.parse(grunt.file.read(cache));
      var fileNew = path.basename(grunt.option('file'));

      if (grunt.cli.tasks[0] === 'publish:blog' && fileNew) {
        grunt.file.read(data).split(/\r?\n/).forEach(function (line) {
          if (!/\d+$/.test(line) || line.indexOf(fileNew) < 0) {
            return;
          }

          line = line.split('=>');
          var file = path.relative(process.cwd(), line[0]);
          var date = new Date(parseInt(line[1]) * 1000);
          var yy = date.getFullYear();
          var mm = date.getMonth();
          var dd = date.getDate();
          var hh = date.getHours();
          var nn = date.getMinutes();
          var ss = date.getSeconds();
          var article = {};
          article.title = grunt.file.read(file).split(/\n/)[0];
          article.link = '/blog/' +
            path.dirname(file).split(path.sep).pop() + '/' +
            path.basename(file).replace(/\.txt$/, '.html');
          article.unixtime = date.getTime();
          article.year = yy;
          article.month = mm + 1;
          article.day = dd;
          article.hour = hh;
          article.minute = nn;
          article.second = ss;
          article.tz = '+09:00';
          article.strPubDate = monthNames[mm] + ' ' + dd + ', ' + yy;
          article.html5PubDate = sprintf(
            '%04d-%02d-%02dT%02d:%02d:%02d+09:00',
            yy, mm + 1, dd, hh, nn, ss
          );

          articles.unshift(article);
          articles = _.sortBy(articles, 'unixtime').reverse();
          grunt.file.write(cache, JSON.stringify(articles));
        });
      }

      var currentYear = false;
      articles.forEach(function (article, index) {
        if (currentYear && article.year !== currentYear) {
          article.isFirstInYear = true;
          articles[index - 1].isLastInYear = true;
        }

        currentYear = article.year;
      });
      articles[0].isFirstInYear = true;
      articles[articles.length - 1].isLastInYear = true;
      _.filter(articles, 'isLastInYear')[0].isLastInLatestYear = true;

      return articles;
    }
  });
};
