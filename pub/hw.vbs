' �ݒ�
userName = "���[�U�[��"
dataDir  = "C:\�_�C�A���[��\�t�@�C����\�u��\�t�H���_�ւ�\�p�X"

' �����̓��t��
Dim yy, mm, dd, today

yy = CStr(Year(Now))
mm = Right("0" + CStr(Month(Now)), 2)
dd = Right("0" + CStr(Day(Now)), 2)
today = yy + "-" + mm + "-" + dd

' �����̓��t���̃t�@�C�����J��
Dim f, fs, title, body
Set oWshShell = WScript.CreateObject("WScript.Shell")
Set oFileSys  = CreateObject("Scripting.FileSystemObject")

f = dataDir + "\" + today + ".txt"

If Not oFileSys.FileExists(f) Then
	WScript.Echo f + ": ��������܂���B"
	WScript.Quit
End If

Set fs = oFileSys.OpenTextFile(f, 1, False)
title = fs.Readline
body  = fs.ReadAll
fs.Close

' IE�N��
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
	' �ȉ��̈�s�̃R�����g����������Ƃ����Ȃ蓊�e�ł�����
	' oIe.document.forms(1).submit()
Else
	WScript.Echo "���O�C�����L������Ă����ԂłȂ��Ɠ����܂���B"
	WScript.Quit
End If

' �I��
WScript.Quit
