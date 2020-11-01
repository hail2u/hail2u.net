var username = "メールアドレス";
var password = "パスワード";
var filename = "E:\\Projects\\WSH\\bloglines\\unread.html";
var cssfile  = "unread.css";

var urlListsub  = "http://rpc.bloglines.com/listsubs";
var urlgetitems = "http://rpc.bloglines.com/getitems";

var xmlHttp = new ActiveXObject("Msxml2.XMLHTTP.3.0");
var xmlDoc  = new ActiveXObject("Msxml2.DOMDocument.3.0");

WScript.Echo(urlListsub);
xmlHttp.open("GET", urlListsub, false, username, password);
xmlHttp.send();

if (xmlHttp.status != 200) {
	WScript.Echo("HTTP Status Error: " + xmlHttp.statusText);
	WScript.Quit();
}

xmlDoc.async = false;
xmlDoc.loadXML(xmlHttp.responseText);

if (xmlDoc.parseError.errorCode != 0) {
	WScript.Echo("XML Parse Error: " + xmlHttp.parseError.reason);
	WSCript.Quit();
}

var outlineNodes = xmlDoc.getElementsByTagName("outline");
var subIds = new Array();

for (var i = 0; i <  outlineNodes.length; i++) {
	var outline = outlineNodes.item(i);

	if (!outline.hasChildNodes()) {
		var unread  = parseInt(outline.getAttribute("BloglinesUnread"));

		if (unread > 0) {
			subIds.push(outline.getAttribute("BloglinesSubId"));
	 }
	}
}

if (subIds.length < 1) {
	WScript.Echo("Unread article is not found.");
	WScript.Quit();
}

var fso = new ActiveXObject("Scripting.FileSystemObject");
var f   = fso.CreateTextFile(filename, true, true);
f.WriteLine('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">');
f.WriteLine('<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ja" lang="ja">');
f.WriteLine('<head>');
f.WriteLine('<meta http-equiv="Content-Type" content="text/html; charset=UTF-16LE" />');
f.WriteLine('<title>My Bloglines</title>');
f.WriteLine('<link rel="stylesheet" type="text/css" href="' + cssfile + '" />');
f.WriteLine('</head>');
f.WriteLine('<body>');
f.WriteLine('<h1>My Bloglines</h1>');

for (var i = 0; i <  subIds.length; i++) {
	var url = urlgetitems + "?n=0&s=" + subIds[i];
	WScript.Echo(url);
	xmlHttp.open("GET", url, false, username, password);
	xmlHttp.send();

	if (xmlHttp.status != 200) {
		WScript.Echo("HTTP Status Error: " + xmlHttp.statusText);
		continue;
	}

	xmlDoc.async = false;
	xmlDoc.loadXML(xmlHttp.responseText);

	if (xmlDoc.parseError.errorCode != 0) {
		WScript.Echo("XML Parse Error: " + xmlHttp.parseError.reason);
		continue;
	}

	var channelNode = xmlDoc.documentElement.selectSingleNode("channel");
	var title = channelNode.selectSingleNode("title").text;
	var link  = channelNode.selectSingleNode("link").text;
	f.WriteLine('<h2><a href="' + link + '">' + title + '</a></h2>');
	var itemNodes = channelNode.selectNodes("item");

	for (j = 0; j < itemNodes.length; j++) {
		var item        = itemNodes[j];
		var title       = item.selectSingleNode("title").text;
		var link        = item.selectSingleNode("link").text;
		var description = item.selectSingleNode("description").text;
		var pubDate     = item.selectSingleNode("pubDate").text;
		f.WriteLine('<h3><a href="' + link + '">' + title + '</a></h3>');
		f.WriteLine('<p>' + gmt2jst(pubDate) + '</p>');
		f.WriteLine('<div>' + description + '</div>');
	}

	f.WriteLine('<hr />');
}

f.WriteLine('<p>Powered by <a href="http://www.bloglines.com/services/">Bloglines Web Services</a></p>');
f.WriteLine('</body>');
f.WriteLine('</html>');
f.Close();

WScript.Quit();

function gmt2jst(gmt) {
	var d = new Date(Date.parse(gmt));
	var yy = d.getYear();
	var mm = d.getMonth() + 1;
	if (mm.toString().length == 1) mm = "0" + mm;
	var dd = d.getDate();
	if (dd.toString().length == 1) dd = "0" + dd;
	var hh = d.getHours();
	if (hh.toString().length == 1) hh = "0" + hh;
	var nn = d.getMinutes();
	if (nn.toString().length == 1) nn = "0" + nn;
	var ss = d.getSeconds();
	if (ss.toString().length == 1) ss = "0" + ss;

	return yy + "/" + mm + "/" + dd + "T" + hh + ":" + nn + ":" + ss + "+09:00";
}
