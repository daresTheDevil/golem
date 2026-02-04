#!/usr/bin/env node
/**
 * golem-api CLI
 *
 * TypeScript helper for API operations, called by the main golem bash script.
 * Handles JSON parsing and API communication cleanly.
 */

import { program } from 'commander';
import chalk from 'chalk';
import { createSyncContext, createLinkedTicket, importFreshTicket, updateTicketStatus, loadTicketState, recordCommit } from '../sync/ticket-sync.js';
import { createWorktree, removeWorktree, getRepoRoot, listWorktrees, squashCommits, pushBranch } from '../worktree/manager.js';
import { createFreshworksClient } from '../api/freshworks.js';
import { createGiteaClient } from '../api/gitea.js';
import type { CommitType, TicketStatus } from '../types.js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Load .env from project root or home
import { config } from 'dotenv';
config({ path: join(process.cwd(), '.env') });
config({ path: join(process.env.HOME || '', '.golem/.env') });

const golemDir = join(process.cwd(), '.golem');
const ticketsDir = join(golemDir, 'tickets');

program
  .name('golem-api')
  .description('Golem API helper for Freshworks/Gitea integration')
  .version('0.1.0');

// ============ Ticket Commands ============

program
  .command('ticket:new')
  .description('Create a new linked ticket in Fresh + Gitea')
  .requiredOption('-s, --subject <subject>', 'Ticket subject')
  .requiredOption('-d, --description <description>', 'Ticket description')
  .requiredOption('-t, --type <type>', 'Commit type (feat|fix|refactor|docs|test|chore)')
  .requiredOption('--slug <slug>', 'Human-readable slug for branch name')
  .option('-p, --priority <priority>', 'Priority (1-4)', '3')
  .option('-r, --repo <repo>', 'Gitea repo (default from GITEA_REPO env)')
  .action(async (opts) => {
    try {
      const repo = opts.repo || process.env.GITEA_REPO;
      if (!repo) {
        console.error(chalk.red('Error: --repo required or set GITEA_REPO'));
        process.exit(1);
      }

      const ctx = createSyncContext(ticketsDir, repo);
      const ticket = await createLinkedTicket(ctx, {
        subject: opts.subject,
        description: opts.description,
        type: opts.type as CommitType,
        slug: opts.slug,
        priority: parseInt(opts.priority) as 1 | 2 | 3 | 4,
      });

      console.log(chalk.green(`✓ Created ticket ${ticket.id}`));
      console.log(chalk.dim(`  Fresh: ${ticket.fresh?.url}`));
      console.log(chalk.dim(`  Gitea: ${ticket.gitea?.url}`));
      console.log(chalk.dim(`  Branch: ${ticket.git.branch}`));

      // Output JSON for bash script to parse
      console.log(JSON.stringify(ticket));
    } catch (e) {
      console.error(chalk.red(`Error: ${e}`));
      process.exit(1);
    }
  });

program
  .command('ticket:import <freshId>')
  .description('Import existing Fresh ticket and create linked Gitea issue')
  .requiredOption('-t, --type <type>', 'Commit type (feat|fix|refactor|docs|test|chore)')
  .requiredOption('--slug <slug>', 'Human-readable slug for branch name')
  .option('-r, --repo <repo>', 'Gitea repo (default from GITEA_REPO env)')
  .action(async (freshId, opts) => {
    try {
      const repo = opts.repo || process.env.GITEA_REPO;
      if (!repo) {
        console.error(chalk.red('Error: --repo required or set GITEA_REPO'));
        process.exit(1);
      }

      const ctx = createSyncContext(ticketsDir, repo);
      const ticket = await importFreshTicket(ctx, freshId, {
        type: opts.type as CommitType,
        slug: opts.slug,
      });

      console.log(chalk.green(`✓ Imported ticket ${ticket.id}`));
      console.log(chalk.dim(`  Fresh: ${ticket.fresh?.url}`));
      console.log(chalk.dim(`  Gitea: ${ticket.gitea?.url}`));
      console.log(chalk.dim(`  Branch: ${ticket.git.branch}`));

      console.log(JSON.stringify(ticket));
    } catch (e) {
      console.error(chalk.red(`Error: ${e}`));
      process.exit(1);
    }
  });

