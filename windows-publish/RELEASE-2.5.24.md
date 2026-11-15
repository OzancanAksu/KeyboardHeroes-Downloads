# Keyboard Heroes Windows v2.5.24 — Wardrobe Atelier

## Visual update
- Remaining non-atlas equipment now uses individually styled hand-coded illustrations in inventory AND in arena.
- All 50 head/armor/boot items plus 6 capes have illustrated coverage; four previous art-atlas outfit illustrations are retained.
- Engravings, cloth fold lines, softened edges, metal plates, nature / storm / shadow / flame motifs and jewel accents depend on the actual item names.
- Items are rasterized once and the cached canvas is reused for arena and inventory. No repeated per-frame gradients or texture generation.
- Weapon art, game balance, account data, multiplayer protocol 2.2.7, and the existing launcher updater are unchanged.

## Packaging and integrity
The Windows installer and portable archive are a compatibility build based on the pinned, SHA-256-verified v2.5.23 public Windows assets. Updated public game script resources are fetched from the already deployed official HTTPS site, verified, added to the ZIP, and embedded into the setup. This is not a clean private-source native rebuild. Publisher Authenticode signing is not present; SHA-256 hashes are verified at release time.
