(function(){"use strict";

(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  var rootStyle = document.documentElement.style;
  var lightnessVariation = ["49%", "34%", "32%", "32%", "52%", "50%"];

  var change = function change() {
    var roll = Math.floor(Math.random() * 6);
    var hue = roll * 60 - 15;
    rootStyle.setProperty("--hue", hue);
    rootStyle.setProperty("--lightness", lightnessVariation[roll]);

    if (typeof testContrastRatio === "function") {
      /* global testContrastRatio */
      testContrastRatio();
    }
  };

  window.changeHue = change;
  change();
})();})();