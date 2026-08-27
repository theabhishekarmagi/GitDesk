# Technical Specification & Architecture Document
## GitVault - GitHub-Based File Storage Desktop Application

**Project Name:** GitVault  
**Version:** 1.0 Technical Spec  
**Date:** August 27, 2026  
**Status:** Development Ready  

---

## 1. PROJECT OVERVIEW

### 1.1 What is GitVault?

GitVault is a cross-platform desktop application that provides a user-friendly interface to use GitHub repositories as personal file storage. It abstracts away Git complexity and presents folders as GitHub repositories and files as committed content.

**Core Concept:**
```
User's Perspective          Internal Implementation
─────────────────          ────────────────────────
Folder "Documents"    →    GitHub Repo "documents"
  - file1.pdf         →    Committed file content
  - file2.docx        →    Committed file content
  - subfolder/        →    Folder structure in repo
    - file3.xlsx      →    Nested committed file

File Version History  →    GitHub Commit History
Share Link           →    GitHub Repository URL + Auth
```

### 1.2 How It Works (Simple Workflow)

```
┌─────────────────────────────────────────────────────────────┐
│                    GITVAULT APPLICATION                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. User Login                                               │
│     User → Click "Login with GitHub" → OAuth Flow           │
│     ← Returns Auth Token (stored in Keychain)                │
│                                                               │
│  2. Browse Folders (Repos)                                   │
│     App → GET /user/repos → List all user's repos           │
│     ← Display as Folders in UI                              │
│                                                               │
│  3. Create Folder                                            │
│     User → Click "New Folder" → Enter Name                  │
│     App → POST /user/repos → Create on GitHub               │
│     ← New folder appears in list                            │
│                                                               │
│  4. Upload File                                              │
│     User → Drag file to folder                              │
│     App → Convert file to Base64 → PUT /repos/.../contents  │
│     ← File committed to GitHub repo                         │
│                                                               │
│  5. Download File                                            │
│     User → Click Download on file                           │
│     App → GET /repos/.../contents/:path                     │
│     ← Decode Base64 → Save to user's device                │
│                                                               │
│  6. View History                                             │
│     User → Right-click file → View History                  │
│     App → GET /repos/.../commits?path=:file                 │
│     ← Display commit timeline                               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. SYSTEM ARCHITECTURE

### 2.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      DESKTOP APPLICATION                     │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           PRESENTATION LAYER (React)                    │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │ Components:                                              │ │
│  │  - LoginScreen                                           │ │
│  │  - FolderListView                                        │ │
│  │  - FileListView                                          │ │
│  │  - FileUploadDropZone                                    │ │
│  │  - FilePreview                                           │ │
│  │  - ShareDialog                                           │ │
│  │  - VersionHistory                                        │ │
│  └─────────────────────────────────────────────────────────┘ │
│                            ↓                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │       STATE MANAGEMENT LAYER (Redux/Zustand)           │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │ Stores:                                                  │ │
│  │  - authStore (token, user info, login state)           │ │
│  │  - folderStore (repos list, current folder)            │ │
│  │  - fileStore (files in folder, selected files)         │ │
│  │  - uiStore (modals, notifications, loading states)     │ │
│  │  - uploadStore (upload queue, progress)                │ │
│  └─────────────────────────────────────────────────────────┘ │
│                            ↓                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │          BUSINESS LOGIC LAYER (Services)               │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │ Services:                                                │ │
│  │  - AuthService (login, logout, token management)       │ │
│  │  - FolderService (CRUD operations on repos)            │ │
│  │  - FileService (upload, download, delete files)        │ │
│  │  - VersionService (view history, restore versions)     │ │
│  │  - ShareService (generate links, manage access)        │ │
│  │  - SyncService (sync with GitHub)                      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                            ↓                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │        API INTEGRATION LAYER (GitHub API)              │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │ - Octokit Client Configuration                          │ │
│  │ - API Request/Response Handling                         │ │
│  │ - Error Handling & Retry Logic                          │ │
│  │ - Rate Limit Management                                 │ │
│  │ - Token Refresh Logic                                   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                            ↓                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │         LOCAL STORAGE LAYER (SQLite + Keychain)        │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │ - SQLite: Cache repos, files, preferences              │ │
│  │ - Keychain: Secure token storage                        │ │
│  │ - File System: Local file operations                    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                            ↓                                   │
├──────────────────────────────────────────────────────────────┤
│                    ELECTRON MAIN PROCESS                     │
├──────────────────────────────────────────────────────────────┤
│  - Window Management                                          │
│  - File System Operations                                     │
│  - OS Integration (Keychain, Native Dialogs)                 │
│  - IPC Bridge (Main ↔ Renderer)                             │
└──────────────────────────────────────────────────────────────┘
                            ↓
                    ┌────────────────┐
                    │   GITHUB API   │
                    │   (REST v3)    │
                    └────────────────┘
```

### 2.2 Component Architecture

