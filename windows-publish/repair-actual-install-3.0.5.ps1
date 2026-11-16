# KeyboardHeroes v3.0.5 one-time Windows file repair.
# Official immutable release: verified ZIP SHA-256.
# Runs as the current user; no admin, no uninstall, no account-data deletion.
# Source: KeyboardHeroes-Downloads/windows-publish/repair-actual-install-3.0.5.ps1
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$expectedVersion = '3.0.5.0'
$zipSha = 'ebc1cdfda2bfe6abf54326ac7e5e5771b23b209e6a8b3e57ba5fd42c25783ad7'
$zipSize = 35469419
$url = 'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v3.0.5/KeyboardHeroes-Desktop-v3.0.5.zip'
$install = Join-Path $env:LOCALAPPDATA 'Programs\KeyboardHeroes'
$exe = Join-Path $install 'KeyboardHeroes.exe'
$work = Join-Path (Join-Path $env:LOCALAPPDATA 'KeyboardHeroes\Updates') ('OneTimeRepair-' + [Guid]::NewGuid().ToString('N'))
$archive = Join-Path $work 'verified-v3.0.5.zip'
$stage = Join-Path $work 'staging'
$backup = Join-Path $work 'backup'
$log = Join-Path $work 'repair.log'
$copied = New-Object 'System.Collections.Generic.List[object]'

function Record([string] $message) {
  $entry = [DateTime]::UtcNow.ToString('u') + ' ' + $message
  Write-Host $message
  Add-Content -LiteralPath $log -Value $entry -Encoding UTF8
}
function ActualVersion([string] $filename) {
  if (!(Test-Path -LiteralPath $filename -PathType Leaf)) { return 'MISSING' }
  try { return [Reflection.AssemblyName]::GetAssemblyName($filename).Version.ToString() }
  catch { return 'INVALID EXE: ' + $_.Exception.Message }
}
function RunningKeyboardHeroes {
  @(Get-CimInstance Win32_Process -Filter "Name LIKE 'KeyboardHeroes%'" -ErrorAction Stop |
    Where-Object { $_.Name -match '^KeyboardHeroes(?:Updater(?:-[A-Fa-f0-9]+)?)?\.exe$' })
}

New-Item -ItemType Directory -Force -Path $work, $stage, $backup | Out-Null
Record '=== KeyboardHeroes official Windows 3.0.5 file repair ==='
Record ('Expected installed EXE: ' + $exe)
Record ('Installed EXE assembly version before repair: ' + (ActualVersion $exe))
try {
  $reg = Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\KeyboardHeroes' -ErrorAction SilentlyContinue
  if ($reg) { Record ('Control Panel version: ' + $reg.DisplayVersion + '; registered folder: ' + $reg.InstallLocation) }
} catch {}
try {
  foreach ($p in @(RunningKeyboardHeroes)) {
    Record ('Running old process: PID=' + $p.ProcessId + '; path=' + $p.ExecutablePath)
  }
} catch { Record ('Process inspection warning: ' + $_.Exception.Message) }

