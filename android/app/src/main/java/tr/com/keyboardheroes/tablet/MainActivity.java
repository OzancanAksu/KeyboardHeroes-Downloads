package tr.com.keyboardheroes.tablet;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

public final class MainActivity extends Activity {
    private static final String BASE = "https://keyboardheroes.com.tr";
    private static final String HOST = "keyboardheroes.com.tr";
    private static final String APP_VERSION = "0.2.0";
    private static final String LAUNCHER = BASE + "/android-launcher";
    private WebView browser;
    private boolean inGame;
    private boolean inCombat;

    private static boolean isTrusted(Uri uri) {
        return uri != null && "https".equalsIgnoreCase(uri.getScheme())
                && HOST.equalsIgnoreCase(uri.getHost())
                && uri.getPort() == -1;
    }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(16, 32, 36));
        getWindow().setNavigationBarColor(Color.rgb(16, 32, 36));
        browser = new WebView(this);
        browser.setBackgroundColor(Color.rgb(18, 36, 44));
        browser.setOverScrollMode(View.OVER_SCROLL_NEVER);
        setContentView(browser);

        WebSettings settings = browser.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setUserAgentString(settings.getUserAgentString()
                + " KeyboardHeroesAndroid/" + APP_VERSION);
        if (Build.VERSION.SDK_INT >= 26) settings.setSafeBrowsingEnabled(true);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(browser, false);
        browser.addJavascriptInterface(new Commands(), "KeyboardHeroesAndroid");
        browser.setWebChromeClient(new WebChromeClient());
        browser.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (isTrusted(uri)) return false;
                if (request.isForMainFrame() && "https".equalsIgnoreCase(uri.getScheme())) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
                    catch (ActivityNotFoundException ignored) { }
                }
                return true;
            }
            @Override public void onPageFinished(WebView view, String url) {
                Uri uri = Uri.parse(url);
                if (!isTrusted(uri)) return;
                String path = uri.getPath();
                if ("/play".equals(path)) {
                    inGame = true;
                    inCombat = false;
                    // Phone and tablet menus must remain naturally oriented and
                    // scrollable. Combat alone requests landscape fullscreen.
                    setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
                    applyImmersive(false);
                } else if ("/android-launcher".equals(path) || "/android-launcher.html".equals(path)) {
                    inGame = false;
                    inCombat = false;
                    setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
                    applyImmersive(false);
                    launcherReady();
                }
            }
            @Override public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse response) {
                if (request.isForMainFrame() && response.getStatusCode() == 401
                        && "/play".equals(request.getUrl().getPath())) {
                    runOnUiThread(() -> {
                        Toast.makeText(MainActivity.this, "Önce hesabına giriş yap.", Toast.LENGTH_SHORT).show();
                        openLauncher();
                    });
                }
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    Toast.makeText(MainActivity.this,
                            "Ağ bağlantısını kontrol et ve yeniden dene.", Toast.LENGTH_LONG).show();
                }
            }
        });
        if (state != null) {
            browser.restoreState(state);
        } else {
            openLauncher();
        }
    }

    private void launcherReady() {
        browser.evaluateJavascript("(function(){"
                + "if(window.khLauncher){window.khLauncher.setNativeVersion('"+APP_VERSION+"');"
                + "window.khLauncher.setUpdate('ready',100,'Android telefon/tablet sürümü hazır · oyun verileri sunucudan yüklenir');}"
                + "})()", null);
    }

    private void applyImmersive(boolean enabled) {
        if (enabled) {
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
        } else {
            getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
        }
    }

    private void openLauncher() {
        inGame = false;
        inCombat = false;
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        applyImmersive(false);
        browser.loadUrl(LAUNCHER);
    }

    private void launchGame() {
        if (inGame) return;
        browser.loadUrl(BASE + "/play");
    }

    private final class Commands {
        @JavascriptInterface public void postMessage(String value) {
            if (value == null || value.length() > 100) return;
            runOnUiThread(() -> {
                if (browser == null || !isTrusted(Uri.parse(browser.getUrl()))) return;
                String path = Uri.parse(browser.getUrl()).getPath();
                if ("launcher-ready".equals(value) || "launcher-retry".equals(value)) {
                    if ("/android-launcher".equals(path)) launcherReady();
                } else if ("launcher-play".equals(value)) {
                    if ("/android-launcher".equals(path)) launchGame();
                } else if ("game-landscape".equals(value)) {
                    if ("/play".equals(path) && !inCombat) {
                        inCombat = true;
                        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
                        applyImmersive(true);
                    }
                } else if ("game-menu".equals(value)) {
                    if ("/play".equals(path) && inCombat) {
                        inCombat = false;
                        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
                        applyImmersive(false);
                    }
                } else if ("back-to-launcher".equals(value)) {
                    if ("/play".equals(path)) confirmExit();
                }
            });
        }
    }

    private void confirmExit() {
        new AlertDialog.Builder(this).setTitle("Arenadan çık")
                .setMessage("Devam eden maçtan ayrılmak istiyor musun?")
                .setNegativeButton("İptal", null)
                .setPositiveButton("Çık", (dialog, which) -> openLauncher()).show();
    }
    @Override public void onBackPressed() {
        if (inGame) confirmExit();
        else new AlertDialog.Builder(this).setTitle("Keyboard Heroes")
                .setMessage("Uygulamadan çıkılsın mı?")
                .setNegativeButton("İptal", null)
                .setPositiveButton("Çık", (d, w) -> finish()).show();
    }
    @Override public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        applyImmersive(inCombat);
    }
    @Override protected void onSaveInstanceState(Bundle bundle) {
        browser.saveState(bundle);
        super.onSaveInstanceState(bundle);
    }
    @Override protected void onDestroy() {
        browser.removeJavascriptInterface("KeyboardHeroesAndroid");
        browser.destroy();
        super.onDestroy();
    }
}
