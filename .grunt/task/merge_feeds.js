'use strict';

module.exports = function (grunt) {
  var taskName = 'merge_feeds';
  var taskDescription = 'Merge feed(s) into a feed.';

  grunt.registerTask(taskName, taskDescription, function () {
    var fs = require('fs');
    var xml2js = require('xml2js');

    var dest = 'build/feed';
    var loadFeed = function (file) {
      var feed = {};
      xml2js.parseString(fs.readFileSync(file, 'utf8'), {
        explicitArray: false,
        trim: true
      }, function (error, data) {
        if (error) {
          throw error;
        }

        feed = data;
      });

      return feed;
    };
    var src = [
      'src/feed/index.rss',
      'build/blog/feed'
    ];

    var feed = loadFeed(src.shift());
    var items = feed.rss.channel.item;
    src.forEach(function (s) {
      items = items.concat(loadFeed(s).rss.channel.item);
    });
    feed.rss.channel.item = items.sort(function (a, b) {
      return new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime();
    }).reverse();
    feed.rss.channel.lastBuildDate = feed.rss.channel.item[0].pubDate;
    grunt.file.write(dest, new xml2js.Builder({
      xmldec: {
        encoding: 'UTF-8',
        version: '1.0'
      }
    }).buildObject(feed) + '\n');
    grunt.log.writeln('File "' + dest + '" created.');
  });
};
