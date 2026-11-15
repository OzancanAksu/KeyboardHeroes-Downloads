# Keyboard Heroes Android v0.6.3 — Persistently Signed APK Updater

The native launcher checks official GitHub Android releases on startup and supports manual checks. If a newer signed APK exists, Android DownloadManager downloads it and shows progress, then the app verifies the GitHub SHA-256 digest, expected size, matching Android application ID and increasing versionCode before asking Android to install.

Permanent release signing requires the repository's encrypted secrets KH_ANDROID_RELEASE_KEYSTORE_B64 and KH_ANDROID_RELEASE_KEYSTORE_PASSWORD. Production workflow refuses to publish if missing.

An ordinary sideloaded application cannot silently install updates: the user must approve installation via the Android system installer. Moving from existing debug beta to permanent signing may require a one-time uninstall/reinstall. Server-side saved accounts remain unaffected.
