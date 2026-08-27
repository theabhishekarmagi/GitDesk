# GitVault - Quick Reference & Project Overview
## For Developers & IDE Integration

---

## 📋 WHAT IS GITVAULT?

**GitVault** is a desktop application that turns GitHub repositories into a file storage system. Think of it as "Dropbox, but powered by GitHub, with no subscriptions."

### The Concept
```
Traditional Cloud Storage    →    GitVault (GitHub-Powered)
────────────────────────    →    ──────────────────────────
Pay $11.99/month            →    Free (GitHub's free tier)
15GB-2TB storage            →    Unlimited storage
Complex features            →    Simple, clean interface
One-time learning curve     →    GitHub knowledge helps
```

---

## 🎯 CORE FEATURES

### Phase 1 (MVP) - What We're Building First
✅ **Login with GitHub** - OAuth authentication  
✅ **Create Folders** - Each folder = one GitHub repository  
✅ **Upload Files** - Any file type, drag-and-drop interface  
✅ **Download Files** - Get files back anytime  
✅ **View History** - See all versions of your files  
✅ **Restore Versions** - Go back to previous versions  

### Phase 2 (Enhancement) - Coming Later
🔜 **Share Files** - Generate shareable links  
🔜 **Offline Access** - Download for offline use  
🔜 **Team Collaboration** - Invite others to access folders  

### Phase 3 (Advanced) - Future Goals
🚀 **Encryption** - Client-side file encryption  
🚀 **Mobile Apps** - iOS and Android versions  
🚀 **Enterprise Features** - Team workspaces, SSO  

---

## 🏗️ HOW IT WORKS (Simple Explanation)

### User Journey

```
1. USER LOGS IN
   ↓
   "Click Login with GitHub"
   → GitHub OAuth popup
   → User grants permissions
   → App stores secure token
   ↓

2. USER SEES FOLDERS
   ↓
   "Fetch all user's GitHub repos"
   → Display as folders in UI
   → Show folder details (size, files, date)
   ↓

3. USER CREATES FOLDER
   ↓
   "Click New Folder"
   → Enter folder name
   → GitHub API creates new repo
   → Folder appears in list
   ↓

4. USER UPLOADS FILE
   ↓
   "Drag file to folder"
   → Convert file to Base64
   → Send to GitHub API
   → File committed to repo
   → File appears in folder
   ↓

5. USER DOWNLOADS FILE
   ↓
   "Click Download"
   → Fetch file from GitHub
   → Save to user's computer
   → Done!
   ↓

6. USER VIEWS HISTORY
   ↓
   "Right-click file → History"
   → Show all versions
   → Restore any old version
   → One-click restore
```

---

## 🔧 TECHNICAL ARCHITECTURE (Simple)

```
YOUR DESKTOP COMPUTER
└─────────────────────────────────────
│  GitVault Desktop App
│  (Electron + React)
│  ├─ Login Screen
│  ├─ Folder List
│  ├─ File Manager
│  └─ Settings
│
│  Under the hood:
│  ├─ Redux (State Management)
│  ├─ Services (Business Logic)
│  ├─ GitHub Client (API)
│  └─ SQLite (Local Cache)
│
└─────────────────────────────────────
         ↓ (Internet)
         ↓
GITHUB.COM (Cloud Storage)
└─────────────────────────────────────
│  Your GitHub Repos
│  ├─ repo: "documents"
│  │   └─ files: pdf, docs, sheets
│  │
│  ├─ repo: "projects"
│  │   └─ files: code, designs
│  │
│  └─ repo: "photos"
│      └─ files: images, videos
│
└─────────────────────────────────────
```

---

## 📁 PROJECT STRUCTURE OVERVIEW

