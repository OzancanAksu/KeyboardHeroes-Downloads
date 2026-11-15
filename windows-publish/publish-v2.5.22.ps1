$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$ProgressPreference = 'SilentlyContinue'

# Rebuild the Windows 2.5.22 payload from the immutable published 2.5.21
# runtime and publicly hosted 2.5.22 web game resources. The private game
# repository is never checked out or copied into this public CI repository.
$root = (Get-Location).Path
$work = Join-Path $root 'windows-build'
$stage = Join-Path $work 'KeyboardHeroes'
$baseUrl = 'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v2.5.21'
$oldZip = Join-Path $work 'KeyboardHeroes-Desktop-v2.5.21.zip'
$oldSetup = Join-Path $work 'KeyboardHeroesSetup-v2.5.21.exe'
$newZip = Join-Path $root 'updates/KeyboardHeroes-Desktop-v2.5.22.zip'
$newSetup = Join-Path $root 'KeyboardHeroesSetup.exe'
New-Item -ItemType Directory -Force -Path $work, (Join-Path $root 'updates') | Out-Null

function Assert-Sha256([string]$file, [string]$expected) {
  if (!(Test-Path -LiteralPath $file)) { throw "Missing $file" }
  $actual = (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash
  if ($actual -ne $expected.ToUpperInvariant()) { throw "Pinned release checksum mismatch: $file ($actual)" }
}
function Get-CheckedDownload([string]$url, [string]$file, [int]$tries=4) {
  $ok = $false
  for ($i=1; $i -le $tries; $i++) {
    try {
      if (Test-Path $file) { Remove-Item -LiteralPath $file -Force }
      Invoke-WebRequest -Uri $url -OutFile $file -TimeoutSec 90 -MaximumRedirection 8
      if ((Get-Item -LiteralPath $file).Length -lt 20) { throw "Suspiciously small download" }
      $ok = $true
      break
    } catch {
      Write-Warning "Attempt $i for $url : $($_.Exception.Message)"
      if ($i -lt $tries) { Start-Sleep -Seconds 4 }
    }
  }
  if (!$ok) { throw "Could not download $url" }
}

Get-CheckedDownload "$baseUrl/KeyboardHeroes-Desktop-v2.5.21.zip" $oldZip
Assert-Sha256 $oldZip '6f4be23154957406db1d1200d361b44d50aab2877f79db09fffcf26179538cef'
Get-CheckedDownload "$baseUrl/KeyboardHeroesSetup.exe" $oldSetup
Assert-Sha256 $oldSetup '1565cb9c5143e25519b1647f613671443b2b2def8776caf1967cc3140df99fb0'
Expand-Archive -LiteralPath $oldZip -DestinationPath $stage -Force
foreach ($file in @('KeyboardHeroes.exe','KeyboardHeroesUpdater.exe','server.cjs','package.json','dist/index.html','runtime/node.exe')) {
  if (!(Test-Path -LiteralPath (Join-Path $stage $file))) { throw "Missing base runtime file: $file" }
}

# The server publicly serves these exact JS/CSS/HTML resources. They were
# changed in the single 2.5.21 -> 2.5.22 commit; no private backend is exposed.
$clientFiles = @(
 'android-launcher.html','arcana-art.js','arcana-unified.css',
 'home.html','i18n-catalog.js','launcher.html',
 'multiplayer-rules.js','portal-arcana.css','version.js','visual-refinement.js'
)
foreach ($name in $clientFiles) {
  $target = Join-Path $stage ('dist/' + $name)
  Get-CheckedDownload ('https://keyboardheroes.onrender.com/' + $name) $target
  $source = Get-Content -LiteralPath $target -Raw -Encoding UTF8
  if ($source -match '(?i)<html[^>]*>\s*(?:<body[^>]*>)?\s*(?:Bad gateway|Not found|Service unavailable)') {
    throw "Upstream error page in $name"
  }
  if ($name.EndsWith('.js')) {
    & (Join-Path $stage 'runtime/node.exe') --check $target
    if ($LASTEXITCODE -ne 0) { throw "Invalid JavaScript: $name" }
  }
  $bytes = (Get-Item -LiteralPath $target).Length
  Write-Host "Updated game asset: $name ($bytes bytes)"
}
# /index.html is intentionally redirected to home.html on the public cloud.
# Patch the existing verified game entrypoint with the two exact additions
# from the v2.5.22 commit rather than downloading the wrong HTML document.
$indexPath = Join-Path $stage 'dist/index.html'
$index = Get-Content -LiteralPath $indexPath -Raw -Encoding UTF8
$oldStyle = 'href="inventory-arcana.css"><link rel="icon"'
$newStyle = 'href="inventory-arcana.css"><link rel="stylesheet" href="arcana-unified.css"><link rel="icon"'
$oldScript = '<script src="gear-v5-visuals.js"></script>'
$newScript = '<script src="gear-v5-visuals.js"></script><script src="arcana-art.js"></script>'
if (!$index.Contains($oldStyle) -or !$index.Contains($oldScript)) { throw 'Unexpected base game entrypoint' }
$index = $index.Replace($oldStyle, $newStyle).Replace($oldScript, $newScript)
[System.IO.File]::WriteAllText($indexPath, $index, [System.Text.UTF8Encoding]::new($false))
# The public cloud also maps /desktop.html to home.html, so preserve the
# existing locally installed desktop page and add only its new theme link.
$desktopPath = Join-Path $stage 'dist/desktop.html'
$desktopSource = Get-Content -LiteralPath $desktopPath -Raw -Encoding UTF8
$oldDesktop = '<link rel="stylesheet" href="/i18n.css">'
if (!$desktopSource.Contains($oldDesktop)) { throw 'Unexpected desktop page template' }
$desktopSource = $desktopSource.Replace($oldDesktop, $oldDesktop + '<link rel="stylesheet" href="/portal-arcana.css">')
[System.IO.File]::WriteAllText($desktopPath, $desktopSource, [System.Text.UTF8Encoding]::new($false))
foreach ($asset in @('arcana-unified.css','arcana-art.js')) {
  if (!$index.Contains($asset)) { throw "Missing v2.5.22 asset reference: $asset" }
}
$rules = Get-Content -LiteralPath (Join-Path $stage 'dist/multiplayer-rules.js') -Raw -Encoding UTF8
if (!$rules.Contains('flagRace')) { throw 'New flag AI asset was not downloaded' }

# All private backend code is unchanged between 2.5.21 and 2.5.22 except
# this published release version constant (verified against commit diff).
$serverPath = Join-Path $stage 'server.cjs'
$serverSource = Get-Content -LiteralPath $serverPath -Raw -Encoding UTF8
if (!$serverSource.Contains("const APP_VERSION='2.5.21';")) { throw 'Unexpected server base version' }
$serverSource = $serverSource.Replace("const APP_VERSION='2.5.21';", "const APP_VERSION='2.5.22';")
[System.IO.File]::WriteAllText($serverPath, $serverSource, [System.Text.UTF8Encoding]::new($false))
& (Join-Path $stage 'runtime/node.exe') --check $serverPath
if ($LASTEXITCODE -ne 0) { throw 'Server syntax verification failed' }

$packagePath = Join-Path $stage 'package.json'
$package = Get-Content -LiteralPath $packagePath -Raw -Encoding UTF8
if ($package -notmatch '"version"\s*:\s*"2\.5\.21"') { throw 'Unexpected npm version in base release' }
$package = $package -replace '"version"\s*:\s*"2\.5\.21"', '"version": "2.5.22"'
[System.IO.File]::WriteAllText($packagePath, $package, [System.Text.UTF8Encoding]::new($false))

# Rewrite the managed version literals and assembly metadata using Cecil.
# This preserves the existing launcher code, platform integrations, resources,
# language picker, updater and offline/LAN support without publishing sources.
$nugetDir = Join-Path $work 'nuget'
& nuget install Mono.Cecil -Version 0.11.6 -OutputDirectory $nugetDir -ExcludeVersion -NonInteractive
if ($LASTEXITCODE -ne 0) { throw 'Mono.Cecil restore failed' }
$dll = Join-Path $nugetDir 'Mono.Cecil/lib/netstandard2.0/Mono.Cecil.dll'
if (!(Test-Path -LiteralPath $dll)) { throw 'Mono.Cecil netstandard2.0 DLL missing' }
Add-Type -Path $dll

function Patch-ManagedVersion([Mono.Cecil.AssemblyDefinition]$assembly, [string]$from, [string]$to) {
  $count = 0
  foreach ($type in $assembly.MainModule.Types) {
    foreach ($method in $type.Methods) {
      if (!$method.HasBody) { continue }
      foreach ($instruction in $method.Body.Instructions) {
        if ($instruction.OpCode.Code -eq [Mono.Cecil.Cil.Code]::Ldstr -and $instruction.Operand -is [string] -and $instruction.Operand -eq $from) {
          $instruction.Operand = $to
          $count++
        }
      }
    }
  }
  if ($count -lt 1) { throw "Version literal $from not found in managed executable" }
  $assembly.Name.Version = [Version]'2.5.22.0'
  return $count
}
$launcherPath = Join-Path $stage 'KeyboardHeroes.exe'
$launcherAsm = [Mono.Cecil.AssemblyDefinition]::ReadAssembly($launcherPath)
try {
  $count = Patch-ManagedVersion $launcherAsm '2.5.21' '2.5.22'
  $tempLauncher = "$launcherPath.rebuilt"
  $launcherAsm.Write($tempLauncher)
  Write-Host "Updated $count launcher runtime version references"
} finally { $launcherAsm.Dispose() }
Move-Item -LiteralPath $tempLauncher -Destination $launcherPath -Force

# Boot a fully populated local server to verify native packaging compatibility.
$env:ARENA_PORT = '46173'
$outLog = Join-Path $work 'server.stdout.log'
$errLog = Join-Path $work 'server.stderr.log'
$proc = Start-Process -FilePath (Join-Path $stage 'runtime/node.exe') -ArgumentList 'server.cjs' -WorkingDirectory $stage -PassThru -RedirectStandardOutput $outLog -RedirectStandardError $errLog
try {
  $live = $null
  for ($i=0; $i -lt 30; $i++) {
    try { $live = Invoke-RestMethod -Uri 'http://127.0.0.1:46173/version' -TimeoutSec 2; break }
    catch { Start-Sleep -Milliseconds 500 }
  }
  if ($null -eq $live) { throw "Local game server failed: $(Get-Content $errLog -Raw)" }
  if ($live.release -ne '2.5.22' -or $live.version -ne '2.2.7') { throw "Local package version/protocol mismatch" }
  foreach ($asset in @('arcana-art.js','arcana-unified.css','multiplayer-rules.js')) {
    $response = Invoke-WebRequest -Uri ('http://127.0.0.1:46173/' + $asset) -TimeoutSec 5
    if ($response.StatusCode -ne 200) { throw "Local asset not served: $asset" }
  }
  Write-Host 'PASS Windows local server and v2.5.22 resources'
} finally {
  if (!$proc.HasExited) { Stop-Process -Id $proc.Id -Force }
}

# Portable ZIP and Setup.exe embed the exact same complete runtime tree.
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $newZip -Force
$setupAsm = [Mono.Cecil.AssemblyDefinition]::ReadAssembly($oldSetup)
try {
  $embed = $null
  foreach ($r in $setupAsm.MainModule.Resources) {
    if ($r.Name -eq 'payload') { $embed = $r; break }
  }
  if ($null -eq $embed -or $embed.ResourceType -ne [Mono.Cecil.ResourceType]::Embedded) {
    throw 'Original installer has no expected embedded payload'
  }
  [void]$setupAsm.MainModule.Resources.Remove($embed)
  $bytes = [System.IO.File]::ReadAllBytes($newZip)
  $newEmbed = [Mono.Cecil.EmbeddedResource]::new('payload', [Mono.Cecil.ManifestResourceAttributes]::Public, $bytes)
  $setupAsm.MainModule.Resources.Add($newEmbed)
  $count = Patch-ManagedVersion $setupAsm '2.5.11' '2.5.22'
  $setupAsm.Write($newSetup)
  Write-Host "Rebuilt installer with $count updated version strings and $($bytes.Length) payload bytes"
} finally { $setupAsm.Dispose() }

foreach ($output in @($newZip, $newSetup)) {
  $size = (Get-Item -LiteralPath $output).Length
  if ($size -lt 2000000) { throw "Suspiciously small published file: $output" }
  Write-Host "Release output: $output, $size bytes, sha256 $((Get-FileHash -LiteralPath $output -Algorithm SHA256).Hash)"
}
# Verify the published setup can be read as a managed EXE, has the right version,
# and embeds a complete PKZIP payload (not the former 2.5.21 content).
$verify = [Mono.Cecil.AssemblyDefinition]::ReadAssembly($newSetup)
try {
  if ($verify.Name.Version.ToString() -ne '2.5.22.0') { throw 'Installer managed version mismatch' }
  $resource = $verify.MainModule.Resources | Where-Object { $_.Name -eq 'payload' } | Select-Object -First 1
  if ($null -eq $resource) { throw 'Installer missing payload after rewrite' }
  $stream = $resource.GetResourceStream()
  try {
    if ($stream.Length -ne (Get-Item -LiteralPath $newZip).Length) { throw 'Installer ZIP length mismatch' }
    $a=$stream.ReadByte(); $b=$stream.ReadByte()
    if ($a -ne 0x50 -or $b -ne 0x4b) { throw 'Installer payload is not ZIP' }
  } finally { $stream.Dispose() }
} finally { $verify.Dispose() }
Write-Host 'PASS v2.5.22 Windows compatibility release prepared'
