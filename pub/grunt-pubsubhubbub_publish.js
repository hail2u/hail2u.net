/* jshint node:true */
'use strict';

module.exports = function (grunt) {
  var taskName = 'pubsubhubbub_publish';
  var taskDescription = 'Publish a feed updates to Google PubSubHubbub hub.';

  grunt.registerMultiTask(taskName, taskDescription, function () {
    var request = require('request');

    var done = this.async();
    var hubUrl = this.data.hubUrl;

    request.post('https://pubsubhubbub.appspot.com/', {
      form: {
        'hub.mode': 'publish',
        'hub.url': hubUrl
      }
    }, function (error, response, body) {
      if (error) {
        return done(error);
      }

      if (response.statusCode !== 204) {
        return done(new Error('Hub returned ' + response.statusCode + '.'));
      }

      grunt.log.writeln('Feed "' + hubUrl + '" published.');
      done();
    });
  });
};
