# Security Guidelines for Offloadr Backend

## Mass Assignment Protection

This document outlines the security measures in place to prevent mass assignment vulnerabilities in the Offloadr API.

### What is Mass Assignment?

Mass assignment occurs when an application automatically binds user input to internal object properties without validation. This can allow attackers to modify fields they shouldn't have access to, such as:
- User roles and permissions (`is_admin`, `is_active`)
- Verification status (`email_verified`)
- Ownership fields (`user_id`, `seller_id`)
- System timestamps

### Protection Mechanisms

#### 1. Separate DTO (Data Transfer Object) Structures

All API endpoints use dedicated payload structures that explicitly define which fields can be modified:

**Good Example:**
```go
type UpdateUserPayload struct {
    Firstname *string `json:"firstname" validate:"omitempty,min=2,max=100"`
    Lastname  *string `json:"lastname" validate:"omitempty,min=2,max=100"`
    Phone     *string `json:"phone" validate:"omitempty,max=20"`
    // Note: is_admin, email_verified, etc. are NOT included
}
```

#### 2. Explicit Field Assignment

Handlers manually assign only whitelisted fields from payloads to models:

```go
// SAFE: Only updates explicitly allowed fields
if payload.Firstname != nil {
    user.Firstname = *payload.Firstname
}
if payload.Lastname != nil {
    user.Lastname = *payload.Lastname
}
```

**Never** do this:
```go
// DANGEROUS: Could expose all fields
json.Unmarshal(body, &user)
```

#### 3. Separate Update Methods for Sensitive Operations

Operations that modify sensitive fields use dedicated methods with explicit authorization:

- `Users.Update()` - General profile updates (safe fields only via handler)
- `Users.Activate()` - Only called during email verification flow
- Password changes - Separate endpoint with password confirmation
- Status changes - Separate endpoints with business logic validation

#### 4. Authorization Checks

Every endpoint that modifies data includes ownership validation:

```go
// Verify the user owns the resource
if item.UserID != user.ID {
    app.forbiddenResponse(w, r, fmt.Errorf("you don't have permission to update this item"))
    return
}
```

### Endpoints and Their Protections

#### User Endpoints

| Endpoint | Protected Fields | Protection Method |
|----------|------------------|-------------------|
| `PATCH /v1/users/me` | `is_admin`, `email_verified`, `is_active`, `school_id`, `id` | Whitelist via `UpdateUserPayload` |
| `PATCH /v1/users/me/password` | All except password | Dedicated endpoint, requires current password |
| `DELETE /v1/users/me` | N/A | Requires password confirmation |

#### Item Endpoints

| Endpoint | Protected Fields | Protection Method |
|----------|------------------|-------------------|
| `POST /v1/items` | `user_id`, `school_id`, `views_count`, `buyer_id` | Set by server from auth context |
| `PATCH /v1/items/{id}` | `user_id`, `school_id`, `status`, `views_count` | Whitelist + ownership check |
| `PATCH /v1/items/{id}/status` | `user_id`, `buyer_id`, `views_count` | Dedicated endpoint + ownership |

#### Review Endpoints

| Endpoint | Protected Fields | Protection Method |
|----------|------------------|-------------------|
| `POST /v1/reviews` | `reviewer_id`, `seller_id` | Set by server from item owner |
| `PATCH /v1/reviews/{id}` | `reviewer_id`, `seller_id`, `item_id` | Ownership check + whitelist |

### Developer Guidelines

When adding new endpoints that modify data:

1. **Create a dedicated payload struct** with only the fields that users should be able to modify
2. **Add validation tags** to the payload struct
3. **Manually assign fields** from payload to model - never use automatic binding
4. **Verify ownership** before allowing modifications
5. **Set server-controlled fields** from the authenticated user context, not from user input
6. **Use separate methods** for sensitive operations (e.g., password changes, role modifications)
7. **Test with malicious payloads** that include fields like `is_admin`, `user_id`, etc.

### Testing for Mass Assignment

To test an endpoint for mass assignment vulnerabilities:

```bash
# Example: Try to set is_admin via user update endpoint
curl -X PATCH https://api.offloadr.com/v1/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstname": "John",
    "is_admin": true,
    "email_verified": true,
    "is_active": true
  }'

# Expected: Only firstname should be updated, other fields should be ignored
# The response should NOT include is_admin=true
```

### Database Layer Protections

While the API layer provides primary protection, the database layer includes additional safeguards:

1. **Update methods use explicit field lists** - they don't use `UPDATE * FROM` patterns
2. **Foreign key constraints** prevent invalid references
3. **Unique constraints** prevent duplicate usernames/emails
4. **Triggers** (if any) validate business rules

### Current Implementation Status

✅ **Protected Against Mass Assignment:**
- User profile updates
- Item creation and updates
- Review creation and updates
- Report creation
- Favorite management
- All authentication flows

⚠️ **Review Periodically:**
- Database Update methods to ensure they don't expose sensitive fields through reflection or ORM
- New endpoints added to the API
- Third-party package updates that might change behavior

### Reporting Security Issues

If you discover a security vulnerability, please report it to security@offloadr.com. Do not create a public GitHub issue.

---

Last Updated: 2025-12-25