program
  .command('ticket:status <ticketId> <status>')
  .description('Update ticket status and sync to Fresh/Gitea')
  .option('-n, --note <note>', 'Status note')
  .option('-r, --repo <repo>', 'Gitea repo')
  .action(async (ticketId, status, opts) => {
    try {
      const repo = opts.repo || process.env.GITEA_REPO;
      if (!repo) {
        console.error(chalk.red('Error: --repo required or set GITEA_REPO'));
        process.exit(1);
      }

      const ctx = createSyncContext(ticketsDir, repo);
      const result = await updateTicketStatus(ctx, ticketId, status as TicketStatus, opts.note);

      if (result.success) {
        console.log(chalk.green(`✓ Updated ${ticketId} to ${status}`));
        if (result.freshUpdated) console.log(chalk.dim('  Fresh updated'));
        if (result.giteaUpdated) console.log(chalk.dim('  Gitea updated'));
      } else {
        console.error(chalk.red(`Error: ${result.error}`));
        process.exit(1);
      }
    } catch (e) {
      console.error(chalk.red(`Error: ${e}`));
      process.exit(1);
    }
  });

program
  .command('ticket:get <ticketId>')
  .description('Get ticket state as JSON')
  .action(async (ticketId) => {
    try {
      const ticket = await loadTicketState(ticketsDir, ticketId);
      if (!ticket) {
        console.error(chalk.red(`Ticket ${ticketId} not found`));
        process.exit(1);
      }
      console.log(JSON.stringify(ticket, null, 2));
    } catch (e) {
      console.error(chalk.red(`Error: ${e}`));
      process.exit(1);
    }
  });

program
  .command('ticket:list')
  .description('List all tickets')
  .option('--status <status>', 'Filter by status')
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    try {
      const { readdir } = await import('node:fs/promises');
      const files = await readdir(ticketsDir).catch(() => []);
      const tickets = [];

      for (const file of files) {
        if (!file.endsWith('.yaml')) continue;
        const ticketId = file.replace('.yaml', '');
        const ticket = await loadTicketState(ticketsDir, ticketId);
        if (ticket && (!opts.status || ticket.status === opts.status)) {
          tickets.push(ticket);
        }
      }

      if (opts.json) {
        console.log(JSON.stringify(tickets, null, 2));
      } else {
        if (tickets.length === 0) {
          console.log(chalk.dim('No tickets found'));
        } else {
          for (const t of tickets) {
            const statusColor = t.status === 'done' ? chalk.green
              : t.status === 'in-progress' ? chalk.yellow
              : t.status === 'blocked' ? chalk.red
              : chalk.dim;
            console.log(`${chalk.bold(t.id)} ${statusColor(`[${t.status}]`)} ${t.fresh?.subject || t.slug}`);
            console.log(chalk.dim(`  ${t.git.branch}`));
          }
        }
      }
    } catch (e) {
      console.error(chalk.red(`Error: ${e}`));
      process.exit(1);
    }
  });

// ============ Worktree Commands ============

program
  .command('worktree:create <ticketId>')
  .description('Create git worktree for a ticket')
  .option('-b, --base <branch>', 'Base branch (default: main)')
  .action(async (ticketId, opts) => {
    try {
      const ticket = await loadTicketState(ticketsDir, ticketId);
      if (!ticket) {
        console.error(chalk.red(`Ticket ${ticketId} not found`));
        process.exit(1);
      }

      const path = await createWorktree(ticket, { baseBranch: opts.base });
      console.log(chalk.green(`✓ Created worktree at ${path}`));
      console.log(path); // For bash to capture
    } catch (e) {
      console.error(chalk.red(`Error: ${e}`));
      process.exit(1);
    }
  });

program
  .command('worktree:list')
  .description('List all worktrees')
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    try {
      const worktrees = listWorktrees();
      if (opts.json) {
        console.log(JSON.stringify(worktrees, null, 2));
      } else {
        for (const wt of worktrees) {
          console.log(`${chalk.bold(wt.branch)}`);
          console.log(chalk.dim(`  ${wt.path}`));
        }
      }
    } catch (e) {
      console.error(chalk.red(`Error: ${e}`));
      process.exit(1);
    }
  });

