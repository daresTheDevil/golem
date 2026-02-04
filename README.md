# Golem

Personal agentic workflow manager. Integrates Freshworks tickets, Gitea issues, and Claude Code.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GOLEM WORKFLOW                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Freshworks          Local State           Gitea                   │
│   ┌─────────┐        ┌───────────┐        ┌─────────┐              │
│   │ INC-123 │◄──────►│.golem/    │◄──────►│ Issue   │              │
│   │ Ticket  │        │tickets/   │        │ #47     │              │
│   └─────────┘        │INC-123.yml│        └─────────┘              │
│                      └───────────┘                                  │
│                            │                                        │
│                            ▼                                        │
│                      ┌───────────┐                                  │
│                      │ Worktree  │                                  │
│                      │ fix/INC-  │                                  │
│                      │ 123-slug  │                                  │
│                      └───────────┘                                  │
│                            │                                        │
│            ┌───────────────┼───────────────┐                       │
│            ▼               ▼               ▼                        │
│      ┌──────────┐   ┌──────────┐   ┌──────────┐                    │
│      │/golem:   │   │/golem:   │   │/golem:   │                    │
│      │spec      │──►│plan      │──►│build     │                    │
│      └──────────┘   └──────────┘   └──────────┘                    │
│            │               │               │                        │
│            ▼               ▼               ▼                        │
│      ┌──────────┐   ┌──────────┐   ┌──────────┐                    │
│      │.golem/   │   │IMPLEMENT-│   │ wip:     │                    │
│      │specs/    │   │ATION_    │   │ commits  │──► squash          │
│      │*.md      │   │PLAN.md   │   └──────────┘   per stage        │
│      └──────────┘   └──────────┘                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Installation

```bash
pnpm install
pnpm run install:global
```

Configure credentials:
```bash
vim ~/.golem/.env
```

## Workflow

### 1. Get a ticket

```bash
# Import existing Fresh ticket
golem import INC-1234

# Or create new ticket
golem new "Fix API timeout issue"
```

### 2. Create worktree

```bash
golem worktree INC-1234
cd .golem/worktrees/fix/INC-1234-api-timeout
```

### 3. Define specs (in Claude)

```
/golem:spec
```

Interactive conversation to define requirements, tests, and constraints.

### 4. Create plan (in Claude)

```
/golem:plan
```

Generates `.golem/IMPLEMENTATION_PLAN.md` with staged tasks.

### 5. Build (CLI loop or Claude)

```bash
# CLI - loops until done
golem build

# Or in Claude - one task at a time
/golem:build
```

Each task gets a WIP commit. Each stage gets squashed.

### 6. Create PR

```bash
golem pr
```

## File Structure

```
.golem/
├── tickets/           # Local ticket state (YAML)
│   └── INC-1234.yaml
├── specs/             # Requirement specs
│   ├── auth.md
│   └── validation.md
├── worktrees/         # Git worktrees per ticket
│   └── fix/INC-1234-api-timeout/
├── AGENTS.md          # Operational commands (test/build/lint)
└── IMPLEMENTATION_PLAN.md  # Current task list
```

## Commands

### Terminal

| Command | Description |
|---------|-------------|
| `golem new <subject>` | Create new ticket |
| `golem import <INC-XXX>` | Import Fresh ticket |
| `golem list` | List tickets |
| `golem worktree [ticket]` | Create/show worktree |
| `golem build` | Run build loop |
| `golem squash` | Squash stage commits |
| `golem pr` | Create pull request |
| `golem sync` | Sync status to Fresh/Gitea |

### Claude Code

| Command | Description |
|---------|-------------|
| `/golem:spec` | Define specs interactively |
| `/golem:plan` | Generate implementation plan |
| `/golem:build` | Run one build iteration |
| `/golem:simplify` | Run code simplifier |
| `/golem:status` | Show current status |

## Environment Variables

```bash
# ~/.golem/.env
FRESH_DOMAIN=yourcompany.freshservice.com
FRESH_API_KEY=your_api_key
GITEA_URL=https://dev.pearlriverresort.com
GITEA_TOKEN=your_token
GITEA_ORG=CRDE
GITEA_REPO=default-repo
```
