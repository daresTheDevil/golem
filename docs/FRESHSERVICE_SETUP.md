# Freshservice API Setup Guide

This document details all the configuration changes required in Freshservice to enable API access for the Golem CLI integration.

---

## Prerequisites

- Freshservice account with admin access
- Access to Admin settings

---

## 1. Agent Role Configuration

**Problem:** The "Account Admin" role only provides administrative privileges (managing settings, users, etc.) but does NOT include permissions to access ticket data via API. API calls to `/api/v2/tickets` return `403 Forbidden`.

**Solution:** Your agent account needs an additional "Agent" role that includes ticket permissions.

### Steps:

1. Go to **Admin** → **Agents**
2. Find your agent account (or the account that will use the API)
3. Click to edit the agent
4. Under **Groups and Roles** → **Roles**, add one of these roles:
   - **IT Agent** (basic ticket access)
   - **IT Supervisor** (ticket access + reporting)
   - **IT Manager** (broader permissions)
   - **IT Operations** (if available)

5. Save the changes

### Required Privileges

The agent role must include these privileges for full API functionality:
- `manage_tickets` - Create, update, view tickets
- `view_time_entries` - View time tracking
- `edit_ticket_properties` - Modify ticket fields
- `reply_ticket` - Add replies/notes

### Verification

After adding the role, verify via API:
```bash
curl -u "YOUR_API_KEY:X" "https://YOUR_DOMAIN.freshservice.com/api/v2/agents/me"
```

Check the `roles` array in the response - you should see multiple role IDs.

---

## 2. API Key Generation

**Location:** Profile Settings → API Key (right side of page)

### Steps:

1. Click your **profile icon** (top right)
2. Go to **Profile Settings**
3. Look for **Your API Key** on the right side
4. Copy the API key

### Alternative Path:
- **Admin** → **Agents** → Click your name → **API Key** section

### Notes:
- The API key is tied to your user account and its permissions
- If you add new roles, you may need to regenerate the API key
- API key uses Basic Auth: `API_KEY:X` (the password is literally the letter X)

---

## 3. Create Custom Ticket Source

**Problem:** When creating tickets via API, they default to "via Phone" as the source, which is misleading.

**Solution:** Create a custom ticket source for API-created tickets.

### Via API:

```bash
curl -X POST -u "YOUR_API_KEY:X" \
  -H "Content-Type: application/json" \
  -d '{"name":"ACE (API)"}' \
  "https://YOUR_DOMAIN.freshservice.com/api/v2/ticket_fields/sources"
```

Response:
```json
{
  "source": {
    "id": 38000360046,
    "choice_id": 1002,
    "value": "ACE (API)",
    "position": 19,
    "visible": true,
    "default": false
  }
}
```

**Important:** Save the `choice_id` value (e.g., `1002`) - this is what you pass as the `source` field when creating tickets.

### Via Admin UI:

1. Go to **Admin** → **Ticket Fields** (under Service Desk Settings)
2. Find the **Source** field
3. Click to edit/expand it
4. Add a new choice: `ACE (API)`
5. Save

### Note on Deleting Sources:
- Default sources (Email, Phone, Portal, etc.) cannot be deleted
- Custom sources can only be deleted via the Admin UI (no DELETE API endpoint)
- To delete: **Admin** → **Ticket Fields** → **Source** → hover over custom source → trash icon

---

## 4. Required Fields for Ticket Creation

**Problem:** Freshservice instances may have required fields configured that cause `400 Validation failed` errors.

### Our Instance Requires:

| Field | Type | Example |
|-------|------|---------|
| `subject` | string | "Ticket title" |
| `description` | string | "Ticket description" |
| `email` | string | "requester@domain.com" |
| `group_id` | integer | `38000120203` |
| `category` | string | "Applications" |
| `source` | integer | `1002` (ACE API) |

### Finding Your Group IDs:

```bash
curl -u "YOUR_API_KEY:X" "https://YOUR_DOMAIN.freshservice.com/api/v2/groups"
```

### Finding Valid Categories:

```bash
curl -u "YOUR_API_KEY:X" "https://YOUR_DOMAIN.freshservice.com/api/v2/ticket_form_fields" | \
  python3 -c "import sys,json; [print(f['choices']) for f in json.load(sys.stdin)['ticket_fields'] if f['name']=='category']"
```

Our valid categories: `Hardware`, `Applications`, `Infrastructure`, `Security`

### Finding Source IDs:

```bash
curl -u "YOUR_API_KEY:X" "https://YOUR_DOMAIN.freshservice.com/api/v2/ticket_form_fields" | \
  python3 -c "import sys,json; [print(c['id'], c['value']) for f in json.load(sys.stdin)['ticket_fields'] if f['name']=='source' for c in f['choices']]"
```

