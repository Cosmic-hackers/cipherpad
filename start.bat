@echo off
title CipherPad Server - http://localhost:8090
color 0A
echo.
echo  =============================================
echo   CipherPad ^| Your thoughts. Your encryption.
echo  =============================================
echo.
echo  Starting on http://localhost:8090 ...
echo  Press Ctrl+C to stop.
echo.
cd /d C:\Users\siddu\Desktop\pad
"C:\tools\jdk-21.0.5+11\bin\java.exe" -Dspring.profiles.active=local -Dserver.port=8090 -jar target\cipherpad-1.0.0.jar
echo.
echo  Server stopped.
pause
