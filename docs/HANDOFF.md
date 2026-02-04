# Golem Project Handoff

## What Is This?

Golem is a personal agentic workflow manager that integrates:
- **Freshservice** (ticketing)
- **Gitea** (issues/PRs/code)
- **Claude Code** (AI-assisted development)
- **Local state** (source of truth linking everything)

It replaces the old `golem-cc` with a hyper-focused tool for your specific workflow.

## Repository

GitHub: https://github.com/daresTheDevil/golem (private)

## Current State

### Working
- ✅ Freshservice API connection (sandbox instance)
- ✅ Gitea API connection (dev.pearlriverresort.com)
- ✅ `golem new` - create ticket in Fresh + Gitea with bi-directional links
- ✅ `golem import` - import existing Fresh ticket, creates linked Gitea issue
- ✅ Idempotency on import - won't create duplicate Gitea issues
- ✅ `golem worktree` - create git worktree for ticket (works with/without remote)
- ✅ `golem-api ticket:status X done` - resolves ticket in both Fresh and Gitea
- ✅ Local state files in `.golem/tickets/*.yaml`
- ✅ CLI installed globally (`golem` and `golem-api`)
- ✅ Claude Code slash commands (`/golem:spec`, `/golem:plan`, `/golem:build`, etc.)
- ✅ Conventional commit branch naming: `{type}/{ticketId}-{slug}` (e.g., `fix/INC-6-idempotency-check`)

### Not Yet Tested
- ⏳ `golem build` - run Claude in print mode loop
- ⏳ `golem plan` - generate implementation plan
- ⏳ `golem squash` - squash stage commits
- ⏳ `golem pr` - create PR for ticket
- ⏳ Full workflow: spec → plan → build loop

### Known Issues
- Labels on Gitea issues disabled (Gitea expects label IDs, not strings)
- Can't delete Fresh tickets via API (need `delete_ticket` privilege)

## Project Structure

```
/Users/dkay/code/golem-cc-new/
├── bin/
│   ├── golem              # Main bash CLI
│   └── install.sh         # Global installer
├── src/
│   ├── api/
│   │   ├── freshworks.ts  # Freshservice API client
│   │   └── gitea.ts       # Gitea API client
│   ├── sync/
│   │   └── ticket-sync.ts # Import/sync logic
│   ├── worktree/
│   │   └── manager.ts     # Git worktree operations
│   ├── cli/
│   │   └── index.ts       # golem-api CLI commands
│   └── types.ts           # TypeScript types
├── commands/golem/        # Claude Code slash commands
│   ├── spec.md
│   ├── plan.md
│   ├── build.md
│   ├── simplify.md
│   ├── status.md
│   └── help.md
├── golem/                 # Prompts and agents
│   ├── agents/
│   │   ├── spec-builder.md
│   │   └── code-simplifier.md
│   └── prompts/
│       ├── PROMPT_build.md
│       └── PROMPT_plan.md
├── docs/
│   ├── FRESHSERVICE_SETUP.md  # Detailed Fresh API setup guide
│   └── HANDOFF.md             # This file
└── .golem/
    └── tickets/           # Local ticket state files
```

## Environment

### Credentials Location
```
~/.golem/.env
```

### Required Environment Variables
```bash
# Freshworks/Freshservice
FRESH_DOMAIN=pearlriverresorthelpdesk-service-desk-sandbox.freshservice.com
FRESH_API_KEY=<redacted>

# Freshservice defaults for ticket creation
FRESH_DEFAULT_GROUP_ID=38000120203
FRESH_DEFAULT_CATEGORY=Applications
FRESH_SOURCE_ID=1002
FRESH_DEFAULT_EMAIL=ace-bot@pearlriverresort.com

# Gitea (on-prem)
GITEA_URL=https://dev.pearlriverresort.com
GITEA_TOKEN=<redacted>
GITEA_ORG=CRDE
GITEA_REPO=dashboard
```

### PATH Setup
In `~/.zshrc`:
```bash
case ":$PATH:" in
  *":$HOME/.local/bin:"*) ;;
  *) export PATH="$HOME/.local/bin:$PATH" ;;
esac
```

## Freshservice Configuration (IMPORTANT)

See `docs/FRESHSERVICE_SETUP.md` for full details. Key points:

