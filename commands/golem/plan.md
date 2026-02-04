---
name: golem:plan
description: Create implementation plan from specs
allowed-tools: [Read, Write, Glob, Grep, Bash]
---

<objective>
Analyze specs versus existing code and create .golem/IMPLEMENTATION_PLAN.md with prioritized, staged tasks.
</objective>

<execution_context>
@~/.golem/prompts/PROMPT_plan.md
</execution_context>

<context>
Current ticket:
```bash
TICKET_ID=$(basename "$(pwd)" | grep -oE '(INC|SR)-[0-9]+' || echo "")
if [ -n "$TICKET_ID" ]; then
  cat .golem/tickets/$TICKET_ID.yaml 2>/dev/null
fi
```

Load all specs:
```bash
for f in .golem/specs/*.md; do echo "=== $f ==="; cat "$f"; echo; done 2>/dev/null || echo "No specs found - run /golem:spec first"
```

Load operational guide:
```bash
cat .golem/AGENTS.md 2>/dev/null || echo "No AGENTS.md found"
```

Existing plan (if any):
```bash
cat .golem/IMPLEMENTATION_PLAN.md 2>/dev/null || echo "No existing plan"
```
</context>

<process>

## 1. Read All Specs

Read each file in `.golem/specs/` completely. Extract:
- Concrete requirements (must have, should have)
- Acceptance criteria and tests
- Technical constraints
- Dependencies between specs

## 2. Analyze Existing Code

Search the codebase to understand current state:
- What's already implemented?
- Current architecture and patterns
- Reusable components
- Where do changes need to go?

## 3. Gap Analysis

For each requirement, determine:
- **Done**: Already implemented and tested
- **Partial**: Partially implemented, needs completion
- **Missing**: Not implemented at all
- **Blocked**: Depends on something not yet built

## 4. Generate Staged Tasks

Create tasks grouped into STAGES. Each stage represents a logical milestone that, when complete, should be squashed into a single commit.

Tasks within a stage:
- Atomic - completable in one focused session
- Testable - has clear verification
- Affects 1-3 files typically
- Minimal dependencies

**Bad task**: "Implement authentication"
**Good task**: "Add password validation function with min length check"

## 5. Prioritize

Order stages by:
1. **Critical path** - What blocks other work?
2. **Dependencies** - What must be built first?
3. **Risk** - Tackle unknowns early
4. **Value** - Core functionality before nice-to-haves

## 6. Write Plan

Create `.golem/IMPLEMENTATION_PLAN.md`:

```markdown
# Implementation Plan

Ticket: {INC-XXXX}
Generated: {ISO timestamp}
Based on: .golem/specs/*.md

## Status
- Stages: N
- Completed: 0
- Current: Stage 1

---

## Stage 1: {Stage Name}
Commit message: {type}({scope}): {description for squash commit}

### [ ] 1.1. {Task title}
Files: {expected files}
Notes: {implementation hints}
Tests: {what tests verify this}

### [ ] 1.2. {Task title}
Files: {files}
Notes: {notes}
Depends on: 1.1

---

## Stage 2: {Stage Name}
Commit message: {type}({scope}): {description}
Depends on: Stage 1

### [ ] 2.1. {Task title}
Files: {files}
Notes: {notes}

...
```

## 7. Sync Status

Update ticket status:
```bash
golem-api ticket:status $TICKET_ID planning --note "Implementation plan created with N stages"
```

</process>

<success_criteria>
- [ ] All specs analyzed
- [ ] Gap analysis completed
- [ ] Tasks grouped into logical stages
- [ ] Each task is atomic and testable
- [ ] Dependencies mapped correctly
- [ ] .golem/IMPLEMENTATION_PLAN.md written
- [ ] No code changes made (planning only)
</success_criteria>

<important>
- Do NOT implement anything in planning mode
- Do NOT modify source code
- ONLY create/update .golem/IMPLEMENTATION_PLAN.md
- Stages should represent logical milestones
- Each stage gets squashed to one commit when complete
</important>
