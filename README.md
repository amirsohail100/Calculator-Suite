# Calculator (WebView2 desktop build)

यह folder **calculator-suite** repo का हिस्सा है। उसमें तीन अलग calculator versions हैं, और हर folder स्वतंत्र है। इनके बीच code share नहीं होता:

```
calculator-suite/
├── web-html-css/        सिर्फ़ browser वाला calculator (HTML + CSS + JS)
├── streamlit/           Python Streamlit calculator
└── desktop-webview2/    यह folder: C++ WebView2 host + वही HTML/CSS/JS UI, Windows .exe के रूप में
```

## Keys
- बटन: C, ⌫, ( ), ± (चिन्ह बदलें), %, ÷ × − +, =, 0–9 और `.`
- Keyboard: अंक, `+ - * /`, `x` (गुणा), `( )`, `.`, `%`, Enter या `=`, Backspace, Esc या Delete (clear)

## Build (Windows, MinGW-w64 64-bit)
1. NuGet package `Microsoft.Web.WebView2` डाउनलोड करें, उसका नाम `.zip` करें, और उसे `WebView2\` folder में extract करें।
2. `build.bat` चलाएँ। इससे `Calculator.exe` बनेगा और `WebView2Loader.dll` अपने आप कॉपी होगी।
3. `Calculator.exe` चलाएँ। इसके लिए WebView2 Runtime चाहिए (Windows 10/11 पर आम तौर पर होता है)।

## Ship करना
`Calculator.exe`, `WebView2Loader.dll`, `index.html`, `style.css` और `app.js` को एक folder में zip करें।

## ज्ञात सीमाएँ
- Native file save/open bridge अभी नहीं है। यह अगला कदम है।
