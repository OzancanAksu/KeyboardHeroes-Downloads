$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$ProgressPreference='SilentlyContinue'
# Verified 3.0.1 base; immutable 3.0.2 local bot-match stat identity fix.
$root=(Get-Location).Path
$work=Join-Path $root 'windows-build-302'
$stage=Join-Path $work 'KeyboardHeroes'
$base='https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v3.0.1'
$oldZip=Join-Path $work 'KeyboardHeroes-Desktop-v3.0.1.zip'
$oldSetup=Join-Path $work 'KeyboardHeroesSetup-v3.0.1.exe'
$newZip=Join-Path $root 'updates/KeyboardHeroes-Desktop-v3.0.2.zip'
$newSetup=Join-Path $root 'KeyboardHeroesSetup.exe'
New-Item -ItemType Directory -Force -Path $work,$stage,(Join-Path $root 'updates') | Out-Null
function Get-CheckedDownload([string]$url,[string]$file,[string]$sha){
  $ok=$false
  for($attempt=1;$attempt -le 4;$attempt++){
    try{
      Invoke-WebRequest -Uri $url -OutFile $file -TimeoutSec 90 -MaximumRedirection 8
      $actual=(Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash
      if($actual -ne $sha.ToUpperInvariant()){throw "SHA-256 mismatch: $url"}
      $ok=$true;break
    }catch{
      Write-Warning "Download attempt $attempt failed: $($_.Exception.Message)"
      if($attempt -lt 4){Start-Sleep -Seconds 4}
    }
  }
  if(!$ok){throw "Cannot download/verify $url"}
}
Get-CheckedDownload "$base/KeyboardHeroes-Desktop-v3.0.1.zip" $oldZip '011ebb41437d50dd67bc4dc1e38577546a44ad6114dd36938f0ad1fc7651ea31'
Get-CheckedDownload "$base/KeyboardHeroesSetup.exe" $oldSetup 'fe68acd7bcd277ac4f621a94a08c1a1b99fbbffdf0b72551b2dac80f6dbf20ba'
Expand-Archive -LiteralPath $oldZip -DestinationPath $stage -Force
foreach($file in @('KeyboardHeroes.exe','KeyboardHeroesUpdater.exe','server.cjs','package.json','dist/index.html','dist/game.js','runtime/node.exe')){
  if(!(Test-Path -LiteralPath (Join-Path $stage $file))){throw "Missing runtime resource $file"}
}
function Patch-Text([string]$relative,[string]$old,[string]$replacement){
  $file=Join-Path $stage $relative
  $body=Get-Content -LiteralPath $file -Raw -Encoding UTF8
  $count=($body.Split([string[]]@($old),[StringSplitOptions]::None)).Length-1
  if($count -ne 1){throw "Expected one occurrence in $relative, found $count"}
  $body=$body.Replace($old,$replacement)
  [IO.File]::WriteAllText($file,$body,[Text.UTF8Encoding]::new($false))
}
$old="const old=actors[0];actors[0]=actor(0,old.x,old.y,chosen,true);if(build==='guard')"
$new="const old=actors[0];actors[0]=actor(0,old.x,old.y,chosen,true);if(old.scoreKey)actors[0].scoreKey=old.scoreKey;if(build==='guard')"
Patch-Text 'dist/game.js' $old $new
Patch-Text 'server.cjs' "const APP_VERSION='3.0.1';" "const APP_VERSION='3.0.2';"
Patch-Text 'package.json' '"version": "3.0.1"' '"version": "3.0.2"'
foreach($name in @('dist/version.js','dist/home.html','dist/launcher.html')){
  $file=Join-Path $stage $name
  $body=Get-Content -LiteralPath $file -Raw -Encoding UTF8
  if(!$body.Contains('3.0.1')){throw "Missing 3.0.1 marker in $name"}
  $body=$body.Replace('3.0.1','3.0.2')
  [IO.File]::WriteAllText($file,$body,[Text.UTF8Encoding]::new($false))
}
$game=Get-Content -LiteralPath (Join-Path $stage 'dist/game.js') -Raw -Encoding UTF8
if(!$game.Contains('if(old.scoreKey)actors[0].scoreKey=old.scoreKey;')){throw 'Missing bot stat identity fix'}
$node=Join-Path $stage 'runtime/node.exe'
& $node --check (Join-Path $stage 'dist/game.js')
if($LASTEXITCODE -ne 0){throw 'Game syntax invalid'}
& $node --check (Join-Path $stage 'server.cjs')
if($LASTEXITCODE -ne 0){throw 'Server syntax invalid'}
$nugetDir=Join-Path $work 'nuget'
& nuget install Mono.Cecil -Version 0.11.6 -OutputDirectory $nugetDir -ExcludeVersion -NonInteractive
if($LASTEXITCODE -ne 0){throw 'Mono.Cecil restore failed'}
$dll=Join-Path $nugetDir 'Mono.Cecil/lib/netstandard2.0/Mono.Cecil.dll'
if(!(Test-Path -LiteralPath $dll)){throw 'Missing Mono.Cecil'}
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
  $assembly.Name.Version = [Version]'3.0.2.0'
  return $count
}
$launcherPath = Join-Path $stage 'KeyboardHeroes.exe'
$launcherAsm = [Mono.Cecil.AssemblyDefinition]::ReadAssembly($launcherPath)
try {
  $count = Patch-ManagedVersion $launcherAsm '3.0.1' '3.0.2'
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
  if ($live.release -ne '3.0.2' -or $live.version -ne '2.2.7') { throw "Local package version/protocol mismatch" }
  foreach ($asset in @('arcana-art.js','arcana-unified.css','multiplayer-rules.js','kh-gear-atlas.webp','wardrobe-atelier.js','arsenal-atelier.js')) {
    $response = Invoke-WebRequest -Uri ('http://127.0.0.1:46173/' + $asset) -TimeoutSec 5
    if ($response.StatusCode -ne 200) { throw "Local asset not served: $asset" }
  }
  Write-Host 'PASS Windows local server and v3.0.2 resources'
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
  $count = Patch-ManagedVersion $setupAsm '3.0.1' '3.0.2'
  $setupAsm.Write($newSetup)
  Write-Host "Rebuilt installer with $count updated version strings and $($bytes.Length) payload bytes"
} finally { $setupAsm.Dispose() }

