(function(){"use strict";

var secondsToHue = function secondsToHue(now) {
  var seconds = Math.floor(now.getSeconds() / 10);
  var hue = seconds * 60 - 15;
  var lightness = ["49%", "34%", "33%", "33%", "52%", "50%"];
  document.documentElement.style = "--hue:".concat(hue, ";--lightness:").concat(lightness[seconds]);
};

secondsToHue(new Date());})();