(function(){"use strict";

(function (window) {
  var lightnessVariation = ["49%", "34%", "33%", "33%", "52%", "50%"];
  var rootStyle = document.documentElement.style;

  var update = function update() {
    var roll = Math.floor(Math.random() * 6);
    var hue = roll * 60 - 15;
    rootStyle.setProperty("--hue", hue);
    rootStyle.setProperty("--lightness", lightnessVariation[roll]);

    if (typeof testContrastRatio === "function") {
      /* global testContrastRatio */
      testContrastRatio();
    }
  };

  update();
  window.updateHue = update;
})(window);})();