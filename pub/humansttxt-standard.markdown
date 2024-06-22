Humans TXT
==========

Translation of: [Humans TXT: Quick start.](http://humanstxt.org/Standard.html)


Quick start
-----------

*`humans.txt`*(必ず小文字で)という名前でファイルを作成するだけです。ファイルのエンコーディングは_UTF-8_にして特殊文字や複数の言語を使用する場合に問題が起こらないようにしましょう。

以下のようなルールに

  1. `<head>`要素内に`<link rel="author" href="humans.txt">`と書くことによって参照できるようにすることもできます。
  2. humansTXTファイルの構造を明瞭にするために`/*TEAM*/`や`/*SITE*/`のような見出しを使って制作チームの情報とWebサイト自体の情報を分離することも出来ます。
  3. そのプロジェクトに関わった人を、その役目や名前、Twitterアカウント名、位置情報などの情報と共に含めることも出来ます。メールアドレスを書いた場合はスパムに晒される危険性が高いことは注意しましょう。
  4. Webサイトの付加的な情報、例えば最終更新日時や主に使われている言語、`DOCTYPE`、使用しているライブラリ、作成に使っているソフトウェアなどを追加することもできます。
  5. ファイルをWebサイトのルートに置くこともできます。
  6. _humansTXTボタン_をWebサイトに設置しhumansTXTファイルにリンクを張ることもできます。


私達のファイルは以下のようなテンプレートに従って記述されています:
--------------------------------------------------------

    /* TEAM */
    Your title: Your name.
    Site: email, link to a contact form, etc.
    Twitter: your Twitter username.
    Location: City, Country.
    
            [...]
    
    /* THANKS */
    Name: name or url
    
            [...]
    
    /* SITE */
    Last update: YYYY/MM/DD 
    Standards: HTML5, CSS3, ...
    Components: Modernizr, jQuery, ...
    Software: Software used for the development

This Translation is licensed under a [Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License](http://creativecommons.org/licenses/by-nc-sa/3.0/).
