package tr.com.keyboardheroes.tablet;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.os.ParcelFileDescriptor;
import android.provider.Settings;
import android.webkit.WebView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * GitHub-hosted APK update channel. The web game itself stays hot-updated;
 * this class only updates the native WebView shell.
 *
 * This app NEVER silently installs an APK. Android owns the final installer
 * consent, and a real in-place update requires the SAME signing certificate.
 */
final class ApkUpdater {
    private static final String API =
            "https://api.github.com/repos/OzancanAksu/KeyboardHeroes-Downloads/releases?per_page=100";
    private static final String OWNER_PREFIX =
            "https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/";
    private static final Pattern TAG = Pattern.compile(
            "^android-v(\\d+)\\.(\\d+)\\.(\\d+)(-beta)?$");
    private static final Pattern SHA = Pattern.compile("^[0-9a-fA-F]{64}$");
    private static final String MIME = "application/vnd.android.package-archive";
    private static final long CHECK_INTERVAL = 60 * 60 * 1000L;

    private final Activity activity;
    private final WebView webView;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final DownloadManager downloads;
    private final SharedPreferences prefs;
    private final boolean betaChannel;
    private long downloadId;
    private boolean checking;
    private boolean offered;
    private boolean polling;
    private boolean verifying;
    private boolean installing;
    private boolean closed;
    private Release newer;

    private static final class Release {
        String version, url, digest, assetName;
        long size;
        int major, minor, patch;
        boolean beta;
        String tag;
    }

