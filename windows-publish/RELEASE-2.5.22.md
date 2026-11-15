# Keyboard Heroes Windows v2.5.22 — Arcana Unified / Flag Race AI

## New live game assets
- Original weapon-specific Arcana details, updated equipment illustrations and a consistent dark palette across homepage, account, launcher, game, inventory and match results.
- Flag Race bots intercept opponents carrying their flag, retrieve dropped flags and escort their own carriers.
- Updated client rules and gameplay files match the authoritative v2.5.22 Render server.
- Native launcher reports v2.5.22. Existing accounts, updater, localization, offline/LAN components and protocol 2.2.7 remain included.

## Packaging method and provenance
- This is a compatibility package assembled from the previously published SHA-256-verified **v2.5.21 Windows runtime and installer** plus the official, live-served **v2.5.22 JavaScript/CSS/HTML game assets**.
- The only server-side code change between the source commits was the app version constant; it is updated here. Managed launcher version metadata and the installer's embedded ZIP are refreshed while preserving existing launcher and setup logic.
- This is **not a clean native compilation from the private v2.5.22 source tree**. The game source remains private.
- CI validates the original release hashes, downloaded assets, JavaScript syntax, launcher/installer assembly metadata, embedded ZIP and a local Node server smoke check.
- Public downloads are published with their SHA-256 digests. This Windows EXE is **not Authenticode code-signed**.
