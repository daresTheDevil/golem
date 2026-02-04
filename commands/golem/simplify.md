---
name: golem:simplify
description: Run code simplifier on specified files or recent changes
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash]
---

<objective>
Simplify code by removing AI artifacts, reducing complexity, and improving clarity while preserving ALL behavior.
</objective>

<execution_context>
@~/.golem/agents/code-simplifier.md
</execution_context>

<context>
Get files to simplify (staged, modified, or specified):
```bash
# Staged files
git diff --cached --name-only 2>/dev/null | head -20

# Modified files
git diff --name-only 2>/dev/null | head -20
```

Test command:
```bash
grep -A1 "### Testing" .golem/AGENTS.md 2>/dev/null | tail -1
```
</context>

<process>

## 1. Identify Target Files

If user specified files, use those.
Otherwise, check for staged/modified files.
Skip:
- Test files (`*.test.ts`, `*.spec.ts`)
- Type definitions (`*.d.ts`)
- Config files (`*.config.*`)
- Generated files

## 2. Simplify Each File

For each source file:

### Priority 1: Remove AI Artifacts
- Unnecessary comments explaining obvious code
- Defensive checks that can never trigger
- Type casts to `any` without need
- Commented-out code blocks
- TODO comments for completed work

### Priority 2: Reduce Complexity
- Flatten nested conditionals (use early returns)
- Replace nested ternaries with if/else
- Extract complex boolean expressions to named variables
- Consolidate duplicate code paths

### Priority 3: Improve Clarity
- Rename unclear variables (single letters, abbreviations)
- Rename functions to describe what they do
- Remove dead/unreachable code
- Simplify over-engineered abstractions

### Priority 4: Structural
- Extract large functions into focused helpers
- Inline trivial one-use functions
- Simplify data structures

## 3. Validate

Run tests to confirm no regressions:
```bash
{test_command from .golem/AGENTS.md}
```

If tests fail: revert simplifications that caused failures.

## 4. Report

Summarize what was simplified:
- Files modified
- Changes made
- Tests still passing

</process>

<important>
- NEVER change behavior - only improve clarity
- Run tests after EVERY file simplification
- If unsure whether a change affects behavior, don't make it
- This is cosmetic surgery, not functional changes
</important>
