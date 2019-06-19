/* ---------------------------------------------------------------------

gmail.js: Google Talkから任意のブラウザでGmailをhttpsで開く
Copyright 2005, Kyo Nagashima <kyo@hail2u.net>, http://hail2u.net/

--------------------------------------------------------------------- */

// ブラウザのパスを設定
var strBrowserPath = "C:\\Program Files\\Mozilla Firefox\\Firefox.exe";

strBrowserPath = "\"" + strBrowserPath + "\"";

var strUrl = WScript.Arguments(0).replace(/http%3A%2F%2F/, 'https%3A%2F%2F');
var objWshShell = WScript.CreateObject("WScript.Shell");
objWshShell.Run(strBrowserPath + " \"" + strUrl + "\"");

WScript.Quit(0);