1. **Agent needs both admin AND agent roles** - Account Admin alone can't access tickets via API
2. **Required ticket fields for creation**: `status`, `group_id`, `category`, `email`, `source`
3. **Required fields for closing**: `responder_id`, `resolution_notes`
4. **Custom source created**: "ACE (API)" with `choice_id: 1002`
5. **Valid filter**: Use `new_and_my_open` not `assigned_to_me`

### Your Roles
- Account Admin (38000126263)
- IT Operations (38000126321)
- IT Manager (38000126322)

### Key IDs
- Agent ID (dkay): `38001086138`
- Group ID (Development): `38000120203`
- Source ID (ACE API): `1002`
- Workspace ID: `2` (IT)

## Test Data Created

### Fresh Tickets (Sandbox)
- INC-2: "Test for API" → linked to Gitea #1
- INC-3: "Ticket created from API" (no Gitea link)
- INC-4: "Ticket created via Golem" → linked to Gitea #3
- INC-5: "Test golem new command" → linked to Gitea #5
- INC-6: "Add idempotency check..." → linked to Gitea #6 (RESOLVED)
- INC-7: "Test ticket close flow" → linked to Gitea #7 (RESOLVED)

### Gitea Issues (dashboard repo)
- #1: [INC-2] Test for API
- #3: [INC-4] Ticket created via API
- #5: [INC-5] Test golem new command
- #6: [INC-6] Add idempotency check to prevent duplicate Gitea issues
- #7: [INC-7] Test ticket close flow

### Test Project
- `~/code/test-worktree-project` - Used for testing worktree creation
- Has fake tickets TEST-1, TEST-2, TEST-3 with worktrees

## Commands Reference

### Terminal
```bash
golem help              # Show all commands
golem version           # Show version
golem init              # Initialize golem in current project

golem new "Subject"     # Create new ticket (interactive prompts for type/slug)
golem import INC-XXX    # Import existing Fresh ticket
golem worktree INC-XXX  # Create/switch to worktree for ticket
golem worktrees         # List all worktrees
golem status [INC-XXX]  # Show ticket or project status

golem-api fresh:test    # Test Fresh connection
golem-api fresh:list    # List your tickets
golem-api gitea:test    # Test Gitea connection
golem-api ticket:list   # List tracked tickets
golem-api ticket:get INC-XXX
golem-api ticket:status INC-XXX done --note "Resolution message"
```

### Claude Code
```
/golem:help      # Show help
/golem:status    # Show current status
/golem:spec      # Define specs (interactive)
/golem:plan      # Create implementation plan
/golem:build     # Run one build iteration
/golem:simplify  # Run code simplifier
```

## Next Steps

1. **Test the full workflow**: spec → plan → build loop
2. **Test `golem squash`** - squash commits before PR
3. **Test `golem pr`** - create PR for ticket
4. **Production setup**: Same Fresh config steps on prod instance
5. **Consider**: Adding label support to Gitea (need to create labels first, then use IDs)

## Build Commands

```bash
cd /Users/dkay/code/golem-cc-new
pnpm install      # Install deps
pnpm build        # Compile TypeScript
./bin/install.sh  # Reinstall globally (after changes)
```

## Recent Fixes (2026-02-04)

### Worktree Creation
- Fixed: Now works for repos without remotes (falls back to local branch → HEAD)
- Fixed: `set -e` bug where missing local `.env` caused silent exit

### Freshservice Integration
- Fixed: `golem new` now includes all required fields (status, source, group_id, category, email)
- Fixed: Closing tickets now sets `responder_id` (current agent) and `resolution_notes`
- Uses status 4 (Resolved) instead of 5 (Closed) for simpler workflow

### Idempotency
- Added `findIssueByTicketId()` to Gitea client
- Import checks local state first, then searches Gitea before creating
- Re-importing won't create duplicate issues

## Useful Debug Commands

```bash
# Check Fresh ticket details
curl -s -u "API_KEY:X" "https://DOMAIN/api/v2/tickets/ID" | python3 -m json.tool

# Check Fresh ticket notes
curl -s -u "API_KEY:X" "https://DOMAIN/api/v2/tickets/ID/conversations"

# Check Gitea issues
curl -s -H "Authorization: token TOKEN" "https://dev.pearlriverresort.com/api/v1/repos/CRDE/dashboard/issues?state=all"

# Check local ticket state
cat .golem/tickets/INC-2.yaml

# Get your agent ID
curl -s -u "API_KEY:X" "https://DOMAIN/api/v2/agents/me" | python3 -c "import sys,json; print(json.load(sys.stdin)['agent']['id'])"
```
