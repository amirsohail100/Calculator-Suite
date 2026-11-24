# Calculator (WebView2 host + HTML/CSS/JS UI)

## Folder structure
```
Calculator/
├── main.cpp          WebView2 host (C++)
├── build.bat         MinGW build script
├── index.html        UI
├── style.css         UI style
├── app.js            UI logic (calculator)
├── WebView2/         ← आपको जोड़ना है (नीचे देखें)
└── README.md
```

## Step 1: WebView2 SDK जोड़ें (ज़रूरी)
1. https://www.nuget.org/packages/Microsoft.Web.WebView2 खोलें और "Download package" दबाएँ.
2. डाउनलोड हुई `.nupkg` फ़ाइल का नाम `.zip` करें और extract करें.
3. Extract किया हुआ पूरा folder `Calculator\WebView2\` नाम से रखें.
   इसमें `build\native\include\WebView2.h` और `build\native\x64\WebView2Loader.dll` होना चाहिए.

## Step 2: Build
MinGW-w64 (64-bit) installed हो और `g++` PATH में हो. फिर:
```
build.bat
```
या सीधे:
```
g++ -std=c++17 -municode -mwindows -DUNICODE -D_UNICODE -I WebView2\build\native\include main.cpp -o Calculator.exe -luuid -lole32 -luser32 -lgdi32
```
और `WebView2\build\native\x64\WebView2Loader.dll` को `Calculator.exe` के बगल में कॉपी करें.

## Step 3: Run
`Calculator.exe` पर double-click करें. Windows 10/11 पर WebView2 Runtime आमतौर पर पहले से होता है.
न हो तो: https://developer.microsoft.com/microsoft-edge/webview2/ से Evergreen Bootstrapper install करें.

## Ship करना
Folder को zip करें, जिसमें `Calculator.exe`, `WebView2Loader.dll`, `index.html`, `style.css`, `app.js` हों. दूसरे PC पर extract करके चलाएँ.

## ज्ञात सीमाएँ
- इस host में अभी native file save/open bridge नहीं है. वह अगला कदम है.
- MinGW पर WebView2.h कभी-कभी warnings देता है. Error आए तो पूरा error text देखें.
