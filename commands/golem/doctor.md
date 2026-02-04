---
name: golem:doctor
description: Diagnose setup issues
allowed-tools: [Bash]
---

<objective>
Run diagnostic checks on golem installation and report any issues with suggested fixes.
</objective>

<context>
Run doctor checks:
```bash
GOLEM_HOME="${GOLEM_HOME:-$HOME/.golem}"
[[ -f "$GOLEM_HOME/.env" ]] && source "$GOLEM_HOME/.env"
[[ -f ".env" ]] && source ".env"

passed=0
failed=0

echo "=== Environment ==="
if [[ -d "$GOLEM_HOME" ]]; then
  echo "✓ $GOLEM_HOME directory exists"
  passed=$((passed + 1))
else
  echo "✗ $GOLEM_HOME directory missing"
  echo "  → Run: mkdir -p $GOLEM_HOME"
  failed=$((failed + 1))
fi

if [[ -f "$GOLEM_HOME/.env" ]]; then
  echo "✓ $GOLEM_HOME/.env file exists"
  passed=$((passed + 1))
else
  echo "✗ $GOLEM_HOME/.env file missing"
  echo "  → Create and configure $GOLEM_HOME/.env"
  failed=$((failed + 1))
fi

missing_vars=""
[[ -z "${FRESH_DOMAIN:-}" ]] && missing_vars="$missing_vars FRESH_DOMAIN"
[[ -z "${FRESH_API_KEY:-}" ]] && missing_vars="$missing_vars FRESH_API_KEY"
[[ -z "${GITEA_URL:-}" ]] && missing_vars="$missing_vars GITEA_URL"
[[ -z "${GITEA_TOKEN:-}" ]] && missing_vars="$missing_vars GITEA_TOKEN"

if [[ -z "$missing_vars" ]]; then
  echo "✓ Required env vars set"
  passed=$((passed + 1))
else
  echo "✗ Missing required env vars:$missing_vars"
  echo "  → Edit $GOLEM_HOME/.env"
  failed=$((failed + 1))
fi

echo ""
echo "=== Dependencies ==="
if command -v node &>/dev/null; then
  echo "✓ node $(node --version)"
  passed=$((passed + 1))
else
  echo "✗ node not found"
  failed=$((failed + 1))
fi

if command -v pnpm &>/dev/null; then
  echo "✓ pnpm $(pnpm --version)"
  passed=$((passed + 1))
else
  echo "✗ pnpm not found"
  failed=$((failed + 1))
fi

if command -v git &>/dev/null; then
  echo "✓ git $(git --version | cut -d' ' -f3)"
  passed=$((passed + 1))
else
  echo "✗ git not found"
  failed=$((failed + 1))
fi

if command -v golem-api &>/dev/null; then
  echo "✓ golem-api accessible"
  passed=$((passed + 1))
else
  echo "✗ golem-api not found"
  echo "  → Run: ./bin/install.sh in golem directory"
  failed=$((failed + 1))
fi

echo ""
echo "=== Installation ==="
prompt_count=$(ls "$GOLEM_HOME/prompts/"*.md 2>/dev/null | wc -l | tr -d ' ')
if [[ "$prompt_count" -gt 0 ]]; then
  echo "✓ Prompts installed ($prompt_count files)"
  passed=$((passed + 1))
else
  echo "✗ No prompts installed"
  failed=$((failed + 1))
fi

agent_count=$(ls "$GOLEM_HOME/agents/"*.md 2>/dev/null | wc -l | tr -d ' ')
if [[ "$agent_count" -gt 0 ]]; then
  echo "✓ Agents installed ($agent_count files)"
  passed=$((passed + 1))
else
  echo "✗ No agents installed"
  failed=$((failed + 1))
fi

if [[ -d "$GOLEM_HOME/commands/golem" ]]; then
  echo "✓ Commands installed"
  passed=$((passed + 1))
else
  echo "✗ Commands not installed"
  failed=$((failed + 1))
fi

if [[ -L "$HOME/.claude/commands/golem" ]] && [[ -d "$HOME/.claude/commands/golem" ]]; then
  echo "✓ Claude integration linked"
  passed=$((passed + 1))
else
  echo "✗ Claude integration not linked"
  echo "  → Run: ln -sf $GOLEM_HOME/commands/golem ~/.claude/commands/golem"
  failed=$((failed + 1))
fi

echo ""
total=$((passed + failed))
echo "=== Summary: $passed/$total checks passed ==="
```
</context>

<process>
1. Run all diagnostic checks
2. Report any failures with suggested fixes
3. For API connectivity tests, suggest running `golem doctor --check-apis`
</process>
