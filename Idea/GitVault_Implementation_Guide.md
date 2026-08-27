# GitVault - Implementation & Development Guide
## Step-by-Step Build Instructions

**Last Updated:** August 27, 2026  
**Status:** Ready for Development

---

## 📚 HOW TO USE THESE 3 DOCUMENTS

| Document | Purpose | Read If | Contains |
|----------|---------|---------|----------|
| **Quick Reference** | Overview & quick lookup | You're new to project | What is GitVault? How does it work? Quick FAQ |
| **PRD** | Business requirements | You're a PM or designer | Features, users, success metrics, timeline |
| **Technical Spec** | Implementation guide | You're a developer | Architecture, workflows, code examples, API details |

**Reading Order:**
1. Start: `GitVault_Quick_Reference.md` (15 min read)
2. Then: `GitVault_Technical_Spec.md` (30 min read)
3. Reference: `GitVault_PRD.md` (when questions arise)

---

## 🎯 IMPLEMENTATION ROADMAP

### Phase 1: MVP Development (Weeks 1-12)

```
Week 1-2: Setup & Auth
├─ Setup Electron + React project
├─ Configure GitHub OAuth
├─ Implement login flow
└─ Test authentication

Week 3-4: Folder Management
├─ List user's GitHub repos
├─ Create folder (repo) feature
├─ UI for folder management
└─ Test folder operations

Week 5-6: File Upload
├─ Implement file upload
├─ Base64 encoding
├─ GitHub API integration
├─ Progress tracking
└─ Error handling

Week 7-8: File Download & Preview
├─ Download files
├─ File preview for common types
├─ File validation
└─ Test download flow

Week 9-10: File History & Versioning
├─ Fetch commit history
├─ Display version timeline
├─ Restore previous versions
└─ Test history operations

Week 11-12: Polish & Testing
├─ Bug fixes
├─ Performance optimization
├─ Security audit
├─ Release v1.0
└─ Create installers
```

---

## 💻 DEVELOPMENT ENVIRONMENT SETUP

### Prerequisites
- Node.js 16+ (or 18+ recommended)
- npm or yarn
- Git
- GitHub account
- Code editor (VS Code recommended)

### Step 1: Create GitHub OAuth App

1. Go to: https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - Application name: "GitVault Dev"
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/oauth/callback`
4. Copy `Client ID` and `Client Secret`
5. Save these to `.env` file (see below)

### Step 2: Clone & Setup Project

```bash
# Clone repository
git clone https://github.com/yourusername/gitvault.git
cd gitvault

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
# GitHub OAuth
REACT_APP_GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here

# API Configuration
REACT_APP_API_TIMEOUT=30000
REACT_APP_MAX_RETRIES=3

# Database
DB_PATH=~/.gitvault/data.db
LOG_PATH=~/.gitvault/logs

# Development
NODE_ENV=development
ELECTRON_START_URL=http://localhost:3000
EOF

# Install Electron
npm install --save-dev electron

# Start development server
npm run dev
```

### Step 3: Project Structure Creation

```bash
# Create directory structure
mkdir -p src/main
mkdir -p src/renderer/{pages,components,services,store,api,db,utils,styles}
mkdir -p src/shared
mkdir -p tests/{unit,integration,e2e}
mkdir -p docs
mkdir -p public/assets

# Create essential files
touch src/main/main.ts
touch src/main/preload.ts
touch src/renderer/index.tsx
touch src/renderer/App.tsx
touch src/renderer/pages/LoginPage.tsx
touch src/renderer/pages/DashboardPage.tsx
touch src/renderer/pages/FolderPage.tsx
touch src/renderer/pages/SettingsPage.tsx

# Create service files
touch src/renderer/services/AuthService.ts
touch src/renderer/services/FolderService.ts
touch src/renderer/services/FileService.ts
touch src/renderer/services/VersionService.ts

# Create store files
touch src/renderer/store/authStore.ts
touch src/renderer/store/folderStore.ts
touch src/renderer/store/fileStore.ts
touch src/renderer/store/uploadStore.ts
touch src/renderer/store/uiStore.ts

# Create API files
touch src/renderer/api/GitHubClient.ts
touch src/renderer/db/database.ts
```

---

## 🔧 DEVELOPMENT WORKFLOW

### Daily Development Cycle

```bash
# 1. Start development server (in terminal 1)
npm run dev
# This starts both Electron and React dev server
# App opens automatically

# 2. Make code changes (in your editor)
# Changes auto-reload in the app

# 3. Run tests (in terminal 2)
npm test

# 4. Check for issues
npm run lint

