// ==UserScript==
// @name           Lightboxed Hatena Bookmark Bookmarklet
// @namespace      http://hail2u.net/
// @description    はてなブックマークのブックマークレットをLightbox化する
// @include        http://*
// @include        https://*
// ==/UserScript==

GM_addStyle(".hatena-bookmark-bookmarklet-container { padding: 0 !important; display: table !important; position: fixed !important; top: 0 !important; right: 0 !important; bottom: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; background-color: transparent !important;}");
GM_addStyle(".hatena-bookmark-bookmarklet-container div { padding: 0 !important; background-image: none !important; text-align: center !important;}");
GM_addStyle(".hatena-bookmark-bookmarklet-header { display: none !important;}");
GM_addStyle(".hatena-bookmark-bookmarklet-header + div { display: table-cell !important; vertical-align: middle !important; background-color: rgba(0, 0, 0, 0.75) !important;}");
GM_addStyle(".hatena-bookmark-bookmarklet-container iframe { padding: 0 !important; background-image: none !important;}");
