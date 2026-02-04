---
name: golem:build
description: Run autonomous build loop - implement, test, simplify, commit
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Task]
---

<objective>
Execute the autonomous build loop: select a task, implement it, validate with tests, simplify the code, and commit. Each task gets its own commit. When a stage is complete, all commits in that stage are squashed into one.
</objective>

<execution_context>
@~/.golem/prompts/PROMPT_build.md
@~/.golem/agents/code-simplifier.md
</execution_context>

<context>
Current ticket:
```bash
TICKET_ID=$(basename "$(pwd)" | grep -oE '(INC|SR)-[0-9]+' || echo "")
if [ -n "$TICKET_ID" ]; then
  cat .golem/tickets/$TICKET_ID.yaml 2>/dev/null
fi
```

Load specs:
```bash
for f in .golem/specs/*.md; do echo "=== $f ==="; cat "$f"; echo; done 2>/dev/null
```

Load operational guide:
```bash
cat .golem/AGENTS.md 2>/dev/null || echo "No AGENTS.md - run /golem:spec first"
```

Load implementation plan:
```bash
cat .golem/IMPLEMENTATION_PLAN.md 2>/dev/null || echo "No plan - run /golem:plan first"
```

Check remaining tasks:
```bash
grep -c '^\- \[ \]' .golem/IMPLEMENTATION_PLAN.md 2>/dev/null || echo "0"
```
</context>

<process>

## Pre-flight Checks

1. Verify .golem/IMPLEMENTATION_PLAN.md exists
2. Verify .golem/specs/ directory has files
3. Verify .golem/AGENTS.md has test commands
4. Check for remaining tasks

If missing prerequisites, instruct user to run appropriate command first.

## Build Loop

For each iteration:

### 1. Orient
- Read the current .golem/IMPLEMENTATION_PLAN.md
- Identify current stage and task
- Review relevant specs for context

### 2. Select Task
- Pick the **first** incomplete task in the current stage
- Skip only if it has unmet dependencies
- Never cherry-pick based on preference

### 3. Investigate
- Search relevant source code
- Understand existing patterns
- Identify files to modify

### 4. Implement
- Make changes required for this task ONLY
- Follow existing code patterns and conventions
- Write tests alongside implementation
- Keep changes minimal and focused

### 5. Validate (Backpressure)
Run ALL gates from .golem/AGENTS.md. ALL must pass:

```bash
# Run test command
{test_command from .golem/AGENTS.md}

# Run typecheck if configured
{typecheck_command from .golem/AGENTS.md}

# Run lint if configured
{lint_command from .golem/AGENTS.md}
```

If any gate fails:
- Read the error carefully
- Fix the issue
- Re-run ALL gates from start
- Repeat until all pass

### 6. Simplify
After tests pass, simplify modified files:

Use the code-simplifier agent principles:
- Remove unnecessary comments
- Flatten nested conditionals
- Improve variable/function names
- Remove dead code
- **Preserve ALL behavior**

Re-run tests after simplification.

### 7. Update Plan & Commit
Edit `.golem/IMPLEMENTATION_PLAN.md`:
- Change `[ ]` to `[x]` for completed task

Create task commit:
```bash
git add -A
git commit -m "wip: {task description} [{TICKET_ID}]"
```

### 8. Check Stage Completion

If current stage is complete (all tasks marked `[x]`):

1. **Squash stage commits** into one clean commit:
   ```bash
   golem-api git:squash $TICKET_ID -m "{stage commit message from plan} [{TICKET_ID}]"
   ```

2. **Update ticket status** with progress:
   ```bash
   golem-api ticket:status $TICKET_ID in-progress --note "Stage N complete: {stage name}"
   ```

3. **Update plan** to mark stage complete

4. Continue to next stage

### 9. Check Overall Completion

- If remaining tasks > 0: continue to next iteration
- If all stages complete:
  - Update ticket status to "review"
  - Announce completion
  - Suggest creating PR
- If stuck for 3+ attempts on same task: mark blocked and move on

</process>

<success_criteria>
- [ ] Task selected from plan
- [ ] Implementation complete
- [ ] All tests passing
- [ ] Code simplified
- [ ] Plan updated
- [ ] Task committed
- [ ] Stage squashed when complete
- [ ] Ticket status synced
</success_criteria>

<important>
- Complete ONE task per message, then check if user wants to continue
- Fresh context helps - don't accumulate too much in one session
- Trust the tests - if they pass, implementation is correct
- Each task gets a wip commit, each stage gets squashed
- Keep ticket status updated throughout
</important>
