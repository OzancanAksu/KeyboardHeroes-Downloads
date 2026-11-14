# Keyboard Heroes Android Phone & Tablet v0.3.0 — Beta
- Native Android app container for https://keyboardheroes.com.tr.
- Account login/registration, multiplayer and equipment share the current live Keyboard Heroes server.
- Landscape arena with tablet-friendly touchscreen controls.
- No Play Store publishing, paid services or server-side account changes.
- **Development-signed beta APK:** suitable for personal tablet testing, not a signed production release.
- Android 8.0+ and a current Android System WebView required. Internet connection required.

## Phone fixes
- Portrait account and bot/lobby/loadout menus; landscape arena only while playing.
- Bot battle launch button stays visible; responsive scrolling, inventory and equipment pages.
- Smaller on-screen controls and Pause/Resume for Redmi Note 13-class phones.
- Existing beta v0.1.0 may need to be uninstalled first because the CI debug signing key changes each build.

## Improved controls and equipment (v0.3.0)
- Correct isometric thumbstick motion and near-field path steering.
- One-tap smart-target Q/W/E/R, or press-and-drag to aim manually.
- Touch-selected opponents have a larger hit area; cooldown rings/overlays on ability buttons.
- Two large equipment columns and a dedicated item ability panel, instead of tiny item slots.
- 60 FPS maximum paint rate on high-refresh phones (input and game ticks are not capped); no reduced-graphics default.
- This development-signed APK may require uninstalling the v0.2.0 beta before installing, because ephemeral CI signing keys differ.