program
  .command('worktree:remove <path>')
  .description('Remove a worktree')
  .action(async (path) => {
    try {
      await removeWorktree(path);
      console.log(chalk.green(`✓ Removed worktree`));
    } catch (e) {
      console.error(chalk.red(`Error: ${e}`));
      process.exit(1);
    }
  });

// ============ Git Commands ============

program
  .command('git:squash <ticketId>')
  .description('Squash all commits for a ticket into one')
  .requiredOption('-m, --message <message>', 'Commit message')
  .option('-b, --base <branch>', 'Base branch')
  .action(async (ticketId, opts) => {
    try {
      const ticket = await loadTicketState(ticketsDir, ticketId);
      if (!ticket) {
        console.error(chalk.red(`Ticket ${ticketId} not found`));
        process.exit(1);
      }

      const repoRoot = getRepoRoot();
      const worktreePath = join(repoRoot, ticket.git.worktree);

      const sha = await squashCommits(worktreePath, opts.message, opts.base);
      console.log(chalk.green(`✓ Squashed to ${sha.slice(0, 8)}`));
      console.log(sha);
    } catch (e) {
      console.error(chalk.red(`Error: ${e}`));
      process.exit(1);
    }
  });

program
  .command('git:push <ticketId>')
  .description('Push ticket branch to remote')
  .option('-f, --force', 'Force push (with lease)')
  .action(async (ticketId, opts) => {
    try {
      const ticket = await loadTicketState(ticketsDir, ticketId);
      if (!ticket) {
        console.error(chalk.red(`Ticket ${ticketId} not found`));
        process.exit(1);
      }

      const repoRoot = getRepoRoot();
      const worktreePath = join(repoRoot, ticket.git.worktree);

      await pushBranch(worktreePath, opts.force);
      console.log(chalk.green(`✓ Pushed ${ticket.git.branch}`));
    } catch (e) {
      console.error(chalk.red(`Error: ${e}`));
      process.exit(1);
    }
  });

program
  .command('git:commit <ticketId> <sha>')
  .description('Record a commit against a ticket')
  .action(async (ticketId, sha) => {
    try {
      await recordCommit(ticketsDir, ticketId, sha);
      console.log(chalk.green(`✓ Recorded commit ${sha.slice(0, 8)}`));
    } catch (e) {
      console.error(chalk.red(`Error: ${e}`));
      process.exit(1);
    }
  });

// ============ API Test Commands ============

program
  .command('fresh:test')
  .description('Test Freshworks API connection')
  .action(async () => {
    try {
      const client = createFreshworksClient();
      const tickets = await client.getMyTickets();
      console.log(chalk.green(`✓ Connected to Freshworks`));
      console.log(chalk.dim(`  Found ${tickets.length} tickets assigned to you`));
    } catch (e) {
      console.error(chalk.red(`Error: ${e}`));
      process.exit(1);
    }
  });

program
  .command('fresh:list')
  .description('List your Freshworks tickets')
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    try {
      const client = createFreshworksClient();
      const tickets = await client.getMyTickets();

      if (opts.json) {
        console.log(JSON.stringify(tickets, null, 2));
      } else {
        for (const t of tickets) {
          const id = client.constructor.prototype.constructor.formatTicketId(t.id, t.ticket_type);
          console.log(`${chalk.bold(id)} ${t.subject}`);
          console.log(chalk.dim(`  Priority: ${t.priority} | Status: ${t.status}`));
        }
      }
    } catch (e) {
      console.error(chalk.red(`Error: ${e}`));
      process.exit(1);
    }
  });

program
  .command('gitea:test')
  .description('Test Gitea API connection')
  .action(async () => {
    try {
      const client = createGiteaClient();
      const repos = await client.listOrgRepos();
      console.log(chalk.green(`✓ Connected to Gitea`));
      console.log(chalk.dim(`  Found ${repos.length} repos in org`));
    } catch (e) {
      console.error(chalk.red(`Error: ${e}`));
      process.exit(1);
    }
  });

program.parse();
