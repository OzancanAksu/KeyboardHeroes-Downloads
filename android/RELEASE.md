# Keyboard Heroes Android Phone & Tablet v0.5.0 — Beta
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

## Improved controls and equipment (v0.5.0)
- Correct isometric thumbstick motion and near-field path steering.
- One-tap smart-target Q/W/E/R, or press-and-drag to aim manually.
- Touch-selected opponents have a larger hit area; cooldown rings/overlays on ability buttons.
- Two large equipment columns and a dedicated item ability panel, instead of tiny item slots.
- 60 FPS maximum paint rate on high-refresh phones (input and game ticks are not capped); no reduced-graphics default.
- This development-signed APK may require uninstalling the v0.2.0 beta before installing, because ephemeral CI signing keys differ.

## v0.5.0 phone improvements
- Direct, instant-reversing analog joystick in bot matches rather than pathfinding a changing destination.
- Larger potion buttons and visible remaining charges/cooldown, with explicit feedback for a full-health heal.
- Minimap no longer competes with skill/potion controls; compact HP panel at the top of the arena.
- Equip button is pinned to bottom with proper scroll inset; saved/preset build panels are optional to maximize inventory space.
- Reduced top-of-screen draft overlays and repositioned match exit and selection timer.
- Validated with headless mobile Chromium gesture testing; actual device validation remains in beta.
- Upgrades from previous beta builds may require uninstall due to different development signing keys.

## v0.5.0 Android usability
- **Save & Close never blocks equipment cards:** button appears after the final item and potion slots as normal scroll content.
- All category tabs fit the screen and can be selected without horizontal clipping.
- Hold a skill button for 160 milliseconds (or swipe immediately), drag to choose aim direction/range; in-arena trajectory and effect outline update as the finger moves. Release to cast or cancel the touch to abandon.
- One-tap smart-target Q/W/E/R is retained, as are instant joystick direction changes and enlarged potions.
- Development-signed release for personal playtest; previous beta may need uninstall due to different ephemeral signing keys.
