/* jshint node:true */
'use strict';

module.exports = function (grunt) {
  var taskName = 'merge_feeds';
  var taskDescription = 'Merge Weblog feed into Home feed.';

  grunt.registerMultiTask(taskName, taskDescription, function () {
    var xml2js = require('xml2js');

    var options = this.options();

    var home = _loadRSS(options.into);

    options.feeds.forEach(function (feed) {
      var f = _loadRSS(feed);
      home.channel.item = home.channel.item.concat(f.channel.item);
    });

    home.channel.item.sort(function (itemA, itemB) {
      var dateA = new Date(itemA.pubDate).getTime();
      var dateB = new Date(itemB.pubDate).getTime();

      return dateA - dateB;
    }).reverse();
    home.$ = {
      version: '2.0',
      'xml:lang': 'ja-JP',
      'xmlns:atom': 'http://www.w3.org/2005/Atom',
      'xmlns:creativeCommons': 'http://backend.userland.com/creativeCommonsRssModule',
      'xmlns:content': 'http://purl.org/rss/1.0/modules/content/'
    };
    home.channel.lastBuildDate = home.channel.item[0].pubDate;
    grunt.file.write(options.file, new xml2js.Builder({
      rootName: 'rss',
      xmldec: {
        encoding: 'UTF-8'
      }
    }).buildObject(home));
    grunt.log.writeln('File "' + options.file + '" created.');

    function _loadRSS(file) {
      var feed = {};

      xml2js.parseString(grunt.file.read(file), {
        trim: true,
        explicitArray: false
      }, function (error, data) {
        if (error) {
          grunt.fail.warn(error);
        }

        feed = data.rss;
      });

      return feed;
    }
  });
};
