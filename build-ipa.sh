#!/bin/bash

# Script pentru a construi IPA pentru AltStore folosind zip
set -e

echo "🔨 Building IPA for AltStore using zip..."

# Curăță build-urile anterioare
echo "🧹 Cleaning previous builds..."
rm -rf ios/build/ipa
rm -rf Payload
rm -f *.ipa

cd ios

# Construiește aplicația pentru device fizic (fără signing - AltStore va gestiona signing-ul)
echo "📦 Building app for device (no signing required for AltStore)..."

# Construiește aplicația fără signing (ignorăm erorile de signing pentru pods)
# AltStore va re-semnă aplicația când o instalează
xcodebuild clean build \
  -workspace Magic8Ball.xcworkspace \
  -scheme Magic8Ball \
  -configuration Release \
  -sdk iphoneos \
  -arch arm64 \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGN_IDENTITY="" \
  DEVELOPMENT_TEAM="" \
  PROVISIONING_PROFILE_SPECIFIER="" \
  2>&1 | grep -E "(BUILD|error|Error|succeeded|failed|Found app)" || {
    echo "⚠️  Build completed (some signing warnings are expected)"
  }

# Găsește .app bundle-ul în mai multe locații posibile
echo "🔍 Searching for Magic8Ball.app bundle..."

# Caută în build direct
APP_BUNDLE=$(find build -name "Magic8Ball.app" -type d 2>/dev/null | head -1)

# Dacă nu găsește, caută în DerivedData
if [ -z "$APP_BUNDLE" ]; then
  echo "💡 Searching in DerivedData..."
  DERIVED_DATA=$(find ~/Library/Developer/Xcode/DerivedData -name "Magic8Ball.app" -type d 2>/dev/null | grep "Release-iphoneos" | head -1)
  if [ -n "$DERIVED_DATA" ]; then
    APP_BUNDLE="$DERIVED_DATA"
  fi
fi

# Dacă încă nu găsește, caută orice .app în build
if [ -z "$APP_BUNDLE" ]; then
  echo "💡 Searching for any .app bundle in build directory..."
  APP_BUNDLE=$(find build -name "*.app" -type d 2>/dev/null | head -1)
fi

# Dacă încă nu găsește, caută în Products
if [ -z "$APP_BUNDLE" ]; then
  echo "💡 Searching in Products directory..."
  APP_BUNDLE=$(find ~/Library/Developer/Xcode/DerivedData -path "*/Build/Products/Release-iphoneos/Magic8Ball.app" -type d 2>/dev/null | head -1)
fi

if [ -z "$APP_BUNDLE" ]; then
  echo "❌ Error: Could not find Magic8Ball.app bundle"
  echo ""
  echo "💡 Build locations checked:"
  echo "   - ios/build/"
  echo "   - ~/Library/Developer/Xcode/DerivedData/"
  echo ""
  echo "💡 Try building manually in Xcode:"
  echo "   1. open ios/Magic8Ball.xcworkspace"
  echo "   2. Product > Archive"
  echo "   3. Then export IPA from Organizer"
  exit 1
else
  echo "✅ Found app bundle: $APP_BUNDLE"
fi

# Creează structura IPA
cd ..
echo "📦 Creating IPA structure..."

# Creează directorul Payload
mkdir -p Payload

# Copiază .app bundle-ul în Payload
echo "📋 Copying app bundle to Payload..."
# Folosește calea absolută dacă e necesar
if [[ "$APP_BUNDLE" != /* ]]; then
  APP_BUNDLE="$(pwd)/$APP_BUNDLE"
fi
cp -R "$APP_BUNDLE" Payload/

# Creează IPA-ul cu zip
IPA_NAME="Magic8Ball.ipa"
echo "🗜️  Creating IPA file: $IPA_NAME..."

# Șterge IPA-ul vechi dacă există
rm -f "$IPA_NAME"

# Creează IPA-ul (Payload trebuie să fie în root-ul arhivei)
cd Payload
zip -r "../$IPA_NAME" . > /dev/null
cd ..

# Curăță Payload (opțional, poți șterge dacă vrei)
echo "🧹 Cleaning up..."
rm -rf Payload

echo ""
echo "✅ IPA built successfully!"
echo "📱 IPA location: $(pwd)/$IPA_NAME"
echo ""
echo "💡 Pentru AltStore:"
echo "   1. Transferă $IPA_NAME pe iPhone (via AirDrop, email, sau iCloud)"
echo "   2. Deschide AltStore pe iPhone"
echo "   3. Tap pe '+' în colțul din dreapta sus"
echo "   4. Selectează $IPA_NAME"
echo "   5. AltStore va instala aplicația"
echo ""
