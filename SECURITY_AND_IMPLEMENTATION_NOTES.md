# Security and Implementation Notes

This document covers security considerations and implementation notes for the IntelliTeach system fixes.

## Security Fixes Applied

### 1. AI Token Deduction Race Condition (CRITICAL - FIXED)

**Issue**: The original implementation had a race condition where multiple concurrent requests could bypass token limits.

**Original Code**:
```typescript
const org = await prisma.organization.findUnique({ where: { idString: organizationId } })
if (org.aiTokenUsage + estimatedTokens > org.aiTokenLimit) return false
await prisma.organization.update({ /* increment tokens */ })
```

**Problem**: Between the check and the update, multiple requests could pass the balance check and all deduct tokens, exceeding the limit.

**Fix**: Wrapped the operation in a Prisma transaction with optimistic locking:
```typescript
const result = await prisma.$transaction(async (tx) => {
  const org = await tx.organization.findUnique({ where: { idString: organizationId } })
  // Check limits
  await tx.organization.update({
    where: { 
      idString: organizationId,
      aiTokenUsage: org.aiTokenUsage // Optimistic lock
    },
    data: { aiTokenUsage: { increment: estimatedTokens } }
  })
  return true
})
```

**Impact**: Prevents token usage from exceeding organizational limits under concurrent load.

---

### 2. Course Code Uniqueness (CRITICAL - FIXED)

**Issue**: Multiple teachers could create courses with the same code (e.g., "CS101").

**Fix**: Added `@unique` constraint to `Course.code` field in Prisma schema.

**Migration Required**: Yes - see Database Migration section below.

**Impact**: Prevents data confusion and ensures course codes are system-wide unique identifiers.

---

### 3. Organization Validation (CRITICAL - FIXED)

**Issue**: Teachers and students could be created without an organizationId, breaking multi-tenant isolation.

**Fix**: 
- Updated `CreateUserSchema` with Zod refinement to require organizationId for TEACHER and STUDENT roles
- Added server-side validation in `createUser` action
- Added validation in `joinCourse` to ensure students have an organization

**Impact**: Ensures proper multi-tenant data isolation and prevents orphaned users.

---

## Known Limitations

### Token Monthly Reset Not Implemented

**Issue**: The system has `aiTokenLimit` (monthly limit) but no automatic reset mechanism.

**Current Behavior**: 
- `aiTokenUsage` increments with each AI API call
- Once usage reaches the limit, AI features become unavailable
- No automatic reset occurs at month start

**Workaround**: Manual reset via database or admin interface:
```sql
-- Reset all organizations at start of month
UPDATE "Organization" SET "aiTokenUsage" = 0 WHERE "aiSubStatus" = 'ACTIVE';

-- Reset specific organization
UPDATE "Organization" SET "aiTokenUsage" = 0 WHERE "idString" = '<org-id>';
```

**Recommended Implementation** (Future Work):
1. Add a cron job or scheduled task (e.g., using Vercel Cron or external scheduler)
2. Create a server action to reset tokens:
```typescript
export async function resetMonthlyTokens() {
  await prisma.organization.updateMany({
    where: { aiSubStatus: 'ACTIVE' },
    data: { aiTokenUsage: 0 }
  })
}
```
3. Schedule it to run on the 1st of each month at midnight UTC

**Alternative Approach**: 
- Add `lastResetDate` field to Organization model
- Check and reset on-demand when API is called:
```typescript
const now = new Date()
if (org.lastResetDate < startOfMonth(now)) {
  await prisma.organization.update({
    where: { idString: organizationId },
    data: { 
      aiTokenUsage: 0,
      lastResetDate: now
    }
  })
}
```

---

## Database Migration

After pulling these changes, you **MUST** run migrations to apply schema changes:

```bash
# Generate Prisma Client with updated schema
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add-unique-constraints-remove-unused-fields

# Seed database (optional, for development)
npm run db:seed
```

### Schema Changes Summary

1. **Course.code**: Added `@unique` constraint
2. **Assignment.attachments**: Removed (file upload not implemented)
3. **Organization.domain**: Removed (unused field)

### Migration Warnings

- **Course.code uniqueness**: If you have existing duplicate course codes, the migration will fail. You must manually resolve duplicates first:
```sql
-- Find duplicate course codes
SELECT code, COUNT(*) FROM "Course" GROUP BY code HAVING COUNT(*) > 1;

-- Update duplicates manually before migration
UPDATE "Course" SET code = 'CS101-2' WHERE "idString" = '<duplicate-id>';
```

