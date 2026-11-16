# Keyboard Heroes Windows v3.0.3 — Updater Loop Repair

- Retains the verified bot-match KDA and damage hotfix introduced in 3.0.2.
- Rebuilds the Windows updater with both pre-install staged EXE version verification and post-install installed EXE version plus SHA-256 checks; a stale launcher can no longer silently report a completed update.
- Writes detailed installation/failure information to %LOCALAPPDATA%/KeyboardHeroes/Updates/updater-history.log.
- A failed update provides explicit instructions to use the official setup. A full installer repairs older installations that repeatedly reopen an obsolete launcher.
- Existing 3.0.2 and all historical release assets are unchanged. Multiplayer protocol remains 2.2.7.
