---
name: golem:status
description: Show current project status
allowed-tools: [Read, Bash, Glob]
---

<objective>
Display current ticket status, spec progress, and implementation plan state.
</objective>

<context>
Ticket info:
```bash
TICKET_ID=$(basename "$(pwd)" | grep -oE '(INC|SR)-[0-9]+' || echo "")
if [ -n "$TICKET_ID" ]; then
  echo "=== Ticket: $TICKET_ID ==="
  cat .golem/tickets/$TICKET_ID.yaml 2>/dev/null || echo "No local state"
else
  echo "Not in a ticket worktree"
  echo ""
  echo "=== All Tickets ==="
  golem-api ticket:list 2>/dev/null || echo "No tickets"
fi
```

Specs:
```bash
echo "=== Specs ==="
ls .golem/specs/*.md 2>/dev/null || echo "No specs yet"
```

Plan progress:
```bash
echo "=== Implementation Plan ==="
if [ -f .golem/IMPLEMENTATION_PLAN.md ]; then
  TOTAL=$(grep -c '^\- \[' .golem/IMPLEMENTATION_PLAN.md 2>/dev/null || echo 0)
  DONE=$(grep -c '^\- \[x\]' .golem/IMPLEMENTATION_PLAN.md 2>/dev/null || echo 0)
  echo "Tasks: $DONE / $TOTAL complete"
  echo ""
  echo "Current stage:"
  grep -A5 '^## Stage' .golem/IMPLEMENTATION_PLAN.md | grep -E '(^## Stage|^\- \[)' | head -10
else
  echo "No plan yet - run /golem:plan"
fi
```

Git status:
```bash
echo ""
echo "=== Git Status ==="
git branch --show-current 2>/dev/null
git log --oneline -5 2>/dev/null
```
</context>

<process>
1. Display all context information
2. Summarize current state
3. Suggest next action if any
</process>
