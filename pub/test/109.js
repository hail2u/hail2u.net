(function($) {
  $.fn.addTableFilter = function () {
    var self = this;

    if (self.is("table")) {
      // Generate ID
      if (!self.attr("id")) {
        self.attr({
          id: "t-" + Math.floor(Math.random() * 99999999)
        });
      }
      var tgt = self.attr("id");
      var id = tgt + "-filtering";

      // Build filtering form
      var label = $("<label/>").attr({
        "for": id
      }).append("Keyword(s): ");
      var input = $("<input/>").attr({
        id:   id,
        type: "text",
        size: 32
      });
      $("<p/>").addClass("formTableFilter").append(label).append(input).insertBefore(self);

      // Bind filtering function
      $("#" + id).keyup(function (e) {
        var words = this.value.toLowerCase().split(" ");
        $("#" + tgt + " tbody tr").each(function () {
          var s = $(this).html().toLowerCase().replace(/<.+?>/g, "").replace(/\s+/g, " ");
          var state = 0;
          $.each(words, function () {
            if (s.indexOf(this) < 0) {
              state = 1;
              return false;
            }
          });
          state ? $(this).hide() : $(this).show();
        });
      });
    }

    return self;
  };
})(jQuery);
