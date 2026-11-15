# Keyboard Heroes Android v0.6.3 Beta — APK Update Checker

## New
- Native launcher automatically checks official GitHub Android releases on startup (hourly throttle). The game is not blocked.
- A new APK GÜNCELLEMESİNİ KONTROL ET button on the launcher.
- Newer beta APKs can be downloaded with Android DownloadManager, progress displayed, SHA-256 verified, and opened through Android's installation prompt.
- Android can request the per-source installation permission and always asks the user to confirm the install.
- Live web game updates are still delivered separately by keyboardheroes.com.tr.

## Beta signing limitation
The debug beta uses a CI-generated signing certificate, which can differ across builds. Android will reject an in-place update if certificate identities differ. In that case download the new APK from GitHub, uninstall the old beta, and install the downloaded APK. Game account progress is stored on the shared server. Normal seamless updates need a persistent developer signing key (see SIGNING.md).

Android 8.0+ and internet are required. The updater accepts only the official repository and validates downloaded APKs before installation.
