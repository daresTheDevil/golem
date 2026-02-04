/**
 * Bi-directional sync between Freshworks, Gitea, and local state
 *
 * Local state (.golem/tickets/*.yaml) is the source of truth.
 * This module handles pushing updates to Fresh and Gitea.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import type { TicketState, SyncResult, TicketStatus, CommitType } from '../types.js';
import { FreshworksClient, createFreshworksClient } from '../api/freshworks.js';
import { GiteaClient, createGiteaClient } from '../api/gitea.js';

export interface SyncContext {
  fresh: FreshworksClient;
  gitea: GiteaClient;
  ticketsDir: string;
  repo: string;
}

/**
 * Load ticket state from local YAML file
 */
export async function loadTicketState(
  ticketsDir: string,
  ticketId: string
): Promise<TicketState | null> {
  const filePath = join(ticketsDir, `${ticketId}.yaml`);
  try {
    const content = await readFile(filePath, 'utf-8');
    return parseYaml(content) as TicketState;
  } catch {
    return null;
  }
}

/**
 * Save ticket state to local YAML file
 */
export async function saveTicketState(
  ticketsDir: string,
  state: TicketState
): Promise<void> {
  const filePath = join(ticketsDir, `${state.id}.yaml`);
  await mkdir(dirname(filePath), { recursive: true });
  state.updated = new Date().toISOString();
  await writeFile(filePath, stringifyYaml(state), 'utf-8');
}

/**
 * Create a new ticket in both Fresh and Gitea, linked together
 */
export async function createLinkedTicket(
  ctx: SyncContext,
  params: {
    subject: string;
    description: string;
    type: CommitType;
    slug: string;
    priority?: 1 | 2 | 3 | 4;
  }
): Promise<TicketState> {
  const { fresh, gitea, ticketsDir, repo } = ctx;

  // 1. Create Fresh ticket first (gets the ID)
  // Required fields from Freshservice: status, group_id, category, email/requester_id, source
  const freshTicket = await fresh.createTicket({
    subject: params.subject,
    description: params.description,
    priority: params.priority || 3,
    status: 2, // Open
    source: parseInt(process.env.FRESH_SOURCE_ID || '1002'), // ACE (API)
    group_id: parseInt(process.env.FRESH_DEFAULT_GROUP_ID || '38000120203'),
    category: process.env.FRESH_DEFAULT_CATEGORY || 'Applications',
    email: process.env.FRESH_DEFAULT_EMAIL || 'ace-bot@pearlriverresort.com',
  });

  const ticketId = FreshworksClient.formatTicketId(freshTicket.id);
  const freshUrl = `https://${process.env.FRESH_DOMAIN}/a/tickets/${freshTicket.id}`;

  // 2. Create Gitea issue with link back to Fresh ticket
  const giteaIssue = await gitea.createIssue(repo, {
    title: `[${ticketId}] ${params.subject}`,
    body: `${params.description}\n\n---\n**Freshservice:** [${ticketId}](${freshUrl})\n**Type:** ${params.type}`,
  });

  // 3. Update Fresh ticket with Gitea link
  await fresh.addNote(
    freshTicket.id,
    `🔗 Gitea Issue: ${giteaIssue.html_url}`,
    true // private note
  );

  // 4. Create local state
  const branch = `${params.type}/${ticketId}-${params.slug}`;
  const state: TicketState = {
    id: ticketId,
    slug: params.slug,
    fresh: {
      id: ticketId,
      url: `https://${process.env.FRESH_DOMAIN}/helpdesk/tickets/${freshTicket.id}`,
      subject: freshTicket.subject,
      description: freshTicket.description_text,
      priority: freshTicket.priority,
      status: freshTicket.status,
    },
    gitea: {
      repo,
      issueNumber: giteaIssue.number,
      url: giteaIssue.html_url,
    },
    git: {
      worktree: join('.golem/worktrees', branch),
      branch,
      commits: [],
    },
    status: 'new',
    type: params.type,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  };

  await saveTicketState(ticketsDir, state);
  return state;
}

/**
 * Import an existing Fresh ticket and create linked Gitea issue
 */
