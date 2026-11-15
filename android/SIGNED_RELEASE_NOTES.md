# Keyboard Heroes Android 1.0.1 — Stable Production Build

- Unifies all 56 old and new outfits in the same original Wardrobe Atelier art direction, including four formerly separate atlas garments.
- Repaints historical weapons and offhand icons with the jewel-toned Arcana Arsenal finish. Inventory and arena share cached art.
- Native app version 1.0.1, versionCode 18, Android 8.0+ phone/tablet support. Multiplayer protocol 2.2.7 and account data are unchanged.
- Built using assembleRelease; publication is refused unless the same owner-managed long-lived PKCS12 signing key is provided through encrypted repository secrets. APK signature and package metadata must verify before publishing.
- Android's debug-signed 0.6.10 beta normally cannot be upgraded in place to the production signature. Uninstall the beta once, then install the stable APK. Future releases must use the same production certificate.
