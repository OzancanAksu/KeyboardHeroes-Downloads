$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$ProgressPreference = 'SilentlyContinue'

# Rebuild Windows 2.5.24 from immutable public 2.5.23 package, using
# updated 2.5.23+ live cloud game resources for the Wardrobe Atelier. The private game
# repository is never checked out or copied into this public CI repository.
$root = (Get-Location).Path
$work = Join-Path $root 'windows-build'
$stage = Join-Path $work 'KeyboardHeroes'
$baseUrl = 'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v2.5.23'
$oldZip = Join-Path $work 'KeyboardHeroes-Desktop-v2.5.23.zip'
$oldSetup = Join-Path $work 'KeyboardHeroesSetup-v2.5.23.exe'
$newZip = Join-Path $root 'updates/KeyboardHeroes-Desktop-v2.5.24.zip'
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

Get-CheckedDownload "$baseUrl/KeyboardHeroes-Desktop-v2.5.23.zip" $oldZip
Assert-Sha256 $oldZip '2e891fef6bade9aab3718225a85723178e18000c4ba5626d800afa7dd0241f70'
Get-CheckedDownload "$baseUrl/KeyboardHeroesSetup.exe" $oldSetup
Assert-Sha256 $oldSetup 'f4c7a27abfe572f07d16a9b21d263ebc17f287f40e0e3e1a4ee87b693ea49d5d'
Expand-Archive -LiteralPath $oldZip -DestinationPath $stage -Force
foreach ($file in @('KeyboardHeroes.exe','KeyboardHeroesUpdater.exe','server.cjs','package.json','dist/index.html','runtime/node.exe')) {
  if (!(Test-Path -LiteralPath (Join-Path $stage $file))) { throw "Missing base runtime file: $file" }
}

