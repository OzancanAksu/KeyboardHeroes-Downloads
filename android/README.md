# Keyboard Heroes — Android phone & tablet (beta)

Independent **Android Studio / Gradle** source project. Gameplay stays on the official Keyboard Heroes HTTPS server; the APK is a secure Android WebView container, **not** an offline reimplementation or a Windows EXE conversion.

- Android 8.0+ (API 26), phone portrait menus, landscape full-screen combat, scrollable bot lobby and inventory, touch controls, Android 8.0+.
- Same registered user accounts and authoritative multiplayer server as Windows.
- Touch joystick, tap-to-aim canvas, virtual Q/W/E/R and potion controls are provided by `android-controls.js` on the web server.
- Only HTTPS keyboardheroes.com.tr is loaded internally; external links open the system browser.
- JS bridge accepts an allowlisted set of launcher commands; no file access or cleartext networking.
- Run locally: open this directory in Android Studio and build `app:assembleDebug`.
- CI: `.github/workflows/android-tablet-apk.yml` publishes an **installable debug-signed beta** artifact under `android-v0.2.0`.

**Important:** Android debug signing keys are not appropriate for a production release. For store distribution and seamless future APK upgrades, configure a persistent private release keystore in encrypted CI secrets, switch to `assembleRelease` with that keystore, and increment `versionCode`. Different debug signing keys prevent direct installation over an older APK. APK install may require Android's 'Install unknown apps' permission.

Android source is isolated under `android/` in the existing KeyboardHeroes-Downloads repository; it can be moved unchanged to a dedicated KeyboardHeroes-Android repository.

## v0.2.0 phone experience
- Portrait startup and scrolling bot/lobby/loadout screens, landscape only during fight (and between rounds).
- Compact portrait gear choices, sticky bot start button, smaller joystick and combat buttons for narrow landscape screens.
- Bot-match pause/resume button on screen; voice or keyboard not required.
- If Android cannot update v0.1.0 because the debug signatures differ across CI jobs, **uninstall the v0.1.0 beta first**. Account data and saved server-side builds remain linked to the login; local app cache is removed.