    ApkUpdater(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
        downloads = (DownloadManager) activity.getSystemService(Context.DOWNLOAD_SERVICE);
        prefs = activity.getSharedPreferences("kh_android_updates", Context.MODE_PRIVATE);
        betaChannel = (activity.getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
        downloadId = prefs.getLong("download_id", -1L);
    }

    private boolean onLauncher() {
        if (closed || activity.isFinishing() || activity.isDestroyed() || webView == null) return false;
        String url = webView.getUrl();
        if (url == null) return false;
        Uri uri = Uri.parse(url);
        return "https".equalsIgnoreCase(uri.getScheme())
                && "keyboardheroes.com.tr".equalsIgnoreCase(uri.getHost())
                && ("/android-launcher".equals(uri.getPath())
                    || "/android-launcher.html".equals(uri.getPath()));
    }

    private void strip(String state, int percent, String message) {
        if (!onLauncher()) return;
        // JSON quoting also ensures the value cannot execute arbitrary JavaScript.
        String stateJson = JSONObject.quote(state);
        String messageJson = JSONObject.quote(message);
        webView.evaluateJavascript("(function(){if(window.khLauncher)"
                + "window.khLauncher.setUpdate(" + stateJson + ","
                + Math.max(0, Math.min(100, percent)) + "," + messageJson + ");})()", null);
    }

    void checkOnLauncher(boolean forced) {
        if (!onLauncher()) return;
        if (downloadId != -1L) {
            pollDownload();
            return;
        }
        if (newer != null && !offered) {
            showOffer(newer);
            return;
        }
        if (checking || (!forced && System.currentTimeMillis()
                - prefs.getLong("last_check", 0) < CHECK_INTERVAL)) return;
        checking = true;
        strip("checking", 0, "Android APK güncellemeleri kontrol ediliyor…");
        new Thread(() -> {
            Release found = null;
            boolean success = false;
            try {
                found = fetchLatest();
                success = true;
            } catch (Exception ignored) {
                // A temporary network failure must never block launching the game.
            }
            final Release result = found;
            final boolean ok = success;
            handler.post(() -> {
                checking = false;
                if (closed) return;
                if (ok) prefs.edit().putLong("last_check", System.currentTimeMillis()).apply();
                if (result != null) {
                    newer = result;
                    if (onLauncher()) showOffer(result);
                } else {
                    strip(ok ? "ready" : "error", ok ? 100 : 0,
                            ok ? "APK sürümün güncel · oyun verileri sunucudan yüklenir"
                               : "Güncelleme kontrol edilemedi · oyun oynanabilir");
                }
            });
        }, "kh-apk-update-check").start();
    }

    private Release fetchLatest() throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(API).openConnection();
        connection.setConnectTimeout(7000);
        connection.setReadTimeout(9000);
        connection.setRequestProperty("Accept", "application/vnd.github+json");
        connection.setRequestProperty("User-Agent", "KeyboardHeroes-Android-Updater");
        try {
            if (connection.getResponseCode() != 200) throw new IllegalStateException("HTTP");
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            try (InputStream in = connection.getInputStream()) {
                byte[] buffer = new byte[8192];
                int count;
                while ((count = in.read(buffer)) != -1) {
                    if (bytes.size() + count > 2_000_000) throw new IllegalStateException("Release data too large");
                    bytes.write(buffer, 0, count);
                }
            }
            JSONArray releases = new JSONArray(bytes.toString("UTF-8"));
            int[] installed = versionTuple(activity.getPackageManager()
                    .getPackageInfo(activity.getPackageName(), 0).versionName);
            Release best = null;
            for (int i = 0; i < releases.length(); i++) {
                JSONObject item = releases.optJSONObject(i);
                if (item == null || item.optBoolean("draft")) continue;
                String tag = item.optString("tag_name", "");
                Matcher matcher = TAG.matcher(tag);
                if (!matcher.matches()) continue;
                boolean beta = matcher.group(4) != null;
                if (beta != betaChannel) continue;
                int major = Integer.parseInt(matcher.group(1));
                int minor = Integer.parseInt(matcher.group(2));
                int patch = Integer.parseInt(matcher.group(3));
                if (compare(major, minor, patch, installed) <= 0) continue;
                if (best != null && compare(major, minor, patch,
                        new int[]{best.major, best.minor, best.patch}) <= 0) continue;
                JSONArray assets = item.optJSONArray("assets");
                if (assets == null) continue;
                String name = "KeyboardHeroes-Android-v" + major + "." + minor + "." + patch
                        + (beta ? "-beta" : "") + ".apk";
                for (int k = 0; k < assets.length(); k++) {
                    JSONObject asset = assets.optJSONObject(k);
                    if (asset == null || !name.equals(asset.optString("name"))) continue;
                    long size = asset.optLong("size");
                    String digest = asset.optString("digest", "");
                    String url = asset.optString("browser_download_url", "");
                    if (size < 10_000 || size > 100_000_000
                            || !digest.startsWith("sha256:")
                            || !SHA.matcher(digest.substring(7)).matches()
                            || !url.equals(OWNER_PREFIX + tag + "/" + name)) continue;
                    Release candidate = new Release();
                    candidate.major = major;
                    candidate.minor = minor;
                    candidate.patch = patch;
                    candidate.version = major + "." + minor + "." + patch;
                    candidate.beta = beta;
                    candidate.tag = tag;
                    candidate.url = url;
                    candidate.digest = digest.substring(7).toLowerCase(Locale.ROOT);
                    candidate.assetName = name;
                    candidate.size = size;
                    best = candidate;
                    break;
                }
            }
            return best;
        } finally {
            connection.disconnect();
        }
    }

    private static int[] versionTuple(String value) {
        Matcher matcher = Pattern.compile("^(\\d+)\\.(\\d+)\\.(\\d+)").matcher(
                value == null ? "" : value);
        if (!matcher.find()) return new int[]{0, 0, 0};
        return new int[]{Integer.parseInt(matcher.group(1)),
                Integer.parseInt(matcher.group(2)), Integer.parseInt(matcher.group(3))};
    }

    private static int compare(int major, int minor, int patch, int[] other) {
        if (major != other[0]) return Integer.compare(major, other[0]);
        if (minor != other[1]) return Integer.compare(minor, other[1]);
        return Integer.compare(patch, other[2]);
    }