```
src/
├── main/
│   ├── main.ts                          # Electron main process entry
│   ├── preload.ts                       # IPC bridge
│   └── background.ts                    # Background processes
│
├── renderer/
│   ├── index.tsx                        # React entry point
│   ├── App.tsx                          # Root component
│   │
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── FolderPage.tsx
│   │   └── SettingsPage.tsx
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Button.tsx
│   │   ├── folder/
│   │   │   ├── FolderList.tsx
│   │   │   ├── FolderCard.tsx
│   │   │   └── NewFolderDialog.tsx
│   │   ├── file/
│   │   │   ├── FileList.tsx
│   │   │   ├── FileCard.tsx
│   │   │   ├── FileUploadZone.tsx
│   │   │   └── FilePreview.tsx
│   │   ├── version/
│   │   │   ├── VersionHistory.tsx
│   │   │   └── VersionCompare.tsx
│   │   └── share/
│   │       └── ShareDialog.tsx
│   │
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── folderStore.ts
│   │   ├── fileStore.ts
│   │   ├── uiStore.ts
│   │   └── uploadStore.ts
│   │
│   ├── services/
│   │   ├── AuthService.ts
│   │   ├── FolderService.ts
│   │   ├── FileService.ts
│   │   ├── VersionService.ts
│   │   ├── ShareService.ts
│   │   └── SyncService.ts
│   │
│   ├── api/
│   │   ├── GitHubClient.ts               # Octokit configuration
│   │   ├── endpoints/
│   │   │   ├── repos.ts
│   │   │   ├── files.ts
│   │   │   ├── commits.ts
│   │   │   └── users.ts
│   │   └── handlers/
│   │       ├── errorHandler.ts
│   │       ├── rateLimitHandler.ts
│   │       └── retryHandler.ts
│   │
│   ├── db/
│   │   ├── database.ts                   # SQLite connection
│   │   ├── models/
│   │   │   ├── Repo.ts
│   │   │   ├── File.ts
│   │   │   └── User.ts
│   │   └── migrations/
│   │       └── init.sql
│   │
│   ├── utils/
│   │   ├── file.ts                       # File operations
│   │   ├── crypto.ts                     # Encryption (future)
│   │   ├── validators.ts                 # Input validation
│   │   └── constants.ts
│   │
│   └── styles/
│       ├── theme.ts
│       ├── global.css
│       └── components/
│
├── shared/
│   ├── types.ts                          # Shared TypeScript types
│   └── constants.ts
│
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## 3. DETAILED WORKFLOW

### 3.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  AUTHENTICATION WORKFLOW                    │
└─────────────────────────────────────────────────────────────┘

STEP 1: USER INITIATES LOGIN
───────────────────────────
User clicks "Login with GitHub" button
                    ↓
Action: triggerGitHubOAuth()
                    ↓
Generate OAuth URL with:
  - client_id: from .env
  - redirect_uri: http://localhost:3000/oauth/callback
  - scope: ["repo", "workflow", "user"]
                    ↓
Open GitHub login in browser


STEP 2: USER AUTHORIZES APP
────────────────────────────
User logs into GitHub (or already logged in)
                    ↓
GitHub shows permission confirmation:
  ✓ Read/write access to repositories
  ✓ Workflow management
  ✓ Access to user profile
                    ↓
User clicks "Authorize GitVault"
                    ↓
GitHub redirects to: http://localhost:3000/oauth/callback?code=XXXX


STEP 3: EXCHANGE CODE FOR TOKEN
────────────────────────────────
App receives authorization code
                    ↓
POST to GitHub API:
  Endpoint: /app/installations/installations/auth/access_tokens
  Body: {
    client_id: "...",
    client_secret: "...",
    code: "XXXX"
  }
                    ↓
GitHub returns:
  {
    "access_token": "gho_xxxxxxxxxxxx",
    "token_type": "bearer",
    "scope": "repo, workflow, user",
    "expires_in": 28800
  }


STEP 4: SECURE TOKEN STORAGE
────────────────────────────
Call: AuthService.storeToken(token)
                    ↓
IPC → Main Process:
  window.electron.storeSecureToken(token)
                    ↓
Main Process:
  keytar.setPassword('GitVault', 'github_token', token)
                    ↓
Token stored in OS Keychain
  (Windows: Credential Manager)
  (macOS: Keychain)
  (Linux: Secret Service)


STEP 5: FETCH USER INFO & INITIALIZE APP
──────────────────────────────────────────
GET /user
                    ↓
Response:
  {
    "login": "john_doe",
    "id": 12345,
    "avatar_url": "...",
    "name": "John Doe",
    "bio": "Developer"
  }
                    ↓
Store in Redux:
  authStore.setUser({...})
  authStore.setIsAuthenticated(true)
                    ↓
Fetch repositories:
  GET /user/repos?per_page=100
                    ↓
Store in Redux:
  folderStore.setFolders([...repos])
                    ↓
Navigate to Dashboard


STEP 6: MAINTAIN SESSION
────────────────────────
Token stored in Keychain persists across:
  ✓ App restarts
  ✓ System restarts
  ✓ Multiple sessions

On app launch:
  1. Check if token exists in Keychain
  2. If yes, validate token: GET /user
  3. If valid, auto-login user
  4. If invalid/expired, ask to re-login


LOGOUT FLOW
───────────
User clicks "Logout"
  ↓
Action: AuthService.logout()
  ↓
1. DELETE /app/installations/:id (revoke token if needed)
2. keytar.deletePassword('GitVault', 'github_token')
3. Clear Redux stores
4. Close all windows
5. Show login screen
```

### 3.2 Create Folder Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                   CREATE FOLDER WORKFLOW                    │
└─────────────────────────────────────────────────────────────┘

STEP 1: USER INITIATES FOLDER CREATION
──────────────────────────────────────
User clicks "New Folder" button
                    ↓
Modal Dialog opens:
  Input: Folder Name (text field)
  Options: 
    ☐ Private Repository
    ☑ Public Repository
  Buttons: [Cancel] [Create]


STEP 2: VALIDATE INPUT
──────────────────────
User enters "My Projects"
                    ↓
Validators.validateFolderName(name):
  ✓ Length > 1 and < 100 characters
  ✓ No leading/trailing spaces
  ✓ Allowed chars: alphanumeric, -, _, .
  ✓ Check if repo name already exists
                    ↓
If valid → Continue
If invalid → Show error message


STEP 3: CREATE REPOSITORY VIA GITHUB API
─────────────────────────────────────────
Call: FolderService.createFolder(name, isPrivate)
                    ↓
Construct GitHub API request:
  POST /user/repos
  Body: {
    "name": "my-projects",
    "description": "Created by GitVault",
    "private": true,
    "auto_init": true,
    "gitignore_template": "None"
  }
                    ↓
GitHub creates repository:
  - Main branch created
  - Initial commit with README
  - Webhook configured (optional)
                    ↓
Response:
  {
    "id": 123456,
    "name": "my-projects",
    "full_name": "john_doe/my-projects",
    "private": true,
    "description": "Created by GitVault",
    "url": "https://github.com/john_doe/my-projects",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }


STEP 4: UPDATE LOCAL CACHE
───────────────────────────
Store in SQLite:
  INSERT INTO repos (
    repo_id, name, full_name, private, url, created_at, updated_at
  ) VALUES (
    123456, "my-projects", "john_doe/my-projects", true, ..., ..., ...
  )


STEP 5: UPDATE UI
─────────────────
Call: folderStore.addFolder(repo)
                    ↓
Redux action:
  {
    type: 'FOLDER_ADDED',
    payload: {
      id: 123456,
      name: "my-projects",
      ...
    }
  }
                    ↓
React component re-renders
                    ↓
New folder appears at top of folder list
                    ↓
