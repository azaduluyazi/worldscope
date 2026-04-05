#!/bin/bash
# ────────────────────────────────────────────────────────
# WorldScope TWA (Trusted Web Activity) Build Script
# Builds an Android App Bundle (AAB) from the PWA
# ────────────────────────────────────────────────────────
#
# Prerequisites:
#   1. Node.js 18+
#   2. Java JDK 11+ (for Android SDK)
#   3. Android SDK (or let Bubblewrap download it)
#   4. npm install -g @nicolo-ribaudo/bubblewrap
#
# Usage:
#   chmod +x scripts/build-twa.sh
#   ./scripts/build-twa.sh
#
# After build:
#   1. Upload AAB to Google Play Console
#   2. Get SHA-256 from Play Console → App Signing
#   3. Update public/.well-known/assetlinks.json with SHA-256
#   4. Deploy to verify Digital Asset Links
# ────────────────────────────────────────────────────────

set -e

MANIFEST_URL="https://troiamedia.com/manifest.json"
OUTPUT_DIR="./android-twa"
PACKAGE_NAME="com.troiamedia.worldscope"
APP_NAME="WorldScope"

echo "╔══════════════════════════════════════════╗"
echo "║  WorldScope TWA Builder                  ║"
echo "╚══════════════════════════════════════════╝"

# Check bubblewrap
if ! command -v bubblewrap &> /dev/null; then
  echo "⚠ Bubblewrap not found. Installing..."
  npm install -g @nicolo-ribaudo/bubblewrap
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"
cd "$OUTPUT_DIR"

# Initialize TWA project
echo ""
echo "▶ Initializing TWA project from manifest..."
bubblewrap init \
  --manifest="$MANIFEST_URL" \
  --directory=. \
  --packageId="$PACKAGE_NAME"

# Build AAB
echo ""
echo "▶ Building Android App Bundle..."
bubblewrap build

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  Build Complete!                         ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Upload the AAB file to Google Play Console"
echo "  2. Copy SHA-256 fingerprint from Play Console → App Signing"
echo "  3. Replace the placeholder in public/.well-known/assetlinks.json"
echo "  4. Deploy to verify: https://troiamedia.com/.well-known/assetlinks.json"
echo ""
echo "Files:"
ls -la *.aab 2>/dev/null || echo "  (AAB file will be in current directory)"
