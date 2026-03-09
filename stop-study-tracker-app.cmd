@echo off
powershell -WindowStyle Hidden -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'powershell.exe' -and $_.CommandLine -match 'start-study-app\.ps1' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"