Folder card shows:
  [📁] My Projects
  Created: Jan 15, 2024
  Size: 1 file (README.md)
  Private repository


STEP 6: SHOW CONFIRMATION
──────────────────────────
Toast notification:
  ✓ "Folder 'My Projects' created successfully"
  
Modal closes
UI returns to folder list
```

### 3.3 Upload File Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    UPLOAD FILE WORKFLOW                     │
└─────────────────────────────────────────────────────────────┘

STEP 1: USER SELECTS FILE TO UPLOAD
────────────────────────────────────
Option A: Drag file from explorer to upload zone
Option B: Click "Choose Files" button

User drags "document.pdf" (5MB) onto folder
                    ↓
FileUploadZone component detects drop event
  ↓
Extract file from event:
  - name: "document.pdf"
  - size: 5242880 bytes
  - type: "application/pdf"
  - lastModified: 1705323456000


STEP 2: VALIDATE FILE
──────────────────────
Validators.validateFile(file):
  ✓ File size ≤ 100MB? YES
  ✓ File type allowed? YES (all types OK)
  ✓ Name valid? YES
  ✓ Already exists? NO
                    ↓
If invalid:
  - Show error: "File too large" or similar
  - Don't proceed
  
If valid: Continue


STEP 3: READ FILE CONTENT
──────────────────────────
FileReader API:
  readAsArrayBuffer(file)
                    ↓
ArrayBuffer: binary file content
  Size: 5MB of binary data


STEP 4: ENCODE FILE CONTENT
────────────────────────────
Convert ArrayBuffer to Base64:
  ArrayBuffer → Base64 string
  (Required for GitHub API)
                    ↓
Base64 string: approximately 6.67MB
  (33% larger than original)


STEP 5: PREPARE GITHUB API REQUEST
───────────────────────────────────
Construct request:
  PUT /repos/{owner}/{repo}/contents/{path}
  
Request body:
  {
    "message": "Upload document.pdf [GitVault] 2024-01-15 10:30",
    "content": "JVBERi0xLjQKJeLj...", // Base64 encoded file
    "branch": "main",
    "committer": {
      "name": "GitVault",
      "email": "app@gitvault.local"
    }
  }


STEP 6: UPLOAD WITH PROGRESS TRACKING
──────────────────────────────────────
Show upload progress:
  ┌────────────────────────────────────┐
  │ Uploading: document.pdf            │
  │ [████████░░░░░░░░░░░] 45% (2.3 MB)│
  │          [Cancel]                  │
  └────────────────────────────────────┘
                    ↓
Send HTTP request:
  - Monitor upload progress events
  - Update progress bar every 50ms
  - Store in uploadStore.fileUploads[fileId]


STEP 7: GITHUB API PROCESSES REQUEST
─────────────────────────────────────
GitHub API:
  1. Validates request
  2. Decodes Base64 content
  3. Creates blob object
  4. Commits file to repository
  5. Updates branch reference
                    ↓
Response (success):
  {
    "content": {
      "name": "document.pdf",
      "path": "document.pdf",
      "sha": "d5c1c8c2c5d3...",
      "size": 5242880,
      "url": "https://api.github.com/repos/.../contents/document.pdf",
      "html_url": "https://github.com/.../blob/main/document.pdf",
      "download_url": "https://raw.githubusercontent.com/..."
    },
    "commit": {
      "sha": "abc123def456...",
      "url": "https://api.github.com/repos/.../commits/abc123def456",
      "html_url": "https://github.com/.../commit/abc123def456",
      "message": "Upload document.pdf [GitVault] 2024-01-15 10:30",
      "author": {
        "name": "GitVault",
        "date": "2024-01-15T10:30:00Z"
      }
    }
  }


STEP 8: STORE FILE METADATA LOCALLY
────────────────────────────────────
Insert into SQLite:
  INSERT INTO files (
    repo_id, name, path, sha, size, url, 
    mime_type, uploaded_at, modified_at
  ) VALUES (
    123456, "document.pdf", "document.pdf", 
    "d5c1c8c2c5d3...", 5242880, "https://...",
    "application/pdf", "2024-01-15 10:30:00", 
    "2024-01-15 10:30:00"
  )


STEP 9: UPDATE REDUX STATE
───────────────────────────
Dispatch action:
  {
    type: 'FILE_UPLOADED',
    payload: {
      repoId: 123456,
      file: {
        id: "auto_generated_uuid",
        name: "document.pdf",
        size: 5242880,
        sha: "d5c1c8c2c5d3...",
        uploadedAt: "2024-01-15T10:30:00Z",
        downloadUrl: "https://raw.githubusercontent.com/..."
      }
    }
  }
                    ↓
fileStore.files = [...fileStore.files, newFile]


STEP 10: UPDATE UI
──────────────────
React re-renders file list:
  [📄] document.pdf (5.0 MB)
       Uploaded: Jan 15, 2024
       [Download] [Delete] [History]
                    ↓
Clear upload progress
                    ↓
Show success toast:
  ✓ "document.pdf uploaded successfully"


STEP 11: FILE ACCESSIBLE
────────────────────────
File now:
  ✓ Stored on GitHub
  ✓ Version-controlled
  ✓ Accessible via download URL
  ✓ Has full commit history
  ✓ Can be shared via GitHub URL
```

### 3.4 Download File Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                   DOWNLOAD FILE WORKFLOW                    │
└─────────────────────────────────────────────────────────────┘

STEP 1: USER INITIATES DOWNLOAD
────────────────────────────────
User right-clicks file in list:
  [📄] document.pdf
       [Download] ← Click here
       [Delete]
       [History]
                    ↓
Action: FileService.downloadFile(fileId, repoId)


STEP 2: RETRIEVE FILE INFO FROM LOCAL CACHE
─────────────────────────────────────────────
Query SQLite:
  SELECT * FROM files WHERE id = ?
                    ↓
File record:
  {
    id: "uuid",
    name: "document.pdf",
    path: "document.pdf",
    sha: "d5c1c8c2c5d3...",
    size: 5242880,
    downloadUrl: "https://raw.githubusercontent.com/..."
  }


STEP 3: FETCH FILE FROM GITHUB
───────────────────────────────
Option A: Using download_url (fastest)
  GET https://raw.githubusercontent.com/owner/repo/main/document.pdf
                    ↓
