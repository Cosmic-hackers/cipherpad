@echo off
title CipherPad Server - Neon PostgreSQL - http://localhost:8090
color 0B
echo.
echo  =====================================================
echo   CipherPad ^| Connecting to Neon PostgreSQL...
echo  =====================================================
echo.

cd /d C:\Users\siddu\Desktop\pad

REM Load .env file — read each KEY=VALUE line
if not exist .env (
    echo  ERROR: .env file not found!
    echo  Create a .env file with your Neon credentials.
    echo  See .env.example for the format.
    pause
    exit /b 1
)

REM Parse .env and set environment variables
for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
    REM Skip comment lines starting with #
    set "line=%%A"
    if not "!line:~0,1!"=="#" (
        if not "%%A"=="" (
            set "%%A=%%B"
        )
    )
)

REM Enable delayed expansion for the above to work
setlocal enabledelayedexpansion
for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
    set "line=%%A"
    set "first=!line:~0,1!"
    if not "!first!"=="#" (
        if not "%%A"=="" (
            set "%%A=%%B"
        )
    )
)

echo  Profile : %SPRING_PROFILES_ACTIVE%
echo  DB Host : %DB_URL%
echo  Port    : %PORT%
echo.
echo  Starting... Open http://localhost:%PORT% in your browser.
echo  Press Ctrl+C to stop.
echo.

"C:\tools\jdk-21.0.5+11\bin\java.exe" ^
  -Dspring.profiles.active=%SPRING_PROFILES_ACTIVE% ^
  -Dserver.port=%PORT% ^
  -DDB_URL="%DB_URL%" ^
  -DDB_USERNAME="%DB_USERNAME%" ^
  -DDB_PASSWORD="%DB_PASSWORD%" ^
  -DSPRING_PROFILES_ACTIVE=%SPRING_PROFILES_ACTIVE% ^
  -jar target\cipherpad-1.0.0.jar

echo.
echo  Server stopped.
pause