Record 'Downloading the exact published 3.0.5 ZIP from the official KeyboardHeroes GitHub release.'
try {
  Invoke-WebRequest -Uri $url -OutFile $archive -UseBasicParsing -TimeoutSec 180 -MaximumRedirection 10
  if ((Get-Item -LiteralPath $archive).Length -ne $zipSize) { throw 'ZIP size mismatch; repair stopped.' }
  $actualSha = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actualSha -ne $zipSha) { throw 'ZIP SHA-256 mismatch; repair stopped. No installed files modified.' }
  Record ('Verified published ZIP SHA-256: ' + $actualSha)
  Expand-Archive -LiteralPath $archive -DestinationPath $stage -Force
  $stagedExe = Join-Path $stage 'KeyboardHeroes.exe'
  $stagedVersion = ActualVersion $stagedExe
  if ($stagedVersion -ne $expectedVersion) { throw ('Staged executable version is ' + $stagedVersion + ', expected ' + $expectedVersion) }
  Record ('Verified extracted launcher version: ' + $stagedVersion)
  $srcFiles = @(Get-ChildItem -LiteralPath $stage -Recurse -File -ErrorAction Stop)
  if ($srcFiles.Count -lt 8) { throw 'Incomplete ZIP contents.' }
  Record ('Verified game files: ' + $srcFiles.Count)
  Record 'The repair will stop any running KeyboardHeroes.exe / Updater, replace ONLY official game files and rebuild current-user shortcuts.'
  Record 'It will NOT delete game settings, user profiles, accounts or the old uninstaller.'
  Record 'Any unsaved local match progress in a running game may be lost.'
  $consent = Read-Host 'Type ONAR to perform this repair (anything else cancels)'
  if ($consent -cne 'ONAR') { Record 'Cancelled. No installed files were modified.'; return }

  foreach ($p in @(RunningKeyboardHeroes)) {
    try {
      Record ('Closing old game/update process ' + $p.ProcessId)
      Stop-Process -Id $p.ProcessId -Force -ErrorAction Stop
    } catch {
      if (Get-Process -Id $p.ProcessId -ErrorAction SilentlyContinue) { throw ('Could not close PID ' + $p.ProcessId + ': ' + $_.Exception.Message) }
    }
  }
  Start-Sleep -Milliseconds 1200
  $stillRunning = @(RunningKeyboardHeroes)
  if ($stillRunning.Count -gt 0) { throw 'KeyboardHeroes still running. Close all old game and updater windows before repair.' }
  New-Item -ItemType Directory -Force -Path $install | Out-Null
  $installPrefix = $install.TrimEnd('\') + '\'
  foreach ($source in $srcFiles) {
    $relative = $source.FullName.Substring($stage.Length).TrimStart('\')
    if ([string]::IsNullOrWhiteSpace($relative)) { continue }
    $dest = [IO.Path]::GetFullPath((Join-Path $install $relative))
    if (!$dest.StartsWith($installPrefix,[StringComparison]::OrdinalIgnoreCase)) { throw ('Unsafe destination: ' + $relative) }
    $previous = Test-Path -LiteralPath $dest -PathType Leaf
    $saved = Join-Path $backup $relative
    if ($previous) {
      New-Item -ItemType Directory -Force -Path (Split-Path -Parent $saved) | Out-Null
      Copy-Item -LiteralPath $dest -Destination $saved -Force -ErrorAction Stop
    }
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dest) | Out-Null
    $copied.Add([pscustomobject]@{Destination=$dest;Previous=$previous;Saved=$saved})
    Copy-Item -LiteralPath $source.FullName -Destination $dest -Force -ErrorAction Stop
  }

  $actualVersion = ActualVersion $exe
  if ($actualVersion -ne $expectedVersion) { throw ('Installed EXE is still ' + $actualVersion + '; expected ' + $expectedVersion) }
  $sourceHash = (Get-FileHash -LiteralPath $stagedExe -Algorithm SHA256).Hash
  $installedHash = (Get-FileHash -LiteralPath $exe -Algorithm SHA256).Hash
  if ($sourceHash -ne $installedHash) { throw 'Installed EXE does not match verified ZIP. Refusing to report success.' }
  Start-Sleep -Seconds 2
  if ((ActualVersion $exe) -ne $expectedVersion) { throw 'Another process replaced the EXE immediately after repair.' }
  Record ('PASS: Installed launcher is exactly ' + $actualVersion + ' at ' + $exe)
  Record ('PASS: Installed EXE SHA-256: ' + $installedHash)

  $shell = New-Object -ComObject WScript.Shell
  $shortcutDirs = @(
    [Environment]::GetFolderPath('DesktopDirectory'),
    [Environment]::GetFolderPath('Programs')
  ) | Where-Object { $_ }
  foreach ($dir in $shortcutDirs) {
    try {
      New-Item -ItemType Directory -Force -Path $dir | Out-Null
      $shortcutPath = Join-Path $dir 'KeyboardHeroes.lnk'
      $link = $shell.CreateShortcut($shortcutPath)
      $link.TargetPath = $exe
      $link.WorkingDirectory = $install
      $link.IconLocation = $exe + ',0'
      $link.Description = 'KeyboardHeroes - Verified v3.0.5'
      $link.Save()
      Record ('Repaired shortcut: ' + $shortcutPath)
    } catch { Record ('Shortcut warning: ' + $_.Exception.Message) }
  }
  try {
    $regKey = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\KeyboardHeroes'
    if (Test-Path $regKey) {
      Set-ItemProperty -Path $regKey -Name DisplayVersion -Value '3.0.5'
      Set-ItemProperty -Path $regKey -Name InstallLocation -Value $install
      Set-ItemProperty -Path $regKey -Name DisplayIcon -Value $exe
    }
  } catch { Record ('Uninstall registry warning: ' + $_.Exception.Message) }

  Record 'SUCCESS: v3.0.5 files restored, verified, and normal desktop/Start Menu shortcuts updated.'
  Record 'Old pinned taskbar buttons may need manual unpinning. Start the game from the verified installed path.'
  Start-Process -FilePath $exe -WorkingDirectory $install -ErrorAction Stop
  Record 'Started the correct installed EXE.'
} catch {
  $failure = $_.Exception.Message
  Record ('REPAIR FAILED: ' + $failure)
  if ($copied.Count -gt 0) {
    Record 'Attempting rollback of overwritten game files...'
    for ($i=$copied.Count-1; $i -ge 0; $i--) {
      $record = $copied[$i]
      try {
        if ($record.Previous) { Copy-Item -LiteralPath $record.Saved -Destination $record.Destination -Force }
        elseif (Test-Path -LiteralPath $record.Destination) { Remove-Item -LiteralPath $record.Destination -Force }
      } catch { Record ('Rollback warning for ' + $record.Destination + ': ' + $_.Exception.Message) }
    }
    Record 'Rollback attempt finished; no game or account settings were erased.'
  }
  Record ('Diagnostics saved locally: ' + $log)
  throw
}
