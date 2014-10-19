'use strict';

module.exports = function (grunt) {
  var taskName = 'generate';
  var taskDescription = 'Generate files.';

  grunt.registerMultiTask(taskName, taskDescription, function () {
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
      var dir = path.join(dirTemplate, 'partial');
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
      var data = _extendObject({}, metadataBase);
      var fileMetadata = file.replace(/\.\w+$/, '.json');

      if (grunt.file.isFile(fileMetadata)) {
        _extendObject(data, grunt.file.readJSON(fileMetadata));
      }

      switch (file) {
        case 'src/html/index.mustache': {
          data.updates = _loadRSS('src/feed/index.rss');
          data.updates.item = data.updates.item.slice(0, 5);
          data.articles = _loadRSS('build/blog/feed');
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

        case 'src/html/blog/index.mustache': {
          data.articles = _loadArticles('src/weblog/plugins/state/files_index.dat');

          break;
        }
      }

      return data;
    }

    function _extendObject(dest, src) {
      if (dest !== Object(dest)) {
        return dest;
      }

      for (var prop in src) {
        dest[prop] = src[prop];
      }

      return dest;
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
      var cache = path.join(__dirname, '.cache', 'articles.json');
      var articles = JSON.parse(grunt.file.read(cache));
      var fileNew = path.basename(grunt.option('file'));

      if (grunt.cli.tasks[0] === 'publish:blog' && fileNew) {
        grunt.file.read(data).split(/\r?\n/).forEach(function (line) {
          if (!/\d+$/.test(line) || line.indexOf(fileNew) < 0) {
            return;
          }

          line = line.split('=>');
          var file = path.relative(process.cwd(), line[0]);
          var category = path.dirname(file).split(path.sep).pop();
          var fn = path.basename(file, '.txt');
          var date = new Date(parseInt(line[1], 10) * 1000);
          var yy = date.getFullYear();
          var mm = date.getMonth();
          var dd = date.getDate();
          var hh = date.getHours();
          var nn = date.getMinutes();
          var ss = date.getSeconds();
          var article = {
            title: grunt.file.read(file).split(/\n/)[0],
            link: '/blog/' + category + '/' + fn  + '.html',
            unixtime: date.getTime(),
            year: yy,
            month: mm + 1,
            day: dd,
            hour: hh,
            minute: nn,
            second: ss,
            tz: '+09:00',
            strPubDate: monthNames[mm] + ' ' + dd + ', ' + yy,
            html5PubDate: sprintf(
              '%04d-%02d-%02dT%02d:%02d:%02d+09:00',
              yy, mm + 1, dd, hh, nn, ss
            )
          };
          articles.unshift(article);
          articles.sort(function (a, b) {
            return parseInt(a.unixtime, 10) - parseInt(b.unixtime, 10);
          }).reverse();
          grunt.log.writeln('File "' + cache + '" updated.');
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
      articles.filter(function (article) {
        return article.isLastInYear;
      })[0].isLastInLatestYear = true;

      return articles;
    }
  });
};
