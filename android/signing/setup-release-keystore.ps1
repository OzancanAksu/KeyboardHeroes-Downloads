param(
  [string]$Repository = 'OzancanAksu/KeyboardHeroes-Downloads',
  [string]$Keystore = (Join-Path $HOME 'KeyboardHeroesSigning\keyboardheroes-release.p12')
)
$ErrorActionPreference = 'Stop'
# One keystore for the life of the app. Never put this file in the Git repo.
if (-not (Get-Command keytool -ErrorAction SilentlyContinue)) {
  throw 'JDK 17+ is needed. Install a JDK and reopen PowerShell so keytool is available.'
}
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  throw 'GitHub CLI (gh) is needed. Install it, then run gh auth login.'
}
& gh auth status 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Log in using gh auth login, then rerun this script.' }
$secrets = @(& gh secret list --repo $Repository --json name | ConvertFrom-Json | ForEach-Object name)
if ($LASTEXITCODE -ne 0) { throw 'Could not inspect GitHub Actions secret names.' }
if (-not (Test-Path -LiteralPath $Keystore)) {
  if ($secrets -contains 'KH_ANDROID_RELEASE_KEYSTORE_B64') {
    throw 'A remote release key is already configured! Restore your original keystore backup; never replace its private key.'
  }
  $directory = Split-Path -Parent $Keystore
  New-Item -ItemType Directory -Path $directory -Force | Out-Null
  Write-Host 'Creating your one-time signing identity. Choose a strong keystore password and keep it safe.'
  & keytool -genkeypair -v -storetype PKCS12 -keystore $Keystore -alias keyboardheroes -keyalg RSA -keysize 3072 -validity 10000 -dname 'CN=Keyboard Heroes, O=Keyboard Heroes, C=TR'
  if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $Keystore)) { throw 'Keystore creation failed.' }
  Write-Host 'Back up the .p12 file and its password OFFLINE. Losing them prevents seamless app updates.'
} else {
  Write-Host 'Using the existing local keystore. This script will never regenerate an existing signing identity.'
}
$secure = Read-Host 'Enter the keystore password to upload it into GitHub encrypted Actions secrets' -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
$pw = $null
try {
  $pw = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  $env:KH_SIGNING_KEY_PASSWORD = $pw
  & keytool -list -storetype PKCS12 -keystore $Keystore -alias keyboardheroes -storepass:env KH_SIGNING_KEY_PASSWORD | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'The password does not unlock this keystore.' }
  $bytes = [IO.File]::ReadAllBytes($Keystore)
  $encoded = [Convert]::ToBase64String($bytes)
  $encoded | & gh secret set KH_ANDROID_RELEASE_KEYSTORE_B64 --repo $Repository
  if ($LASTEXITCODE -ne 0) { throw 'Could not securely upload keystore GitHub secret.' }
  $pw | & gh secret set KH_ANDROID_RELEASE_KEYSTORE_PASSWORD --repo $Repository
  if ($LASTEXITCODE -ne 0) { throw 'Could not securely upload signing password GitHub secret.' }
  Write-Host 'Signing secrets configured. Private keystore file stays on your PC and is backed up by you.'
  Write-Host 'Next: GitHub Actions > Android Production APK — Persistent Signing Key > Run workflow.'
  Write-Host 'Your certificate SHA-256 fingerprint (public) is:'
  & keytool -list -v -storetype PKCS12 -keystore $Keystore -alias keyboardheroes -storepass:env KH_SIGNING_KEY_PASSWORD |
    Select-String -Pattern 'SHA256:'
} finally {
  Remove-Item Env:\KH_SIGNING_KEY_PASSWORD -ErrorAction SilentlyContinue
  if ($bstr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
  $pw = $null
}