# 5. Format code
npm run format

# 6. Build when ready
npm run build
npm run electron-builder
```

### Useful npm Commands

```bash
# Development
npm run dev              # Start dev environment
npm run dev:main        # Start Electron main process only
npm run dev:renderer    # Start React dev server only

# Testing
npm test                # Run all tests
npm test:watch         # Watch mode for tests
npm test:coverage      # Coverage report

# Build
npm run build           # Build production
npm run build:main      # Build main process
npm run build:renderer  # Build renderer process
npm run electron-builder # Create installers

# Utilities
npm run lint            # Check code quality
npm run format          # Format code with Prettier
npm run type-check      # TypeScript type checking
npm run analyze         # Bundle size analysis
```

---

## 🎨 BUILDING YOUR FIRST FEATURE

### Feature 1: Implement GitHub Login

**Files to Create/Edit:**
```
src/
├─ pages/LoginPage.tsx          ← Create
├─ services/AuthService.ts      ← Create
├─ api/GitHubClient.ts          ← Create
├─ store/authStore.ts           ← Create
└─ utils/constants.ts           ← Edit
```

**Step-by-Step Implementation:**

#### 1. Create `src/utils/constants.ts`
```typescript
export const GITHUB_CONFIG = {
  CLIENT_ID: process.env.REACT_APP_GITHUB_CLIENT_ID,
  REDIRECT_URI: 'http://localhost:3000/oauth/callback',
  SCOPES: ['repo', 'workflow', 'user'],
};

export const API_ENDPOINTS = {
  GITHUB_AUTHORIZE: 'https://github.com/login/oauth/authorize',
  GITHUB_ACCESS_TOKEN: 'https://github.com/login/oauth/access_token',
  API_BASE: 'https://api.github.com',
};

export const ERRORS = {
  AUTH_FAILED: 'Authentication failed. Please try again.',
  INVALID_TOKEN: 'Invalid authentication token.',
  NOT_AUTHENTICATED: 'Please log in to continue.',
};
```

#### 2. Create `src/renderer/services/AuthService.ts`
```typescript
import axios from 'axios';
import { GITHUB_CONFIG, API_ENDPOINTS } from '../utils/constants';

export class AuthService {
  static generateOAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: GITHUB_CONFIG.CLIENT_ID!,
      redirect_uri: GITHUB_CONFIG.REDIRECT_URI,
      scope: GITHUB_CONFIG.SCOPES.join(' '),
      state: this.generateRandomState(),
    });
    
    return `${API_ENDPOINTS.GITHUB_AUTHORIZE}?${params.toString()}`;
  }
  
  static async exchangeCodeForToken(code: string): Promise<string> {
    try {
      const response = await axios.post(
        API_ENDPOINTS.GITHUB_ACCESS_TOKEN,
        {
          client_id: GITHUB_CONFIG.CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: GITHUB_CONFIG.REDIRECT_URI,
        },
        {
          headers: { Accept: 'application/json' },
        }
      );
      
      if (response.data.error) {
        throw new Error(response.data.error_description);
      }
      
      return response.data.access_token;
    } catch (error) {
      console.error('Token exchange failed:', error);
      throw error;
    }
  }
  
  static async storeTokenSecurely(token: string): Promise<void> {
    // Store in OS Keychain via Electron IPC
    await window.electron.storeSecureToken(token);
  }
  
  static async getStoredToken(): Promise<string | null> {
    return await window.electron.getSecureToken();
  }
  
  private static generateRandomState(): string {
    return Math.random().toString(36).substring(2, 15);
  }
  
  static async logout(): Promise<void> {
    await window.electron.deleteSecureToken();
  }
}
```

#### 3. Create `src/renderer/api/GitHubClient.ts`
```typescript
import { Octokit } from '@octokit/rest';

export class GitHubClient {
  private static instance: Octokit | null = null;
  
