#!/usr/bin/env bash
set -e

if [ "$(uname)" != "Darwin" ]; then
  exit 0
fi

DIST_DIR="node_modules/electron/dist"
APP_DIR=""

if [ -d "$DIST_DIR/GitDrive.app" ]; then
  APP_DIR="$DIST_DIR/GitDrive.app"
elif [ -d "$DIST_DIR/Electron.app" ]; then
  mv "$DIST_DIR/Electron.app" "$DIST_DIR/GitDrive.app"
  mv "$DIST_DIR/GitDrive.app/Contents/MacOS/Electron" "$DIST_DIR/GitDrive.app/Contents/MacOS/GitDrive" 2>/dev/null || true
  APP_DIR="$DIST_DIR/GitDrive.app"
  echo -n "GitDrive.app/Contents/MacOS/GitDrive" > "node_modules/electron/path.txt"
fi

if [ -n "$APP_DIR" ] && [ -d "$APP_DIR" ]; then
  if [ -f "assets/icon.icns" ]; then
    cp "assets/icon.icns" "$APP_DIR/Contents/Resources/electron.icns" 2>/dev/null || true
  fi

  PLIST="$APP_DIR/Contents/Info.plist"
  if [ -f "$PLIST" ]; then
    /usr/libexec/PlistBuddy -c "Set :CFBundleExecutable GitDrive" "$PLIST" 2>/dev/null || true
    /usr/libexec/PlistBuddy -c "Set :CFBundleName GitDrive" "$PLIST" 2>/dev/null || true
    /usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName GitDrive" "$PLIST" 2>/dev/null || true
    /usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier com.gitdrive.app" "$PLIST" 2>/dev/null || true
  fi

  codesign --force --deep --sign - "$APP_DIR" 2>/dev/null || true
  mdimport "$APP_DIR" 2>/dev/null || true
fi