foreach ($output in @($newZip, $newSetup)) {
  $size = (Get-Item -LiteralPath $output).Length
  if ($size -lt 2000000) { throw "Suspiciously small published file: $output" }
  Write-Host "Release output: $output, $size bytes, sha256 $((Get-FileHash -LiteralPath $output -Algorithm SHA256).Hash)"
}
# Verify the published setup can be read as a managed EXE, has the right version,
# and embeds a complete PKZIP payload (not the former v3.0.1 content).
$verify = [Mono.Cecil.AssemblyDefinition]::ReadAssembly($newSetup)
try {
  if ($verify.Name.Version.ToString() -ne '3.0.2.0') { throw 'Installer managed version mismatch' }
  $resource = $verify.MainModule.Resources | Where-Object { $_.Name -eq 'payload' } | Select-Object -First 1
  if ($null -eq $resource) { throw 'Installer missing payload after rewrite' }
  $stream = $resource.GetResourceStream()
  try {
    if ($stream.Length -ne (Get-Item -LiteralPath $newZip).Length) { throw 'Installer ZIP length mismatch' }
    $a=$stream.ReadByte(); $b=$stream.ReadByte()
    if ($a -ne 0x50 -or $b -ne 0x4b) { throw 'Installer payload is not ZIP' }
  } finally { $stream.Dispose() }
} finally { $verify.Dispose() }
Write-Host 'PASS v3.0.2 Windows statistics hotfix prepared'

