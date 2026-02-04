---
name: golem:spec
description: Build project specs through guided conversation
allowed-tools: [Read, Write, Glob, Grep, Bash, AskUserQuestion]
---

<objective>
Guide the user through a structured conversation to define requirements for the current ticket/issue and generate spec files. This creates the foundation for the implementation plan and build loop.
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
```
</context>

<process>

## Phase 1: Ticket Context

If we're in a ticket worktree:
1. Read the Fresh ticket description and Gitea issue
2. Summarize what the user/reporter is asking for
3. Ask clarifying questions about the actual need

If NOT in a ticket worktree:
1. Ask: "What are you building? What problem does this solve?"
2. Offer to create a ticket: "Should I create a Fresh ticket and Gitea issue for this work?"

## Phase 2: Requirement Extraction

Understand the scope:
1. **What's the actual problem?** - Not the solution, the problem
2. **Who's affected?** - Users, internal, integrations?
3. **What's the minimum viable fix/feature?** - v1 scope
4. **What's explicitly NOT in scope?** - Boundaries

Use `AskUserQuestion` for concrete choices, open questions for exploration.

## Phase 3: Topic Decomposition

Extract distinct "topics of concern":
1. Based on what you learned, propose 1-5 topics
   - Each topic should pass the "no AND test"
   - Good: "input validation", "error handling", "API response format"
   - Bad: "validation and error handling" (split these)

2. Ask if any topics should be added, removed, or split

## Phase 4: Spec Generation

For each topic, have a focused mini-conversation:

1. **Requirements**: Ask 2-4 targeted questions:
   - What MUST it do?
   - What SHOULD it do if time allows?
   - What must it NOT do?
   - Technical constraints?

2. **Tests**: What tests must pass for this to be considered done?

3. **Write File**: Save to `.golem/specs/{topic-name}.md`

### Spec File Format

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
- {Test description} → expects {outcome}

## Technical Notes
{Implementation hints, constraints, or decisions}
```

## Phase 5: Operational Setup

After all specs are written:

1. Create `.golem/specs/` directory if needed
2. Write each spec file
3. Detect or ask for test/build/lint commands
4. Write `.golem/AGENTS.md`

### AGENTS.md Format

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

## Phase 6: Sync & Completion

1. Update the ticket status to "spec" in Fresh and Gitea:
   ```bash
   golem-api ticket:status $TICKET_ID spec --note "Specs complete"
   ```

2. Summarize what was created

3. Show next steps:
   ```
   Specs complete! Next steps:
   1. Review .golem/specs/ and adjust if needed
   2. Run /golem:plan to create implementation plan
   3. Run /golem:build to start building
   ```

</process>

<success_criteria>
- [ ] Ticket context incorporated
- [ ] User requirements fully captured
- [ ] Each topic has a separate spec file
- [ ] Tests defined in each spec
- [ ] AGENTS.md exists with operational commands
- [ ] Ticket status synced to Fresh/Gitea
</success_criteria>
