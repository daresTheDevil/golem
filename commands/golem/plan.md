---
name: golem:plan
description: Create implementation plan from specs
allowed-tools: [Read, Write, Glob, Grep, Bash, Task]
---

<objective>
Spawn an agent team to analyze specs, explore the codebase from multiple angles, and create a robust implementation plan. Each teammate owns a layer/module, and a devil's advocate challenges the proposed architecture before the plan is finalized.
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

## Phase 1: Analyze Specs

Before spawning the team, read all specs and identify:
- The distinct layers/modules involved
- Key requirements and constraints
- Dependencies between specs

## Phase 2: Spawn Planning Team

Create an agent team based on the layers/modules identified:

```
Create an agent team to plan implementation for these specs.
Spawn teammates based on the layers involved, plus a devil's advocate.

Example for a typical web app:
1. **Frontend Planner** - Owns UI/UX implementation:
   - Component structure
   - State management
   - User interactions
   - Styling approach

2. **Backend Planner** - Owns API/service implementation:
   - Endpoint design
   - Data flow
   - Business logic
   - Error handling

3. **Data Planner** - Owns data layer:
   - Schema changes
   - Migrations
   - Query patterns
   - Data validation

4. **Devil's Advocate** - Challenges the architecture:
   - "This is overengineered for the requirements"
   - "What happens when X fails?"
   - "Why not use existing pattern Y?"
   - "This will be hard to test/maintain"

   Rules for Devil's Advocate:
   - Must articulate WHY something is problematic
   - Must propose a concrete alternative
   - Must back down when concern is adequately addressed
   - Goal is better architecture, not blocking progress

Adjust team composition based on actual project structure.
For a CLI tool: maybe Parser, Core Logic, Output Formatting.
For a mobile app: maybe UI, State, Network, Storage.
```

## Phase 3: Team Analysis

Each teammate analyzes their layer:

### Layer Planners investigate:
- What existing code can we reuse?
- What new components are needed?
- What's the gap between spec and current state?
- How does my layer integrate with others?
- What order should tasks be done?

### Devil's Advocate challenges:
- Is this architecture too complex?
- Are there simpler patterns we should use?
- What are the failure modes?
- Will this be maintainable?
- Are we gold-plating?

## Phase 4: Cross-Layer Synthesis

After individual analysis:
1. Teammates share their proposed tasks
2. Identify dependencies between layers
3. Devil's advocate challenges integration points
4. Resolve conflicts and simplify where possible
5. Agree on stage boundaries

## Phase 5: Generate Plan

Synthesize team findings into `.golem/IMPLEMENTATION_PLAN.md`:

```markdown
# Implementation Plan

Ticket: {INC-XXXX}
Generated: {ISO timestamp}
Based on: .golem/specs/*.md

## Status
- Stages: N
- Completed: 0
- Current: Stage 1

## Architecture Decisions
{Key decisions from team discussion}
{What the Devil's Advocate challenged and how it was resolved}

---

## Stage 1: {Stage Name}
Commit message: {type}({scope}): {description for squash commit}
Owner: {which layer this primarily affects}

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

---

## Risks & Mitigations
{What the Devil's Advocate identified as risks}
{How we plan to mitigate them}
```

## Phase 6: Cleanup & Sync

1. Clean up the agent team
2. Update ticket status:
   ```bash
   golem-api ticket:status $TICKET_ID planning --note "Implementation plan created with N stages"
   ```
3. Show next steps:
   ```
   Plan complete! Next steps:
   1. Review .golem/IMPLEMENTATION_PLAN.md
   2. Run /golem:build to start building
   ```

</process>

<success_criteria>
- [ ] All specs analyzed
- [ ] Agent team explored from multiple layer perspectives
- [ ] Devil's advocate challenged architecture
- [ ] Gap analysis completed
- [ ] Tasks grouped into logical stages
- [ ] Each task is atomic and testable
- [ ] Dependencies mapped correctly
- [ ] Architecture decisions documented
- [ ] Risks identified and mitigated
- [ ] .golem/IMPLEMENTATION_PLAN.md written
- [ ] Team cleaned up
- [ ] No code changes made (planning only)
</success_criteria>

<important>
- Do NOT implement anything in planning mode
- Do NOT modify source code
- ONLY create/update .golem/IMPLEMENTATION_PLAN.md
- The Devil's Advocate must actively challenge, not just observe
- Document architecture decisions so we remember WHY
- Document risks so we're prepared for them
- Clean up the team when done
</important>
