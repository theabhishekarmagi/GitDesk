#!/usr/bin/env bash
# GitDrive 1-Line Installer for macOS
# Usage: curl -fsSL https://raw.githubusercontent.com/theabhishekarmagi/GitDesk/main/install.sh | bash

set -e

# Styling
BOLD="$(tput bold 2>/dev/null || echo '')"
GREEN="$(tput setaf 2 2>/dev/null || echo '')"
CYAN="$(tput setaf 6 2>/dev/null || echo '')"
YELLOW="$(tput setaf 3 2>/dev/null || echo '')"
RESET="$(tput sgr0 2>/dev/null || echo '')"

echo "${BOLD}${CYAN}"
echo "  ____ _ _   ____       _           "
echo " / ___(_) |_|  _ \ _ __(_)_   _____ "
echo "| |  _| | __| | | | '__| \ \ / / _ \\"
echo "| |_| | | |_| |_| | |  | |\ V /  __/"
echo " \____|_|\__|____/|_|  |_| \_/ \___|"
echo "${RESET}"
echo "${BOLD}Installing GitDrive for macOS...${RESET}"

# Check OS
OS="$(uname -s)"
if [ "$OS" != "Darwin" ]; then
  echo "❌ This installer script is designed for macOS. On Windows, please run install.ps1 in PowerShell."
  exit 1
fi

# Detect Architecture
ARCH="$(uname -m)"
if [ "$ARCH" = "arm64" ]; then
  ARCH_TAG="arm64"
  echo "💻 Detected: Apple Silicon (M-series / arm64)"
else
  ARCH_TAG="x64"
  echo "💻 Detected: Intel Mac (x64)"
fi

REPO="theabhishekarmagi/GitDesk"
TEMP_DIR="$(mktemp -d)"
ZIP_PATH="$TEMP_DIR/GitDrive.zip"

echo "🔍 Locating latest release from GitHub ($REPO)..."
RELEASE_JSON="$(curl -sSL "https://api.github.com/repos/$REPO/releases/latest" 2>/dev/null || echo '')"

DOWNLOAD_URL=""
if [ -n "$RELEASE_JSON" ]; then
  DOWNLOAD_URL="$(echo "$RELEASE_JSON" | grep -o 'https://[^"]*GitDrive[^"]*'"$ARCH_TAG"'-mac\.zip' | head -n 1 || true)"
  if [ -z "$DOWNLOAD_URL" ]; then
    DOWNLOAD_URL="$(echo "$RELEASE_JSON" | grep -o 'https://[^"]*GitDrive[^"]*mac\.zip' | head -n 1 || true)"
  fi
fi

if [ -z "$DOWNLOAD_URL" ]; then
  DOWNLOAD_URL="https://github.com/$REPO/releases/latest/download/GitDrive-1.0.0-${ARCH_TAG}-mac.zip"
fi

echo "⬇️  Downloading GitDrive..."
curl -fL --progress-bar "$DOWNLOAD_URL" -o "$ZIP_PATH"

echo "📦 Installing into /Applications/GitDrive.app..."
rm -rf /Applications/GitDrive.app
unzip -q -o "$ZIP_PATH" -d /Applications/

echo "🛡️  Configuring macOS security permissions..."
xattr -cr /Applications/GitDrive.app 2>/dev/null || true

echo "🧹 Cleaning up temporary cache..."
rm -rf "$TEMP_DIR"

echo "${GREEN}${BOLD}✅ GitDrive installed successfully to /Applications/GitDrive.app!${RESET}"
echo "🚀 Launching GitDrive..."
open -a GitDrive
