@echo off
REM MinGW-w64 (64-bit) से build. WebView2 SDK का folder "WebView2" इसी folder में होना चाहिए.
REM WebView2 headers: WebView2\build\native\include\WebView2.h
REM Loader DLL:       WebView2\build\native\x64\WebView2Loader.dll  (exe के साथ कॉपी होगी)

g++ -std=c++17 -municode -mwindows -DUNICODE -D_UNICODE ^
  -I WebView2\build\native\include ^
  main.cpp -o Calculator.exe ^
  -luuid -lole32 -luser32 -lgdi32

if errorlevel 1 (
  echo.
  echo Build FAILED. ऊपर का error पढ़ें.
  exit /b 1
)

copy /Y WebView2\build\native\x64\WebView2Loader.dll . >nul
echo.
echo Build OK: Calculator.exe बन गया. index.html, style.css, app.js के साथ चलाएँ.
