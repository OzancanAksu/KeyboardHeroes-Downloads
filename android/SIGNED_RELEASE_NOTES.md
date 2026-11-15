# Keyboard Heroes Android v0.6.2 — Persistently Signed Match Results Hotfix

The first persistent-key release on this version is built ONLY when the project owner has configured the original permanent signing keystore as encrypted GitHub Actions secrets. The build verifies its APK signature with Android SDK apksigner and attaches a SHA-256 digest.

New end-of-match controls: Replay / Rematch, Main Menu, and K/D/A/damage/time statistics. The game logic comes from the official keyboardheroes.com.tr server; the server-side match results hotfix must also be deployed. Existing Deathmatch + Armağan, Q/W/E/R drag aiming, potions and original KH app icon remain.

**Upgrade note:** A debug-signed beta generally cannot be upgraded directly to an APK signed with the permanent key. Uninstall the beta first if Android reports a certificate mismatch; account progress stays on the server.

Cryptographic APK signing validates file origin and integrity. It is **not** equivalent to Google Play Protect approval or government/developer certification.
