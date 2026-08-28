<h1 align="center">
  <img src="./assets/icon.png" alt="GitDrive Logo" width="42" style="vertical-align: middle;">&nbsp;
  GitDrive: Personal Cloud Drive Powered by GitHub
</h1>

<p align="center">
  🚀 Turn your GitHub repositories into a sleek, zero-cost, privacy-first personal cloud drive.
</p>

<p align="center">
  <a href="#-get-started"><img src="https://img.shields.io/badge/💻_Install_Now-npx_gitdrive--install-3776AB?style=for-the-badge&logo=npm" alt="Install with npx"></a>
  &nbsp;
  <a href="https://github.com/theabhishekarmagi/GitDesk/releases/latest"><img src="https://img.shields.io/badge/📦_Download_Desktop-macOS_|_Windows-10B981?style=for-the-badge&logo=apple" alt="Download Desktop"></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/gitdrive-install"><img src="https://img.shields.io/npm/v/gitdrive-install?color=CB3837&label=npm%3A%20gitdrive-install" alt="npm version"></a>&ensp;
  <a href="https://github.com/theabhishekarmagi/GitDesk/releases"><img src="https://img.shields.io/github/v/release/theabhishekarmagi/GitDesk?color=blue&label=release" alt="GitHub release"></a>&ensp;
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>&ensp;
  <a href="https://github.com/theabhishekarmagi/GitDesk/actions/workflows/release.yml"><img src="https://github.com/theabhishekarmagi/GitDesk/actions/workflows/release.yml/badge.svg" alt="Release Build"></a>&ensp;
  <a href="https://github.com/theabhishekarmagi/GitDesk"><img src="https://img.shields.io/badge/Platform-macOS%20%7C%20Windows-lightgrey" alt="Platform: macOS | Windows"></a>
</p>

---

## Why GitDrive?

Managing personal files across the cloud has two major pain points:

1. **Commercial cloud storage is expensive and vendor-locked.** Monthly subscriptions for Google Drive, Dropbox, and OneDrive add up every year, while your personal files and documents are stored on third-party servers.
2. **Git & GitHub offer free, infinite versioned storage, but git CLI is too tedious for daily file management.** Opening a terminal to `git add`, `git commit`, and `git push` every time you want to save a PDF, presentation, screenshot, or design asset is high-friction.

**GitDrive bridges this gap.** It gives you the familiar, beautiful desktop experience of a modern cloud drive, backed 100% by your own GitHub account:

- **Zero subscription fees**: Unlimited repositories and storage backed directly by GitHub.
- **True data ownership**: Your files live in your own repositories. No middleman servers, no data scraping.
- **Native OS Drag & Drop**: Drag documents, PDFs, and media directly from GitDrive out onto your Desktop, Finder, or Windows File Explorer.
- **Built-in Time Machine**: Effortlessly inspect and restore past versions of any file backed by Git commit history.

---

## ✨ Features

- 📁 **Repository as Folder**: Treat any GitHub repository as a high-capacity drive folder.
- 🖐️ **Native OS Drag-and-Drop**: Drag any file or document directly out of GitDrive onto your Desktop, macOS Finder, or Windows File Explorer with a single gesture.
- 🔒 **Hardware-Encrypted Security**: Personal Access Tokens are encrypted client-side using native OS keychains (macOS Keychain / Windows Credential Manager). Credentials never touch any external server.
- ⏱️ **Version History & Restore**: Browse complete commit histories for individual files and restore earlier versions with one click.
- 🎨 **Apple Notes Dark Aesthetic**: Minimalist, clean neutral dark gray theme (`#1c1c1e`) engineered for distraction-free focus.
- ⚡ **Zero-Daemon Overhead**: Direct REST communication with GitHub. No background disk watchers or CPU-draining syncing daemons.

---

## 🚀 Get Started

Install and launch GitDrive using any of the options below:

### Option 1: Instant 1-Line Install via NPX (Recommended)

If you have Node.js installed, run this single command in your terminal:

```bash
npx gitdrive-install
```
> Automatically detects your OS (macOS Apple Silicon/Intel or Windows), downloads the latest desktop build, installs it into your applications folder, and launches the app!

---

### Option 2: 1-Line Terminal Scripts (No Node.js Required)

#### 🍏 macOS (Terminal):
```bash
curl -fsSL https://raw.githubusercontent.com/theabhishekarmagi/GitDesk/main/install.sh | bash
```

#### 🪟 Windows (PowerShell):
```powershell
irm https://raw.githubusercontent.com/theabhishekarmagi/GitDesk/main/install.ps1 | iex
```

---

### Option 3: Homebrew Cask (macOS)

```bash
brew install --cask theabhishekarmagi/tap/gitdrive
```

Update anytime with:
```bash
brew upgrade gitdrive
```

---

### Option 4: Manual Desktop Downloads

Pre-built self-contained desktop binaries are compiled on every release:

- **macOS (Apple Silicon M1/M2/M3/M4):** [Download `.dmg`](https://github.com/theabhishekarmagi/GitDesk/releases/latest) or [Download `.zip`](https://github.com/theabhishekarmagi/GitDesk/releases/latest)
- **macOS (Intel):** [Download `.dmg`](https://github.com/theabhishekarmagi/GitDesk/releases/latest) or [Download `.zip`](https://github.com/theabhishekarmagi/GitDesk/releases/latest)
- **Windows (x64):** [Download Setup `.exe`](https://github.com/theabhishekarmagi/GitDesk/releases/latest) or [Download Portable `.zip`](https://github.com/theabhishekarmagi/GitDesk/releases/latest)

> [!NOTE]
> On macOS, move `GitDrive.app` to **Applications**. The first time you launch, if macOS Gatekeeper displays a verification prompt, simply right-click and choose **Open**, or run `xattr -cr /Applications/GitDrive.app`.

---

### Option 5: Developer Setup (Build from Source)

Clone the repository and start the development environment:

```bash
# 1. Clone repository
git clone https://github.com/theabhishekarmagi/GitDesk.git
cd GitDesk

# 2. Install dependencies
npm install

# 3. Start development environment
npm run dev
```

Build production executables locally:
```bash
# Build for macOS
npm run dist:mac

# Build for Windows
npm run dist:win
```

---

## 🔐 Security & Privacy

* **Direct API Communication**: GitDrive communicates directly with the official GitHub REST API (`api.github.com`). No intermediate proxy or relay server is used.
* **Hardware Keychain Storage**: Your GitHub Personal Access Token is stored using Electron's `safeStorage` API, which leverages Apple Keychain on macOS and Windows DPAPI on Windows.
* **Dual-Layer Auto-Login**: Sessions are persistent across updates and app restarts. Tokens are destroyed only when you explicitly click **Log out**.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/theabhishekarmagi/GitDesk/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.
