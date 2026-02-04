# Golem

Personal agentic workflow manager. Integrates Freshservice tickets, Gitea issues, and Claude Code for a unified development workflow.

## Installation

```bash
# Install globally via npm
npm install -g golem-cc

# Or run directly with pnpm
pnpm dlx golem-cc
```

After installing, run the setup:

```bash
# Check your installation
golem doctor

# Configure credentials
vim ~/.golem/.env
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GOLEM WORKFLOW                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Freshservice          Local State           Gitea                 │
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

## Quick Start

### 1. Initialize a project

```bash
cd your-project
golem init
```

### 2. Get a ticket

```bash
# Import existing Freshservice ticket
golem import INC-1234

# Or create new ticket
golem new "Fix API timeout issue"
```

### 3. Create worktree

```bash
golem worktree INC-1234
cd .golem/worktrees/fix/INC-1234-api-timeout
```

### 4. Define specs (in Claude Code)

```
/golem:spec
```

Interactive conversation to define requirements, tests, and constraints.

### 5. Create plan (in Claude Code)

```
/golem:plan
```

Generates `.golem/IMPLEMENTATION_PLAN.md` with staged tasks.

### 6. Build (CLI loop or Claude Code)

```bash
# CLI - loops until done
golem build

# Or in Claude Code - one task at a time
/golem:build
```

Each task gets a WIP commit. Each stage gets squashed.

### 7. Create PR

```bash
golem pr
```

## Commands

### Terminal

| Command | Description |
|---------|-------------|
| `golem new <subject>` | Create new ticket |
| `golem import <INC-XXX>` | Import Freshservice ticket |
| `golem list` | List tracked tickets |
| `golem status [ticket]` | Show ticket or project status |
| `golem worktree [ticket]` | Create/show worktree |
| `golem worktrees` | List all worktrees |
| `golem build` | Run autonomous build loop |
| `golem plan` | Generate implementation plan |
| `golem simplify [files]` | Run code simplifier |
| `golem squash` | Squash stage commits |
| `golem pr` | Create pull request |
| `golem sync` | Sync status to Freshservice/Gitea |
| `golem config` | Show current configuration |
| `golem doctor` | Diagnose setup issues |
| `golem init` | Initialize golem in current project |
| `golem help` | Show help |

### Claude Code

| Command | Description |
|---------|-------------|
| `/golem:spec` | Define specs interactively |
| `/golem:plan` | Generate implementation plan |
| `/golem:build` | Run one build iteration |
| `/golem:simplify` | Run code simplifier |
| `/golem:status` | Show current status |
| `/golem:config` | Show configuration |
| `/golem:doctor` | Diagnose setup issues |
| `/golem:help` | Show help |

## Configuration

### Environment Variables

```bash
# ~/.golem/.env

# Freshservice
FRESH_DOMAIN=yourcompany.freshservice.com
FRESH_API_KEY=your_api_key
FRESH_DEFAULT_GROUP_ID=12345          # Optional
FRESH_DEFAULT_CATEGORY=Applications   # Optional
FRESH_SOURCE_ID=1002                  # Optional
FRESH_DEFAULT_EMAIL=bot@example.com   # Optional

# Gitea
GITEA_URL=https://gitea.example.com
GITEA_TOKEN=your_token
GITEA_ORG=your-org
GITEA_REPO=default-repo               # Can be overridden per-project
```

### Project Structure

```
.golem/
├── tickets/           # Local ticket state (YAML)
│   └── INC-1234.yaml
├── specs/             # Requirement specs
│   ├── feature.md
│   └── validation.md
├── worktrees/         # Git worktrees per ticket
│   └── fix/INC-1234-api-timeout/
├── AGENTS.md          # Operational commands (test/build/lint)
└── IMPLEMENTATION_PLAN.md  # Current task list
```

## License

MIT