export async function importFreshTicket(
  ctx: SyncContext,
  freshTicketId: number | string,
  params: {
    type: CommitType;
    slug: string;
  }
): Promise<TicketState> {
  const { fresh, gitea, ticketsDir, repo } = ctx;

  // Parse ticket ID if string
  const numericId = typeof freshTicketId === 'string'
    ? FreshworksClient.parseTicketId(freshTicketId)
    : freshTicketId;

  // 1. Fetch existing Fresh ticket
  const freshTicket = await fresh.getTicket(numericId);
  const ticketId = FreshworksClient.formatTicketId(freshTicket.id, freshTicket.ticket_type);

  // 2. Check if local state already exists
  const existingState = await loadTicketState(ticketsDir, ticketId);
  if (existingState) {
    console.log(`Ticket ${ticketId} already imported, returning existing state`);
    return existingState;
  }

  // 3. Check if Gitea issue already exists for this ticket
  let giteaIssue = await gitea.findIssueByTicketId(repo, ticketId);
  const freshUrl = `https://${process.env.FRESH_DOMAIN}/a/tickets/${freshTicket.id}`;

  if (giteaIssue) {
    console.log(`Found existing Gitea issue #${giteaIssue.number} for ${ticketId}`);
  } else {
    // 4. Create Gitea issue with link back to Fresh
    giteaIssue = await gitea.createIssue(repo, {
      title: `[${ticketId}] ${freshTicket.subject}`,
      body: `${freshTicket.description_text}\n\n---\n**Freshservice:** [${ticketId}](${freshUrl})\n**Type:** ${params.type}`,
    });

    // 5. Update Fresh ticket with Gitea link
    await fresh.addNote(
      freshTicket.id,
      `🔗 Gitea Issue: ${giteaIssue.html_url}`,
      true
    );
  }

  // 6. Create local state
  const branch = `${params.type}/${ticketId}-${params.slug}`;
  const state: TicketState = {
    id: ticketId,
    slug: params.slug,
    fresh: {
      id: ticketId,
      url: `https://${process.env.FRESH_DOMAIN}/helpdesk/tickets/${freshTicket.id}`,
      subject: freshTicket.subject,
      description: freshTicket.description_text,
      priority: freshTicket.priority,
      status: freshTicket.status,
    },
    gitea: {
      repo,
      issueNumber: giteaIssue.number,
      url: giteaIssue.html_url,
    },
    git: {
      worktree: join('.golem/worktrees', branch),
      branch,
      commits: [],
    },
    status: 'new',
    type: params.type,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  };

  await saveTicketState(ticketsDir, state);
  return state;
}

/**
 * Update ticket status and sync to Fresh/Gitea
 */
export async function updateTicketStatus(
  ctx: SyncContext,
  ticketId: string,
  newStatus: TicketStatus,
  note?: string
): Promise<SyncResult> {
  const { fresh, gitea, ticketsDir } = ctx;

  const state = await loadTicketState(ticketsDir, ticketId);
  if (!state) {
    return { success: false, freshUpdated: false, giteaUpdated: false, localUpdated: false, error: 'Ticket not found' };
  }

  const oldStatus = state.status;
  state.status = newStatus;

  let freshUpdated = false;
  let giteaUpdated = false;

  // Build status message
  const statusMessage = note || `Status: ${oldStatus} → ${newStatus}`;

  // Update Fresh
  if (state.fresh) {
    try {
      const freshId = FreshworksClient.parseTicketId(state.fresh.id);
      await fresh.addNote(freshId, `🤖 Golem: ${statusMessage}`, true);

      // Close ticket if done
      if (newStatus === 'done') {
        await fresh.closeTicket(freshId, statusMessage);
      }
      freshUpdated = true;
    } catch (e) {
      console.error('Failed to update Fresh:', e);
    }
  }

  // Update Gitea
  if (state.gitea) {
    try {
      await gitea.addIssueComment(state.gitea.repo, state.gitea.issueNumber, `🤖 Golem: ${statusMessage}`);

      // Close issue if done
      if (newStatus === 'done') {
        await gitea.closeIssue(state.gitea.repo, state.gitea.issueNumber);
      }
      giteaUpdated = true;
    } catch (e) {
      console.error('Failed to update Gitea:', e);
    }
  }

  // Save local state
  await saveTicketState(ticketsDir, state);

  return { success: true, freshUpdated, giteaUpdated, localUpdated: true };
}

/**
 * Record a commit against a ticket
 */
export async function recordCommit(
  ticketsDir: string,
  ticketId: string,
  commitSha: string
): Promise<void> {
  const state = await loadTicketState(ticketsDir, ticketId);
  if (!state) {
    throw new Error(`Ticket ${ticketId} not found`);
  }

  state.git.commits.push(commitSha);
  await saveTicketState(ticketsDir, state);
}

/**
 * Create sync context from environment
 */
export function createSyncContext(
  ticketsDir: string,
  repo: string
): SyncContext {
  return {
    fresh: createFreshworksClient(),
    gitea: createGiteaClient(),
    ticketsDir,
    repo,
  };
}