```
gitvault/
│
├─ src/
│  │
│  ├─ main/                    # Electron main process
│  │  └─ main.ts               # Window management, OS integration
│  │
│  ├─ renderer/                # React frontend
│  │  ├─ pages/                # Full page components
│  │  │  ├─ LoginPage          # GitHub login screen
│  │  │  ├─ DashboardPage      # Main app screen
│  │  │  ├─ FolderPage         # Folder contents
│  │  │  └─ SettingsPage       # App settings
│  │  │
│  │  ├─ components/           # Reusable UI components
│  │  │  ├─ FolderList         # Display folders
│  │  │  ├─ FileList           # Display files
│  │  │  └─ FileUploadZone     # Drag-drop area
│  │  │
│  │  ├─ services/             # Business logic
│  │  │  ├─ AuthService        # Handle login/logout
│  │  │  ├─ FolderService      # Create/delete folders
│  │  │  ├─ FileService        # Upload/download files
│  │  │  └─ VersionService     # Handle file history
│  │  │
│  │  ├─ api/                  # GitHub API integration
│  │  │  ├─ GitHubClient       # Octokit setup
│  │  │  └─ endpoints/         # API call wrappers
│  │  │
│  │  ├─ store/                # Redux state management
│  │  │  ├─ authStore          # Login state
│  │  │  ├─ folderStore        # Folders state
│  │  │  ├─ fileStore          # Files state
│  │  │  └─ uploadStore        # Upload progress
│  │  │
│  │  ├─ db/                   # Database (SQLite)
│  │  │  └─ database.ts        # Local cache
│  │  │
│  │  └─ utils/                # Helper functions
│  │     ├─ fileEncoding       # Base64 conversion
│  │     ├─ validators         # Input validation
│  │     └─ constants          # App constants
│  │
│  └─ shared/                  # Shared types & constants
│
├─ tests/                      # Unit tests
├─ docs/                       # Documentation
└─ package.json               # Dependencies
```

---

## 🔄 MAIN WORKFLOWS

### 1️⃣ AUTHENTICATION WORKFLOW
```
User clicks "Login"
    ↓
Open GitHub OAuth page
    ↓
User authorizes app
    ↓
Get access token
    ↓
Store token securely (in OS Keychain)
    ↓
Fetch user info
    ↓
Redirect to main app
    ↓
App auto-login on restart (token in keychain)
```

### 2️⃣ CREATE FOLDER WORKFLOW
```
User clicks "New Folder"
    ↓
Show dialog: "Enter folder name"
    ↓
Validate name (no special chars, not duplicate)
    ↓
Call GitHub API: POST /user/repos
    ↓
GitHub creates repository
    ↓
Update local cache (SQLite)
    ↓
Update UI (Redux state)
    ↓
Show confirmation: "Folder created!"
```

### 3️⃣ UPLOAD FILE WORKFLOW
```
User drags file to folder
    ↓
Read file content
    ↓
Validate file size (must be ≤100MB)
    ↓
Convert file to Base64
    ↓
Call GitHub API: PUT /repos/.../contents/{path}
    ↓
GitHub stores file in repo
    ↓
Update local cache with file metadata
    ↓
Update UI (file appears in list)
    ↓
Show progress bar during upload
```

### 4️⃣ VIEW VERSION HISTORY WORKFLOW
```
User right-clicks file → "History"
    ↓
Call GitHub API: GET /repos/.../commits?path={file}
    ↓
GitHub returns commit history
    ↓
Display timeline of all versions
    ↓
User can see:
  - Date of change
  - File size at that time
  - Who uploaded it
  - Download or restore option
    ↓
User clicks "Restore"
    ↓
App pushes old content back to GitHub
    ↓
File restored to previous version
```

---

## 💻 TECHNOLOGY STACK

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Desktop Framework** | Electron | Cross-platform desktop app |
| **Frontend** | React + TypeScript | User interface |
| **State Management** | Redux or Zustand | Manage app state |
| **API Client** | Octokit | GitHub API wrapper |
| **Local Storage** | SQLite | Cache repos & files |
| **Secure Storage** | OS Keychain | Store auth token safely |
| **UI Components** | React + CSS | Buttons, dialogs, lists |
| **Build Tool** | Webpack/Vite | Bundle code |
| **Testing** | Jest + React Testing Library | Unit & integration tests |
| **Authentication** | GitHub OAuth 2.0 | User login |

---

## 🔌 GITHUB API INTEGRATION

### Key API Endpoints Used

```
Authentication
──────────────
GET /user                           → Get current user info

Repositories (Folders)
──────────────────────
GET /user/repos                     → List all user's repos
POST /user/repos                    → Create new repo
DELETE /repos/{owner}/{repo}        → Delete repo

Files
─────
GET /repos/{owner}/{repo}/contents/{path}      → Get file content
PUT /repos/{owner}/{repo}/contents/{path}      → Upload/update file
DELETE /repos/{owner}/{repo}/contents/{path}   → Delete file

History
───────
GET /repos/{owner}/{repo}/commits?path={file}  → Get file history
GET /repos/{owner}/{repo}/commits/{sha}        → Get specific commit
```

