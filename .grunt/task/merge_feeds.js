'use strict';

module.exports = function (grunt) {
  var taskName = 'merge_feeds';
  var taskDescription = 'Merge feed(s) into a feed.';

  grunt.registerMultiTask(taskName, taskDescription, function () {
    var fs = require('fs');
    var xml2js = require('xml2js');

    var options = this.options();
    var _loadRSS = function (file) {
      var feed = {};

      xml2js.parseString(fs.readFileSync(file, 'utf8'), {
        explicitArray: false,
        trim: true
      }, function (error, data) {
        if (error) {
          grunt.fail.warn(error);
        }

        feed = data.rss;
      });

      return feed;
    };

    this.files.forEach(function (file) {
      var into = _loadRSS(file.src.shift());
      file.src.forEach(function (src) {
        var feed = _loadRSS(src);
        into.channel.item = into.channel.item.concat(feed.channel.item);
      });
      into.channel.item.sort(function (itemA, itemB) {
        var dateA = new Date(itemA.pubDate).getTime();
        var dateB = new Date(itemB.pubDate).getTime();

        return dateA - dateB;
      }).reverse();
      into.$ = {
        'version': '2.0',
        'xml:lang': 'ja-JP',
        'xmlns:atom': 'http://www.w3.org/2005/Atom',
        'xmlns:content': 'http://purl.org/rss/1.0/modules/content/',
        'xmlns:creativeCommons': 'http://backend.userland.com/creativeCommonsRssModule'
      };
      into.channel.lastBuildDate = into.channel.item[0].pubDate;
      fs.writeFileSync(file.dest, new xml2js.Builder({
        options: {
          allowSurrogateChars: true
        },
        rootName: 'rss',
        xmldec: {
          encoding: 'UTF-8'
        }
      }).buildObject(into) + '\n');
      grunt.log.writeln('File "' + file.dest + '" created.');
    });
  });
};
