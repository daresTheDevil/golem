---
name: golem:config
description: Show current configuration
allowed-tools: [Read, Bash]
---

<objective>
Display current golem configuration - paths, environment files, and environment variables.
</objective>

<context>
Paths:
```bash
echo "=== Paths ==="
echo "GOLEM_HOME: ${GOLEM_HOME:-$HOME/.golem}"
```

Environment files:
```bash
echo ""
echo "=== Environment Files ==="
GOLEM_HOME="${GOLEM_HOME:-$HOME/.golem}"
[[ -f "$GOLEM_HOME/.env" ]] && echo "✓ $GOLEM_HOME/.env" || echo "✗ $GOLEM_HOME/.env (not found)"
[[ -f ".env" ]] && echo "✓ ./.env (local)" || echo "  ./.env (not found)"
```

Load and display variables:
```bash
echo ""
echo "=== Freshservice ==="
GOLEM_HOME="${GOLEM_HOME:-$HOME/.golem}"
[[ -f "$GOLEM_HOME/.env" ]] && source "$GOLEM_HOME/.env"
[[ -f ".env" ]] && source ".env"

echo "FRESH_DOMAIN: ${FRESH_DOMAIN:-(not set)}"
[[ -n "${FRESH_API_KEY:-}" ]] && echo "FRESH_API_KEY: (set)" || echo "FRESH_API_KEY: (not set) - REQUIRED"
echo "FRESH_DEFAULT_GROUP_ID: ${FRESH_DEFAULT_GROUP_ID:-(not set)}"
echo "FRESH_DEFAULT_CATEGORY: ${FRESH_DEFAULT_CATEGORY:-(not set)}"
echo "FRESH_SOURCE_ID: ${FRESH_SOURCE_ID:-(not set)}"
echo "FRESH_DEFAULT_EMAIL: ${FRESH_DEFAULT_EMAIL:-(not set)}"

echo ""
echo "=== Gitea ==="
echo "GITEA_URL: ${GITEA_URL:-(not set)}"
[[ -n "${GITEA_TOKEN:-}" ]] && echo "GITEA_TOKEN: (set)" || echo "GITEA_TOKEN: (not set) - REQUIRED"
echo "GITEA_ORG: ${GITEA_ORG:-(not set)}"
echo "GITEA_REPO: ${GITEA_REPO:-(not set)}"
```
</context>

<process>
1. Display all configuration context
2. Highlight any missing required variables
3. Note: Use `golem doctor` for connectivity tests
</process>
