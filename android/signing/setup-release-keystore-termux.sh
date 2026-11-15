#!/usr/bin/env bash
# KeyboardHeroes: one-time Android signing-key setup on Termux.
# Run only on your own device. Keep the .p12 file and password private.
set -euo pipefail
umask 077

REPO="OzancanAksu/KeyboardHeroes-Downloads"
KEYDIR="$HOME/KeyboardHeroesSigning"
KEYSTORE="$KEYDIR/keyboardheroes-release.p12"

for command in keytool gh base64; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "Missing $command. First run: pkg update && pkg install -y openjdk-17 gh coreutils"
    exit 1
  fi
done

if ! gh auth status >/dev/null 2>&1; then
  echo "Sign in to your own GitHub account (OzancanAksu)."
  gh auth login
fi
gh repo view "$REPO" --json name >/dev/null

remote_names="$(gh secret list --repo "$REPO" --json name --jq '.[].name')"

if [ ! -f "$KEYSTORE" ]; then
  if printf '%s\n' "$remote_names" | grep -Fxq 'KH_ANDROID_RELEASE_KEYSTORE_B64'; then
    echo "STOP: a production key already exists in GitHub but not on this phone."
    echo "Restore the ORIGINAL signing key from backup. Never generate a replacement."
    exit 1
  fi
  mkdir -p "$KEYDIR"
  chmod 700 "$KEYDIR"
  echo "Creating the permanent KeyboardHeroes signing key."
  echo "Choose a strong password when keytool asks. Keep it for all future releases."
  keytool -genkeypair -v -storetype PKCS12 -keystore "$KEYSTORE" \
    -alias keyboardheroes -keyalg RSA -keysize 3072 -validity 10000 \
    -dname "CN=Keyboard Heroes, O=Keyboard Heroes, C=TR"
  chmod 600 "$KEYSTORE"
else
  echo "Existing local signing key found; it will NOT be replaced."
fi

read -r -s -p "Enter the keystore password again (hidden): " KH_SIGNING_KEY_PASSWORD
printf '\n'
export KH_SIGNING_KEY_PASSWORD
trap 'unset KH_SIGNING_KEY_PASSWORD' EXIT
if ! keytool -list -keystore "$KEYSTORE" -storetype PKCS12 \
  -alias keyboardheroes -storepass:env KH_SIGNING_KEY_PASSWORD >/dev/null; then
  echo "STOP: password incorrect or keystore invalid. No secrets uploaded."
  exit 1
fi

echo "Uploading encrypted GitHub Actions secrets (not the public repository)..."
base64 -w 0 "$KEYSTORE" | gh secret set KH_ANDROID_RELEASE_KEYSTORE_B64 --repo "$REPO"
printf '%s' "$KH_SIGNING_KEY_PASSWORD" | gh secret set KH_ANDROID_RELEASE_KEYSTORE_PASSWORD --repo "$REPO"

echo
echo "GitHub secret names:"
gh secret list --repo "$REPO" --json name --jq '.[].name' | grep -E '^KH_ANDROID_RELEASE_KEYSTORE_(B64|PASSWORD)$'
echo
echo "Public certificate SHA-256 fingerprint:"
keytool -list -v -keystore "$KEYSTORE" -storetype PKCS12 \
  -alias keyboardheroes -storepass:env KH_SIGNING_KEY_PASSWORD | grep 'SHA256:' || true
echo
echo "SUCCESS. Keep the .p12 key and password SAFE and BACKED UP."
echo "Private key on phone: $KEYSTORE"
echo "DO NOT delete Termux or lose this file before making a secure backup."
echo "Next: https://github.com/$REPO/actions/workflows/android-production-signing.yml"
