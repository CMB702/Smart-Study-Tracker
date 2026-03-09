Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
basePath = fso.GetParentFolderName(WScript.ScriptFullName)

serverCommand = "powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File """ & basePath & "\start-study-app.ps1"""
shell.Run serverCommand, 0, False
WScript.Sleep 1800

edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
appUrl = "http://localhost:4173"

If fso.FileExists(edgePath) Then
  shell.Run """" & edgePath & """ --app=" & appUrl & " --window-size=1440,960", 1, False
ElseIf fso.FileExists(chromePath) Then
  shell.Run """" & chromePath & """ --app=" & appUrl & " --window-size=1440,960", 1, False
Else
  shell.Run appUrl, 1, False
End If