Option B: Using GitHub API (for larger files)
  GET /repos/{owner}/{repo}/contents/{path}
  Accept: application/vnd.github.v3.raw
                    ↓
Monitor download progress:
  ┌────────────────────────────────────┐
  │ Downloading: document.pdf          │
  │ [██████████████░░░░░░░░░] 65%      │
  └────────────────────────────────────┘


STEP 4: SHOW FILE SAVE DIALOG
──────────────────────────────
Electron IPC → Main Process:
  dialog.showSaveDialog({
    defaultPath: `/Downloads/document.pdf`,
    filters: [
      { name: 'PDF', extensions: ['pdf'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
                    ↓
User selects location:
  /Users/john/Downloads/document.pdf
                    ↓
If user cancels → Stop download


STEP 5: SAVE FILE TO DISK
──────────────────────────
Write file stream to selected path:
  fs.writeFile(
    '/Users/john/Downloads/document.pdf',
    fileBuffer,
    (err) => {
      if (err) throw err;
    }
  )


STEP 6: VERIFY FILE INTEGRITY
──────────────────────────────
Calculate SHA256 hash of downloaded file:
  hash(downloaded_file) === stored_sha?
                    ↓
If match: File integrity verified ✓
If mismatch: Show error, offer retry


STEP 7: UPDATE DOWNLOAD HISTORY
────────────────────────────────
Insert into SQLite:
  INSERT INTO download_history (
    file_id, downloaded_at, download_path
  ) VALUES (
    "uuid", "2024-01-15 10:35:00", 
    "/Users/john/Downloads/document.pdf"
  )


STEP 8: SHOW SUCCESS
────────────────────
Toast notification:
  ✓ "Downloaded: document.pdf"
  
Options:
  [Open File] [Open Folder] [OK]
```

### 3.5 View File History Workflow

```
┌─────────────────────────────────────────────────────────────┐
│               VIEW FILE HISTORY WORKFLOW                    │
└─────────────────────────────────────────────────────────────┘

STEP 1: USER INITIATES HISTORY VIEW
────────────────────────────────────
User right-clicks file:
  [📄] document.pdf
       [Download]
       [Delete]
       [History] ← Click here
                    ↓
Action: VersionService.getFileHistory(fileId, repoId)


STEP 2: FETCH COMMIT HISTORY FROM GITHUB
─────────────────────────────────────────
GET /repos/{owner}/{repo}/commits?path={filePath}
                    ↓
GitHub returns last 30 commits affecting this file:
  [
    {
      "sha": "abc123def456...",
      "message": "Upload document.pdf [GitVault] 2024-01-15 10:35",
      "author": {
        "name": "GitVault",
        "email": "app@gitvault.local",
        "date": "2024-01-15T10:35:00Z"
      },
      "committer": { ... },
      "tree": { "sha": "...", "url": "..." },
      "url": "https://api.github.com/repos/.../commits/abc123def456",
      "html_url": "https://github.com/.../commit/abc123def456"
    },
    {
      "sha": "def456ghi789...",
      "message": "Update document.pdf [GitVault] 2024-01-14 15:20",
      "author": { ... },
      ...
    },
    ...
  ]


STEP 3: DISPLAY VERSION HISTORY UI
───────────────────────────────────
VersionHistory component shows:

  Document History: document.pdf
  ════════════════════════════════════════
  
  Version 1 (CURRENT)
  ──────────────────
  Date: Jan 15, 2024 - 10:35 AM
  Size: 5.0 MB
  SHA: abc123def456...
  Message: Upload document.pdf
  [Restore] [Download] [View Details]
  
  Version 2
  ─────────
  Date: Jan 14, 2024 - 3:20 PM
  Size: 4.8 MB
  SHA: def456ghi789...
  Message: Update document.pdf
  [Restore] [Download] [Compare]
  
  Version 3
  ─────────
  Date: Jan 12, 2024 - 9:10 AM
  Size: 4.5 MB
  SHA: ghi789jkl012...
  Message: Initial document.pdf
  [Restore] [Download]


STEP 4: RESTORE SPECIFIC VERSION (User clicks "Restore")
─────────────────────────────────────────────────────────
Show confirmation dialog:
  "Restore 'document.pdf' to version from Jan 14, 3:20 PM?"
  [Cancel] [Restore]
                    ↓
If user confirms:
  Call: VersionService.restoreFileVersion(fileId, commitSha)


STEP 5: RESTORE FILE TO PREVIOUS VERSION
──────────────────────────────────────────
Get file content from specific commit:
  GET /repos/{owner}/{repo}/contents/{path}?ref={commitSha}
                    ↓
Response includes file content at that commit:
  {
    "name": "document.pdf",
    "path": "document.pdf",
    "sha": "def456ghi789...",
    "size": 5033472,
    "type": "file",
    "content": "JVBERi0xLjQKJeLj..." // Base64 at old version
  }


STEP 6: COMMIT RESTORED VERSION
────────────────────────────────
Push restored content back:
  PUT /repos/{owner}/{repo}/contents/{path}
  Body: {
    "message": "Restore document.pdf to version from Jan 14, 3:20 PM [GitVault]",
    "content": "JVBERi0xLjQKJeLj...", // Old content
    "branch": "main"
  }
                    ↓
GitHub creates new commit:
  sha: "xyz789abc123..."
  message: "Restore document.pdf to version from Jan 14, 3:20 PM [GitVault]"
  parent: "abc123def456..." (current version)


STEP 7: UPDATE LOCAL STATE
───────────────────────────
Update SQLite:
  UPDATE files SET 
    sha = "xyz789abc123...",
    modified_at = NOW(),
    size = 5033472
  WHERE id = ?
                    ↓
Update Redux:
  {
    type: 'FILE_RESTORED',
    payload: {
      fileId: "uuid",
      newSha: "xyz789abc123...",
      restoredAt: "2024-01-15T10:40:00Z"
    }
  }


STEP 8: SHOW SUCCESS & REFRESH
───────────────────────────────
Toast notification:
  ✓ "Restored document.pdf to Jan 14 version"
                    ↓
Refresh file list:
  - Version 1 now shows restored content
  - New commit appears at top of history
  - Old versions still accessible
```

---

## 4. API INTEGRATION DETAILS

### 4.1 GitHub API Endpoints Map

```
ENDPOINT MAPPING TO GITVAULT FEATURES
═════════════════════════════════════════════════════════════

USER OPERATIONS
───────────────
GET /user
  → Get current authenticated user info
  → Used in: AuthService.getUserInfo()

GET /user/repos
  → List all repositories for authenticated user
  → Used in: FolderService.getFolders()
  → Params: ?per_page=100&sort=updated&direction=desc

POST /user/repos
  → Create new repository
  → Used in: FolderService.createFolder()
  → Body: {name, description, private, auto_init}


REPOSITORY OPERATIONS
─────────────────────
GET /repos/{owner}/{repo}
  → Get repository details
  → Used in: FolderService.getFolderDetails()

PATCH /repos/{owner}/{repo}
  → Update repository
  → Used in: FolderService.renameFolder()
  → Body: {name, description}

DELETE /repos/{owner}/{repo}
  → Delete repository
  → Used in: FolderService.deleteFolder()


FILE OPERATIONS (Contents API)
──────────────────────────────
GET /repos/{owner}/{repo}/contents/{path}
  → Get file/directory contents
  → Used in: FileService.listFiles()
  → Used in: FileService.getFileContent()
  → Params: ?ref=main (specify branch)

PUT /repos/{owner}/{repo}/contents/{path}
  → Create or update file
  → Used in: FileService.uploadFile()
  → Used in: VersionService.restoreFileVersion()
  → Body: {message, content (base64), branch, committer}

DELETE /repos/{owner}/{repo}/contents/{path}
  → Delete file
  → Used in: FileService.deleteFile()
  → Body: {message, sha, branch}

GET /repos/{owner}/{repo}/readme
  → Get README file
  → Used in: FolderService.getFolderDescription()


COMMIT HISTORY
──────────────
GET /repos/{owner}/{repo}/commits
  → List commits for repository
  → Used in: VersionService.getFolderHistory()
  → Params: ?path={filePath}&per_page=30

GET /repos/{owner}/{repo}/commits/{sha}
  → Get specific commit details
  → Used in: VersionService.getCommitDetails()

GET /repos/{owner}/{repo}/commits/{sha}/files
  → Get files changed in commit
  → Used in: VersionService.getCommitFileChanges()


BRANCH OPERATIONS
─────────────────
GET /repos/{owner}/{repo}/branches
  → List all branches
  → Used in: FolderService.getBranches()

GET /repos/{owner}/{repo}/branches/{branch}
  → Get specific branch info
  → Used in: FolderService.getBranchDetails()
```

### 4.2 API Request/Response Examples

#### Example 1: Create Folder

**Request:**
```http
POST /user/repos HTTP/1.1
Host: api.github.com
Authorization: token gho_xxxxxxxxxxxx
Content-Type: application/json

{
  "name": "my-documents",
  "description": "Personal documents storage",
  "private": true,
  "auto_init": true,
  "gitignore_template": "None"
}
```

**Response (201 Created):**
```json
{
  "id": 123456789,
  "node_id": "R_kgDOAA1234Q",
  "name": "my-documents",
  "full_name": "john_doe/my-documents",
  "owner": {
    "login": "john_doe",
    "id": 9876543,
    "avatar_url": "https://avatars.githubusercontent.com/u/9876543",
    "type": "User"
  },
  "private": true,
  "html_url": "https://github.com/john_doe/my-documents",
  "description": "Personal documents storage",
  "url": "https://api.github.com/repos/john_doe/my-documents",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "pushed_at": "2024-01-15T10:30:00Z",
  "size": 1,
  "default_branch": "main",
  "topics": []
}
```

#### Example 2: Upload File

**Request:**
```http
PUT /repos/john_doe/my-documents/contents/report.pdf HTTP/1.1
Host: api.github.com
Authorization: token gho_xxxxxxxxxxxx
Content-Type: application/json

{
  "message": "Upload report.pdf [GitVault] 2024-01-15 10:35:00",
  "content": "JVBERi0xLjQKJeLj... (base64 encoded PDF content, 5MB)",
  "branch": "main",
  "committer": {
    "name": "GitVault",
    "email": "app@gitvault.local"
  }
}
```

**Response (201 Created):**
```json
{
  "content": {
    "name": "report.pdf",
    "path": "report.pdf",
    "sha": "d5c1c8c2c5d3f4a5b6c7d8e9f0a1b2c3d4e5f6a7",
    "size": 5242880,
    "type": "file",
    "url": "https://api.github.com/repos/john_doe/my-documents/contents/report.pdf",
    "html_url": "https://github.com/john_doe/my-documents/blob/main/report.pdf",
    "download_url": "https://raw.githubusercontent.com/john_doe/my-documents/main/report.pdf"
  },
  "commit": {
    "sha": "abc123def456abc123def456abc123def456abc123",
    "node_id": "C_kwDOAA1234Q456",
    "url": "https://api.github.com/repos/john_doe/my-documents/commits/abc123def456...",
    "html_url": "https://github.com/john_doe/my-documents/commit/abc123def456...",
    "author": {
      "date": "2024-01-15T10:35:00Z",
      "name": "GitVault",
      "email": "app@gitvault.local"
    },
    "message": "Upload report.pdf [GitVault] 2024-01-15 10:35:00",
    "tree": {
      "sha": "tree123sha456",
      "url": "https://api.github.com/repos/john_doe/my-documents/git/trees/tree123sha456"
    },
    "committer": {
      "date": "2024-01-15T10:35:00Z",
      "name": "GitVault",
      "email": "app@gitvault.local"
    }
  }
}
```

---

## 5. DATABASE SCHEMA

### 5.1 SQLite Database Design

```sql
-- Users Table (Caching GitHub user info)
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  github_id INTEGER UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  token_stored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Repositories Table (Folders)
CREATE TABLE repos (
  id INTEGER PRIMARY KEY,
  github_repo_id INTEGER UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL, -- owner/repo
  description TEXT,
  private INTEGER DEFAULT 1,
  is_archived INTEGER DEFAULT 0,
  url TEXT,
  clone_url TEXT,
  default_branch TEXT DEFAULT 'main',
  size INTEGER, -- in bytes
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  pushed_at TIMESTAMP,
  synced_at TIMESTAMP,
  local_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Files Table (File metadata cache)
CREATE TABLE files (
  id TEXT PRIMARY KEY, -- UUID generated locally
  repo_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  path TEXT NOT NULL, -- relative path in repo
  sha TEXT, -- GitHub blob SHA
  size INTEGER, -- in bytes
  mime_type TEXT,
  download_url TEXT,
  url TEXT,
  created_at TIMESTAMP,
  modified_at TIMESTAMP,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (repo_id) REFERENCES repos(id)
);

-- File Versions Table (Commit history for files)
CREATE TABLE file_versions (
  id TEXT PRIMARY KEY, -- UUID
  file_id TEXT NOT NULL,
  commit_sha TEXT UNIQUE NOT NULL,
  commit_message TEXT,
  commit_date TIMESTAMP,
  file_size INTEGER,
  author_name TEXT,
  author_email TEXT,
  parent_sha TEXT, -- parent commit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (file_id) REFERENCES files(id)
);

-- Upload Queue Table (For offline uploads)
CREATE TABLE upload_queue (
  id TEXT PRIMARY KEY,
  repo_id INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT,
  local_file_path TEXT,
  status TEXT DEFAULT 'pending', -- pending, uploading, completed, failed
  file_size INTEGER,
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (repo_id) REFERENCES repos(id)
);

-- Download History Table
CREATE TABLE download_history (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL,
  downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  download_path TEXT,
  file_size INTEGER,
  FOREIGN KEY (file_id) REFERENCES files(id)
);

-- Sync Log Table (Track sync operations)
CREATE TABLE sync_log (
  id TEXT PRIMARY KEY,
  repo_id INTEGER,
  action TEXT, -- 'fetch', 'upload', 'delete'
  status TEXT, -- 'success', 'failed'
  error_message TEXT,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (repo_id) REFERENCES repos(id)
);

-- Settings Table
CREATE TABLE settings (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX idx_repos_user_id ON repos(user_id);
CREATE INDEX idx_repos_name ON repos(name);
CREATE INDEX idx_files_repo_id ON files(repo_id);
CREATE INDEX idx_files_path ON files(path);
CREATE INDEX idx_versions_file_id ON file_versions(file_id);
CREATE INDEX idx_upload_queue_status ON upload_queue(status);
CREATE INDEX idx_sync_log_repo_id ON sync_log(repo_id);
```

---

## 6. STATE MANAGEMENT (Redux/Zustand)

### 6.1 Redux Store Structure

```typescript
// store/authStore.ts
interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    id: number;
    username: string;
    name: string;
    email: string;
    avatarUrl: string;
  } | null;
  error: string | null;
  tokenExpiresAt: Date | null;
}

// store/folderStore.ts
interface FolderState {
  folders: Folder[];
  currentFolder: Folder | null;
  isLoading: boolean;
  sortBy: 'name' | 'date' | 'size'; // default: 'date'
  searchQuery: string;
  error: string | null;
}

interface Folder {
  id: number;
  name: string;
  fullName: string;
  description: string;
  private: boolean;
  url: string;
  fileCount: number;
  size: number;
  createdAt: Date;
  updatedAt: Date;
  lastModified: Date;
}

// store/fileStore.ts
interface FileState {
  files: FileData[];
  selectedFiles: string[]; // file IDs
  isLoading: boolean;
  sortBy: 'name' | 'date' | 'size';
  filterBy: 'all' | 'images' | 'documents' | 'videos' | 'audio';
  searchQuery: string;
  currentFolderId: number | null;
  error: string | null;
}

interface FileData {
  id: string;
  repoId: number;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  sha: string;
  downloadUrl: string;
  uploadedAt: Date;
  modifiedAt: Date;
}

// store/uploadStore.ts
interface UploadState {
  uploads: Upload[];
  totalProgress: number; // 0-100
  isUploading: boolean;
}

interface Upload {
  id: string;
  fileName: string;
  fileSize: number;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error: string | null;
  createdAt: Date;
}

// store/uiStore.ts
interface UIState {
  isDrawerOpen: boolean;
  activeModal: string | null; // 'newFolder', 'share', 'settings', null
  notifications: Notification[];
  isOnline: boolean;
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration: number; // milliseconds
  createdAt: Date;
}
```

### 6.2 Redux Actions Example

```typescript
// authStore actions
export const authActions = {
  // Login flow
  loginWithGitHub: async (dispatch: Dispatch) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const token = await AuthService.getGitHubToken();
      const user = await AuthService.getUserInfo();
      await AuthService.storeTokenSecurely(token);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user }
      });
    } catch (error) {
      dispatch({
        type: 'LOGIN_ERROR',
        payload: error.message
      });
    }
  },

  // Logout flow
  logout: async (dispatch: Dispatch) => {
    try {
      await AuthService.revokeToken();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      dispatch({ type: 'LOGOUT_ERROR', payload: error.message });
    }
  }
};

