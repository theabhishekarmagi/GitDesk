import { Octokit } from '@octokit/rest';
import { Repository, FileItem, CommitItem, UserProfile } from '@shared/types';

let octokitInstance: Octokit | null = null;

export function initializeOctokit(token: string): Octokit {
  octokitInstance = new Octokit({ auth: token });
  return octokitInstance;
}

export function getOctokit(): Octokit {
  if (!octokitInstance) {
    throw new Error('Octokit has not been initialized with an auth token');
  }
  return octokitInstance;
}

export function clearOctokit(): void {
  octokitInstance = null;
}

export const GitHubService = {
  // Validate token & get profile
  async getCurrentUser(token?: string): Promise<UserProfile> {
    const client = token ? new Octokit({ auth: token }) : getOctokit();
    const response = await client.rest.users.getAuthenticated();
    const data = response.data;
    return {
      login: data.login,
      name: data.name ?? null,
      avatar_url: data.avatar_url,
      email: data.email ?? null,
      public_repos: data.public_repos,
      total_private_repos: (data as any).total_private_repos ?? 0,
    };
  },

  // List user repositories
  async listRepositories(): Promise<Repository[]> {
    const client = getOctokit();
    const response = await client.request('GET /user/repos', {
      sort: 'updated',
      direction: 'desc',
      per_page: 100,
      affiliation: 'owner',
      t: Date.now(),
    });

    return response.data.map((repo: any) => {
      const topics: string[] = repo.topics || [];
      const desc = repo.description || '';
      const isGitDrive =
        topics.includes('gitdrive') ||
        topics.includes('gitvault') ||
        /gitdrive|gitvault/i.test(desc) ||
        repo.name.toLowerCase() === 'test';

      return {
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private,
        description: repo.description,
        size: repo.size,
        default_branch: repo.default_branch,
        updated_at: repo.updated_at,
        html_url: repo.html_url,
        stargazers_count: repo.stargazers_count,
        topics,
        isGitDrive,
      };
    });
  },

  // Create repository as a GitDrive folder
  async createRepository(name: string, description: string = '', isPrivate: boolean = true): Promise<Repository> {
    const client = getOctokit();
    const finalDesc = description || '📁 GitDrive Storage Folder';
    const response = await client.rest.repos.createForAuthenticatedUser({
      name,
      description: finalDesc,
      private: isPrivate,
      auto_init: true, // Initialise with README so there's an initial commit
    });

    const repo = response.data;

    // Automatically set the 'gitdrive' topic on GitHub
    try {
      await client.rest.repos.replaceAllTopics({
        owner: repo.owner.login,
        repo: repo.name,
        names: ['gitdrive'],
      });
    } catch (e) {
      console.warn('Could not set gitdrive topic:', e);
    }

    return {
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      private: repo.private,
      description: repo.description,
      size: repo.size,
      default_branch: repo.default_branch,
      updated_at: repo.updated_at,
      html_url: repo.html_url,
      stargazers_count: repo.stargazers_count,
      topics: ['gitdrive'],
      isGitDrive: true,
    };
  },

  // Tag an existing repository as a GitDrive folder
  async markAsGitDrive(owner: string, repo: string): Promise<void> {
    const client = getOctokit();
    const repoInfo = await client.rest.repos.get({ owner, repo });
    const existingTopics = repoInfo.data.topics || [];
    if (!existingTopics.includes('gitdrive')) {
      await client.rest.repos.replaceAllTopics({
        owner,
        repo,
        names: [...existingTopics, 'gitdrive'],
      });
    }
  },

  // List folder/repo contents
  async listContents(owner: string, repo: string, path: string = ''): Promise<FileItem[]> {
    const client = getOctokit();
    try {
      const endpoint = path ? 'GET /repos/{owner}/{repo}/contents/{path}' : 'GET /repos/{owner}/{repo}/contents';
      const response = await client.request(endpoint, {
        owner,
        repo,
        ...(path ? { path } : {}),
        t: Date.now(),
      });

      if (!Array.isArray(response.data)) {
        return [];
      }

      return response.data.map((item: any) => ({
        name: item.name,
        path: item.path,
        sha: item.sha,
        size: item.size,
        type: item.type === 'dir' ? 'dir' : 'file',
        download_url: item.download_url,
      }));
    } catch (err: any) {
      // Empty repo returns 404 or empty object for contents
      if (err.status === 404) {
        return [];
      }
      throw err;
    }
  },

  // Upload or update a file
  async uploadFile(
    owner: string,
    repo: string,
    path: string,
    base64Content: string,
    message?: string,
    sha?: string
  ): Promise<{ sha: string; path: string; download_url: string | null }> {
    const client = getOctokit();
    const commitMessage = message || `Upload ${path.split('/').pop()} via GitDrive`;

    const response = await client.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: commitMessage,
      content: base64Content,
      sha, // Required if updating an existing file
    });

    const content = response.data.content;
    return {
      sha: content?.sha || '',
      path: content?.path || path,
      download_url: content?.download_url || null,
    };
  },

  // Get raw file content (base64)
  async getFileContent(
    owner: string,
    repo: string,
    path: string
  ): Promise<{ content: string; sha: string; size: number }> {
    const client = getOctokit();
    const response = await client.rest.repos.getContent({
      owner,
      repo,
      path,
    });

    const data = response.data as any;
    return {
      content: data.content,
      sha: data.sha,
      size: data.size,
    };
  },

  // Delete a file
  async deleteFile(owner: string, repo: string, path: string, sha: string, message?: string): Promise<void> {
    const client = getOctokit();
    await client.rest.repos.deleteFile({
      owner,
      repo,
      path,
      message: message || `Delete ${path} via GitDrive`,
      sha,
    });
  },

  // Get commit history for file or repository
  async getCommitHistory(owner: string, repo: string, path?: string): Promise<CommitItem[]> {
    const client = getOctokit();
    const params: any = { owner, repo, per_page: 30 };
    if (path) params.path = path;

    const response = await client.rest.repos.listCommits(params);

    return response.data.map((c) => ({
      sha: c.sha,
      message: c.commit.message,
      author_name: c.commit.author?.name || c.author?.login || 'Unknown',
      author_avatar: c.author?.avatar_url,
      author_date: c.commit.author?.date || '',
      html_url: c.html_url,
    }));
  },

  // Rename repository (folder)
  async renameRepository(owner: string, oldName: string, newName: string): Promise<Repository> {
    const client = getOctokit();
    const response = await client.rest.repos.update({
      owner,
      repo: oldName,
      name: newName,
    });
    const repo = response.data;
    const topics: string[] = repo.topics || [];
    return {
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      private: repo.private,
      description: repo.description,
      size: repo.size,
      default_branch: repo.default_branch,
      updated_at: repo.updated_at,
      html_url: repo.html_url,
      stargazers_count: repo.stargazers_count,
      topics,
      isGitDrive: topics.includes('gitdrive') || /gitdrive/i.test(repo.description || ''),
    };
  },

  // Rename a file
  async renameFile(
    owner: string,
    repo: string,
    oldPath: string,
    newPath: string
  ): Promise<{ sha: string; path: string; download_url: string | null }> {
    // 1. Fetch old file's content and SHA
    const oldFile = await this.getFileContent(owner, repo, oldPath);

    // 2. Create the file at newPath
    const newFile = await this.uploadFile(
      owner,
      repo,
      newPath,
      oldFile.content,
      `Rename ${oldPath.split('/').pop()} to ${newPath.split('/').pop()} via GitDrive`
    );

    // 3. Delete old file
    await this.deleteFile(
      owner,
      repo,
      oldPath,
      oldFile.sha,
      `Remove ${oldPath} after rename via GitDrive`
    );

    return newFile;
  },
};
