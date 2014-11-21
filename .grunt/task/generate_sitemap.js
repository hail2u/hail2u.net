'use strict';

module.exports = function (grunt) {
  var taskName = 'generate_sitemap';
  var taskDescription = 'Generate a sitemap XML file.';

  grunt.registerMultiTask(taskName, taskDescription, function () {
    var fs = require('fs');
    var path = require('path');
    var xml2js = require('xml2js');

    var file = this.data.file;
    var domain = 'http://hail2u.net';
    var urls = [
      '/',
      '/about/',
      '/about/style-guide/',
      '/blog/',
      '/blog/blog/',
      '/blog/blosxom/',
      '/blog/coding/',
      '/blog/gadget/',
      '/blog/game/',
      '/blog/internet/',
      '/blog/media',
      '/blog/misc/',
      '/blog/rss/',
      '/blog/software/',
      '/blog/sports/',
      '/blog/webdesign/',
      '/documents/',
      '/projects/',
      '/search/'
    ];

    urls = addDocuments('build/documents/', urls);
    urls = addArticles(path.join(__dirname, '../cache', 'articles.json'), urls);
    fs.writeFileSync(file, createSitemap(domain, urls));
    grunt.log.writeln('File "' + file + '" created.');

    function addDocuments(dir, to) {
      var documents = fs.readdirSync(dir).filter(function (file) {
        if (file === 'index.html' || file.indexOf('.html') !== file.length - 5) {
          return false;
        }

        return true;
      }).map(function (file) {
        return '/documents/' + file;
      });

      return to.concat(documents);
    }

    function addArticles(data, to) {
      var articles = [];
      JSON.parse(fs.readFileSync(data, 'utf-8')).forEach(function (article) {
        articles.push(article.link);
      });

      return to.concat(articles);
    }

    function createSitemap(domain, urls) {
      var sitemap = {
        urlset: {
          $: {
            xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9'
          },
          url: []
        }
      };
      urls.forEach(function (url) {
        sitemap.urlset.url.push({
          loc: domain + url
        });
      });

      return new xml2js.Builder().buildObject(sitemap);
    }
  });
};