// folderStore actions
export const folderActions = {
  // Fetch folders
  getFolders: async (dispatch: Dispatch) => {
    dispatch({ type: 'GET_FOLDERS_START' });
    try {
      const folders = await FolderService.getFolders();
      dispatch({
        type: 'GET_FOLDERS_SUCCESS',
        payload: folders
      });
    } catch (error) {
      dispatch({ type: 'GET_FOLDERS_ERROR', payload: error.message });
    }
  },

  // Create folder
  createFolder: async (dispatch: Dispatch, name: string, isPrivate: boolean) => {
    dispatch({ type: 'CREATE_FOLDER_START' });
    try {
      const newFolder = await FolderService.createFolder(name, isPrivate);
      dispatch({
        type: 'CREATE_FOLDER_SUCCESS',
        payload: newFolder
      });
      dispatch(uiActions.notify({
        type: 'success',
        message: `Folder '${name}' created successfully`
      }));
    } catch (error) {
      dispatch({ type: 'CREATE_FOLDER_ERROR', payload: error.message });
    }
  },

  // Set current folder
  setCurrentFolder: (dispatch: Dispatch, folder: Folder) => {
    dispatch({
      type: 'SET_CURRENT_FOLDER',
      payload: folder
    });
  }
};
```

---

## 7. ERROR HANDLING & RATE LIMITING

### 7.1 API Error Handling

```typescript
// api/handlers/errorHandler.ts

