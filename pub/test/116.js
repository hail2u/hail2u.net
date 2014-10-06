var suggestUrl = {
  suggest: function (path) {
    // pathの簡単な修正
    path = decodeURIComponent(path).toLowerCase().replace(/[\s\/]*$/, "").replace(/[ａ-ｚ]/g, function (m) {
      return String.fromCharCode(m.charCodeAt(0) - 65248);
    });

    // 一つ上の階層のURLを追加
    var suggest_urls = new Array();
    suggest_urls.push("http://hail2u.net" + path.replace(/[^\/]*$/, ""));

    // キーワードになる単語を配列として取り出す
    var words = path.replace(/^.*\//, "").replace(/[^a-z]/g, " ").split(/\s+/);

    // スペル修正
    // words = $.each(words, this.correctSpell);

    // 重複する単語を削除
    words = this.uniqueArray(words);

    // Stop WordsとサイトのURLに多い単語を削除
    words = this.removeStopWords(words);
    
    // 単語が少ないなら終了
    if (words.length < 2) {
      if (suggest_urls.length > 0) {
        this.outputList(suggest_urls);
      }

      return true;
    }

    // Sitemapsを取得
    var self = this;
    $.ajax({
      type:     "GET",
      dataType: "xml",
      url:      "116.xml",
      success:  function (data) {
        // XMLをパースして配列を作成
        var urls = new Array();
        $(data).find("loc").each(function () {
          urls.push($(this).text());
        });

        // URLのランク付け
        var url_ranking = new Array();
        $.each(urls, function (i, url) {
          var score = 0;
          $.each(words, function (j, word) {
            if (url.search("[-\b_./]" + word + "[-\b_./]") >= 0) {
              score += 4; // 簡単な重み付け
            } else if (url.indexOf(word) >= 0) {
              score += 1;
            }
          });

          if (score > 0) {
            url_ranking.push([url, score]);
          }
        });

        // ランク順にソート
        url_ranking.sort(function (a, b) {
          return a[1] - b[1];
        }).reverse();

        // スコアが最高のURLだけ取り出す
        var max_score = (url_ranking[0])[1];
        $.each(url_ranking, function (i, v) {
          var url = v[0];
          var score = v[1];

          if (score < max_score) {
            return false;
          }

          suggest_urls.push(url);
        });

        console.log(suggest_urls);

        self.outputList(suggest_urls);
      }
    });
  },

  correctSpell: function (word) {
    return word;
  },

  uniqueArray: function (array) {
    var done = {}, ret = [];

    for (i = 0; i < array.length; i++) {
      var id = array[i];

      if (!done[id]) {
        done[id] = true;
        ret.push(array[i]);
      }
    }

    return ret;
  },

  removeStopWords: function (words) {
    var stop_words = "a about above above across after afterwards again against all almost alone along already also although always am among amongst amoungst amount an and another any anyhow anyone anything anyway anywhere are around as at back be became because become becomes becoming been before beforehand behind being below beside besides between beyond bill both bottom but by call can cannot cant co con could couldnt cry de describe detail do done down due during each eg eight either eleven else elsewhere empty enough etc even ever every everyone everything everywhere except few fifteen fify fill find fire first five for former formerly forty found four from front full further get give go had has hasnt have he hence her here hereafter hereby herein hereupon hers herself him himself his how however hundred ie if in inc indeed interest into is it its itself keep last latter latterly least less ltd made many may me meanwhile might mill mine more moreover most mostly move much must my myself name namely neither never nevertheless next nine no nobody none noone nor not nothing now nowhere of off often on once one only onto or other others otherwise our ours ourselves out over own part per perhaps please put rather re same see seem seemed seeming seems serious several she should show side since sincere six sixty so some somehow someone something sometime sometimes somewhere still such system take ten than that the their them themselves then thence there thereafter thereby therefore therein thereupon these they thickv thin third this those though three through throughout thru thus to together too top toward towards twelve twenty two un under until up upon us very via was we well were what whatever when whence whenever where whereafter whereas whereby wherein whereupon wherever whether which while whither who whoever whole whom whose why will with within without would yet you your yours yourself yourselves";
    var site_words = "hail2u net archives blog documents htm html";
    stop_words = " " + stop_words + " " + site_words + " ";

    return $.grep(words, function (m) {
      if (stop_words.indexOf(" " + m + " ") < 0) {
        return true;
      } else {
        return false;
      }
    });
  },

  outputList: function (urls) {
    var parent = urls.shift();
    urls.sort().push(parent);
    var ol = $("<ol/>");
    $.each(urls, function (i, v) {
      var li = $("<li/>").append($("<a/>").attr({
        href: v
      }).append(v)).appendTo(ol);
    });
    $("#suggestion").prepend($("<li/>").append($("<em/>").append("もしかして")).append(ol));
  }
};

$(function () {
  suggestUrl.suggest($("#url").val());
});
