---
name: golem:review
description: Run parallel code review before PR
allowed-tools: [Read, Glob, Grep, Bash, Write, Task]
---

<objective>
Run automated security scans first, then spawn an agent team for comprehensive code review. Security issues block the review. The agent team reviews from multiple perspectives: security patterns, performance, correctness, and test coverage. A devil's advocate challenges the implementation. Generate a review report and block PR creation until issues are resolved.
</objective>

<context>
Current ticket:
```bash
TICKET_ID=$(basename "$(pwd)" | grep -oE '(INC|SR)-[0-9]+' || echo "")
if [ -n "$TICKET_ID" ]; then
  cat .golem/tickets/$TICKET_ID.yaml 2>/dev/null
fi
```

Changes to review:
```bash
git diff origin/main..HEAD --stat
```

Files changed:
```bash
git diff origin/main..HEAD --name-only
```

Load specs for context:
```bash
for f in .golem/specs/*.md; do echo "=== $f ==="; cat "$f"; echo; done 2>/dev/null
```

Load implementation plan:
```bash
cat .golem/IMPLEMENTATION_PLAN.md 2>/dev/null
```

Check available security tools:
```bash
echo "Security tools:"
which gitleaks &>/dev/null && echo "  gitleaks: OK" || echo "  gitleaks: MISSING"
which semgrep &>/dev/null && echo "  semgrep: OK" || echo "  semgrep: MISSING"
which trivy &>/dev/null && echo "  trivy: OK" || echo "  trivy: MISSING"
```
</context>

<process>

## Phase 0: Security Gate (BLOCKING)

Before any code review, run automated security scans. This gate must pass.

### 0.1 Secrets Scan (gitleaks)
```bash
if command -v gitleaks &> /dev/null; then
  echo "=== SECRETS SCAN ==="
  if [ -f .gitleaks.toml ]; then
    gitleaks detect --config .gitleaks.toml --no-git -v 2>&1
  else
    gitleaks detect --no-git -v 2>&1
  fi
  SECRETS_EXIT=$?
  if [ $SECRETS_EXIT -ne 0 ]; then
    echo "CRITICAL: Secrets detected in codebase!"
  fi
fi
```

### 0.2 SAST Scan (semgrep)
```bash
if command -v semgrep &> /dev/null; then
  echo "=== SAST SCAN ==="
  SAST_OUTPUT=$(semgrep scan --config auto --json 2>&1)
  SAST_FINDINGS=$(echo "$SAST_OUTPUT" | jq '.results | length' 2>/dev/null || echo "0")
  echo "Findings: $SAST_FINDINGS"
  if [ "$SAST_FINDINGS" != "0" ] && [ -n "$SAST_FINDINGS" ]; then
    echo "$SAST_OUTPUT" | jq '.results[] | {rule: .check_id, file: .path, line: .start.line, message: .extra.message}' 2>/dev/null
  fi
fi
```

### 0.3 Dependency Scan (pnpm audit)
```bash
if [ -f package.json ]; then
  echo "=== DEPENDENCY SCAN ==="
  DEPS_OUTPUT=$(pnpm audit --json 2>&1)
  DEPS_HIGH=$(echo "$DEPS_OUTPUT" | jq '.metadata.vulnerabilities.high // 0' 2>/dev/null || echo "0")
  DEPS_CRITICAL=$(echo "$DEPS_OUTPUT" | jq '.metadata.vulnerabilities.critical // 0' 2>/dev/null || echo "0")
  echo "High: $DEPS_HIGH, Critical: $DEPS_CRITICAL"
fi
```

### 0.4 Security Gate Decision

**If ANY security scan fails (secrets found, critical SAST findings, critical deps):**
```
SECURITY GATE: BLOCKED

Critical security issues must be resolved before code review.

Issues found:
- {list issues}

Fix these issues, then run /golem:review again.
```
**STOP HERE. Do not proceed to agent team review.**

**If security scans pass (or tools not available):**
Proceed to Phase 1.

---

## Phase 1: Identify Review Scope

After security gate passes:
1. Get list of all changed files
2. Get the full diff
3. Load specs to understand intent
4. Load plan to understand expected changes

## Phase 2: Spawn Review Team

Create an agent team with specialized reviewers:

```
Create an agent team to review the changes before PR creation.
Security scans have passed. Now review code quality.

Spawn five reviewers:

1. **Security Patterns Reviewer** - Reviews code for security anti-patterns:
   - Auth/authz logic correctness
   - Input validation patterns
   - Output encoding
   - Session management
   - Error handling (no info leakage)
   - Logging (no sensitive data)
   (Note: Automated tools already ran - focus on logic/patterns)

2. **Performance Reviewer** - Identifies performance issues:
   - N+1 queries
   - Missing indexes
   - Memory leaks
   - Unnecessary allocations
   - Blocking operations
   - Missing caching opportunities
   - O(n²) or worse algorithms

3. **Correctness Reviewer** - Validates logic and behavior:
   - Does it match the spec?
   - Edge cases handled?
   - Error handling complete?
   - Race conditions?
   - Null/undefined handling?
   - Off-by-one errors?

4. **Test Reviewer** - Validates test coverage:
   - Are new features tested?
   - Are edge cases covered?
   - Are error paths tested?
   - Test quality (not just quantity)
   - Integration tests where needed?
   - Mocks used appropriately?

5. **Devil's Advocate** - Challenges the implementation:
   - "This is overengineered"
   - "This will be hard to maintain"
   - "This doesn't match the spec"
   - "There's a simpler way to do this"
   - "This will break when X happens"

   Rules for Devil's Advocate:
   - Must articulate WHY something is problematic
   - Must propose a concrete fix or alternative
   - Must back down when concern is adequately addressed
   - Severity ratings: critical, major, minor, nit

Have reviewers work in parallel, share findings, and challenge
each other. The goal is to catch issues before they hit production.
```

