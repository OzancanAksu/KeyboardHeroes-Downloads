$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$ProgressPreference = 'SilentlyContinue'
$root=(Get-Location).Path
$version='3.2.0'
$baseVersion='3.1.0'
$expectedBaseSha='8777b859e102324d72d53a9a4e77fe67bef5a269e85a76b9211d6fd58f3268b0'
$source=Join-Path $root 'windows-publish/v3.2.0/game'
$work=Join-Path $root 'windows-build-320'
$stage=Join-Path $work 'KeyboardHeroes'
$baseZip=Join-Path $work 'KeyboardHeroes-Desktop-v3.1.0.zip'
$outZip=Join-Path $root 'updates/KeyboardHeroes-Desktop-v3.2.0.zip'
$outSetup=Join-Path $root 'KeyboardHeroesSetup.exe'
New-Item -ItemType Directory -Force -Path $work,$stage,(Join-Path $root 'updates') | Out-Null
if(!(Test-Path $source)){throw 'Missing v3.2.0 release source overlays'}
$base='https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v3.1.0/KeyboardHeroes-Desktop-v3.1.0.zip'
$downloaded=$false
for($i=0;$i -lt 4;$i++){
 try{
  Invoke-WebRequest -Uri $base -OutFile $baseZip -TimeoutSec 120
  if((Get-FileHash -LiteralPath $baseZip -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expectedBaseSha){
   throw 'Published v3.1.0 ZIP SHA-256 mismatch'
  }
  $downloaded=$true;break
 }catch{if($i -eq 3){throw};Start-Sleep -Seconds 3}
}
if(!$downloaded){throw 'Unable to download verified v3.1.0 base ZIP'}
Expand-Archive -LiteralPath $baseZip -DestinationPath $stage -Force
foreach($name in @('KeyboardHeroes.exe','KeyboardHeroesUpdater.exe','dist/index.html','server.cjs','runtime/node.exe','Microsoft.Web.WebView2.Core.dll','Microsoft.Web.WebView2.WinForms.dll')){
 if(!(Test-Path -LiteralPath (Join-Path $stage $name))){throw "Missing baseline game file: $name"}
}
# A complete source-authored overlay contains the latest missed-result hotfix and
# TWO new gameplay/graphics modules; this is not a binary patch of old native code.
foreach($file in Get-ChildItem -LiteralPath $source -Recurse -File){
 $rel=$file.FullName.Substring($source.Length+1)
 if($rel.StartsWith('desktop-launcher'+[IO.Path]::DirectorySeparatorChar)){continue}
 $destination=Join-Path $stage $rel
 New-Item -ItemType Directory -Force -Path (Split-Path -Parent $destination) | Out-Null
 Copy-Item -LiteralPath $file.FullName -Destination $destination -Force
}
$node=Join-Path $stage 'runtime/node.exe'
foreach($rel in @('dist/fear-boxing-320.js','dist/fear-boxing-art-320.js','dist/fear-boxing-vfx-320.js','dist/version.js','server.cjs','dist/legendary-weapons-308.js')){
 & $node --check (Join-Path $stage $rel)
 if($LASTEXITCODE -ne 0){throw "JavaScript syntax failed: $rel"}
}
# Actual shared Node/VM combat tests, including both Q variants and their timings.
Push-Location $stage
try{
 & $node fear-boxing-320.test.cjs
 if($LASTEXITCODE -ne 0){throw 'v3.2.0 fear dagger and boxing glove gameplay/art regression FAILED'}
}finally{Pop-Location}
foreach($rel in @('dist/home.html','dist/launcher.html','dist/version.js','dist/android-launcher.html')){
 $s=[IO.File]::ReadAllText((Join-Path $stage $rel))
 if(!$s.Contains('3.2.0')){throw "Wrong v3.2.0 release identity: $rel"}
}
# Setup, launcher and updater are all freshly compiled from v3.2.0 C# source.
$csc='C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if(!(Test-Path $csc)){throw 'Microsoft .NET C# compiler missing'}
$launcher=(Join-Path $stage 'KeyboardHeroes.exe')
Add-Type -AssemblyName System.Drawing
$iconFile=Join-Path $work 'KeyboardHeroes.ico'
$icon=[Drawing.Icon]::ExtractAssociatedIcon($launcher)
try{
 if(!$icon){throw 'Baseline launcher icon missing'}
 $stream=[IO.File]::Create($iconFile)
 try{$icon.Save($stream)}finally{$stream.Dispose()}
}finally{if($icon){$icon.Dispose()}}
$cs=Join-Path $source 'desktop-launcher'
$webCore=Join-Path $stage 'Microsoft.Web.WebView2.Core.dll'
$webForms=Join-Path $stage 'Microsoft.Web.WebView2.WinForms.dll'
& $csc /nologo /target:winexe /platform:x64 "/out:$launcher" "/win32icon:$iconFile" /reference:System.dll /reference:System.Core.dll /reference:System.Drawing.dll /reference:System.Windows.Forms.dll /reference:System.Web.Extensions.dll "/reference:$webCore" "/reference:$webForms" (Join-Path $cs 'KeyboardHeroesLauncher.cs')
if($LASTEXITCODE -ne 0){throw 'KeyboardHeroesLauncher v3.2.0 C# compilation failed'}
$updater=Join-Path $stage 'KeyboardHeroesUpdater.exe'
& $csc /nologo /target:winexe /platform:x64 "/out:$updater" "/win32icon:$iconFile" /reference:System.dll /reference:System.Core.dll /reference:System.Drawing.dll /reference:System.Windows.Forms.dll /reference:System.IO.Compression.dll /reference:System.IO.Compression.FileSystem.dll (Join-Path $cs 'KeyboardHeroesUpdater.cs')
if($LASTEXITCODE -ne 0){throw 'KeyboardHeroesUpdater v3.2.0 C# compilation failed'}
foreach($file in @($launcher,$updater)){
 $actual=[Reflection.AssemblyName]::GetAssemblyName($file).Version.ToString()
 if($actual -ne '3.2.0.0'){throw "Wrong compiled native executable version: $file => $actual"}
}
# Local server boots from the exact files that will be delivered.
$env:ARENA_PORT='46203'
$outLog=Join-Path $work 'runtime.stdout.log'
$errLog=Join-Path $work 'runtime.stderr.log'
$proc=Start-Process -FilePath $node -ArgumentList 'server.cjs' -WorkingDirectory $stage -PassThru -RedirectStandardOutput $outLog -RedirectStandardError $errLog
try{
 $live=$null
 for($i=0;$i -lt 24;$i++){
  try{$live=Invoke-RestMethod -Uri 'http://127.0.0.1:46203/version' -TimeoutSec 2;break}catch{Start-Sleep -Milliseconds 500}
 }
 if(!$live){throw "Local game server did not boot: $(Get-Content -LiteralPath $errLog -Raw)"}
 if($live.release -ne '3.2.0' -or $live.version -ne '2.2.7'){throw 'Local server version or gameplay protocol mismatch'}
 Write-Host 'PASS: real v3.2.0 local arena process and protocol 2.2.7'
}finally{if(!$proc.HasExited){Stop-Process -Id $proc.Id -Force}}
# Developer tests should not be shipped with production payload.
Remove-Item -LiteralPath (Join-Path $stage 'fear-boxing-320.test.cjs') -Force
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $outZip -Force
$setupSource=Join-Path $cs 'KeyboardHeroesSetup.cs'
$payloadArg="/resource:$outZip,payload"
& $csc /nologo /target:winexe /platform:x64 "/out:$outSetup" "/win32icon:$iconFile" $payloadArg /reference:System.dll /reference:System.Core.dll /reference:System.Windows.Forms.dll /reference:Microsoft.CSharp.dll /reference:System.IO.Compression.dll /reference:System.IO.Compression.FileSystem.dll $setupSource
if($LASTEXITCODE -ne 0){throw 'KeyboardHeroesSetup v3.2.0 compilation failed'}
if([Reflection.AssemblyName]::GetAssemblyName($outSetup).Version.ToString() -ne '3.2.0.0'){
 throw 'Wrong final Setup.exe AssemblyVersion'
}
foreach($file in @($outZip,$outSetup)){
 $size=(Get-Item $file).Length
 if($size -lt 2000000){throw "Suspicious release artifact size: $file"}
 Write-Host "PASS release artifact: $file bytes=$size SHA256=$((Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash)"
}
Write-Host 'Keyboard Heroes Windows v3.2.0 release candidate ready. No Windows signing certificate required.'
