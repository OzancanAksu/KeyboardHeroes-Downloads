# Keyboard Heroes Windows v3.0.6 — Actual Native Launcher Version Repair

- **Root cause fixed:** Previous release packaging changed the EXE's assembly header but left the in-game C# launcher Version constant at 2.5.21. Hence Windows repeatedly downloaded updates and showed v2.5.21 even after successful installation.
- This release freshly compiles the native launcher from current 3.0.6 C# source rather than using Mono.Cecil to patch only some strings in an obsolete binary.
- GitHub Actions fails the build unless BOTH the EXE assembly version and `KeyboardHeroesDesktop.LauncherWindow.Version` are exactly 3.0.6. The package is checked for remaining inlined v2.5.21 version strings before publication.
- The installer is freshly compiled and verifies the EXE after copying it to the correct folder, closes running old clients with consent, and refreshes shortcuts.
- Existing Windows 3.0.5 updater integrity checks, bot-match KDA/damage hotfix, artwork, and multiplayer 2.2.7 protocol remain.
- Official fix for old versions: close KeyboardHeroes, run v3.0.6 Setup.exe once, and launch from its success prompt.