enum GitHubAPIError {
  RATE_LIMIT_EXCEEDED = 403,
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
  VALIDATION_FAILED = 422,
  SERVER_ERROR = 500,
  NOT_MODIFIED = 304,
}

interface APIErrorResponse {
  message: string;
  documentation_url: string;
  errors?: Array<{
    message: string;
    resource: string;
    field: string;
    code: string;
  }>;
}

export class APIErrorHandler {
  static handle(error: any): { userMessage: string; retryable: boolean } {
    if (error.status === 401) {
      return {
        userMessage: 'Unauthorized. Please log in again.',
        retryable: false
      };
    }
    
    if (error.status === 403) {
      if (error.message.includes('rate limit')) {
        return {
          userMessage: 'GitHub API rate limit exceeded. Please try again later.',
          retryable: true
        };
      }
      return {
        userMessage: 'Access forbidden.',
        retryable: false
      };
    }
    
    if (error.status === 404) {
      return {
        userMessage: 'Resource not found.',
        retryable: false
      };
    }
    
    if (error.status === 422) {
      return {
        userMessage: 'Invalid input. Please check your data.',
        retryable: false
      };
    }
    
    if (error.status >= 500) {
      return {
        userMessage: 'Server error. Please try again later.',
        retryable: true
      };
    }
    
    return {
      userMessage: 'An unknown error occurred.',
      retryable: true
    };
  }
}
```

### 7.2 Rate Limit Management

```typescript
// api/handlers/rateLimitHandler.ts

