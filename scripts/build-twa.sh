#!/bin/bash
# ────────────────────────────────────────────────────────
# WorldScope TWA (Trusted Web Activity) Build Script
# Builds an Android App Bundle (AAB) from the PWA
# ────────────────────────────────────────────────────────
#
# Prerequisites (already installed):
#   ✅ Node.js 25+
#   ✅ Java JDK 17 (Microsoft OpenJDK)
#   ✅ @bubblewrap/cli (npm global)
#
# Usage:
#   cd worldscope
#   ./scripts/build-twa.sh
#
# The script is INTERACTIVE — it will ask for:
#   - JDK installation: answer "No" (already installed)
#   - Android SDK: answer "Yes" (let Bubblewrap download it)
#   - Keystore password: choose a strong password and SAVE IT
#
# After build:
#   1. Upload AAB to Google Play Console ($25 dev account)
#   2. Get SHA-256 from Play Console → App Signing
#   3. Update public/.well-known/assetlinks.json with SHA-256
#   4. Deploy and verify: https://troiamedia.com/.well-known/assetlinks.json
# ────────────────────────────────────────────────────────

set -e

# Set JAVA_HOME
export JAVA_HOME="/c/Program Files/Microsoft/jdk-17.0.18.8-hotspot"
export PATH="$JAVA_HOME/bin:$PATH"

OUTPUT_DIR="./android-twa"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  WorldScope TWA Builder                  ║"
echo "║  Package: com.troiamedia.worldscope      ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Verify Java
echo "▶ Checking Java..."
java -version 2>&1 | head -1
echo ""

# Check bubblewrap
if ! command -v bubblewrap &> /dev/null && ! npx @bubblewrap/cli --help &> /dev/null; then
  echo "⚠ @bubblewrap/cli not found. Installing..."
  npm install -g @bubblewrap/cli
fi

# Navigate to TWA directory
mkdir -p "$OUTPUT_DIR"
cd "$OUTPUT_DIR"

# Check if already initialized
if [ -f "twa-manifest.json" ]; then
  echo "▶ TWA manifest found. Building..."
  echo ""
  npx @bubblewrap/cli build
else
  echo "▶ Initializing TWA project from web manifest..."
  echo ""
  echo "⚡ TIPS for interactive prompts:"
  echo "   - JDK installation: No (already have JDK 17)"
  echo "   - Android SDK: Yes (let Bubblewrap download ~500MB)"
  echo "   - Keystore password: use a strong password, SAVE IT!"
  echo "   - Key alias: worldscope"
  echo ""
  npx @bubblewrap/cli init --manifest="https://troiamedia.com/manifest.json"
fi

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  Build Complete!                         ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Upload .aab file to Google Play Console"
echo "     https://play.google.com/console"
echo "  2. Copy SHA-256 from Play Console → Setup → App Signing"
echo "  3. Update public/.well-known/assetlinks.json"
echo "  4. git add + commit + push to deploy"
echo ""
echo "Files generated:"
ls -la *.aab *.apk 2>/dev/null || echo "  (Check current directory for output files)"
