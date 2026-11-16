$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$ProgressPreference='SilentlyContinue'
# v3.0.6: rebuild the launcher from C# SOURCE, never patch an inherited
# executable that still contains the 2.5.21 const string Version metadata.
$root=(Get-Location).Path
$work=Join-Path $root 'windows-build-306'
$stage=Join-Path $work 'KeyboardHeroes'
$base='https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v3.0.5'
$baseZip=Join-Path $work 'KeyboardHeroes-Desktop-v3.0.5.zip'
$newZip=Join-Path $root 'updates/KeyboardHeroes-Desktop-v3.0.6.zip'
$newSetup=Join-Path $root 'KeyboardHeroesSetup.exe'
New-Item -ItemType Directory -Force -Path $work,$stage,(Join-Path $root 'updates') | Out-Null
$expectedZipHash='ebc1cdfda2bfe6abf54326ac7e5e5771b23b209e6a8b3e57ba5fd42c25783ad7'
for($i=1;$i -le 4;$i++){
 try{
  Invoke-WebRequest -Uri ($base+'/KeyboardHeroes-Desktop-v3.0.5.zip') -OutFile $baseZip -TimeoutSec 120
  if((Get-FileHash -LiteralPath $baseZip -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expectedZipHash){throw 'Immutable v3.0.5 base package hash mismatch'}
  break
 }catch{if($i -ge 4){throw};Start-Sleep -Seconds 4}
}
Expand-Archive -LiteralPath $baseZip -DestinationPath $stage -Force
foreach($name in @('KeyboardHeroes.exe','KeyboardHeroesUpdater.exe','server.cjs','package.json','dist/index.html','dist/game.js','runtime/node.exe','Microsoft.Web.WebView2.Core.dll','Microsoft.Web.WebView2.WinForms.dll')){
 if(!(Test-Path -LiteralPath (Join-Path $stage $name))){throw "Incomplete previous release package, missing $name"}
}
function Patch-Text([string]$relative,[string]$old,[string]$new){
 $file=Join-Path $stage $relative
 $body=[IO.File]::ReadAllText($file)
 $matches=($body.Split([string[]]@($old),[StringSplitOptions]::None)).Length-1
 if($matches -ne 1){throw "Expected exactly one old marker in $relative, got $matches"}
 [IO.File]::WriteAllText($file,$body.Replace($old,$new),[Text.UTF8Encoding]::new($false))
}
Patch-Text 'server.cjs' "const APP_VERSION='3.0.5';" "const APP_VERSION='3.0.6';"
Patch-Text 'package.json' '"version": "3.0.5"' '"version": "3.0.6"'
foreach($path in @('dist/version.js','dist/home.html','dist/launcher.html')){
 $file=Join-Path $stage $path
 $body=[IO.File]::ReadAllText($file)
 if(!$body.Contains('3.0.5')){throw "Missing old marker in $path"}
 [IO.File]::WriteAllText($file,$body.Replace('3.0.5','3.0.6'),[Text.UTF8Encoding]::new($false))
}
if(![IO.File]::ReadAllText((Join-Path $stage 'dist/game.js')).Contains('if(old.scoreKey)actors[0].scoreKey=old.scoreKey;')){
 throw 'Existing bot-match statistics hotfix missing'
}
$node=Join-Path $stage 'runtime/node.exe'
& $node --check (Join-Path $stage 'dist/game.js')
if($LASTEXITCODE -ne 0){throw 'Game JavaScript syntax invalid'}
& $node --check (Join-Path $stage 'server.cjs')
if($LASTEXITCODE -ne 0){throw 'Server syntax invalid'}
$csc='C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if(!(Test-Path -LiteralPath $csc)){throw 'Windows .NET Framework C# compiler missing'}
$launcherSource=Join-Path $root 'windows-publish/KeyboardHeroesLauncher-3.0.6.cs'
$setupSource=Join-Path $root 'windows-publish/KeyboardHeroesSetup-3.0.6.cs'
if(!(Test-Path $launcherSource) -or !(Test-Path $setupSource)){throw 'C# source unavailable'}
$launcherExe=Join-Path $stage 'KeyboardHeroes.exe'
# Preserve brand identity from the previously distributed launcher.
Add-Type -AssemblyName System.Drawing
$iconFile=Join-Path $work 'KeyboardHeroes.ico'
$brandIcon=[Drawing.Icon]::ExtractAssociatedIcon($launcherExe)
try{
 if($null -eq $brandIcon){throw 'Existing Windows icon missing'}
 $stream=[IO.File]::Create($iconFile)
 try{$brandIcon.Save($stream)}finally{$stream.Dispose()}
}finally{if($null -ne $brandIcon){$brandIcon.Dispose()}}
$refCore=Join-Path $stage 'Microsoft.Web.WebView2.Core.dll'
$refForms=Join-Path $stage 'Microsoft.Web.WebView2.WinForms.dll'
& $csc /nologo /target:winexe /platform:x64 "/out:$launcherExe" "/win32icon:$iconFile" /reference:System.dll /reference:System.Core.dll /reference:System.Drawing.dll /reference:System.Windows.Forms.dll /reference:System.Web.Extensions.dll "/reference:$refCore" "/reference:$refForms" $launcherSource
if($LASTEXITCODE -ne 0){throw 'Fresh native launcher compilation failed'}
if([Reflection.AssemblyName]::GetAssemblyName($launcherExe).Version.ToString() -ne '3.0.6.0'){throw 'Fresh launcher assembly version mismatch'}
# Inspect the actual compile-time const (not merely the assembly file version).
$nugetDir=Join-Path $work 'nuget'
& nuget install Mono.Cecil -Version 0.11.6 -OutputDirectory $nugetDir -ExcludeVersion -NonInteractive | Out-Null
if($LASTEXITCODE -ne 0){throw 'Unable to load Mono.Cecil'}
Add-Type -Path (Join-Path $nugetDir 'Mono.Cecil/lib/netstandard2.0/Mono.Cecil.dll')
$assembly=[Mono.Cecil.AssemblyDefinition]::ReadAssembly($launcherExe)
try{
 $class=@($assembly.MainModule.Types | Where-Object {$_.FullName -eq 'KeyboardHeroesDesktop.LauncherWindow'}) | Select-Object -First 1
 if($class.Count -ne 1){throw 'LauncherWindow type missing from compiled EXE'}
 $field=@($class[0].Fields | Where-Object {$_.Name -eq 'Version'}) | Select-Object -First 1
 if($field.Count -ne 1 -or !$field[0].HasConstant -or [string]$field[0].Constant -ne '3.0.6'){
  throw "CRITICAL: compiled native launcher Version constant wrong (found '$($field[0].Constant)')"
 }
 Write-Host 'PASS: published launcher has AssemblyVersion=3.0.6.0 AND LauncherWindow.Version=3.0.6'
 foreach($type in $assembly.MainModule.Types){
  foreach($method in $type.Methods){
   if(!$method.HasBody){continue}
   foreach($ins in $method.Body.Instructions){
    if($ins.OpCode.Code -eq [Mono.Cecil.Cil.Code]::Ldstr -and [string]$ins.Operand -eq '2.5.21'){
     throw "Stale 2.5.21 IL literal in $($type.FullName).$($method.Name)"
    }
   }
  }
 }
 Write-Host 'PASS: native launcher has no v2.5.21 inlined version literals'
}finally{$assembly.Dispose()}
# Retain the updater's integrity checks; advance only its managed version metadata.
$updater=Join-Path $stage 'KeyboardHeroesUpdater.exe'
$assembly=[Mono.Cecil.AssemblyDefinition]::ReadAssembly($updater)
try{
 if($assembly.Name.Version.ToString() -ne '3.0.5.0'){throw 'Unexpected base updater version'}
 $assembly.Name.Version=[Version]'3.0.6.0'
 $patched="$updater.rebuilt"
 $assembly.Write($patched)
}finally{$assembly.Dispose()}
Move-Item -LiteralPath $patched -Destination $updater -Force
# Verify that local offline server remains bootable and speaks the existing protocol.
$env:ARENA_PORT='46173'
$outLog=Join-Path $work 'server.stdout.log'
$errLog=Join-Path $work 'server.stderr.log'
$proc=Start-Process -FilePath $node -ArgumentList 'server.cjs' -WorkingDirectory $stage -PassThru -RedirectStandardOutput $outLog -RedirectStandardError $errLog
try{
 $local=$null
 for($i=0;$i -lt 30;$i++){
  try{$local=Invoke-RestMethod -Uri 'http://127.0.0.1:46173/version' -TimeoutSec 2;break}catch{Start-Sleep -Milliseconds 500}
 }
 if(!$local){throw "Local game server did not boot: $(Get-Content -LiteralPath $errLog -Raw)"}
 if($local.release -ne '3.0.6' -or $local.version -ne '2.2.7'){throw 'Local protocol/version mismatch'}
 Write-Host 'PASS: local game server release 3.0.6, protocol 2.2.7'
}finally{if(!$proc.HasExited){Stop-Process -Id $proc.Id -Force}}
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $newZip -Force
$payloadArg="/resource:$newZip,payload"
& $csc /nologo /target:winexe /platform:x64 "/out:$newSetup" "/win32icon:$iconFile" $payloadArg /reference:System.dll /reference:System.Core.dll /reference:System.Windows.Forms.dll /reference:Microsoft.CSharp.dll /reference:System.IO.Compression.dll /reference:System.IO.Compression.FileSystem.dll $setupSource
if($LASTEXITCODE -ne 0){throw 'Fresh 3.0.6 setup compilation failed'}
if([Reflection.AssemblyName]::GetAssemblyName($newSetup).Version.ToString() -ne '3.0.6.0'){throw 'Installer assembly version mismatch'}
$verify=[Mono.Cecil.AssemblyDefinition]::ReadAssembly($newSetup)
try{
 $resource=@($verify.MainModule.Resources | Where-Object {$_.Name -eq 'payload'}) | Select-Object -First 1
 if($resource.Count -ne 1){throw 'Installer payload missing'}
 $st=$resource[0].GetResourceStream()
 try{
  if($st.Length -ne (Get-Item -LiteralPath $newZip).Length -or $st.ReadByte() -ne 0x50 -or $st.ReadByte() -ne 0x4b){throw 'Installer ZIP embedded payload invalid'}
 }finally{$st.Dispose()}
}finally{$verify.Dispose()}
foreach($output in @($newSetup,$newZip)){
 $size=(Get-Item -LiteralPath $output).Length
 if($size -lt 2000000){throw "Suspiciously small package: $output"}
 Write-Host "PASS: $output size=$size sha256=$((Get-FileHash -LiteralPath $output -Algorithm SHA256).Hash)"
}
Write-Host 'PASS Windows 3.0.6 fresh launcher source build + embedded source-version validation'
