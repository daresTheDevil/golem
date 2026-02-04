#!/usr/bin/env bash
#
# Install golem globally
#

set -euo pipefail

GOLEM_HOME="${GOLEM_HOME:-$HOME/.golem}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Installing golem to $GOLEM_HOME..."

# Create directory structure
mkdir -p "$GOLEM_HOME"/{commands,agents,prompts}

# Copy commands
cp -r "$SCRIPT_DIR/commands/golem" "$GOLEM_HOME/commands/"
echo "✓ Installed Claude commands"

# Copy agents and prompts
cp "$SCRIPT_DIR/golem/agents/"*.md "$GOLEM_HOME/agents/"
cp "$SCRIPT_DIR/golem/prompts/"*.md "$GOLEM_HOME/prompts/"
echo "✓ Installed agents and prompts"

# Build TypeScript
echo "Building TypeScript..."
cd "$SCRIPT_DIR"
pnpm build

# Link binaries
mkdir -p "$HOME/.local/bin"
ln -sf "$SCRIPT_DIR/bin/golem" "$HOME/.local/bin/golem"
ln -sf "$SCRIPT_DIR/dist/cli/index.js" "$HOME/.local/bin/golem-api"
chmod +x "$SCRIPT_DIR/dist/cli/index.js"
echo "✓ Linked binaries to ~/.local/bin"

# Create env template if not exists
if [[ ! -f "$GOLEM_HOME/.env" ]]; then
  cat > "$GOLEM_HOME/.env" << 'EOF'
# Freshworks/Freshservice
FRESH_DOMAIN=yourcompany.freshservice.com
FRESH_API_KEY=your_api_key_here

# Gitea (on-prem)
GITEA_URL=https://dev.pearlriverresort.com
GITEA_TOKEN=your_token_here
GITEA_ORG=CRDE

# Default repo for issues (can be overridden per-project)
GITEA_REPO=
EOF
  echo "✓ Created $GOLEM_HOME/.env template"
  echo ""
  echo "⚠️  Edit $GOLEM_HOME/.env with your API credentials"
fi

# Setup Claude integration
mkdir -p "$HOME/.claude/commands"
ln -sf "$GOLEM_HOME/commands/golem" "$HOME/.claude/commands/golem" 2>/dev/null || true
echo "✓ Linked Claude commands"

echo ""
echo "Installation complete!"
echo ""
echo "Make sure ~/.local/bin is in your PATH:"
echo '  export PATH="$HOME/.local/bin:$PATH"'
echo ""
echo "Then configure your credentials:"
echo "  $GOLEM_HOME/.env"
