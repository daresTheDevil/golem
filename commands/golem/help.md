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

Golem integrates Freshworks tickets, Gitea issues, and local development into a unified workflow. Uses Claude Code agent teams for collaborative spec/plan/review phases.

## Commands

| Command | Description |
|---------|-------------|
| `/golem:spec` | Define specs with agent team (UX, Architect, Devil's Advocate) |
| `/golem:plan` | Create implementation plan with agent team (per-layer + Devil's Advocate) |
| `/golem:build` | Build lead + sequential builders (observable, interruptible) |
| `/golem:security` | Run automated security scans (gitleaks, semgrep, pnpm audit, trivy) |
| `/golem:review` | Security scans + code review agent team |
| `/golem:simplify` | Run code simplifier on files |
| `/golem:status` | Show current ticket/project status |
| `/golem:help` | Show this help |

---

## Default Workflow

### 1. Setup (CLI)
```bash
golem import INC-1234        # Import ticket from Freshservice
golem worktree               # Create isolated worktree for this ticket
cd .golem/worktrees/INC-1234 # Enter the worktree
claude                       # Start Claude Code
```

### 2. Spec Phase (`/golem:spec`)

Agent team explores requirements from multiple angles:

```
You: /golem:spec

[Agent team spawns]
├── UX Advocate: "Who are the users? What's the simplest solution?"
├── Architect: "What's the technical approach? What patterns fit?"
└── Devil's Advocate: "Do we need this? What's the simpler alternative?"

[Team debates and synthesizes]

Output:
├── .golem/specs/authentication.md
├── .golem/specs/validation.md
└── .golem/AGENTS.md (test/build/lint commands)
```

### 3. Plan Phase (`/golem:plan`)

Agent team creates staged implementation plan:

```
You: /golem:plan

[Agent team spawns based on project layers]
├── Frontend Planner: "Component structure, state management"
├── Backend Planner: "API design, business logic"
├── Data Planner: "Schema, migrations, queries"
└── Devil's Advocate: "Too complex? Better patterns?"

[Team maps requirements to tasks]

Output:
└── .golem/IMPLEMENTATION_PLAN.md
    ├── Stage 1: Setup (3 tasks) → "feat(auth): add login endpoint"
    ├── Stage 2: Core Logic (5 tasks) → "feat(auth): implement validation"
    └── Stage 3: Integration (2 tasks) → "feat(auth): wire up frontend"
```

### 4. Build Phase (`/golem:build`)

Lead orchestrates builders, you observe and intervene:

```
You: /golem:build

[Build lead starts]
=== Task 1.1: Create auth service ===
Spawning builder...

[Builder works - you can watch]
├── Writing tests (red phase)
├── Implementing (green phase)
├── Running validation gates
├── Simplifying code
└── Reporting: SUCCESS

✓ Task 1.1 complete
=== Task 1.2: Add password validation ===
Spawning builder...

[If something breaks]
⚠ Task 1.3 BLOCKED
Reason: Cannot connect to database

Options:
1. Skip and continue
2. Provide guidance
3. Fix and retry

You: The DB is on port 5433, not 5432
[Lead relays to builder, continues]

[Stage complete]
=== Stage 1 Complete ===
Squashing commits...
```

**Build controls:**
- `skip` - Skip blocked task
- `retry` - Retry current task
- `stop` - Pause build
- `status` - Show progress
- `Shift+Up/Down` - Message builder directly

### 5. Review Phase (`/golem:review`)

Security scans first, then agent team review:

```
You: /golem:review

[Security gate - automated tools]
=== SECRETS SCAN (gitleaks) ===
✓ No secrets detected

=== SAST SCAN (semgrep) ===
✓ 0 findings

=== DEPENDENCY SCAN (pnpm audit) ===
✓ 0 high, 0 critical

[Agent team spawns for code review]
├── Security Patterns: Auth logic, input validation
├── Performance: Query patterns, algorithms
├── Correctness: Spec match, edge cases
├── Tests: Coverage, quality
└── Devil's Advocate: Overengineered? Maintainable?

[Team reports findings]

Output:
└── .golem/REVIEW_REPORT.md
    ├── Verdict: APPROVED (or BLOCKED)
    ├── 0 critical, 1 major, 3 minor issues
    └── Recommendations for future work
```

### 6. Ship (CLI)
```bash
golem pr                     # Create pull request
# Review, merge, done
```

---

## Files Generated

| File | Created By | Purpose |
|------|------------|---------|
| `.golem/specs/*.md` | /golem:spec | Requirements for each topic |
| `.golem/AGENTS.md` | /golem:spec | Test/build/lint commands |
| `.golem/IMPLEMENTATION_PLAN.md` | /golem:plan | Staged task list |
| `.golem/SECURITY_REPORT.md` | /golem:security | Scan results |
| `.golem/REVIEW_REPORT.md` | /golem:review | Code review findings |

---

## Agent Teams

All phases use a **Devil's Advocate** who:
- Must articulate WHY something is problematic
- Must propose a concrete alternative
- Must back down when concern is addressed
- Goal: better thinking, not blocking progress

---

## Environment Setup

```bash
# ~/.golem/.env
FRESH_DOMAIN=yourcompany.freshservice.com
FRESH_API_KEY=your_api_key
GITEA_URL=https://gitea.example.com
GITEA_TOKEN=your_token
GITEA_ORG=your-org
GITEA_REPO=your-repo
```

```json
// Claude Code settings.json - enable agent teams
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```
</response>