### Example: Upload File

**What the user does:**
```
Drag "document.pdf" into folder
```

**What GitVault does internally:**
```
1. Read file bytes
2. Convert to Base64 string
3. Call GitHub API:
   PUT https://api.github.com/repos/john/documents/contents/document.pdf
   Body: {
     message: "Upload document.pdf",
     content: "JVBERi0xLjQKJeLj...",  (Base64)
     branch: "main"
   }
4. GitHub stores file
5. GitVault updates UI
```

---

## 📊 DATABASE SCHEMA (SQLite)

```
Simple version of what's stored locally:

USERS Table
───────────
- id: unique identifier
- username: GitHub username
- email: user email
- token_stored_at: when token was saved

REPOS Table (Folders)
─────────────────────
- id: folder ID
- name: folder name
- full_name: owner/folder
- size: total size in bytes
- created_at: when created

FILES Table
───────────
- id: file ID
- name: file name
- repo_id: which folder
- sha: GitHub file hash
- size: file size in bytes
- upload_at: when uploaded

FILE_VERSIONS Table (History)
─────────────────────────────
- file_id: which file
- commit_sha: GitHub commit hash
- date: when changed
- size: file size at that time
```

---

## 🚀 WORKFLOW AT A GLANCE

### For a Developer Working on GitVault

```
1. SETUP
   └─ npm install
   └─ npm run dev
   └─ App opens with login screen

2. FEATURE: Login
   ├─ Edit: src/pages/LoginPage.tsx
   ├─ Edit: src/services/AuthService.ts
   ├─ Call: GitHub OAuth API
   └─ Test: npm test

3. FEATURE: Upload File
   ├─ Edit: src/components/FileUploadZone.tsx
   ├─ Edit: src/services/FileService.ts
   ├─ Logic: Read file → Convert to Base64 → Call GitHub API
   ├─ Update: Redux state in src/store/fileStore.ts
   └─ Test: npm test

4. FEATURE: View History
   ├─ Edit: src/components/VersionHistory.tsx
   ├─ Edit: src/services/VersionService.ts
   ├─ Call: GitHub API for commits
   ├─ Display: Timeline of versions
   └─ Test: npm test

5. BUILD & RELEASE
   ├─ npm run build
   ├─ npm run electron-builder
   └─ Installer ready for distribution
```

---

## 📋 CHECKLIST: What Each Component Does

- [ ] **LoginPage** - Shows login button, handles OAuth redirect
- [ ] **DashboardPage** - Shows list of folders, create folder button
- [ ] **FolderPage** - Shows files in folder, upload zone
- [ ] **SettingsPage** - App preferences, logout button

- [ ] **FolderList** - Component to display folders
- [ ] **FileList** - Component to display files
- [ ] **FileUploadZone** - Drag-drop area for files
- [ ] **VersionHistory** - Show file version timeline

- [ ] **AuthService** - Login/logout, token management
- [ ] **FolderService** - Create/list/delete folders (repos)
- [ ] **FileService** - Upload/download/delete files
- [ ] **VersionService** - Get history, restore versions

- [ ] **GitHubClient** - Configure Octokit, make API calls
- [ ] **database.ts** - SQLite setup, caching
- [ ] **fileEncoding.ts** - Convert file to/from Base64

---

## 🐛 COMMON DEVELOPER TASKS

### Task 1: Add a New Button to Upload Files
```typescript
// File: src/components/FileUploadZone.tsx

function FileUploadZone() {
  const handleClick = () => {
    // Let user select file
    input.click();
  };
  
  const handleFileSelect = (file: File) => {
    // Upload using FileService
    FileService.uploadFile(file);
  };
  
  return (
    <button onClick={handleClick}>
      Choose File
    </button>
  );
}
```

### Task 2: Handle File Upload Progress
```typescript
// File: src/services/FileService.ts

async uploadFile(file: File) {
  // Update progress
  dispatch({ type: 'UPLOAD_START', payload: file });
  
  try {
    // Encode file
    const base64 = await FileEncoding.encodeFileToBase64(file);
    
    // Call GitHub API
    const response = await GitHubClient.uploadFile(base64);
    
    // Success
    dispatch({ type: 'UPLOAD_SUCCESS', payload: response });
  } catch (error) {
    // Error
    dispatch({ type: 'UPLOAD_ERROR', payload: error.message });
  }
}
```

