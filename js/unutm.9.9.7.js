(function(){"use strict";

var removeUTMParams = function removeUTMParams() {
  if (location.search) {
    var search = location.search.replace(/[?&]utm_[^&]+/g, "").replace(/^&/, "?");
    history.replaceState(null, "", "".concat(location.pathname).concat(search).concat(location.hash));
  }
};

removeUTMParams();})();