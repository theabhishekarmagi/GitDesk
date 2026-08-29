#!/usr/bin/env node

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawn } = require('child_process');

const REPO = 'theabhishekarmagi/GitDesk';

// Terminal colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

console.log(`${colors.cyan}${colors.bright}`);
console.log('  ____ _ _   ____       _           ');
console.log(' / ___(_) |_|  _ \\ _ __(_)_   _____ ');
console.log('| |  _| | __| | | | \'__| \\ \\ / / _ \\');
console.log('| |_| | | |_| |_| | |  | |\\ V /  __/');
console.log(' \\____|_|\\__|____/|_|  |_| \\_/ \\___|');
console.log(`${colors.reset}`);
console.log(`${colors.bright}📦 Installing GitDrive Desktop App...${colors.reset}\n`);

// Helper to fetch JSON from GitHub API
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'GitDrive-Installer',
        Accept: 'application/vnd.github.v3+json',
      },
    };
    https.get(url, options, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`GitHub API returned status code ${res.statusCode}`));
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Helper to download a file with progress bar and follow redirects
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const get = url.startsWith('https:') ? https.get : http.get;
    const options = {
      headers: {
        'User-Agent': 'GitDrive-Installer',
      },
    };

    get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        return reject(new Error(`Download failed with status ${res.statusCode}`));
      }

      const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
      let receivedBytes = 0;
      let lastPercent = -1;

      res.on('data', (chunk) => {
        receivedBytes += chunk.length;
        if (totalBytes > 0) {
          const percent = Math.floor((receivedBytes / totalBytes) * 100);
          if (percent !== lastPercent && percent % 10 === 0) {
            process.stdout.write(`\r⬇️  Downloading: ${percent}% [${(receivedBytes / (1024 * 1024)).toFixed(1)}MB / ${(totalBytes / (1024 * 1024)).toFixed(1)}MB]`);
            lastPercent = percent;
          }
        }
      });

      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          process.stdout.write('\n');
          resolve();
        });
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

async function main() {
  const platform = process.platform;
  const arch = process.arch;

  console.log(`🖥️  Platform: ${platform} (${arch})`);

  let release;
  try {
    process.stdout.write('🔍 Finding latest release on GitHub... ');
    release = await fetchJson(`https://api.github.com/repos/${REPO}/releases/latest`);
    console.log(`${colors.green}Found ${release.tag_name || 'v1.0.0'}${colors.reset}`);
  } catch (err) {
    console.log(`${colors.yellow}Using fallback release URL...${colors.reset}`);
  }

  const assets = release && Array.isArray(release.assets) ? release.assets : [];

  if (platform === 'darwin') {
    // macOS Installation via .dmg
    const isArm = arch === 'arm64';
    const targetArchTag = isArm ? 'arm64' : 'x64';

    let targetAsset = assets.find((a) => a.name.includes(targetArchTag) && a.name.endsWith('.dmg'));
    if (!targetAsset) {
      targetAsset = assets.find((a) => a.name.endsWith('.dmg'));
    }

    const downloadUrl = targetAsset
      ? targetAsset.browser_download_url
      : `https://github.com/${REPO}/releases/latest/download/GitDrive-1.0.2-${targetArchTag}.dmg`;

    const tmpDmg = path.join(os.tmpdir(), `GitDrive-${Date.now()}.dmg`);
    console.log(`\n⬇️  Downloading GitDrive (.dmg) for macOS...`);
    await downloadFile(downloadUrl, tmpDmg);

    console.log(`📦 Mounting installer and copying to /Applications...`);
    const mountPoint = path.join(os.tmpdir(), `GitDriveMount-${Date.now()}`);
    fs.mkdirSync(mountPoint, { recursive: true });

    try {
      execSync(`hdiutil attach "${tmpDmg}" -mountpoint "${mountPoint}" -nobrowse -quiet`);

      const appSource = path.join(mountPoint, 'GitDrive.app');
      if (!fs.existsSync(appSource)) {
        throw new Error('GitDrive.app not found inside DMG volume.');
      }

      execSync('rm -rf /Applications/GitDrive.app');
      execSync(`cp -R "${appSource}" /Applications/`);

      try {
        execSync(`hdiutil detach "${mountPoint}" -force -quiet`);
      } catch {}
      try {
        fs.rmdirSync(mountPoint);
      } catch {}

      execSync('xattr -cr /Applications/GitDrive.app 2>/dev/null || true');
      execSync('xattr -dr com.apple.quarantine /Applications/GitDrive.app 2>/dev/null || true');
      execSync('codesign --force --deep --sign - /Applications/GitDrive.app 2>/dev/null || true');

      if (fs.existsSync(tmpDmg)) fs.unlinkSync(tmpDmg);
    } catch (e) {
      try { execSync(`hdiutil detach "${mountPoint}" -force -quiet 2>/dev/null || true`); } catch {}
      console.error(`${colors.red}Failed to install into /Applications. Try running with sudo if permissions are restricted.${colors.reset}`, e.message);
      process.exit(1);
    }

    console.log(`\n${colors.green}${colors.bright}✅ GitDrive has been installed successfully into /Applications!${colors.reset}`);
    console.log(`🚀 Launching GitDrive...\n`);
    try {
      execSync('open -a GitDrive');
    } catch {}

  } else if (platform === 'win32') {
    // Windows Installation
    let targetAsset = assets.find((a) => a.name.toLowerCase().includes('setup') && a.name.endsWith('.exe'));
    if (!targetAsset) {
      targetAsset = assets.find((a) => a.name.endsWith('.exe'));
    }

    const downloadUrl = targetAsset
      ? targetAsset.browser_download_url
      : `https://github.com/${REPO}/releases/latest/download/GitDrive-Setup-1.0.0.exe`;

    const tmpExe = path.join(os.tmpdir(), `GitDrive-Setup-${Date.now()}.exe`);
    console.log(`\n⬇️  Downloading GitDrive for Windows...`);
    await downloadFile(downloadUrl, tmpExe);

    console.log(`⚙️  Running Windows installer...`);
    try {
      execSync(`"${tmpExe}" /S`);
      try { fs.unlinkSync(tmpExe); } catch {}
    } catch (e) {
      console.error(`${colors.red}Failed to execute installer.${colors.reset}`, e);
      process.exit(1);
    }

    console.log(`\n${colors.green}${colors.bright}✅ GitDrive has been installed successfully to Windows!${colors.reset}`);
    console.log(`🚀 Launching GitDrive...\n`);
    const localAppPath = path.join(process.env.LOCALAPPDATA || '', 'Programs', 'GitDrive', 'GitDrive.exe');
    if (fs.existsSync(localAppPath)) {
      spawn(localAppPath, [], { detached: true, stdio: 'ignore' }).unref();
    }

  } else {
    console.error(`${colors.red}Unsupported platform: ${platform}. GitDrive currently supports macOS and Windows.${colors.reset}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`\n${colors.red}Installation failed:${colors.reset}`, err.message);
  process.exit(1);
});