  static initialize(token: string): void {
    this.instance = new Octokit({
      auth: `token ${token}`,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
  }
  
  static getInstance(): Octokit {
    if (!this.instance) {
      throw new Error('GitHubClient not initialized');
    }
    return this.instance;
  }
  
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
}
```

#### 4. Create `src/renderer/store/authStore.ts`
```typescript
import { create } from 'zustand';

interface User {
  id: number;
  username: string;
  email: string;
  avatarUrl: string;
}

interface AuthStore {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
  
  // Actions
  setLoading: (loading: boolean) => void;
  setAuthenticated: (auth: boolean) => void;
  setUser: (user: User) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  isLoading: false,
  user: null,
  error: null,
  
  setLoading: (loading) => set({ isLoading: loading }),
  setAuthenticated: (auth) => set({ isAuthenticated: auth }),
  setUser: (user) => set({ user }),
  setError: (error) => set({ error }),
  reset: () => set({ isAuthenticated: false, user: null, error: null }),
}));
```

#### 5. Create `src/renderer/pages/LoginPage.tsx`
```typescript
import React, { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { AuthService } from '../services/AuthService';
import { GitHubClient } from '../api/GitHubClient';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const { setLoading, setAuthenticated, setUser, setError } = useAuthStore();
  
  useEffect(() => {
    // Check if returning from OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      handleOAuthCallback(code);
    }
  }, []);
  
  const handleLogin = () => {
    const oauthUrl = AuthService.generateOAuthUrl();
    window.location.href = oauthUrl;
  };
  
  const handleOAuthCallback = async (code: string) => {
    setLoading(true);
    try {
      // Exchange code for token
      const token = await AuthService.exchangeCodeForToken(code);
      
      // Store token securely
      await AuthService.storeTokenSecurely(token);
      
      // Initialize GitHub client
      GitHubClient.initialize(token);
      
      // Fetch user info
      const response = await GitHubClient.getCurrentUser();
      const user = response.data;
      
      // Update store
      setUser({
        id: user.id,
        username: user.login,
        email: user.email || '',
        avatarUrl: user.avatar_url,
      });
      setAuthenticated(true);
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Login failed:', error);
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="login-page">
      <div className="login-container">
        <h1>🔐 GitVault</h1>
        <p className="subtitle">Your GitHub-Powered Cloud Storage</p>
        
        <button 
          className="github-login-btn"
          onClick={handleLogin}
        >
          Login with GitHub
        </button>
        
        <p className="info-text">
          Secure. Free. Unlimited storage using your GitHub account.
        </p>
      </div>
    </div>
  );
};
```

#### 6. Update `src/renderer/App.tsx`
```typescript
import React, { useEffect } from 'react';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { useAuthStore } from './store/authStore';
import { AuthService } from './services/AuthService';
import { GitHubClient } from './api/GitHubClient';

function App() {
  const { isAuthenticated, setAuthenticated, setUser } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);
  
  useEffect(() => {
    // Check if user is already authenticated
    checkAuthentication();
  }, []);
  
  const checkAuthentication = async () => {
    try {
      const token = await AuthService.getStoredToken();
      if (token) {
        GitHubClient.initialize(token);
        const response = await GitHubClient.getCurrentUser();
        const user = response.data;
        
        setUser({
          id: user.id,
          username: user.login,
          email: user.email || '',
          avatarUrl: user.avatar_url,
        });
        setAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Not authenticated
    } finally {
      setIsCheckingAuth(false);
    }
  };
  
  if (isCheckingAuth) {
    return <div className="loading">Loading...</div>;
  }
  
  return isAuthenticated ? <DashboardPage /> : <LoginPage />;
}

export default App;
```

---

## 🧪 TESTING YOUR IMPLEMENTATION

### Unit Test Example for AuthService

```typescript
// tests/unit/services/AuthService.test.ts

describe('AuthService', () => {
  describe('generateOAuthUrl', () => {
    it('should generate valid OAuth URL', () => {
      const url = AuthService.generateOAuthUrl();
      
      expect(url).toContain('github.com/login/oauth/authorize');
      expect(url).toContain('client_id=');
      expect(url).toContain('redirect_uri=');
      expect(url).toContain('scope=');
    });
  });
  
  describe('exchangeCodeForToken', () => {
    it('should exchange code for access token', async () => {
      const mockCode = 'test_code_123';
      const mockToken = 'gho_test_token_456';
      
      // Mock axios
      jest.mock('axios');
      const mockAxios = require('axios');
      mockAxios.post.mockResolvedValue({
        data: { access_token: mockToken },
      });
      
      const token = await AuthService.exchangeCodeForToken(mockCode);
      
      expect(token).toBe(mockToken);
    });
  });
});
```

### Run Tests

```bash
npm test

# Output should show:
# PASS  tests/unit/services/AuthService.test.ts
#   AuthService
#     generateOAuthUrl
#       ✓ should generate valid OAuth URL (5ms)
#     exchangeCodeForToken
#       ✓ should exchange code for access token (12ms)
# 
# Test Suites: 1 passed, 1 total
# Tests:       2 passed, 2 total
```

---

## 📦 DEPENDENCIES TO INSTALL

```bash
# Core dependencies
npm install electron electron-builder
npm install react react-dom
npm install @types/react @types/react-dom --save-dev
npm install typescript --save-dev

