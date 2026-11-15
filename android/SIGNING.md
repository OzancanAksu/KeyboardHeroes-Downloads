# Keyboard Heroes — Persistent Android APK Signing

**Status:** Production workflow is prepared for Android 1.0.1. The presence of the permanent signing secrets must be verified by a successful workflow run before announcing a stable APK. Existing debug betas are not considered production releases. No claim of Google Play endorsement is implied.

## One-time private-key setup (free)

You must run these steps **locally**, in your own authenticated GitHub environment. Neither a private signing key nor its password belongs in this repository, a chat, an issue or a public artifact.

1. Install a JDK 17+ (for `keytool`) and GitHub CLI (`gh`), then run `gh auth login`.
2. In PowerShell, run `./android/signing/setup-release-keystore.ps1` from the Downloads repo. You will choose the persistent keystore password yourself.
3. Make an offline backup of `$HOME/KeyboardHeroesSigning/keyboardheroes-release.p12` and the password in a secure password manager. **Never rotate or overwrite the key while this Android package remains in use.**
4. The helper stores the private key as `KH_ANDROID_RELEASE_KEYSTORE_B64` and the password as `KH_ANDROID_RELEASE_KEYSTORE_PASSWORD` through encrypted GitHub Actions secrets, and prints only the *public* certificate SHA-256 fingerprint.
5. After the two secrets are provisioned, open the GitHub **Actions → Android Production APK — Persistent Signing Key → Run workflow**. The manual workflow builds `assembleRelease` with versionCode **18**, versionName **1.0.1** and verifies its cryptographic signing scheme using `apksigner verify` before publishing an immutable `android-v1.0.1` release.
6. The existing debug-signed v0.6.10-beta APK is signed with a different certificate. Users must **uninstall the old beta once**, then install v1.0.1. Future releases signed with this same permanent key can be installed directly over the preceding signed version.

The workflow fails rather than generating an untrusted new debug key when release secrets are missing. There is no cost for generating or using the Android release key.

**Android trust is separate from APK signing:** Side-loaded APKs can still prompt for installing unknown apps and receive Google Play Protect / Android Developer Verification warnings. Register package `tr.com.keyboardheroes.tablet` in [Android Developer Console](https://developer.android.com/developer-verification), providing the public signing certificate fingerprint, to establish verified developer identity for outside-Play distribution. Full distribution has separate eligibility/fees; limited distribution is free for up to 20 devices. Google Play is another distribution option. Neither platform guarantees zero warnings purely because a file is signed.

**Do not** upload keystores, PFX files or signing passwords in chat or GitHub repository files.
