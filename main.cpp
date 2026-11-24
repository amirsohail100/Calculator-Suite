#define UNICODE
#define _UNICODE
#include <windows.h>
#include <objbase.h>
#include <string>
#include <WebView2.h>

namespace {

ICoreWebView2Controller* g_controller = nullptr;
ICoreWebView2* g_webview = nullptr;
HWND g_hwnd = nullptr;

typedef HRESULT(STDAPICALLTYPE* CreateEnvFn)(
    PCWSTR,
    PCWSTR,
    ICoreWebView2EnvironmentOptions*,
    ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler*);

// exe के folder का path (आखिर में \ के साथ)
std::wstring ExeDir() {
    wchar_t path[MAX_PATH];
    GetModuleFileNameW(nullptr, path, MAX_PATH);
    std::wstring p(path);
    return p.substr(0, p.find_last_of(L'\\') + 1);
}

// index.html का file:/// URL (space को %20 करते हुए)
std::wstring IndexUrl() {
    std::wstring p = ExeDir() + L"index.html";
    std::wstring url = L"file:///";
    for (wchar_t c : p) {
        if (c == L'\\') url += L'/';
        else if (c == L' ') url += L"%20";
        else url += c;
    }
    return url;
}

void ResizeWebView() {
    if (g_controller && g_hwnd) {
        RECT rc;
        GetClientRect(g_hwnd, &rc);
        g_controller->put_Bounds(rc);
    }
}

// Controller बनने पर callback
class ControllerHandler : public ICoreWebView2CreateCoreWebView2ControllerCompletedHandler {
    LONG ref_ = 1;

public:
    HRESULT STDMETHODCALLTYPE QueryInterface(REFIID riid, void** ppv) override {
        if (riid == IID_IUnknown ||
            riid == IID_ICoreWebView2CreateCoreWebView2ControllerCompletedHandler) {
            *ppv = static_cast<ICoreWebView2CreateCoreWebView2ControllerCompletedHandler*>(this);
            AddRef();
            return S_OK;
        }
        *ppv = nullptr;
        return E_NOINTERFACE;
    }
    ULONG STDMETHODCALLTYPE AddRef() override { return InterlockedIncrement(&ref_); }
    ULONG STDMETHODCALLTYPE Release() override {
        ULONG r = InterlockedDecrement(&ref_);
        if (r == 0) delete this;
        return r;
    }

    HRESULT STDMETHODCALLTYPE Invoke(HRESULT hr, ICoreWebView2Controller* controller) override {
        if (FAILED(hr) || !controller) {
            MessageBoxW(g_hwnd,
                L"WebView2 controller नहीं बन सका.\nWebView2 Runtime install है?",
                L"Error", MB_OK | MB_ICONERROR);
            return S_OK;
        }
        g_controller = controller;
        g_controller->AddRef();
        g_controller->get_CoreWebView2(&g_webview);
        ResizeWebView();
        g_webview->Navigate(IndexUrl().c_str());
        return S_OK;
    }
};

// Environment बनने पर callback
class EnvHandler : public ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler {
    LONG ref_ = 1;

public:
    HRESULT STDMETHODCALLTYPE QueryInterface(REFIID riid, void** ppv) override {
        if (riid == IID_IUnknown ||
            riid == IID_ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler) {
            *ppv = static_cast<ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler*>(this);
            AddRef();
            return S_OK;
        }
        *ppv = nullptr;
        return E_NOINTERFACE;
    }
    ULONG STDMETHODCALLTYPE AddRef() override { return InterlockedIncrement(&ref_); }
    ULONG STDMETHODCALLTYPE Release() override {
        ULONG r = InterlockedDecrement(&ref_);
        if (r == 0) delete this;
        return r;
    }

    HRESULT STDMETHODCALLTYPE Invoke(HRESULT hr, ICoreWebView2Environment* env) override {
        if (FAILED(hr) || !env) {
            MessageBoxW(g_hwnd,
                L"WebView2 environment नहीं बन सका.",
                L"Error", MB_OK | MB_ICONERROR);
            return S_OK;
        }
        auto* ch = new ControllerHandler();
        env->CreateCoreWebView2Controller(g_hwnd, ch);
        ch->Release();
        return S_OK;
    }
};

LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp) {
    switch (msg) {
    case WM_SIZE:
        ResizeWebView();
        return 0;
    case WM_DESTROY:
        if (g_webview) { g_webview->Release(); g_webview = nullptr; }
        if (g_controller) {
            g_controller->Close();
            g_controller->Release();
            g_controller = nullptr;
        }
        PostQuitMessage(0);
        return 0;
    }
    return DefWindowProcW(hwnd, msg, wp, lp);
}

} // namespace

int WINAPI wWinMain(HINSTANCE hInst, HINSTANCE, PWSTR, int nShow) {
    CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED);

    WNDCLASSW wc{};
    wc.lpfnWndProc = WndProc;
    wc.hInstance = hInst;
    wc.hCursor = LoadCursorW(nullptr, IDC_ARROW);
    wc.lpszClassName = L"QuadraCalcHost";
    RegisterClassW(&wc);

    g_hwnd = CreateWindowExW(0, L"QuadraCalcHost", L"Calculator",
                             WS_OVERLAPPEDWINDOW,
                             CW_USEDEFAULT, CW_USEDEFAULT, 420, 620,
                             nullptr, nullptr, hInst, nullptr);
    if (!g_hwnd) return 1;
    ShowWindow(g_hwnd, nShow);
    UpdateWindow(g_hwnd);

    HMODULE loader = LoadLibraryW(L"WebView2Loader.dll");
    if (!loader) {
        MessageBoxW(g_hwnd, L"WebView2Loader.dll नहीं मिली.\nउसे exe के साथ रखें.",
                    L"Error", MB_OK | MB_ICONERROR);
        return 1;
    }
    auto create = reinterpret_cast<CreateEnvFn>(
        GetProcAddress(loader, "CreateCoreWebView2EnvironmentWithOptions"));
    if (!create) {
        MessageBoxW(g_hwnd, L"WebView2Loader.dll में function नहीं मिला.",
                    L"Error", MB_OK | MB_ICONERROR);
        return 1;
    }

    auto* eh = new EnvHandler();
    HRESULT hr = create(nullptr, nullptr, nullptr, eh);
    eh->Release();
    if (FAILED(hr)) {
        MessageBoxW(g_hwnd, L"WebView2 environment शुरू नहीं हो सका.",
                    L"Error", MB_OK | MB_ICONERROR);
    }

    MSG msg;
    while (GetMessageW(&msg, nullptr, 0, 0) > 0) {
        TranslateMessage(&msg);
        DispatchMessageW(&msg);
    }

    CoUninitialize();
    return 0;
}
