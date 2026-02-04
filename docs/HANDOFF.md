# Golem Project Handoff

## What Is This?

Golem is a personal agentic workflow manager that integrates:
- **Freshservice** (ticketing)
- **Gitea** (issues/PRs/code)
- **Claude Code** (AI-assisted development)
- **Local state** (source of truth linking everything)

It replaces the old `golem-cc` with a hyper-focused tool for your specific workflow.

## Current State

### Working
- ✅ Freshservice API connection (sandbox instance)
- ✅ Gitea API connection (dev.pearlriverresort.com)
- ✅ Import Fresh ticket → creates linked Gitea issue
- ✅ Bi-directional links (Fresh note → Gitea, Gitea body → Fresh)
- ✅ Local state files in `.golem/tickets/*.yaml`
- ✅ CLI installed globally (`golem` and `golem-api`)
- ✅ Claude Code slash commands (`/golem:spec`, `/golem:plan`, `/golem:build`, etc.)

### Not Yet Tested
- ⏳ `golem new` - create ticket from scratch (API code exists)
- ⏳ `golem worktree` - create git worktree for ticket
- ⏳ `golem build` - run Claude in print mode loop
- ⏳ `golem plan` - generate implementation plan
- ⏳ `golem squash` - squash stage commits
- ⏳ Status sync updates (updating Fresh/Gitea as work progresses)

### Known Issues
- Labels on Gitea issues disabled (Gitea expects label IDs, not strings)
- No idempotency check - re-running import can create duplicate Gitea issues
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
        ├── INC-2.yaml
        └── INC-4.yaml
```

## Environment

### Credentials Location
```
~/.golem/.env
```

### Current Values
```bash
FRESH_DOMAIN=pearlriverresorthelpdesk-service-desk-sandbox.freshservice.com
FRESH_API_KEY=<redacted>
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
2. **Required ticket fields**: `group_id`, `category` (in addition to subject/description)
3. **Custom source created**: "ACE (API)" with `choice_id: 1002`
4. **Valid filter**: Use `new_and_my_open` not `assigned_to_me`

### Your Roles
- Account Admin (38000126263)
- IT Operations (38000126321)
- IT Manager (38000126322)

### Key IDs
- Group ID (Development): `38000120203`
- Source ID (ACE API): `1002`
- Workspace ID: `2` (IT)

## Test Data Created

### Fresh Tickets
- INC-2: "Test for API" → linked to Gitea #1
- INC-3: "Ticket created from API" (no Gitea link)
- INC-4: "Ticket created via Golem" → linked to Gitea #3

### Gitea Issues
- #1: [INC-2] Test for API
- #3: [INC-4] Ticket created via API
- #4: Test issue (orphan, can delete)

## Commands Reference

### Terminal
```bash
golem help              # Show all commands
golem version           # Show version
golem init              # Initialize in project

golem-api fresh:test    # Test Fresh connection
golem-api fresh:list    # List your tickets
golem-api gitea:test    # Test Gitea connection

golem-api ticket:import INC-XXX --type fix --slug my-slug --repo dashboard
golem-api ticket:list
golem-api ticket:get INC-XXX
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

1. **Test worktree creation**: `golem worktree INC-2`
2. **Test the full workflow**: spec → plan → build loop
3. **Add idempotency**: Check if Gitea issue exists before creating
4. **Production setup**: Same Fresh config steps on prod instance
5. **Consider**: Adding label support to Gitea (need to create labels first, then use IDs)

## Build Commands

```bash
cd /Users/dkay/code/golem-cc-new
pnpm install      # Install deps
pnpm build        # Compile TypeScript
./bin/install.sh  # Reinstall globally (after changes)
```

## Useful Debug Commands

```bash
# Check Fresh ticket details
source ~/.golem/.env && curl -s -u "$FRESH_API_KEY:X" "https://$FRESH_DOMAIN/api/v2/tickets/2" | python3 -m json.tool

# Check Fresh ticket notes
source ~/.golem/.env && curl -s -u "$FRESH_API_KEY:X" "https://$FRESH_DOMAIN/api/v2/tickets/2/conversations"

# Check Gitea issues
source ~/.golem/.env && curl -s -H "Authorization: token $GITEA_TOKEN" "https://dev.pearlriverresort.com/api/v1/repos/CRDE/dashboard/issues?state=all"

# Check local ticket state
cat .golem/tickets/INC-2.yaml
```
