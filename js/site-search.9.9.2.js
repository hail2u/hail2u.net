(function(){"use strict";

var showSiteSearchForm = function showSiteSearchForm() {
  var doSearch = function doSearch(event) {
    var query = event.srcElement.q;
    query.value = "".concat(query.value, " site:hail2u.net");
  };

  var template = document.querySelector(".js-site-search");
  template.content.querySelector(".js-site-search-form").addEventListener("submit", doSearch);
  template.parentNode.insertBefore(template.content, template);
  template.parentNode.removeChild(template);
  var fallback = document.querySelector(".js-site-search-fallback");
  fallback.textContent = fallback.dataset.normal;
};

showSiteSearchForm();})();