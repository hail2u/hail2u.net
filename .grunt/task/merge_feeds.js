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

      xml2js.parseString(fs.readFileSync(file, 'utf-8'), {
        trim: true,
        explicitArray: false
      }, function (error, data) {
        if (error) {
          grunt.fail.warn(error);
        }

        feed = data.rss;
      });

      return feed;
    };

    var into = _loadRSS(options.into);
    options.feeds.forEach(function (feed) {
      var f = _loadRSS(feed);
      into.channel.item = into.channel.item.concat(f.channel.item);
    });
    into.channel.item.sort(function (itemA, itemB) {
      var dateA = new Date(itemA.pubDate).getTime();
      var dateB = new Date(itemB.pubDate).getTime();

      return dateA - dateB;
    }).reverse();
    into.$ = {
      version: '2.0',
      'xml:lang': 'ja-JP',
      'xmlns:atom': 'http://www.w3.org/2005/Atom',
      'xmlns:creativeCommons': 'http://backend.userland.com/creativeCommonsRssModule',
      'xmlns:content': 'http://purl.org/rss/1.0/modules/content/'
    };
    into.channel.lastBuildDate = into.channel.item[0].pubDate;
    fs.writeFileSync(options.file, new xml2js.Builder({
      rootName: 'rss',
      xmldec: {
        encoding: 'UTF-8'
      },
      options: {
        allowSurrogateChars: true
      }
    }).buildObject(into));
    grunt.log.writeln('File "' + options.file + '" created.');
  });
};
