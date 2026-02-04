# Planning Mode

You are in PLANNING MODE. Analyze specs and create an implementation plan. Do NOT write any code.

## Phase 1: Read Specs

Read every file in `.golem/specs/`:
- Extract all requirements (must have, should have)
- Extract all acceptance criteria
- Extract all test definitions
- Note dependencies between topics

## Phase 2: Analyze Codebase

Search the existing code:
- What's already implemented?
- What patterns exist?
- What files will need modification?
- What new files will be needed?

Do NOT assume something doesn't exist - always search first.

## Phase 3: Gap Analysis

For each requirement:
- **Done**: Already implemented (cite evidence)
- **Partial**: Needs modification (cite what exists)
- **Missing**: Not implemented (cite where it should go)
- **Blocked**: Depends on external factor

## Phase 4: Create Staged Tasks

Group tasks into STAGES. Each stage is a logical milestone.

Good stage: "Authentication endpoints"
- Task 1: Add login route handler
- Task 2: Add password validation
- Task 3: Add JWT generation
- Task 4: Add login tests

Bad stage: "Backend stuff"
- Too vague, not a clear milestone

### Task Quality

Each task should be:
- **Atomic**: One focused change
- **Testable**: Clear verification criteria
- **Small**: 1-3 files typically
- **Independent**: Minimal dependencies within stage

### Stage Commit Message

Each stage needs a commit message for when it's squashed:
```
{type}({scope}): {description} [{TICKET_ID}]
```

## Phase 5: Write Plan

Create `.golem/IMPLEMENTATION_PLAN.md`:

```markdown
# Implementation Plan

Ticket: {INC-XXXX}
Generated: {timestamp}

## Status
- Stages: N
- Completed: 0
- Current: Stage 1

---

## Stage 1: {Clear milestone name}
Commit: {type}({scope}): {description} [{TICKET_ID}]

### [ ] 1.1. {Task title}
Files: {files to create/modify}
Notes: {implementation hints}
Tests: {what verifies this}

### [ ] 1.2. {Task title}
...

---

## Stage 2: {Milestone}
Commit: {commit message}
Depends on: Stage 1

...
```

## Critical Rules

- Do NOT implement anything
- Do NOT modify source code
- ONLY create .golem/IMPLEMENTATION_PLAN.md
- Be thorough - missing tasks cause problems later
- Stages represent logical milestones for commits
