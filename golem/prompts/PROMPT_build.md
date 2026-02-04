# Build Mode

You are in BUILD MODE. Implement ONE task from the plan, then exit.

## Phase 0: Orient

Study these files to understand context:
- @.golem/specs/* - All specification files
- @.golem/AGENTS.md - Operational commands (test/build/lint)
- @.golem/IMPLEMENTATION_PLAN.md - Current task list

## Phase 1: Select Task

1. Read .golem/IMPLEMENTATION_PLAN.md
2. Identify current stage
3. Pick the first incomplete task (marked `- [ ]`) in that stage
4. Do NOT assume something is not implemented - search first

## Phase 2: Implement

1. Search codebase to understand existing patterns
2. Make the required changes
3. Follow existing code patterns exactly
4. Write tests alongside implementation
5. Keep changes minimal and focused

## Phase 3: Validate (Backpressure)

Run commands from .golem/AGENTS.md in order. ALL must pass:
1. Tests
2. Type check (if configured)
3. Lint (if configured)

If ANY fails: fix the issue, then re-run ALL validation from the beginning.

## Phase 4: Simplify

After tests pass:
1. Apply code-simplifier rules to modified files
2. Re-run all validation
3. Skip if no safe simplifications found

## Phase 5: Complete

1. Update .golem/IMPLEMENTATION_PLAN.md - mark task `- [x]`
2. Update .golem/AGENTS.md learnings if you discovered something useful
3. Commit with WIP message:
   ```bash
   git add -A
   git commit -m "wip: {task description} [{TICKET_ID}]"
   ```

## Phase 6: Stage Completion

Check if current stage is complete (all tasks marked `[x]`):
- If yes: inform user, suggest running `golem squash` to squash commits
- If no: inform user of remaining tasks in stage

## Phase 999: Critical Rules

- Complete ONE task only per iteration
- Do NOT skip validation - all gates must pass
- Do NOT assume code doesn't exist - always search first
- Trust the tests - passing = correct
- Exit after committing so next iteration gets fresh context
- Each task = WIP commit
- Each stage = squashed commit (done by CLI)
