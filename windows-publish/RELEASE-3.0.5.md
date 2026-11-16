# Keyboard Heroes Windows v3.0.5 — Stale Launcher Repair
- Installer detects running KeyboardHeroes and updater processes and asks permission to close them before replacing any files.
- Ensures `KeyboardHeroes.exe` actually has assembly version 3.0.5.0 after installation. An old EXE can never silently count as successful.
- Rewrites desktop and Start menu links to the verified installed executable, shows the installed path, and offers to launch that exact path.
- If an old pinned taskbar icon opens a different 2.5.x executable, unpin the stale icon and pin the newly launched application.
- Retains the 3.0.4 access-denied uninstaller workaround, 3.0.3 updater integrity checks, and 3.0.2 bot match stats hotfix.
- No change to online gameplay protocol 2.2.7 or player-account data.