    private void showOffer(Release release) {
        if (!onLauncher() || offered || installing) return;
        offered = true;
        strip("available", 0, "Yeni Android sürümü: v" + release.version);
        String warning = betaChannel
                ? "\n\nBeta APK'lar farklı geliştirme anahtarlarıyla imzalanabilir."
                + " Android imza uyuşmazlığı bildirirse önce eski betayı kaldırıp yenisini kurman gerekir."
                : "\n\nAynı kalıcı imza anahtarıyla hazırlanan sürümler veriler silinmeden güncellenir.";
        new AlertDialog.Builder(activity)
                .setTitle("Keyboard Heroes v" + release.version + " hazır")
                .setMessage("Yeni APK resmî GitHub yayınından indirilecek, SHA-256 doğrulanacak."
                        + " Android kurulum için senden onay isteyecek." + warning)
                .setNegativeButton("Daha sonra", (dialog, which) -> offered = false)
                .setPositiveButton("İndir ve güncelle", (dialog, which) -> download(release))
                .show();
    }

    private void download(Release release) {
        if (downloadId != -1L) { pollDownload(); return; }
        try {
            Uri uri = Uri.parse(release.url);
            DownloadManager.Request request = new DownloadManager.Request(uri);
            request.setTitle("Keyboard Heroes v" + release.version);
            request.setDescription("Doğrulanmış APK güncellemesi indiriliyor");
            request.setMimeType(MIME);
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE);
            request.setAllowedOverMetered(false); // avoid surprise mobile-data usage
            request.setDestinationInExternalFilesDir(activity, Environment.DIRECTORY_DOWNLOADS,
                    "keyboardheroes-update-v" + release.version + ".apk");
            downloadId = downloads.enqueue(request);
            prefs.edit().putLong("download_id", downloadId)
                    .putString("digest", release.digest)
                    .putString("version", release.version)
                    .putLong("size", release.size).apply();
            strip("checking", 1, "APK Wi-Fi üzerinden indiriliyor…");
            pollDownload();
        } catch (Exception e) {
            strip("error", 0, "APK indirmesi başlatılamadı");
            Toast.makeText(activity, "Güncelleme indirilemedi.", Toast.LENGTH_LONG).show();
        }
    }

    private void pollDownload() {
        if (closed || polling || verifying || downloadId == -1L) return;
        polling = true;
        handler.postDelayed(() -> {
            polling = false;
            if (closed || downloadId == -1L) return;
            try (Cursor c = downloads.query(
                    new DownloadManager.Query().setFilterById(downloadId))) {
                if (c == null || !c.moveToFirst()) {
                    fail("APK indirmesi bulunamadı"); return;
                }
                int status = c.getInt(c.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
                if (status == DownloadManager.STATUS_SUCCESSFUL) {
                    verifyDownloaded();
                    return;
                }
                if (status == DownloadManager.STATUS_FAILED) {
                    fail("APK indirmesi tamamlanamadı"); return;
                }
                long done = c.getLong(c.getColumnIndexOrThrow(
                        DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR));
                long total = c.getLong(c.getColumnIndexOrThrow(
                        DownloadManager.COLUMN_TOTAL_SIZE_BYTES));
                int percent = total > 0 ? (int) Math.min(99, 100 * done / total) : 0;
                strip("checking", percent, "APK indiriliyor… %" + percent);
            } catch (Exception e) {
                fail("İndirme durumu alınamadı"); return;
            }
            handler.postDelayed(this::pollDownload, 1000);
        }, 300);
    }

    private void verifyDownloaded() {
        if (verifying || closed || downloadId == -1L) return;
        verifying = true;
        final long id = downloadId;
        final String expected = prefs.getString("digest", "");
        final long size = prefs.getLong("size", -1);
        final String version = prefs.getString("version", "");
        strip("checking", 99, "APK güvenliği doğrulanıyor…");
        new Thread(() -> {
            boolean valid = false;
            try {
                MessageDigest sha = MessageDigest.getInstance("SHA-256");
                long bytes = 0;
                try (ParcelFileDescriptor parcel = downloads.openDownloadedFile(id);
                     InputStream in = new FileInputStream(parcel.getFileDescriptor())) {
                    byte[] buf = new byte[16_384];
                    int n;
                    while ((n = in.read(buf)) >= 0) {
                        if (n == 0) continue;
                        sha.update(buf, 0, n);
                        bytes += n;
                        if (bytes > 100_000_000) break;
                    }
                }
                StringBuilder hash = new StringBuilder();
                for (byte b : sha.digest()) hash.append(String.format(Locale.ROOT, "%02x", b & 0xff));
                File file = new File(activity.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS),
                        "keyboardheroes-update-v" + version + ".apk");
                PackageInfo pkg = activity.getPackageManager()
                        .getPackageArchiveInfo(file.getAbsolutePath(), 0);
                PackageInfo current = activity.getPackageManager()
                        .getPackageInfo(activity.getPackageName(), 0);
                long nextCode = pkg == null ? 0
                        : (Build.VERSION.SDK_INT >= 28 ? pkg.getLongVersionCode() : pkg.versionCode);
                long currentCode = Build.VERSION.SDK_INT >= 28
                        ? current.getLongVersionCode() : current.versionCode;
                valid = size == bytes && expected.equals(hash.toString()) && pkg != null
                        && activity.getPackageName().equals(pkg.packageName)
                        && nextCode > currentCode;
            } catch (Exception ignored) { }
            final boolean verified = valid;
            handler.post(() -> {
                verifying = false;
                if (closed) return;
                if (!verified) { fail("APK doğrulaması başarısız. Kurulum engellendi."); return; }
                strip("ready", 100, "APK doğrulandı · Android kurulum onayı bekleniyor");
                if (onLauncher()) offerInstall();
            });
        }, "kh-apk-verify").start();
    }

    private void offerInstall() {
        if (installing || !onLauncher() || downloadId == -1L) return;
        installing = true;
        new AlertDialog.Builder(activity)
                .setTitle("Güncelleme indirildi")
                .setMessage("APK'nin SHA-256 değeri, paket adı ve sürümü doğrulandı."
                        + " Kurulumu Android'in güvenli paket yükleyicisi tamamlayacak.")
                .setNegativeButton("Daha sonra", (d, w) -> installing = false)
                .setPositiveButton("Kur", (d, w) -> installVerified())
                .show();
    }

    private void installVerified() {
        installing = false;
        if (downloadId == -1L || !onLauncher()) return;
        if (Build.VERSION.SDK_INT >= 26
                && !activity.getPackageManager().canRequestPackageInstalls()) {
            new AlertDialog.Builder(activity)
                    .setTitle("Kurulum izni gerekli")
                    .setMessage("Android, uygulamanın güncelleme kurabilmesi için "
                            + "'Bu kaynaktan uygulama yükle' iznini istemektedir.")
                    .setNegativeButton("Vazgeç", null)
                    .setPositiveButton("Ayarları aç", (d, w) -> {
                        Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                                Uri.parse("package:" + activity.getPackageName()));
                        activity.startActivity(intent);
                    }).show();
            return;
        }
        Uri content = downloads.getUriForDownloadedFile(downloadId);
        if (content == null) { fail("Kurulum dosyasına erişilemiyor"); return; }
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(content, MIME);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        try {
            // The OS checks APK signing identity and asks the user before replacing the app.
            activity.startActivity(intent);
            // Keep verified download available if the user cancels the Android installer.
            strip("ready", 100, "APK indirildi · kurulum onayını tamamla");
        } catch (Exception e) {
            fail("Android APK yükleyicisi açılamadı");
        }
    }

    private void fail(String message) {
        if (downloadId != -1L) downloads.remove(downloadId);
        downloadId = -1L;
        prefs.edit().remove("download_id").remove("digest").remove("version")
                .remove("size").apply();
        installing = false;
        strip("error", 0, message);
        if (onLauncher()) Toast.makeText(activity, message, Toast.LENGTH_LONG).show();
    }

    void onResume() {
        if (closed) return;
        if (downloadId != -1L) pollDownload();
    }

    void close() {
        closed = true;
        handler.removeCallbacksAndMessages(null);
    }
}
