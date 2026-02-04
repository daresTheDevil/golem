/**
 * Core types for golem workflow
 */

// Ticket status across systems
export type TicketStatus =
  | 'new'           // Just created
  | 'spec'          // Defining specs
  | 'planning'      // Creating implementation plan
  | 'in-progress'   // Building
  | 'review'        // PR created, awaiting review
  | 'done'          // Merged and deployed
  | 'blocked';      // Waiting on external dependency

// Conventional commit types
export type CommitType = 'feat' | 'fix' | 'refactor' | 'docs' | 'test' | 'chore';

// The local source of truth linking Fresh ↔ Gitea ↔ Local
export interface TicketState {
  // Identifiers
  id: string;                    // Local ID (usually Fresh ticket ID)
  slug: string;                  // Human-readable slug for branch name

  // Freshworks
  fresh: {
    id: string;                  // e.g., "INC-1234"
    url: string;
    subject: string;
    description: string;
    priority: 1 | 2 | 3 | 4;     // 1=Urgent, 4=Low
    status: number;              // Fresh status codes
  } | null;

  // Gitea
  gitea: {
    repo: string;                // e.g., "CRDE/dashboard-api"
    issueNumber: number;
    url: string;
    prNumber?: number;
    prUrl?: string;
  } | null;

  // Local git
  git: {
    worktree: string;            // Path to worktree
    branch: string;              // Branch name
    commits: string[];           // Commit SHAs for this ticket
  };

  // Workflow state
  status: TicketStatus;
  type: CommitType;
  created: string;               // ISO timestamp
  updated: string;               // ISO timestamp

  // Spec/plan references
  specFile?: string;             // Path to spec file
  planFile?: string;             // Path to implementation plan
}

// Freshservice API types (subset we care about)
export interface FreshTicket {
  id: number;
  subject: string;
  description: string;
  description_text: string;
  status: number;
  priority: 1 | 2 | 3 | 4;
  ticket_type: 'Incident' | 'Service Request';
  created_at: string;
  updated_at: string;
  requester_id: number;
  responder_id: number;
  custom_fields: Record<string, unknown>;
}

export interface FreshTicketCreatePayload {
  subject: string;
  description: string;
  priority?: 1 | 2 | 3 | 4;
  status?: number;
  source?: number;
  email?: string;
  requester_id?: number;
  responder_id?: number;
  group_id?: number;
  category?: string;
  sub_category?: string;
  resolution_notes?: string;
  custom_fields?: Record<string, unknown>;
}

// Gitea API types (subset we care about)
export interface GiteaIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  html_url: string;
  created_at: string;
  updated_at: string;
  labels: { name: string; color: string }[];
  milestone?: { title: string };
}

export interface GiteaIssueCreatePayload {
  title: string;
  body: string;
  labels?: string[];
  milestone?: number;
}

export interface GiteaPullRequest {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed' | 'merged';
  html_url: string;
  head: { ref: string };
  base: { ref: string };
  merged: boolean;
  mergeable: boolean;
}

// CLI command context
export interface GolemContext {
  projectRoot: string;           // Where .golem/ lives
  golemDir: string;              // .golem/ path
  ticketsDir: string;            // .golem/tickets/
  specsDir: string;              // .golem/specs/
  worktreesDir: string;          // .golem/worktrees/
  currentTicket?: TicketState;   // If working on a ticket
}

// Sync operation result
export interface SyncResult {
  success: boolean;
  freshUpdated: boolean;
  giteaUpdated: boolean;
  localUpdated: boolean;
  error?: string;
}

// Build loop iteration result
export interface BuildIterationResult {
  taskCompleted: string | null;  // Task ID if completed
  allDone: boolean;              // No more tasks
  commits: string[];             // Commit SHAs from this iteration
  error?: string;
}
