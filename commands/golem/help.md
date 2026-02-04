---
name: golem:help
description: Show all golem commands and usage
allowed-tools: []
---

<objective>
Display help information for all golem commands.
</objective>

<response>
# Golem - Personal Workflow Manager

Golem integrates Freshworks tickets, Gitea issues, and local development into a unified workflow.

## Claude Code Commands (inside Claude)

| Command | Description |
|---------|-------------|
| `/golem:spec` | Define specs through guided conversation |
| `/golem:plan` | Create implementation plan from specs |
| `/golem:build` | Run build loop (implement → test → simplify → commit) |
| `/golem:simplify` | Run code simplifier on files |
| `/golem:status` | Show current ticket/project status |
| `/golem:help` | Show this help |

## CLI Commands (terminal)

```bash
# Ticket Management
golem new "description"           # Create new ticket + issue
golem import INC-1234             # Import existing Fresh ticket
golem list                        # List all tickets
golem status                      # Show current ticket status

# Worktree Management
golem worktree                    # Create worktree for current ticket
golem worktree INC-1234           # Create worktree for specific ticket
golem worktrees                   # List all worktrees

# Build Loop
golem build                       # Run build loop (spawns Claude)
golem plan                        # Generate plan (spawns Claude)

# Utilities
golem simplify [files]            # Run simplifier
golem sync                        # Sync ticket status to Fresh/Gitea
```

## Typical Workflow

1. **Get a ticket**: `golem import INC-1234` or `golem new "fix api timeout"`
2. **Create worktree**: `golem worktree`
3. **Define specs**: `/golem:spec` (in Claude)
4. **Create plan**: `/golem:plan` (in Claude)
5. **Build**: `/golem:build` (in Claude) or `golem build` (CLI loop)
6. **Review**: Create PR, sync status
7. **Done**: Merge, close ticket

## Environment Variables

Set in `~/.golem/.env`:

```bash
FRESH_DOMAIN=yourcompany.freshservice.com
FRESH_API_KEY=your_api_key
GITEA_URL=https://dev.pearlriverresort.com
GITEA_TOKEN=your_token
GITEA_ORG=CRDE
GITEA_REPO=default-repo
```
</response>
