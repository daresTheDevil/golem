/**
 * Gitea API client
 *
 * API Docs: https://docs.gitea.com/api/1.20/
 * Swagger: {your-gitea}/api/swagger
 */

import type { GiteaIssue, GiteaIssueCreatePayload, GiteaPullRequest } from '../types.js';

export interface GiteaConfig {
  baseUrl: string;     // e.g., "https://dev.pearlriverresort.com"
  token: string;
  org: string;         // Default org, e.g., "CRDE"
}

export class GiteaClient {
  private baseUrl: string;
  private headers: Headers;
  private defaultOrg: string;

  constructor(config: GiteaConfig) {
    this.baseUrl = `${config.baseUrl}/api/v1`;
    this.defaultOrg = config.org;
    this.headers = new Headers({
      'Authorization': `token ${config.token}`,
      'Content-Type': 'application/json',
    });
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Gitea API error ${response.status}: ${text}`);
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  private repoPath(repo: string): string {
    // If repo doesn't include org, prepend default org
    if (!repo.includes('/')) {
      return `${this.defaultOrg}/${repo}`;
    }
    return repo;
  }

  // ============ Issues ============

  /**
   * Get an issue by number
   */
  async getIssue(repo: string, number: number): Promise<GiteaIssue> {
    const path = this.repoPath(repo);
    return this.request<GiteaIssue>('GET', `/repos/${path}/issues/${number}`);
  }

  /**
   * List issues for a repo
   */
  async listIssues(
    repo: string,
    options: { state?: 'open' | 'closed' | 'all'; labels?: string[] } = {}
  ): Promise<GiteaIssue[]> {
    const path = this.repoPath(repo);
    const params = new URLSearchParams();
    if (options.state) params.set('state', options.state);
    if (options.labels?.length) params.set('labels', options.labels.join(','));

    const query = params.toString();
    return this.request<GiteaIssue[]>(
      'GET',
      `/repos/${path}/issues${query ? `?${query}` : ''}`
    );
  }

  /**
   * Create a new issue
   */
  async createIssue(repo: string, payload: GiteaIssueCreatePayload): Promise<GiteaIssue> {
    const path = this.repoPath(repo);
    return this.request<GiteaIssue>('POST', `/repos/${path}/issues`, payload);
  }

  /**
   * Update an issue
   */
  async updateIssue(
    repo: string,
    number: number,
    updates: Partial<GiteaIssueCreatePayload> & { state?: 'open' | 'closed' }
  ): Promise<GiteaIssue> {
    const path = this.repoPath(repo);
    return this.request<GiteaIssue>('PATCH', `/repos/${path}/issues/${number}`, updates);
  }

  /**
   * Add a comment to an issue
   */
  async addIssueComment(repo: string, number: number, body: string): Promise<void> {
    const path = this.repoPath(repo);
    await this.request('POST', `/repos/${path}/issues/${number}/comments`, { body });
  }

  /**
   * Close an issue
   */
  async closeIssue(repo: string, number: number): Promise<GiteaIssue> {
    return this.updateIssue(repo, number, { state: 'closed' });
  }

  // ============ Pull Requests ============

  /**
   * Get a pull request by number
   */
  async getPullRequest(repo: string, number: number): Promise<GiteaPullRequest> {
    const path = this.repoPath(repo);
    return this.request<GiteaPullRequest>('GET', `/repos/${path}/pulls/${number}`);
  }

  /**
   * Create a pull request
   */
  async createPullRequest(
    repo: string,
    payload: {
      title: string;
      body: string;
      head: string;      // Source branch
      base: string;      // Target branch (usually 'main')
    }
  ): Promise<GiteaPullRequest> {
    const path = this.repoPath(repo);
    return this.request<GiteaPullRequest>('POST', `/repos/${path}/pulls`, payload);
  }

  /**
   * Merge a pull request
   */
  async mergePullRequest(
    repo: string,
    number: number,
    options: {
      mergeStyle?: 'merge' | 'rebase' | 'squash';
      title?: string;
      message?: string;
    } = {}
  ): Promise<void> {
    const path = this.repoPath(repo);
    await this.request('POST', `/repos/${path}/pulls/${number}/merge`, {
      Do: options.mergeStyle || 'squash',
      MergeTitleField: options.title,
      MergeMessageField: options.message,
    });
  }

  // ============ Repos ============

  /**
   * List repos in the default org
   */
  async listOrgRepos(): Promise<{ name: string; full_name: string; html_url: string }[]> {
    return this.request('GET', `/orgs/${this.defaultOrg}/repos`);
  }

  /**
   * Get repo info
   */
  async getRepo(repo: string): Promise<{ name: string; full_name: string; default_branch: string }> {
    const path = this.repoPath(repo);
    return this.request('GET', `/repos/${path}`);
  }
}

/**
 * Create client from environment variables
 */
export function createGiteaClient(): GiteaClient {
  const baseUrl = process.env.GITEA_URL;
  const token = process.env.GITEA_TOKEN;
  const org = process.env.GITEA_ORG;

  if (!baseUrl || !token || !org) {
    throw new Error('Missing GITEA_URL, GITEA_TOKEN, or GITEA_ORG environment variables');
  }

  return new GiteaClient({ baseUrl, token, org });
}
