# Implementation Plan

Ticket: LOCAL-DEV (no external ticket)
Generated: 2026-02-04
Based on: .golem/specs/config-command.md, .golem/specs/doctor-command.md

## Status
- Stages: 2
- Completed: 0
- Current: Stage 1

---

## Stage 1: Config Command
Commit: feat(cli): add golem config command to display configuration status

### [x] 1.1. Add cmd_config function to bin/golem
Files: bin/golem
Notes: Add function that displays GOLEM_HOME, env file locations, and all env vars with appropriate masking for secrets. Use existing color helpers (GREEN for set, YELLOW for unset optional, RED for unset required). Required vars: FRESH_DOMAIN, FRESH_API_KEY, GITEA_URL, GITEA_TOKEN.
Tests: Run `golem config` and verify output shows env status correctly

### [x] 1.2. Add config to main case statement and help text
Files: bin/golem
Notes: Add "config)" case to main(), add to cmd_help() under OTHER section
Tests: `golem help` shows config command, `golem config` routes correctly

### [x] 1.3. Create /golem:config Claude command
Files: commands/golem/config.md
Notes: Follow pattern from status.md - use bash context blocks to read env status, display formatted output
Tests: Run `/golem:config` in Claude and verify it shows configuration

---

## Stage 2: Doctor Command
Commit: feat(cli): add golem doctor command to diagnose setup issues
Depends on: Stage 1

### [x] 2.1. Add cmd_doctor function to bin/golem
Files: bin/golem
Notes: Implement environment checks (~/.golem dir, .env file, required vars), dependency checks (node, pnpm, git, golem-api with versions), installation checks (prompts, agents, commands, claude symlink). Track pass/fail count. Support --check-apis flag for optional API tests.
Tests: Run `golem doctor` and verify all checks run and display correctly

### [x] 2.2. Add doctor to main case statement and help text
Files: bin/golem
Notes: Add "doctor)" case to main(), add to cmd_help() under OTHER section
Tests: `golem help` shows doctor command, `golem doctor` routes correctly

### [x] 2.3. Create /golem:doctor Claude command
Files: commands/golem/doctor.md
Notes: Follow same pattern, run diagnostic checks and display results
Tests: Run `/golem:doctor` in Claude and verify diagnostics display

---

## Notes

- No external services needed - all local checks
- Install script may need re-run after adding new commands to copy them to ~/.golem
- Exit codes: config always 0 (informational), doctor 0 if all pass / 1 if any fail