interface RateLimit {
  remaining: number;
  limit: number;
  reset: Date;
  resetIn: number; // seconds
}

export class RateLimitHandler {
  static readonly MINIMUM_REQUESTS_BUFFER = 100;
  
  static parseRateLimitFromResponse(headers: any): RateLimit {
    return {
      remaining: parseInt(headers['x-ratelimit-remaining']),
      limit: parseInt(headers['x-ratelimit-limit']),
      reset: new Date(parseInt(headers['x-ratelimit-reset']) * 1000),
      resetIn: parseInt(headers['x-ratelimit-reset']) - Math.floor(Date.now() / 1000)
    };
  }
  
  static shouldWaitForRateLimit(rateLimit: RateLimit): boolean {
    return rateLimit.remaining < this.MINIMUM_REQUESTS_BUFFER;
  }
  
  static async waitForRateLimit(rateLimit: RateLimit): Promise<void> {
    const waitTime = rateLimit.resetIn * 1000 + 1000; // +1s buffer
    console.log(`Rate limited. Waiting ${waitTime}ms until reset.`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  static async executeWithRateLimitHandling<T>(
    apiCall: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        if (error.status === 403 && error.message.includes('rate limit')) {
          const rateLimit = RateLimitHandler.parseRateLimitFromResponse(error.headers);
          await RateLimitHandler.waitForRateLimit(rateLimit);
          // Retry
          continue;
        }
        throw error;
      }
    }
  }
}
```

---

## 8. DEVELOPMENT GUIDELINES

### 8.1 File Upload/Download Size Limits

```typescript
// utils/constants.ts

export const FILE_LIMITS = {
  // GitHub API limits
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100 MB
  MAX_REPO_SIZE: 1024 * 1024 * 1024, // 1 GB
  
  // Warning thresholds
  FILE_SIZE_WARNING: 50 * 1024 * 1024, // 50 MB
  REPO_SIZE_WARNING: 800 * 1024 * 1024, // 800 MB
  
  // Upload optimization
  CHUNK_SIZE: 5 * 1024 * 1024, // 5 MB chunks
  MAX_CONCURRENT_UPLOADS: 3,
  
  // UI
  DISPLAY_SIZE_THRESHOLD: 1024 * 1024, // Show "MB" for >1MB
};

