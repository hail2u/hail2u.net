' 設定
userName = "ユーザー名"
dataDir  = "C:\ダイアリーの\ファイルを\置く\フォルダへの\パス"

' 今日の日付け
Dim yy, mm, dd, today

yy = CStr(Year(Now))
mm = Right("0" + CStr(Month(Now)), 2)
dd = Right("0" + CStr(Day(Now)), 2)
today = yy + "-" + mm + "-" + dd

' 今日の日付けのファイルを開く
Dim f, fs, title, body
Set oWshShell = WScript.CreateObject("WScript.Shell")
Set oFileSys  = CreateObject("Scripting.FileSystemObject")

f = dataDir + "\" + today + ".txt"

If Not oFileSys.FileExists(f) Then
	WScript.Echo f + ": が見つかりません。"
	WScript.Quit
End If

Set fs = oFileSys.OpenTextFile(f, 1, False)
title = fs.Readline
body  = fs.ReadAll
fs.Close

' IE起動
Set oIe = WScript.CreateObject("InternetExplorer.Application")
oIe.Visible = True
oIe.Navigate "http://d.hatena.ne.jp/" + userName + "/edit"

Do While oIe.Busy
	Wscript.Sleep 100
Loop

Do While oIe.document.readyState <> "complete"
	Wscript.Sleep 100
Loop

If oIe.document.forms.length = "2" Then
	oIe.document.forms(1).title.value = title
	oIe.document.forms(1).body.value  = body
	' 以下の一行のコメントを解除するといきなり投稿できたり
	' oIe.document.forms(1).submit()
Else
	WScript.Echo "ログインが記憶されている状態でないと動きません。"
	WScript.Quit
End If

' 終了
WScript.Quit
