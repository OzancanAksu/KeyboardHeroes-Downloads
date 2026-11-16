# KeyboardHeroes - local-only stale launcher diagnostics and repair.
# No admin, no downloads, no deletion of game/account data, no uploads.
# Run in PowerShell as: powershell -NoProfile -ExecutionPolicy Bypass -File .\repair-stale-launcher.ps1
$ErrorActionPreference='Stop'
$expected=[Version]'3.0.5.0'
$folder=Join-Path $env:LOCALAPPDATA 'Programs\KeyboardHeroes'
$exe=Join-Path $folder 'KeyboardHeroes.exe'
function Get-Version($file){
  if(!(Test-Path -LiteralPath $file -PathType Leaf)){return 'MISSING'}
  try{return [Reflection.AssemblyName]::GetAssemblyName($file).Version.ToString()}
  catch{return 'INVALID-EXE'}
}
Write-Host '=== Keyboard Heroes launcher diagnosis ===' -ForegroundColor Cyan
Write-Host ('Expected installed file: '+$exe)
$version=Get-Version $exe
Write-Host ('Actual installed EXE version: '+$version)
$reg=Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\KeyboardHeroes' -ErrorAction SilentlyContinue
if($reg){Write-Host ('Control Panel DisplayVersion: '+$reg.DisplayVersion); Write-Host ('Registered InstallLocation: '+$reg.InstallLocation)}
$running=@(Get-CimInstance Win32_Process -Filter "Name='KeyboardHeroes.exe'" -ErrorAction SilentlyContinue)
foreach($process in $running){
 Write-Host ('RUNNING PID '+$process.ProcessId+' PATH '+$process.ExecutablePath)
 if($process.ExecutablePath){Write-Host ('  actual assembly version: '+(Get-Version $process.ExecutablePath))}
}
if($running.Count -eq 0){Write-Host 'No KeyboardHeroes.exe is currently running.'}
$dirs=@(
 [Environment]::GetFolderPath('DesktopDirectory'),
 [Environment]::GetFolderPath('Programs'),
 (Join-Path $env:APPDATA 'Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar')
)|Where-Object{$_ -and (Test-Path -LiteralPath $_)}|Select-Object -Unique
$shell=New-Object -ComObject WScript.Shell
$links=@()
foreach($dir in $dirs){
  foreach($file in @(Get-ChildItem -LiteralPath $dir -Filter '*.lnk' -File -Recurse -ErrorAction SilentlyContinue)){
    if($file.BaseName -notmatch 'Keyboard\s*Heroes|KeyboardHeroes'){continue}
    try{
      $shortcut=$shell.CreateShortcut($file.FullName)
      $links+=@([pscustomobject]@{Path=$file.FullName;Target=$shortcut.TargetPath;WorkingDirectory=$shortcut.WorkingDirectory})
      Write-Host ('SHORTCUT '+$file.FullName)
      Write-Host ('  -> '+$shortcut.TargetPath)
      if($shortcut.TargetPath){Write-Host ('  assembly version: '+(Get-Version $shortcut.TargetPath))}
    }catch{Write-Warning ('Cannot inspect shortcut: '+$file.FullName)}
  }
}
if($version -ne $expected.ToString()){
  Write-Warning 'The standard installation contains an outdated or missing EXE. Aborting repair safely.'
  Write-Host 'Close every game/updater, then run official signed-independent GitHub v3.0.5 Setup.exe and retry.'
  exit 2
}
Write-Host 'The standard installed launcher is the expected v3.0.5.' -ForegroundColor Green
Write-Host 'This tool can close running game windows, repair your own shortcuts and launch that exact file.'
Write-Host 'Any unfinished local bot match will be lost if processes are closed.'
$consent=Read-Host 'Type ONAR to repair current-user shortcuts and launch v3.0.5 (anything else cancels)'
if($consent -cne 'ONAR'){Write-Host 'No changes made.';exit 0}
foreach($process in $running){
  try{
    $p=Get-Process -Id $process.ProcessId -ErrorAction SilentlyContinue
    if($p){Stop-Process -Id $p.Id -Force -ErrorAction Stop}
  }catch{Write-Warning ('Could not close '+$process.ProcessId+': '+$_.Exception.Message)}
}
foreach($link in $links){
 try{
  $target=$shell.CreateShortcut($link.Path)
  $target.TargetPath=$exe
  $target.WorkingDirectory=$folder
  $target.Save()
  Write-Host ('REPAIRED '+$link.Path)
 }catch{Write-Warning ('Could not repair '+$link.Path+': '+$_.Exception.Message)}
}
Start-Process -FilePath $exe -WorkingDirectory $folder
Write-Host 'Started verified v3.0.5 launcher from the standard install path.' -ForegroundColor Green
Write-Host 'If a pinned taskbar icon still opens v2.5.21, unpin it and pin the newly opened window.'
