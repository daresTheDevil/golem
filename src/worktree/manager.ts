/**
 * Git worktree management
 *
 * Creates isolated worktrees per ticket under .golem/worktrees/
 */

import { execSync, exec } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, rm, access } from 'node:fs/promises';
import { join } from 'node:path';
import type { TicketState } from '../types.js';

const execAsync = promisify(exec);

export interface WorktreeInfo {
  path: string;
  branch: string;
  commitSha: string;
}

/**
 * Run git command and return stdout
 */
function git(command: string, cwd?: string): string {
  return execSync(`git ${command}`, {
    cwd,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
}

/**
 * Run git command async
 */
async function gitAsync(command: string, cwd?: string): Promise<string> {
  const { stdout } = await execAsync(`git ${command}`, { cwd });
  return stdout.trim();
}

/**
 * Get the root of the current git repository
 */
export function getRepoRoot(): string {
  return git('rev-parse --show-toplevel');
}

/**
 * Get the default branch (main or master)
 */
export function getDefaultBranch(): string {
  try {
    // Try to get from remote HEAD
    const ref = git('symbolic-ref refs/remotes/origin/HEAD');
    return ref.replace('refs/remotes/origin/', '');
  } catch {
    // Fall back to checking if main or master exists
    try {
      git('rev-parse --verify main');
      return 'main';
    } catch {
      return 'master';
    }
  }
}

/**
 * List all worktrees
 */
export function listWorktrees(): WorktreeInfo[] {
  const output = git('worktree list --porcelain');
  const worktrees: WorktreeInfo[] = [];
  let current: Partial<WorktreeInfo> = {};

  for (const line of output.split('\n')) {
    if (line.startsWith('worktree ')) {
      current.path = line.replace('worktree ', '');
    } else if (line.startsWith('HEAD ')) {
      current.commitSha = line.replace('HEAD ', '');
    } else if (line.startsWith('branch ')) {
      current.branch = line.replace('branch refs/heads/', '');
    } else if (line === '') {
      if (current.path && current.branch && current.commitSha) {
        worktrees.push(current as WorktreeInfo);
      }
      current = {};
    }
  }

  // Handle last entry
  if (current.path && current.branch && current.commitSha) {
    worktrees.push(current as WorktreeInfo);
  }

  return worktrees;
}

/**
 * Create a worktree for a ticket
 */
export async function createWorktree(
  ticket: TicketState,
  options: { baseBranch?: string } = {}
): Promise<string> {
  const repoRoot = getRepoRoot();
  const baseBranch = options.baseBranch || getDefaultBranch();
  const worktreePath = join(repoRoot, ticket.git.worktree);
  const branch = ticket.git.branch;

  // Ensure worktrees directory exists
  await mkdir(join(repoRoot, '.golem/worktrees'), { recursive: true });

  // Check if worktree already exists
  const worktrees = listWorktrees();
  const existing = worktrees.find(w => w.branch === branch);
  if (existing) {
    return existing.path;
  }

  // Fetch latest from remote
  try {
    git('fetch origin', repoRoot);
  } catch {
    // Ignore fetch errors (might be offline)
  }

  // Create the worktree with a new branch based on the base branch
  git(`worktree add -b ${branch} "${worktreePath}" origin/${baseBranch}`, repoRoot);

  return worktreePath;
}

/**
 * Remove a worktree
 */
export async function removeWorktree(worktreePath: string): Promise<void> {
  const repoRoot = getRepoRoot();

  // Check if it exists
  try {
    await access(worktreePath);
  } catch {
    return; // Already gone
  }

  // Remove the worktree
  git(`worktree remove "${worktreePath}" --force`, repoRoot);
}

/**
 * Get current branch in a worktree
 */
export function getCurrentBranch(worktreePath: string): string {
  return git('rev-parse --abbrev-ref HEAD', worktreePath);
}

/**
 * Get list of commits on branch since it diverged from base
 */
export async function getCommitsSinceBase(
  worktreePath: string,
  baseBranch?: string
): Promise<string[]> {
  const base = baseBranch || getDefaultBranch();
  const output = await gitAsync(
    `log origin/${base}..HEAD --format=%H`,
    worktreePath
  );
  return output ? output.split('\n') : [];
}

/**
 * Squash all commits since base into one
 */
export async function squashCommits(
  worktreePath: string,
  message: string,
  baseBranch?: string
): Promise<string> {
  const base = baseBranch || getDefaultBranch();

  // Soft reset to merge base, keeping changes staged
  await gitAsync(`reset --soft origin/${base}`, worktreePath);

  // Create new commit with all changes
  await gitAsync(`commit -m "${message.replace(/"/g, '\\"')}"`, worktreePath);

  // Return new commit SHA
  return gitAsync('rev-parse HEAD', worktreePath);
}

/**
 * Create a commit in the worktree
 */
export async function createCommit(
  worktreePath: string,
  message: string
): Promise<string> {
  // Stage all changes
  await gitAsync('add -A', worktreePath);

  // Check if there are changes to commit
  try {
    await gitAsync('diff --cached --quiet', worktreePath);
    // No changes
    return '';
  } catch {
    // There are changes, commit them
  }

  await gitAsync(`commit -m "${message.replace(/"/g, '\\"')}"`, worktreePath);
  return gitAsync('rev-parse HEAD', worktreePath);
}

/**
 * Push branch to remote
 */
export async function pushBranch(
  worktreePath: string,
  force = false
): Promise<void> {
  const forceFlag = force ? '--force-with-lease' : '';
  await gitAsync(`push -u origin HEAD ${forceFlag}`, worktreePath);
}