# The server publicly serves these exact JS/CSS/HTML resources. They were
# changed in the single 2.5.23 -> 2.5.24 commit; no private backend is exposed.
$clientFiles = @(
 'android-launcher.html','arcana-art.js','arcana-unified.css',
 'home.html','i18n-catalog.js','launcher.html',
 'multiplayer-rules.js','portal-arcana.css','version.js','visual-refinement.js',
 'wardrobe-atelier.js'
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

# Package identity must advance even when the live site still advertises the
# preceding release while CI creates the new immutable artifacts.
foreach($name in @('version.js','home.html','launcher.html','android-launcher.html')){
 $full=Join-Path $stage ('dist/'+$name)
 $content=Get-Content -LiteralPath $full -Raw -Encoding UTF8
 $content=$content.Replace('2.5.23','2.5.24')
 [System.IO.File]::WriteAllText($full,$content,[System.Text.UTF8Encoding]::new($false))
}
# v2.5.23 already contains the Arcana HTML imports.
# The live cloud /index.html route is a portal redirect, not the game.
$index = Get-Content -LiteralPath (Join-Path $stage 'dist/index.html') -Raw -Encoding UTF8
foreach ($name in @('arcana-unified.css','arcana-art.js')) {
  if (!$index.Contains($name)) { throw "Missing original game reference to $name" }
}

# 2.5.23 archive predates the 50-outfit procedural atelier. Patch only the
# script include in the ZIP, using the new file fetched from the live server.
$atelierTag='<script src="wardrobe-atelier.js"></script>'
$arcanaTag='<script src="arcana-art.js"></script>'
if (!$index.Contains($atelierTag)) {
  if (!$index.Contains($arcanaTag)) { throw 'Cannot find Arcana renderer include in original game HTML' }
  $index=$index.Replace($arcanaTag, $arcanaTag+$atelierTag)
  [System.IO.File]::WriteAllText((Join-Path $stage 'dist/index.html'), $index, [System.Text.UTF8Encoding]::new($false))
}
if ($index.IndexOf($atelierTag) -lt $index.IndexOf($arcanaTag)) { throw 'Wardrobe renderer loaded out of order' }
$atelier=Get-Content -LiteralPath (Join-Path $stage 'dist/wardrobe-atelier.js') -Raw -Encoding UTF8
foreach($symbol in @('kh-atelier-art','drawModularArmor','drawModularHead','drawModularBoots','drawModularCape')){
 if (!$atelier.Contains($symbol)) { throw "Wardrobe renderer is missing: $symbol" }
}
$desktop = Get-Content -LiteralPath (Join-Path $stage 'dist/desktop.html') -Raw -Encoding UTF8
if (!$desktop.Contains('portal-arcana.css')) { throw 'Base desktop theme reference missing' }

# Exact binary sprite atlas generated for the 12 featured inventory + arena items.
$atlas = Join-Path $stage 'dist/kh-gear-atlas.webp'
Get-CheckedDownload 'https://keyboardheroes.onrender.com/kh-gear-atlas.webp' $atlas
Assert-Sha256 $atlas 'd81fea2cdd9508525bb34b63e904f1e8804e57109c1aa2cf28c5a15d66460cbf'
if ((Get-Item -LiteralPath $atlas).Length -ne 84672) { throw 'Unexpected gear atlas size' }
$atlasHead = [System.IO.File]::ReadAllBytes($atlas)
if ([System.Text.Encoding]::ASCII.GetString($atlasHead,0,4) -ne 'RIFF' -or
    [System.Text.Encoding]::ASCII.GetString($atlasHead,8,4) -ne 'WEBP') { throw 'Gear atlas is not valid WebP' }
$artJs = Get-Content -LiteralPath (Join-Path $stage 'dist/arcana-art.js') -Raw -Encoding UTF8
if (!$artJs.Contains('KH_ART_WEAPONS') -or !$artJs.Contains('kh-gear-atlas.webp')) { throw 'Inventory and arena image mapping missing' }

$rules = Get-Content -LiteralPath (Join-Path $stage 'dist/multiplayer-rules.js') -Raw -Encoding UTF8
if (!$rules.Contains('flagRace')) { throw 'New flag AI asset was not downloaded' }

# All private backend code is unchanged between 2.5.23 and 2.5.24 except
# this published release version constant (verified against commit diff).
$serverPath = Join-Path $stage 'server.cjs'
$serverSource = Get-Content -LiteralPath $serverPath -Raw -Encoding UTF8
if (!$serverSource.Contains("const APP_VERSION='2.5.23';")) { throw 'Unexpected server base version' }
$serverSource = $serverSource.Replace("const APP_VERSION='2.5.23';", "const APP_VERSION='2.5.24';")
if (!$serverSource.Contains("'.webp':'image/webp'")) { throw 'Base 2.5.23 is missing WebP MIME support' }
[System.IO.File]::WriteAllText($serverPath, $serverSource, [System.Text.UTF8Encoding]::new($false))
& (Join-Path $stage 'runtime/node.exe') --check $serverPath
if ($LASTEXITCODE -ne 0) { throw 'Server syntax verification failed' }

$packagePath = Join-Path $stage 'package.json'
$package = Get-Content -LiteralPath $packagePath -Raw -Encoding UTF8
if ($package -notmatch '"version"\s*:\s*"2\.5\.23"') { throw 'Unexpected npm version in base release' }
$package = $package -replace '"version"\s*:\s*"2\.5\.23"', '"version": "2.5.24"'
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
  $assembly.Name.Version = [Version]'2.5.24.0'
  return $count
}
$launcherPath = Join-Path $stage 'KeyboardHeroes.exe'
$launcherAsm = [Mono.Cecil.AssemblyDefinition]::ReadAssembly($launcherPath)
try {
  $count = Patch-ManagedVersion $launcherAsm '2.5.23' '2.5.24'
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
  if ($live.release -ne '2.5.24' -or $live.version -ne '2.2.7') { throw "Local package version/protocol mismatch" }
  foreach ($asset in @('arcana-art.js','arcana-unified.css','multiplayer-rules.js','kh-gear-atlas.webp','wardrobe-atelier.js')) {
    $response = Invoke-WebRequest -Uri ('http://127.0.0.1:46173/' + $asset) -TimeoutSec 5
    if ($response.StatusCode -ne 200) { throw "Local asset not served: $asset" }
  }
  Write-Host 'PASS Windows local server and v2.5.24 resources'
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
  $count = Patch-ManagedVersion $setupAsm '2.5.23' '2.5.24'
  $setupAsm.Write($newSetup)
  Write-Host "Rebuilt installer with $count updated version strings and $($bytes.Length) payload bytes"
} finally { $setupAsm.Dispose() }

foreach ($output in @($newZip, $newSetup)) {
  $size = (Get-Item -LiteralPath $output).Length
  if ($size -lt 2000000) { throw "Suspiciously small published file: $output" }
  Write-Host "Release output: $output, $size bytes, sha256 $((Get-FileHash -LiteralPath $output -Algorithm SHA256).Hash)"
}
# Verify the published setup can be read as a managed EXE, has the right version,
# and embeds a complete PKZIP payload (not the former 2.5.23 content).
$verify = [Mono.Cecil.AssemblyDefinition]::ReadAssembly($newSetup)
try {
  if ($verify.Name.Version.ToString() -ne '2.5.24.0') { throw 'Installer managed version mismatch' }
  $resource = $verify.MainModule.Resources | Where-Object { $_.Name -eq 'payload' } | Select-Object -First 1
  if ($null -eq $resource) { throw 'Installer missing payload after rewrite' }
  $stream = $resource.GetResourceStream()
  try {
    if ($stream.Length -ne (Get-Item -LiteralPath $newZip).Length) { throw 'Installer ZIP length mismatch' }
    $a=$stream.ReadByte(); $b=$stream.ReadByte()
    if ($a -ne 0x50 -or $b -ne 0x4b) { throw 'Installer payload is not ZIP' }
  } finally { $stream.Dispose() }
} finally { $verify.Dispose() }
Write-Host 'PASS v2.5.24 Windows compatibility release prepared'