// Validation before upload
export function validateFileForUpload(file: File): { valid: boolean; error?: string } {
  if (file.size > FILE_LIMITS.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds GitHub limit of ${FILE_LIMITS.MAX_FILE_SIZE / 1024 / 1024}MB`
    };
  }
  
  if (file.size > FILE_LIMITS.FILE_SIZE_WARNING) {
    console.warn(`Large file: ${file.name} (${file.size / 1024 / 1024}MB)`);
  }
  
  return { valid: true };
}
```

### 8.2 Project Structure & File Organization

```
gitvault/
├── .github/
│   ├── workflows/
│   │   ├── build.yml
│   │   ├── test.yml
│   │   └── release.yml
│   └── ISSUE_TEMPLATE/
│
├── src/
│   ├── main/
│   │   ├── main.ts                    # Electron main process
│   │   ├── preload.ts                 # IPC communication
│   │   └── utils/
│   │
│   ├── renderer/
│   │   ├── index.tsx                  # React entry
│   │   ├── App.tsx                    # Root component
│   │   ├── pages/                     # Page components
│   │   ├── components/                # Reusable components
│   │   ├── store/                     # Redux store
│   │   ├── services/                  # Business logic
│   │   ├── api/                       # GitHub API client
│   │   ├── db/                        # Database layer
│   │   ├── utils/                     # Utilities
│   │   └── styles/                    # CSS/theme
│   │
│   └── shared/
│       ├── types.ts                   # TypeScript types
│       └── constants.ts               # Shared constants
│
├── tests/
│   ├── unit/                          # Unit tests
│   ├── integration/                   # Integration tests
│   └── e2e/                           # End-to-end tests
│
├── docs/
│   ├── ARCHITECTURE.md                # This document
│   ├── API.md
│   ├── SETUP.md
│   └── CONTRIBUTING.md
│
├── public/
│   ├── icon.png
│   └── assets/
│
├── .env.example
├── package.json
├── tsconfig.json
├── webpack.config.js
├── electron-builder.json
└── README.md
```

---

## 9. KEY IMPLEMENTATION DETAILS

### 9.1 GitHub OAuth Implementation

```typescript
// services/AuthService.ts

export class AuthService {
  private static readonly CLIENT_ID = process.env.REACT_APP_GITHUB_CLIENT_ID;
  private static readonly CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
  private static readonly REDIRECT_URI = 'http://localhost:3000/oauth/callback';
  
  static generateOAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.CLIENT_ID,
      redirect_uri: this.REDIRECT_URI,
      scope: 'repo workflow user',
      state: this.generateState(),
    });
    
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }
  
  static async exchangeCodeForToken(code: string): Promise<string> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.CLIENT_ID,
        client_secret: this.CLIENT_SECRET,
        code: code,
        redirect_uri: this.REDIRECT_URI,
      }),
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`OAuth error: ${data.error_description}`);
    }
    
    return data.access_token;
  }
  
  static async storeTokenSecurely(token: string): Promise<void> {
    // IPC to main process to store in Keychain
    await window.electron.storeSecureToken(token);
  }
  
  static async getStoredToken(): Promise<string | null> {
    return await window.electron.getSecureToken();
  }
}
```

### 9.2 Octokit GitHub Client Setup

```typescript
// api/GitHubClient.ts

import { Octokit } from '@octokit/rest';

export class GitHubClient {
  private static instance: Octokit;
  
  static initialize(token: string): void {
    this.instance = new Octokit({
      auth: `token ${token}`,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
        'X-GitHub-Media-Type': 'github.v3+json',
      },
      request: {
        timeout: 30000,
      },
    });
  }
  
  static getInstance(): Octokit {
    if (!this.instance) {
      throw new Error('GitHubClient not initialized. Call initialize() first.');
    }
    return this.instance;
  }
  
  // Common API calls
  static async getCurrentUser() {
    return await this.getInstance().rest.users.getAuthenticated();
  }
  
  static async listUserRepos() {
    return await this.getInstance().rest.repos.listForAuthenticatedUser({
      per_page: 100,
      sort: 'updated',
      direction: 'desc',
    });
  }
  
  static async createRepo(name: string, isPrivate: boolean) {
    return await this.getInstance().rest.repos.createForAuthenticatedUser({
      name,
      private: isPrivate,
      auto_init: true,
      description: 'Created by GitVault',
    });
  }
}
```

### 9.3 File Encoding/Decoding

```typescript
// utils/fileEncoding.ts

export class FileEncoding {
  // Encode file to Base64 for GitHub API
  static async encodeFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        resolve(base64);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }
  
  // Decode Base64 from GitHub API to File
  static decodeBase64ToBlob(base64: string, mimeType: string): Blob {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  }
  
  // Save Blob to file system
  static async saveBlobToFile(blob: Blob, filePath: string): Promise<void> {
    const buffer = await blob.arrayBuffer();
    await window.electron.writeFile(filePath, buffer);
  }
}
```

---

## 10. TESTING STRATEGY

### 10.1 Test Structure

```typescript
// tests/unit/services/FolderService.test.ts

describe('FolderService', () => {
  let service: FolderService;
  let mockGitHubClient: jest.Mocked<Octokit>;
  
  beforeEach(() => {
    mockGitHubClient = createMockOctokit();
    service = new FolderService(mockGitHubClient);
  });
  
  describe('createFolder', () => {
    it('should create a GitHub repository', async () => {
      const folderName = 'test-folder';
      
      mockGitHubClient.rest.repos.createForAuthenticatedUser.mockResolvedValue({
        data: { id: 123, name: folderName, private: true }
      });
      
      const result = await service.createFolder(folderName, true);
      
      expect(result.id).toBe(123);
      expect(result.name).toBe(folderName);
      expect(mockGitHubClient.rest.repos.createForAuthenticatedUser).toHaveBeenCalledWith({
        name: folderName,
        private: true,
        auto_init: true,
        description: 'Created by GitVault'
      });
    });
    
    it('should handle API errors gracefully', async () => {
      mockGitHubClient.rest.repos.createForAuthenticatedUser.mockRejectedValue(
        new Error('API Error: Repository name already exists')
      );
      
      await expect(service.createFolder('existing-folder', true))
        .rejects.toThrow('Repository name already exists');
    });
  });
  
  describe('getFolders', () => {
    it('should fetch all user repositories', async () => {
      const mockRepos = [
        { id: 1, name: 'repo1' },
        { id: 2, name: 'repo2' }
      ];
      
      mockGitHubClient.rest.repos.listForAuthenticatedUser.mockResolvedValue({
        data: mockRepos
      });
      
      const result = await service.getFolders();
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('repo1');
    });
  });
});
```

---

## 11. DEPLOYMENT & RELEASE CHECKLIST

### 11.1 Before Release

- [ ] All tests passing
- [ ] Code review completed
- [ ] No console errors/warnings
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Changelog written
- [ ] Electron builder configuration verified
- [ ] Signing certificates configured
- [ ] Update URLs/endpoints verified

### 11.2 Release Process

```bash
# 1. Build application
npm run build

# 2. Create installers
npm run electron-builder

# 3. Sign installers (macOS/Windows)
npm run sign

# 4. Upload to release server
npm run publish

# 5. Create GitHub release
gh release create v1.0.0 --title "GitVault v1.0.0"
```

---

## 12. ENVIRONMENT SETUP

### 12.1 Environment Variables (.env)

```env
# GitHub OAuth
REACT_APP_GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# API Configuration
REACT_APP_API_TIMEOUT=30000
REACT_APP_MAX_RETRIES=3

# Database
DB_PATH=~/.gitvault/data.db
LOG_PATH=~/.gitvault/logs

# Feature Flags
FEATURE_OFFLINE_MODE=false
FEATURE_ENCRYPTION=false
FEATURE_TEAM_WORKSPACES=false

# Build/Environment
NODE_ENV=development
ELECTRON_START_URL=http://localhost:3000
```

---

## 13. QUICK START FOR DEVELOPERS

### Installation & Setup

```bash
# 1. Clone repository
git clone https://github.com/yourusername/gitvault.git
cd gitvault

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your GitHub credentials

# 4. Start development
npm run dev
# This starts both Electron main process and React dev server

# 5. Run tests
npm test

# 6. Build for distribution
npm run build
npm run electron-builder
```

---

## 14. TROUBLESHOOTING & COMMON ISSUES

### Issue: Rate Limit Exceeded

**Symptom:** API calls fail with 403 status code  
**Solution:** 
- App automatically waits for rate limit reset
- Check `x-ratelimit-reset` header
- Consider implementing batch operations

### Issue: File Upload Fails on Large Files

**Symptom:** Files >50MB fail to upload  
**Solution:**
- Split into chunks
- Implement progress tracking
- Check GitHub repo size limits

### Issue: Token Expiration

**Symptom:** "Unauthorized" errors after inactive period  
**Solution:**
- Implement token refresh flow
- Re-authenticate user
- Clear local token cache

---

**Document prepared for development team**  
**Last updated:** August 27, 2026  
**Next review:** September 27, 2026