# State management
npm install zustand
# OR
npm install redux react-redux @reduxjs/toolkit

# GitHub API
npm install @octokit/rest

# HTTP client
npm install axios

# Database
npm install sqlite3
npm install better-sqlite3

# Security
npm install keytar

# UI & Styling
npm install classnames

# Utilities
npm install lodash dotenv

# Development tools
npm install --save-dev webpack webpack-cli
npm install --save-dev babel-loader @babel/core
npm install --save-dev prettier eslint
npm install --save-dev jest @testing-library/react

# TypeScript
npm install --save-dev ts-loader

# Build tools
npm install --save-dev electron-builder electron-notarize
```

### Check Versions in package.json

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "electron": "^27.0.0",
    "@octokit/rest": "^20.0.0",
    "zustand": "^4.4.0",
    "axios": "^1.6.0",
    "sqlite3": "^5.1.0",
    "keytar": "^7.9.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "webpack": "^5.0.0",
    "electron-builder": "^24.0.0",
    "jest": "^29.0.0",
    "@testing-library/react": "^14.0.0"
  }
}
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Before Release v1.0

- [ ] All Phase 1 features implemented
- [ ] All tests passing (`npm test`)
- [ ] No console errors in production build
- [ ] Security audit completed
- [ ] GitHub OAuth working correctly
- [ ] Token storage working (Keychain)
- [ ] File upload/download working
- [ ] Version history working
- [ ] Error handling implemented
- [ ] Rate limit handling implemented
- [ ] Documentation complete
- [ ] Installer created
- [ ] Code signed (if macOS)
- [ ] Notarized (if macOS)

### Build for Release

```bash
# 1. Ensure all tests pass
npm test

# 2. Build production bundle
npm run build

# 3. Create installers
npm run electron-builder

# 4. Outputs (in dist/):
# - gitvault-1.0.0.exe (Windows)
# - GitVault-1.0.0.dmg (macOS)
# - gitvault-1.0.0.AppImage (Linux)

# 5. Create checksums
cd dist
sha256sum *.exe *.dmg *.AppImage > checksums.txt

# 6. Upload to GitHub Releases
gh release create v1.0.0 dist/* --title "GitVault v1.0.0"
```

---

## 🐛 DEBUGGING TIPS

### Enable Debug Logging

```typescript
// In main.ts or during development
if (process.env.NODE_ENV === 'development') {
  const log = require('electron-log');
  log.transports.file.level = 'debug';
  log.catchErrors();
}
```

### Electron DevTools

```typescript
// In main.ts
if (process.env.NODE_ENV === 'development') {
  mainWindow.webContents.openDevTools();
}
```

### Common Issues & Solutions

**Issue: "Cannot find module '@octokit/rest'"**
```bash
npm install @octokit/rest
```

**Issue: "Token not found in keychain"**
```typescript
// Check keytar setup
const keytar = require('keytar');
keytar.setPassword('GitVault', 'github_token', token);
```

**Issue: "React components not rendering"**
```typescript
// Check store initialization
import { useAuthStore } from './store/authStore';
const { isAuthenticated } = useAuthStore();
console.log('Auth status:', isAuthenticated);
```

**Issue: "GitHub API rate limited"**
```typescript
// Check rate limit headers
const response = await api.call();
console.log('Remaining:', response.headers['x-ratelimit-remaining']);
console.log('Reset:', new Date(response.headers['x-ratelimit-reset'] * 1000));
```

---

## 📚 RECOMMENDED READING ORDER

1. **Start:** This document (30 min)
2. **Then:** `GitVault_Quick_Reference.md` (15 min)
3. **Deep dive:** `GitVault_Technical_Spec.md` sections:
   - Section 2: System Architecture
   - Section 3: Detailed Workflow
   - Section 4: API Integration
   - Section 5: Database Schema

---

## ✅ NEXT STEPS

1. **Set up environment** (Follow "Development Environment Setup")
2. **Implement Feature 1: Auth** (Follow "Building Your First Feature")
3. **Write tests** (Follow "Testing Your Implementation")
4. **Run and test locally**
5. **Move to Feature 2: Folder Management**
6. **Repeat for Feature 3, 4, 5...**

---

## 📞 GETTING HELP

- Check `GitVault_Technical_Spec.md` for implementation details
- Review code examples in this document
- Check GitHub Issues for known problems
- Read Electron & React documentation
- Ask in community chat/Discord

---

**You're ready to build! Start with "Development Environment Setup" → 🚀**
