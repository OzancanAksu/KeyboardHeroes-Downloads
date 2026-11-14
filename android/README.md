# Keyboard Heroes — Android phone & tablet (beta)

Independent **Android Studio / Gradle** source project. Gameplay stays on the official Keyboard Heroes HTTPS server; the APK is a secure Android WebView container, **not** an offline reimplementation or a Windows EXE conversion.

- Android 8.0+ (API 26), phone portrait menus, landscape full-screen combat, scrollable bot lobby and inventory, touch controls, Android 8.0+.
- Same registered user accounts and authoritative multiplayer server as Windows.
- Touch joystick, tap-to-aim canvas, virtual Q/W/E/R and potion controls are provided by `android-controls.js` on the web server.
- Only HTTPS keyboardheroes.com.tr is loaded internally; external links open the system browser.
- JS bridge accepts an allowlisted set of launcher commands; no file access or cleartext networking.
- Run locally: open this directory in Android Studio and build `app:assembleDebug`.
- CI: `.github/workflows/android-tablet-apk.yml` publishes an **installable debug-signed beta** artifact under `android-v0.5.0`.

**Important:** Android debug signing keys are not appropriate for a production release. For store distribution and seamless future APK upgrades, configure a persistent private release keystore in encrypted CI secrets, switch to `assembleRelease` with that keystore, and increment `versionCode`. Different debug signing keys prevent direct installation over an older APK. APK install may require Android's 'Install unknown apps' permission.

Android source is isolated under `android/` in the existing KeyboardHeroes-Downloads repository; it can be moved unchanged to a dedicated KeyboardHeroes-Android repository.

## v0.5.0 phone experience
- Portrait startup and scrolling bot/lobby/loadout screens, landscape only during fight (and between rounds).
- Compact portrait gear choices, sticky bot start button, smaller joystick and combat buttons for narrow landscape screens.
- Bot-match pause/resume button on screen; voice or keyboard not required.
- If Android cannot update v0.1.0 because the debug signatures differ across CI jobs, **uninstall the v0.1.0 beta first**. Account data and saved server-side builds remain linked to the login; local app cache is removed.

## v0.5.0 — phone touch controls
- Joystick direction now maps to isometric world coordinates; short anchored steering goals reduce route jitter.
- Skill Q/W/E/R: tap for immediate nearest-target cast; swipe from skill button to aim direction, then release to cast. No second arena tap.
- Larger 2x2 skill pad, visible cooldown overlays and tap-to-lock enemy hit areas.
- Full-width two-column weapon inventory; tap one item to open its own ability/equip screen, with a Back to Items control.
- Canvas drawing is limited to 60 FPS on high-refresh phones while simulation/input continues at native rate and original art detail.
- Windows gameplay code is unaffected: Android-only user-agent activation.

## v0.5.0 — Redmi Note 13 mobile UX cleanup
- Live analog joystick movement with immediate direction reversal in bot matches; collision resolver retained.
- Clearer 1/2/3 potion targets (48–52 CSS px) show remaining charges and cooldown; healing at full HP explains why use is blocked.
- Canvas minimap is hidden for mobile so it no longer paints behind QWER/potion buttons; player health moves to a compact top-left overlay.
- Draft hides desktop quick slot strips and collapses Build Arsenal / presets behind an accessible toggle.
- Equip button stays at the actual bottom edge of the phone; draft gains enough inset and scroll space so cards remain tappable.
- Mobile Chrome smoke checks landscape, bot start, inventory navigation, Q, potions and right-to-left joystick reversal.
- Debug-signed beta v0.5.0: uninstall earlier beta first when signatures differ. Server-side user data is not stored in the APK.

## v0.5.0 — full inventory visibility and skill drag-to-aim
- Save & Close is now at the bottom of the scrollable equipment contents; it no longer floats over item cards.
- Equipment category filters wrap into four columns, with no horizontally clipped category tabs.
- Status bar safe margins for the mobile back/exit control.
- Short tap Q/W/E/R retains nearest-enemy auto-cast. Hold for 160ms or drag >14px to preview in-world range, trajectory and area-of-effect. Release to fire; canceled touches do not cast.
- Existing phone movement, enlarged potions and 60 FPS paint throttle retained.
- Note: This is a debug-signed beta APK; uninstall a previous Android beta if Android reports a signing incompatibility when updating.