## Phase 3: Parallel Review

Each reviewer examines the changes from their perspective.

### Security Patterns Reviewer checks:
- Authentication/authorization logic
- Input handling patterns
- Data sanitization
- Session handling
- Error messages (no stack traces to users)
- Audit logging

### Performance Reviewer checks:
- Database queries and patterns
- Loop complexity
- Memory usage patterns
- Async/await usage
- Caching strategies
- Bundle size impact

### Correctness Reviewer checks:
- Business logic matches specs
- All acceptance criteria addressed
- Edge cases handled
- Error states handled
- Types are correct
- Contracts are honored

### Test Reviewer checks:
- New code has tests
- Tests actually verify behavior
- Edge cases tested
- Error paths tested
- Tests are maintainable
- No flaky test patterns

### Devil's Advocate challenges:
- Complexity vs requirements
- Maintainability concerns
- Alternative approaches
- Future-proofing vs YAGNI
- Consistency with codebase

## Phase 4: Synthesize Findings

After individual reviews:
1. Each reviewer reports findings with severity
2. Devil's advocate challenges or reinforces findings
3. Deduplicate overlapping issues
4. Prioritize by severity

Severity levels:
- **Critical**: Must fix before merge (security holes, data loss, crashes)
- **Major**: Should fix before merge (bugs, missing tests, performance issues)
- **Minor**: Nice to fix (code style, minor improvements)
- **Nit**: Optional (naming, formatting, suggestions)

## Phase 5: Generate Review Report

Write `.golem/REVIEW_REPORT.md`:

```markdown
# Code Review Report

Ticket: {INC-XXXX}
Reviewed: {ISO timestamp}
Changes: {N} files, +{additions}/-{deletions}

## Security Scans (Automated)

| Scan | Status |
|------|--------|
| Secrets (gitleaks) | {PASS/SKIPPED} |
| SAST (semgrep) | {PASS/N findings} |
| Dependencies (pnpm) | {PASS/N high, M critical} |

## Code Review Summary

| Category | Critical | Major | Minor | Nit |
|----------|----------|-------|-------|-----|
| Security Patterns | {n} | {n} | {n} | {n} |
| Performance | {n} | {n} | {n} | {n} |
| Correctness | {n} | {n} | {n} | {n} |
| Tests | {n} | {n} | {n} | {n} |
| Devil's Advocate | {n} | {n} | {n} | {n} |

## Verdict
{BLOCKED | APPROVED | APPROVED_WITH_COMMENTS}

---

## Critical Issues
{Must be resolved before merge}

### [{Category}] {Issue title}
**File**: {path}:{line}
**Description**: {what's wrong}
**Risk**: {what could happen}
**Fix**: {how to fix it}

---

## Major Issues
{Should be resolved before merge}

### [{Category}] {Issue title}
**File**: {path}:{line}
**Description**: {what's wrong}
**Impact**: {impact}
**Fix**: {how to fix it}

---

## Minor Issues
{Nice to have}

### [{Category}] {Issue title}
**File**: {path}:{line}
**Suggestion**: {improvement}

---

## Nits
{Optional improvements}

- {nit 1}
- {nit 2}

---

## What Went Well
{Positive observations from the review}

## Recommendations
{Suggestions for future work, not blockers}
```

## Phase 6: Verdict & Next Steps

Based on findings:

**If Critical or Major issues exist:**
```
Review complete: BLOCKED

{N} critical and {M} major issues must be resolved.
See .golem/REVIEW_REPORT.md for details.

Fix the issues, then run /golem:review again.
```

**If only Minor/Nit issues:**
```
Review complete: APPROVED

{N} minor suggestions documented in .golem/REVIEW_REPORT.md
You may proceed with `golem pr` to create the pull request.
```

## Phase 7: Cleanup

1. Clean up the agent team
2. Update ticket status:
   ```bash
   golem-api ticket:status $TICKET_ID review --note "Code review: {verdict}"
   ```

</process>

<success_criteria>
- [ ] Security scans passed (gitleaks, semgrep, pnpm audit)
- [ ] All changed files reviewed by agent team
- [ ] Security patterns perspective covered
- [ ] Performance perspective covered
- [ ] Correctness perspective covered
- [ ] Test coverage verified
- [ ] Devil's advocate challenged implementation
- [ ] Issues categorized by severity
- [ ] Review report generated
- [ ] Clear verdict provided
- [ ] Team cleaned up
</success_criteria>

<important>
- Security scans run FIRST and block if they fail
- This is a READ-ONLY review phase - do NOT fix issues
- Issues must include specific file:line references
- Issues must include concrete fix suggestions
- Critical/Major issues BLOCK the PR
- The Devil's Advocate should be ruthless but fair
- Document what went WELL, not just problems
- Clean up the team when done
</important>
