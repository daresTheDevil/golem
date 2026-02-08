---
name: golem:spec
description: Build project specs through guided conversation
allowed-tools: [Read, Write, Glob, Grep, Bash, AskUserQuestion, Task]
---

<objective>
Spawn an agent team to explore requirements from multiple angles, challenge assumptions, and generate robust specs. The team synthesizes findings into spec files that form the foundation for planning and building.
</objective>

<execution_context>
@~/.golem/agents/spec-builder.md
</execution_context>

<context>
Current ticket (if any):
```bash
TICKET_ID=$(basename "$(pwd)" | grep -oE '(INC|SR)-[0-9]+' || echo "")
if [ -n "$TICKET_ID" ]; then
  cat .golem/tickets/$TICKET_ID.yaml 2>/dev/null || echo "No ticket state found"
else
  echo "Not in a ticket worktree"
fi
```

Current specs:
```bash
ls -la .golem/specs/ 2>/dev/null || echo "No specs directory yet"
```

Project structure:
```bash
if [ -f package.json ]; then echo "Node/TypeScript project"; head -30 package.json; fi
if [ -f pyproject.toml ]; then echo "Python project"; head -30 pyproject.toml; fi
if [ -f Cargo.toml ]; then echo "Rust project"; head -30 Cargo.toml; fi
```
</context>

<process>

## Phase 1: Gather Initial Context

Before spawning the team, gather baseline information:

1. If in a ticket worktree: read the ticket description
2. If NOT in a ticket worktree: ask what we're building
3. Get a rough sense of scope and purpose

## Phase 2: Spawn Spec Team

Create an agent team with three specialized teammates:

```
Create an agent team to explore requirements for this feature/fix.
Spawn three teammates:

1. **UX Advocate** - Focuses on user experience and usability:
   - Who are the users?
   - What's their workflow?
   - What's the simplest interface that solves the problem?
   - Where will users get confused or frustrated?

2. **Architect** - Focuses on technical design:
   - What's the system architecture?
   - How does this fit into existing code?
   - What are the technical constraints?
   - What are the integration points?

3. **Devil's Advocate** - Actively challenges assumptions:
   - "Do we actually need this?"
   - "What's the simplest thing that could work?"
   - "What happens when X fails?"
   - "Why not use existing solution Y?"

   Rules for Devil's Advocate:
   - Must articulate WHY something is problematic
   - Must propose a concrete alternative
   - Must back down when concern is adequately addressed
   - Goal is better thinking, not blocking progress

Have them explore the problem space simultaneously, share findings,
and challenge each other's assumptions. The debate should surface
requirements we'd otherwise miss.
```

## Phase 3: Team Exploration

Let the team explore these questions:

### UX Advocate investigates:
- What's the actual problem users face?
- What's the minimum viable solution?
- What edge cases will users encounter?
- What error states need handling?

### Architect investigates:
- What existing code/patterns can we reuse?
- What new components are needed?
- What are the dependencies?
- What technical constraints exist?

### Devil's Advocate challenges:
- Is this feature actually necessary?
- Are we overengineering?
- What's the cost of NOT doing this?
- What simpler alternatives exist?

## Phase 4: Synthesize Findings

After team exploration, synthesize into topics:

1. Review findings from all three perspectives
2. Identify 1-5 distinct topics of concern
3. Each topic should pass the "no AND test"
4. Resolve any conflicts between teammates

## Phase 5: Generate Spec Files

For each topic, write to `.golem/specs/{topic-name}.md`:

```markdown
# {Topic Name}

Ticket: {INC-XXXX} (if applicable)

## Purpose
{One paragraph explaining what this covers and why}

## Requirements

### Must Have
- {Requirement 1}
- {Requirement 2}

### Should Have
- {Optional requirement}

### Must Not
- {Anti-requirement / constraint}

## Acceptance Criteria
- [ ] {Testable criterion 1}
- [ ] {Testable criterion 2}

## Tests
- {Test description} → expects {outcome}

## Technical Notes
{Implementation hints, constraints, decisions}

## Considered Alternatives
{What the Devil's Advocate proposed and why we did/didn't take it}
```

## Phase 6: Operational Setup

After specs are written:

1. Create `.golem/specs/` directory if needed
2. Write each spec file
3. Detect or ask for test/build/lint commands
4. Write `.golem/AGENTS.md`:

```markdown
# Operational Guide

Ticket: {INC-XXXX}
Branch: {branch-name}

## Commands

### Testing
\`\`\`bash
{test command}
\`\`\`

### Type Checking
\`\`\`bash
{typecheck command}
\`\`\`

### Linting
\`\`\`bash
{lint command}
\`\`\`

## Learnings
<!-- Updated during build iterations -->
```

## Phase 7: Cleanup & Completion

1. Clean up the agent team
2. Update ticket status:
   ```bash
   golem-api ticket:status $TICKET_ID spec --note "Specs complete"
   ```
3. Summarize what was created
4. Show next steps:
   ```
   Specs complete! Next steps:
   1. Review .golem/specs/ and adjust if needed
   2. Run /golem:plan to create implementation plan
   3. Run /golem:build to start building
   ```

</process>

<success_criteria>
- [ ] Agent team explored requirements from 3 perspectives
- [ ] Devil's advocate challenged assumptions
- [ ] Conflicts resolved through discussion
- [ ] Each topic has a separate spec file
- [ ] Tests defined in each spec
- [ ] Alternatives considered and documented
- [ ] AGENTS.md exists with operational commands
- [ ] Team cleaned up
- [ ] Ticket status synced
</success_criteria>

<important>
- The Devil's Advocate must be ACTIVE, not passive criticism
- All three perspectives should contribute to final specs
- Document "Considered Alternatives" so we remember why we chose this path
- Clean up the team when done
</important>