---

## Validation Summary

All input validation now uses Zod schemas with proper error messages:

### User Creation
- ✅ Name: minimum 2 characters
- ✅ Email: valid email format
- ✅ Password: minimum 6 characters
- ✅ Role: must be SUPER_ADMIN, TEACHER, or STUDENT
- ✅ OrganizationId: required for TEACHER and STUDENT roles

### Course Enrollment
- ✅ Course code: must exist and not be archived
- ✅ Organization match: course must belong to student's organization
- ✅ Duplicate check: prevents joining the same course twice

### Organization Creation
- ✅ Name: minimum 2 characters, must be unique
- ✅ AI Token Limit: minimum 1000 tokens

---

## Performance Improvements

### Pagination
All list queries now use pagination (20 items per page by default):
- Organizations list
- Users list  
- Teacher courses list
- Student enrollments list

**Benefits**:
- Prevents database query timeouts with large datasets
- Reduces memory usage on server and client
- Improves page load times

**Usage**: Navigate with query parameters:
```
/admin/users?page=1
/admin/users?page=2
```

---

## Permission Model Updates

### SUPER_ADMIN Access
SUPER_ADMIN can now access all role-specific views for debugging and monitoring:

- Teacher dashboard: Shows ALL courses and submissions (not just owned)
- Student dashboard: Shows ALL enrollments and assignments (not just user's)
- Teacher courses: Shows ALL courses in system
- Student courses: Shows ALL enrollments in system

**Implementation**: Updated layout guards:
```typescript
// Before: Only TEACHER allowed
if (session.user.role !== 'TEACHER') redirect('/unauthorized')

// After: Both TEACHER and SUPER_ADMIN allowed
if (session.user.role !== 'TEACHER' && session.user.role !== 'SUPER_ADMIN') redirect('/unauthorized')
```

---

## Testing Recommendations

### Critical Paths to Test

1. **Token Deduction Under Load**
   - Simulate concurrent AI grading requests
   - Verify token usage doesn't exceed limit
   - Use tool like `ab` (Apache Bench) or `k6` for load testing

2. **User Creation Flow**
   - Create TEACHER without organizationId → should fail
   - Create STUDENT without organizationId → should fail
   - Create SUPER_ADMIN without organizationId → should succeed

3. **Course Enrollment**
   - Student tries to join course from different organization → should fail
   - Student tries to join same course twice → should fail
   - Student without organization tries to join course → should fail

4. **Pagination**
   - Create 25+ organizations/users/courses
   - Verify pagination controls appear
   - Test navigation between pages

### SQL Injection Testing
All database queries use Prisma's parameterized queries, which are safe from SQL injection by design.

### XSS Testing  
All user input is rendered using React, which automatically escapes HTML. Manual testing recommended for:
- Organization names with HTML/JS
- User names with script tags
- Course descriptions with malicious content

---

## Deployment Checklist

Before deploying to production:

- [ ] Run database migrations
- [ ] Verify all environment variables are set
- [ ] Test user creation workflow
- [ ] Test course enrollment workflow  
- [ ] Verify pagination works with production data
- [ ] Set up monitoring for token usage
- [ ] **IMPORTANT**: Schedule manual token reset for month start (until automated solution is implemented)
- [ ] Review security scanning results from CodeQL
- [ ] Test SUPER_ADMIN access to all views

---

## Future Improvements

### High Priority
1. Implement automated monthly token reset (cron job or scheduled task)
2. Add ability for users to change passwords
3. Add ability for users to update avatars

### Medium Priority  
1. Add course code validation to prevent profanity or reserved words
2. Implement soft delete for courses and users instead of hard delete
3. Add audit logging for sensitive operations (user creation, token resets, etc.)

### Low Priority
1. Add CSV export for users and organizations
2. Add advanced filtering for list views
3. Implement full-text search for courses

---

## Support

For issues or questions:
1. Check this document first
2. Review error logs in `/var/log` or application console
3. Check Prisma migration status: `npx prisma migrate status`
4. Review GitHub issues for similar problems

---

**Last Updated**: 2025-11-20  
**Version**: 2.0.0  
**Migration Version**: add-unique-constraints-remove-unused-fields
