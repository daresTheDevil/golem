---
name: golem:security
description: Run automated security scans
allowed-tools: [Read, Bash, Write]
---

<objective>
Run automated security tooling to detect vulnerabilities before code review. Uses gitleaks (secrets), semgrep (SAST), pnpm audit (dependencies), and trivy (containers).
</objective>

<context>
Current ticket:
```bash
TICKET_ID=$(basename "$(pwd)" | grep -oE '(INC|SR)-[0-9]+' || echo "")
echo "Ticket: ${TICKET_ID:-none}"
```

Check available tools:
```bash
echo "Checking security tools..."
which gitleaks && gitleaks version || echo "gitleaks: NOT INSTALLED"
which semgrep && semgrep --version || echo "semgrep: NOT INSTALLED"
which trivy && trivy --version || echo "trivy: NOT INSTALLED"
pnpm --version && echo "pnpm: OK" || echo "pnpm: NOT INSTALLED"
```
</context>

<process>

## Phase 1: Pre-flight

Check which security tools are available. Not all are required - run what's available.

Required tools and install commands:
- **gitleaks**: `brew install gitleaks` or `go install github.com/gitleaks/gitleaks/v8@latest`
- **semgrep**: `brew install semgrep` or `pip install semgrep`
- **trivy**: `brew install trivy` or `curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh`
- **pnpm**: `npm install -g pnpm`

## Phase 2: Run Security Scans

Run each available tool and capture results:

### 2.1 Secrets Scan (gitleaks)
```bash
if command -v gitleaks &> /dev/null; then
  echo "=== SECRETS SCAN (gitleaks) ==="
  if [ -f .gitleaks.toml ]; then
    gitleaks detect --config .gitleaks.toml --no-git -v 2>&1
  else
    gitleaks detect --no-git -v 2>&1
  fi
  echo "Exit code: $?"
fi
```

Scans for:
- API keys (AWS, GCP, Azure, Stripe, etc.)
- Private keys (RSA, SSH, PGP)
- Database connection strings with passwords
- OAuth/JWT tokens
- Hardcoded credentials

### 2.2 SAST Scan (semgrep)
```bash
if command -v semgrep &> /dev/null; then
  echo "=== SAST SCAN (semgrep) ==="
  semgrep scan --config auto --json 2>&1 | head -200
  echo "Exit code: $?"
fi
```

Scans for OWASP Top 10:
- A01: Broken Access Control
- A02: Cryptographic Failures
- A03: Injection (SQL, XSS, Command)
- A04: Insecure Design
- A05: Security Misconfiguration
- A06: Vulnerable Components
- A07: Authentication Failures
- A08: Data Integrity Failures
- A09: Logging Failures
- A10: SSRF

### 2.3 Dependency Scan (pnpm audit)
```bash
if [ -f package.json ]; then
  echo "=== DEPENDENCY SCAN (pnpm audit) ==="
  pnpm audit --json 2>&1 | head -100
  echo "Exit code: $?"
fi
```

Checks against:
- National Vulnerability Database (NVD/CVE)
- GitHub Advisory Database
- npm Security Advisories

### 2.4 Container Scan (trivy)
```bash
if command -v trivy &> /dev/null && command -v docker &> /dev/null; then
  # Check for local image or Dockerfile
  if docker images --format "{{.Repository}}" 2>/dev/null | head -1 | grep -q .; then
    echo "=== CONTAINER SCAN (trivy) ==="
    IMAGE=$(docker images --format "{{.Repository}}:{{.Tag}}" 2>/dev/null | head -1)
    trivy image --severity HIGH,CRITICAL "$IMAGE" 2>&1 | head -100
    echo "Exit code: $?"
  elif [ -f Dockerfile ]; then
    echo "=== DOCKERFILE SCAN (trivy) ==="
    trivy config Dockerfile 2>&1
    echo "Exit code: $?"
  else
    echo "=== CONTAINER SCAN: SKIPPED (no image or Dockerfile) ==="
  fi
fi
```

Scans for:
- OS package vulnerabilities
- Application dependencies in image
- Dockerfile misconfigurations

## Phase 3: Generate Report

Write `.golem/SECURITY_REPORT.md`:

```markdown
# Security Scan Report

**Generated:** {ISO timestamp}
**Ticket:** {TICKET_ID}

## Summary

| Scan | Status | Findings |
|------|--------|----------|
| Secrets (gitleaks) | {PASS/FAIL/SKIPPED} | {count} |
| SAST (semgrep) | {PASS/FAIL/SKIPPED} | {count} |
| Dependencies (pnpm) | {PASS/FAIL/SKIPPED} | {high}/{critical} |
| Container (trivy) | {PASS/FAIL/SKIPPED} | {count} |

## Verdict

{PASS | FAIL | PARTIAL}

---

## Findings

### Secrets
{details or "No secrets detected"}

### SAST
{details or "No vulnerabilities detected"}

### Dependencies
{details or "No vulnerable dependencies"}

### Container
{details or "No container vulnerabilities"}

---

## Next Steps

{If FAIL: list what needs to be fixed}
{If PASS: "Ready for code review - run /golem:review"}
```

## Phase 4: Verdict

**PASS**: All scans passed (or skipped due to missing tools)
- Announce ready for review
- Suggest running `/golem:review`

**FAIL**: Any scan found issues
- List critical findings
- Block until fixed
- Do NOT proceed to review

**PARTIAL**: Some tools missing
- Warn about missing coverage
- Suggest installing missing tools
- Allow proceeding with caution

</process>

<success_criteria>
- [ ] Available security tools identified
- [ ] Secrets scan completed (if gitleaks available)
- [ ] SAST scan completed (if semgrep available)
- [ ] Dependency scan completed (if package.json exists)
- [ ] Container scan completed (if applicable)
- [ ] Report generated at .golem/SECURITY_REPORT.md
- [ ] Clear verdict provided
</success_criteria>

<important>
- This is READ-ONLY - do not fix issues, just report them
- Any secrets found are CRITICAL - must be rotated immediately
- High/Critical dependency vulns should block merge
- Missing tools should trigger a warning, not a failure
- Container scan only runs if image exists or Dockerfile present
</important>