### Task 3: Display Files in UI
```typescript
// File: src/components/FileList.tsx

function FileList({ files }) {
  return (
    <div className="file-list">
      {files.map(file => (
        <FileCard key={file.id} file={file} />
      ))}
    </div>
  );
}
```

---

## 🔒 SECURITY NOTES

### Token Storage
- GitHub auth token stored in **OS Keychain**, not in code/config
- Windows: Credential Manager
- macOS: Keychain
- Linux: Secret Service

### File Validation
- Check file size ≤ 100MB before upload
- Validate file names (no special characters)
- Verify downloaded files with SHA hash

### API Security
- Use HTTPS for all API calls
- Include auth token in every request
- Handle rate limits (5,000 requests/hour)

---

## ⚡ PERFORMANCE TARGETS

| Metric | Target | Current |
|--------|--------|---------|
| App startup | <3 seconds | TBD |
| Folder list load | <2 seconds | TBD |
| File upload | Match connection speed | TBD |
| File download | Match connection speed | TBD |
| Search results | <1 second | TBD |
| API response | <2 seconds | TBD |

---

## 📚 DOCUMENTATION FILES

You now have **2 main documents**:

### 1. **GitVault_PRD.md** - Product Requirements
   - What we're building (features)
   - Who we're building for (users)
   - Why we're building it (problems)
   - Success metrics
   - Business requirements

### 2. **GitVault_Technical_Spec.md** (This document's sibling)
   - How we're building it (architecture)
   - System design & components
   - Detailed workflows with diagrams
   - API integration details
   - Database schema
   - Code examples
   - Development guidelines

---

## 🎓 HOW TO USE THESE DOCUMENTS

### If you're a **Product Manager:**
→ Read: `GitVault_PRD.md`  
→ Understand: Features, user personas, success metrics

### If you're a **Developer:**
→ Read: `GitVault_Technical_Spec.md`  
→ Understand: Architecture, workflows, code structure

### If you're an **IDE/Code Assistant:**
→ Read: Both documents  
→ Understand: Full product + technical implementation  
→ Generate: Code, tests, documentation

---

## 🏁 GETTING STARTED

### For New Developers

```bash
# 1. Clone and setup
git clone https://github.com/yourusername/gitvault.git
cd gitvault
npm install

# 2. Create .env file
cp .env.example .env
# Add your GitHub OAuth credentials

# 3. Start development
npm run dev
# Opens app in development mode

# 4. Make changes to src/ files
# App auto-reloads

# 5. Run tests
npm test

# 6. Build for release
npm run build
npm run electron-builder
```

### File Locations to Start With
1. `src/pages/LoginPage.tsx` - Start here for auth flow
2. `src/services/FolderService.ts` - Main folder operations
3. `src/api/GitHubClient.ts` - GitHub API setup
4. `src/store/` - Redux store structure

---

## ❓ QUICK FAQ

**Q: How does GitVault differ from Git?**  
A: Users don't need Git knowledge. No commands, just click and drag.

**Q: What if GitHub's free storage limits change?**  
A: Warn users, document limits, suggest upgrading to GitHub Pro.

**Q: How does file versioning work?**  
A: Every file upload creates a GitHub commit. History = commit history.

**Q: Can I use private repos?**  
A: Yes, set repo to private when creating folder.

**Q: What's the max file size?**  
A: GitHub limit is 100MB per file.

**Q: Is the app open source?**  
A: Yes, available on GitHub under MIT license.

**Q: How much data can I store?**  
A: Unlimited (within GitHub's repo size guidelines, ~1GB per repo).

**Q: Do I need a GitHub account?**  
A: Yes, GitVault uses GitHub as storage backend.

---

## 📞 SUPPORT & RESOURCES

### Getting Help
- GitHub Issues: Report bugs and suggest features
- Documentation: Read the docs/ folder
- Slack/Discord: Community support channel
- Email: support@gitvault.local

### Useful Links
- GitHub API Docs: https://docs.github.com/en/rest
- Electron Docs: https://www.electronjs.org/docs
- React Docs: https://react.dev
- TypeScript Docs: https://www.typescriptlang.org/docs

---

**Ready to build? Start with the Technical Spec and implement Feature 1: Authentication! 🚀**