---

## 5. Workspace Configuration

**Note:** If your Freshservice instance uses multiple workspaces, API access is workspace-scoped.

### Check Your Workspace:

```bash
curl -u "YOUR_API_KEY:X" "https://YOUR_DOMAIN.freshservice.com/api/v2/agents/me" | \
  python3 -c "import sys,json; print('Workspace IDs:', json.load(sys.stdin)['agent']['workspace_ids'])"
```

### List Workspaces:

```bash
curl -u "YOUR_API_KEY:X" "https://YOUR_DOMAIN.freshservice.com/api/v2/workspaces"
```

If tickets are in a different workspace than your agent, you'll get `403` errors.

---

## 6. API Endpoints Reference

### Base URL
```
https://YOUR_DOMAIN.freshservice.com/api/v2
```

### Authentication
```
Basic Auth: API_KEY:X
```

### Endpoints Used by Golem

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/agents/me` | Get current agent profile |
| GET | `/tickets?filter=new_and_my_open` | List my open tickets |
| GET | `/tickets/{id}` | Get single ticket |
| POST | `/tickets` | Create ticket |
| PUT | `/tickets/{id}` | Update ticket |
| POST | `/tickets/{id}/notes` | Add note to ticket |
| GET | `/ticket_form_fields` | Get ticket field definitions |
| POST | `/ticket_fields/sources` | Create custom source |
| GET | `/groups` | List agent groups |
| GET | `/workspaces` | List workspaces |

### Valid Filter Values for Tickets

```
new_and_my_open, watching, spam, deleted, archived
```

Note: `assigned_to_me` is NOT valid (despite being documented elsewhere).

---

## 7. Common Errors and Solutions

### 403 Forbidden - "You are not authorized to perform this action"

**Causes:**
1. Agent only has "Account Admin" role (no ticket permissions)
2. Agent not assigned to correct workspace
3. API key is incorrect or expired

**Solution:** Add an agent role (IT Agent, IT Supervisor, etc.) with `manage_tickets` privilege.

### 400 Validation Failed - Missing group_id

**Cause:** Your Freshservice instance requires `group_id` for ticket creation.

**Solution:** Include `group_id` in ticket creation payload. Get valid IDs from `/api/v2/groups`.

### 400 Validation Failed - Invalid category

**Cause:** Category value doesn't match configured options.

**Solution:** Query `/api/v2/ticket_form_fields` to get valid category values for your instance.

### 400 Validation Failed - Invalid filter

**Cause:** Using unsupported filter value like `assigned_to_me`.

**Solution:** Use `new_and_my_open` instead.

---

## 8. Environment Variables

Set these in `~/.golem/.env`:

```bash
# Freshservice Configuration
FRESH_DOMAIN=your-instance.freshservice.com
FRESH_API_KEY=your_api_key_here

# Optional: Default values for ticket creation
FRESH_DEFAULT_GROUP_ID=38000120203
FRESH_DEFAULT_CATEGORY=Applications
FRESH_SOURCE_ID=1002
```

---

## 9. Testing the Configuration

Run these commands to verify everything is working:

### Test Authentication:
```bash
golem-api fresh:test
```

Expected output:
```
✓ Connected to Freshworks
  Found X tickets assigned to you
```

### List Your Tickets:
```bash
golem-api fresh:list
```

### Create a Test Ticket:
```bash
curl -X POST -u "$FRESH_API_KEY:X" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "API Test Ticket",
    "description": "Testing API connectivity",
    "email": "your@email.com",
    "group_id": YOUR_GROUP_ID,
    "category": "Applications",
    "source": YOUR_SOURCE_ID,
    "priority": 3,
    "status": 2
  }' \
  "https://$FRESH_DOMAIN/api/v2/tickets"
```

---

## 10. Production Checklist

Before deploying to production:

- [ ] Create dedicated service account (don't use personal account)
- [ ] Assign IT Agent/Supervisor role to service account
- [ ] Generate API key for service account
- [ ] Create "ACE (API)" custom source
- [ ] Document group_id values for your teams
- [ ] Document valid category values
- [ ] Test ticket creation with all required fields
- [ ] Test ticket updates and notes
- [ ] Store API key securely (not in git)

---

## Appendix: Our Sandbox Configuration

**Domain:** `pearlriverresorthelpdesk-service-desk-sandbox.freshservice.com`

**Agent Roles Required:**
- Account Admin (for admin functions)
- IT Operations (role_id: 38000126321)
- IT Manager (role_id: 38000126322)

**Group ID (Development):** `38000120203`

**Categories:** `Hardware`, `Applications`, `Infrastructure`, `Security`

**Custom Source:**
- Name: `ACE (API)`
- choice_id: `1002`

**Workspace:**
- ID: `2`
- Name: `IT`
