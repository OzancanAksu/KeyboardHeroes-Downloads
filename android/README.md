# Keyboard Heroes — Android tablet (beta)

Independent **Android Studio / Gradle** source project. Gameplay stays on the official Keyboard Heroes HTTPS server; the APK is a secure Android WebView container, **not** an offline reimplementation or a Windows EXE conversion.

- Android 8.0+ (API 26), landscape arena, portrait/landscape launcher.
- Same registered user accounts and authoritative multiplayer server as Windows.
- Touch joystick, tap-to-aim canvas, virtual Q/W/E/R and potion controls are provided by `android-controls.js` on the web server.
- Only HTTPS keyboardheroes.com.tr is loaded internally; external links open the system browser.
- JS bridge accepts an allowlisted set of launcher commands; no file access or cleartext networking.
- Run locally: open this directory in Android Studio and build `app:assembleDebug`.
- CI: `.github/workflows/android-tablet-apk.yml` publishes an **installable debug-signed beta** artifact under `android-v0.1.0`.

**Important:** Android debug signing keys are not appropriate for a production release. For store distribution and seamless future APK upgrades, configure a persistent private release keystore in encrypted CI secrets, switch to `assembleRelease` with that keystore, and increment `versionCode`. Different debug signing keys prevent direct installation over an older APK. APK install may require Android's 'Install unknown apps' permission.

Android source is isolated under `android/` in the existing KeyboardHeroes-Downloads repository; it can be moved unchanged to a dedicated KeyboardHeroes-Android repository.
