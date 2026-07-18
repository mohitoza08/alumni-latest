# AlumniConnect1 — Full Audit Issues

> Generated: 2026-07-18
> Total issues: 40
> Status: Documentation only — fix when ready

---

## TIER 1: BLOCKING — Causes 500 errors (10 issues)

### 1. `users` table missing column `current_year_level`
- **File**: Supabase DB
- **Fix**: `ALTER TABLE users ADD COLUMN IF NOT EXISTS current_year_level VARCHAR(10)`

### 2. `users` table missing multiple columns
- **Columns missing**: `onboarding_completed`, `bio`, `current_company`, `current_position`, `linkedin_url`, `ban_reason`, `suspended_until`, `profile_picture`
- **File**: Supabase DB
- **Fix**: Run `db-migrations/fix-missing-columns.sql`

### 3. `onboarding_requests` table missing
- **File**: Supabase DB
- **Fix**: Already in `fix-missing-columns.sql`

### 4. Notifications: `read` vs `is_read` column mismatch
- **Files**: `app/api/notifications/[id]/read/route.ts:21`, `app/api/notifications/mark-all-read/route.ts:16-17`, `app/api/notifications/unread-count/route.ts:17`
- **Fix**: Change `read` → `is_read` in all queries

### 5. Workshops: `date` vs `start_date` column mismatch
- **File**: `app/api/workshops/route.ts:17`
- **Fix**: Change `ORDER BY date ASC` → `ORDER BY start_date ASC`

### 6. Event registration verify/reject use non-existent columns
- **Columns**: `admin_note`, `verified_at` on `event_registrations`
- **Files**: `app/api/events/registrations/[id]/verify/route.ts:25`, `reject/route.ts:24`
- **Fix**: Remove `admin_note = $1` and `verified_at = CURRENT_TIMESTAMP` from queries, or add columns to schema

### 7. Donations: `created_at` vs `donated_at` column mismatch
- **File**: `app/api/campaigns/[id]/donations/route.ts:18`
- **Fix**: Change `d.created_at` → `d.donated_at`

### 8. Event registration verify: invalid status `'confirmed'`
- **File**: `app/api/events/registrations/[id]/verify/route.ts:25`
- **Schema CHECK**: `registered, attended, cancelled, waitlisted`
- **Fix**: Change `'confirmed'` → `'attended'`

### 9. Event registration reject: invalid status `'rejected'`
- **File**: `app/api/events/registrations/[id]/reject/route.ts:24`
- **Fix**: Change `'rejected'` → `'cancelled'`

### 10. Campaign donations: invalid status filter `'verified'`
- **File**: `app/api/campaigns/[id]/donations/route.ts:17`
- **Schema CHECK**: `pending, completed, failed, refunded`
- **Fix**: Change `'verified'` → `'completed'`

---

## TIER 2: SECURITY — Must fix before production (8 issues)

### 11. Session tokens generated with `Math.random()` — predictable
- **File**: `lib/auth-db.ts:172`
- **Fix**: Use `crypto.randomBytes(32).toString('hex')`

### 12. OTPs logged to console in plaintext
- **File**: `app/api/auth/register/route.ts:47`
- **Fix**: Remove or gate behind `if (process.env.NODE_ENV === 'development')`

### 13. No auth on `/api/debug` — exposes DB schema
- **File**: `app/api/debug/route.ts`
- **Fix**: Add admin check or remove from production

### 14. No auth on `/api/admin/activity` — full user data leak
- **File**: `app/api/admin/activity/route.ts`
- **Fix**: Add `getServerSession()` + admin role check

### 15. No auth on `/api/donations/top-donors` — donor PII exposed
- **File**: `app/api/donations/top-donors/route.ts`
- **Fix**: Add session check

### 16. No auth on `/api/ai/enhance-resume` — Groq API quota abuse
- **File**: `app/api/ai/enhance-resume/route.ts`
- **Fix**: Add session check

### 17. SSO callback creates fake users without real validation
- **File**: `app/api/auth/sso/[college]/callback/route.ts`
- **Fix**: Remove from production or implement real SSO validation

### 18. `updateUserProfile` allows arbitrary column names
- **File**: `lib/auth-db.ts:154-156`
- **Fix**: Add column name whitelist validation inside the function

---

## TIER 3: SCHEMA MISMATCHES — Wrong CHECK values (7 issues)

### 19. `banUser()` sets `status = 'banned'` — not in CHECK
- **File**: `lib/db-helpers.ts:1018`
- **Schema CHECK**: `active, inactive, pending, suspended, rejected`
- **Fix**: Change to `'suspended'` or add `'banned'` to schema

### 20. Notifications: `type = 'announcement'` — not in CHECK
- **File**: `app/api/notifications/route.ts:47,56`
- **Schema CHECK**: `application, post, comment, like, mentorship, event, donation, system, achievement`
- **Fix**: Change to `'system'` or add `'announcement'` to schema

### 21. Notifications: `type = 'streak'` — not in CHECK
- **File**: `app/api/streak/checkin/route.ts:60`
- **Fix**: Change to `'system'` or add `'streak'` to schema

### 22. Workshops: `status = 'active'` — not in CHECK
- **File**: `app/api/workshops/route.ts:16`
- **Schema CHECK**: `draft, upcoming, ongoing, completed, cancelled`
- **Fix**: Change to `'upcoming'`

### 23. Mentorship requests: `status = 'completed'` — not in CHECK
- **File**: `app/api/mentorship/requests/[id]/route.ts:19`
- **Schema CHECK**: `pending, accepted, rejected, cancelled`
- **Fix**: Change to `'accepted'`

### 24. Dashboard stats: wrong property access
- **File**: `app/api/admin/dashboard-stats/route.ts:37`
- **Issue**: Query alias is `total_points` but code reads `pointsData[0]?.points`
- **Fix**: Change to `pointsData[0]?.total_points`

### 25. Event registrations: `status = 'pending'` — not in CHECK
- **File**: `app/api/events/registrations/route.ts:20`
- **Schema CHECK**: `registered, attended, cancelled, waitlisted`
- **Fix**: Change to `'registered'`

### 26. Fundraising donation verify: `status = 'verified'` — not in CHECK
- **File**: `app/api/fundraising/donations/[id]/verify/route.ts:21`
- **Schema CHECK**: `pending, completed, failed, refunded`
- **Fix**: Change to `'completed'`

### 27. `db-helpers.ts`: `updated_at` on event_registrations — no such column
- **File**: `lib/db-helpers.ts:289`
- **Fix**: Remove `updated_at = CURRENT_TIMESTAMP` from the UPDATE query

---

## TIER 4: CROSS-COLLEGE DATA ACCESS — 8 routes leak data across colleges (8 issues)

### 28. `admin/activity/route.ts`
- No `college_id` filter on users, posts, events queries

### 29. `donations/top-donors/route.ts`
- No `college_id` filter

### 30. `users/bulk-activate/route.ts`
- Can activate users from any college

### 31. `onboarding/[id]/route.ts`
- Can view/approve other colleges' requests

### 32. `onboarding/requests/route.ts`
- Returns ALL colleges' requests

### 33. `campaigns/[id]/route.ts` GET
- No auth + no college filter

### 34. `events/registrations/[id]/verify`
- Can verify registrations from other colleges

### 35. `events/registrations/[id]/reject`
- Same

---

## TIER 5: NEXT.JS 15 PARAMS COMPATIBILITY (1 issue covering 18 routes)

### 36. `params: { id: string }` → `params: Promise<{ id: string }>`
- **Affected routes** (18 files):
  - `users/[id]/route.ts`
  - `users/[id]/suspend/route.ts`
  - `users/[id]/role/route.ts`
  - `users/[id]/reject/route.ts`
  - `users/[id]/delete/route.ts`
  - `users/[id]/approve/route.ts`
  - `users/[id]/activate/route.ts`
  - `users/[id]/ban/route.ts`
  - `events/registrations/[id]/verify/route.ts`
  - `events/registrations/[id]/reject/route.ts`
  - `campaigns/[id]/route.ts`
  - `campaigns/[id]/donations/route.ts`
  - `campaigns/[id]/donation-requests/route.ts`
  - `campaigns/[id]/donation-requests/[requestId]/route.ts`
  - `campaigns/[id]/donation-requests/[requestId]/verify/route.ts`
  - `campaigns/[id]/donation-requests/[requestId]/reject/route.ts`
  - `fundraising/donations/[id]/verify/route.ts`
  - `notifications/[id]/read/route.ts`
- **Fix**: Change all to `params: Promise<{ id: string }>` and `const { id } = await params`

---

## TIER 6: MINOR / LOW PRIORITY (4 issues)

### 37. OTP uses `Math.random()` not crypto-secure
- **File**: `app/api/auth/register/route.ts:16`
- **Fix**: Use `crypto.randomInt(100000, 999999)`

### 38. Error details leaked to client in 8+ routes
- **Files**: `auth/verify-otp/route.ts:164`, `auth/complete-register/route.ts:127`, `auth/register/route.ts:63`, `users/[id]/route.ts:142`, `events/route.ts:225`, `applications/[id]/approve/route.ts:63`, `onboarding/[id]/route.ts:53`, `users/apply-alumni/route.ts:60`
- **Fix**: Return generic error messages in production, log details server-side only

### 39. No rate limiting on login
- **File**: `app/api/auth/login/route.ts`
- **Fix**: Add rate limiting (e.g., 5 attempts per minute per IP)

### 40. Certificate uploads not stored anywhere
- **File**: `app/api/auth/verify-otp/route.ts:99`
- **Issue**: Sets `certUrl = "certificate_stored"` but file content is discarded
- **Fix**: Store in external storage (S3/R2/Blob) or base64 in DB

---

## QUICK REFERENCE: SQL to fix Tiers 1-3

Run this in Supabase SQL Editor to fix all blocking + schema issues:

```sql
-- Add missing users columns
DO $$ BEGIN ALTER TABLE users ADD COLUMN IF NOT EXISTS current_year_level VARCHAR(10); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE users ADD COLUMN IF NOT EXISTS current_company VARCHAR(255); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE users ADD COLUMN IF NOT EXISTS current_position VARCHAR(255); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Add missing event_registrations columns
DO $$ BEGIN ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS admin_note TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Extend CHECK constraints to match code
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('active', 'inactive', 'pending', 'suspended', 'rejected', 'banned'));

ALTER TABLE event_registrations DROP CONSTRAINT IF EXISTS event_registrations_status_check;
ALTER TABLE event_registrations ADD CONSTRAINT event_registrations_status_check CHECK (status IN ('registered', 'attended', 'cancelled', 'waitlisted', 'confirmed', 'rejected', 'pending'));

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('application', 'post', 'comment', 'like', 'mentorship', 'event', 'donation', 'system', 'achievement', 'announcement', 'streak'));

ALTER TABLE workshops DROP CONSTRAINT IF EXISTS workshops_status_check;
ALTER TABLE workshops ADD CONSTRAINT workshops_status_check CHECK (status IN ('draft', 'upcoming', 'ongoing', 'completed', 'cancelled', 'active'));

ALTER TABLE donations DROP CONSTRAINT IF EXISTS donations_status_check;
ALTER TABLE donations ADD CONSTRAINT donations_status_check CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'verified'));

ALTER TABLE mentorship_requests DROP CONSTRAINT IF EXISTS mentorship_requests_status_check;
ALTER TABLE mentorship_requests ADD CONSTRAINT mentorship_requests_status_check CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'completed'));

-- Create missing tables
CREATE TABLE IF NOT EXISTS onboarding_requests (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    college_id BIGINT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('student', 'alumni')),
    graduation_year INTEGER,
    current_year VARCHAR(20),
    semester VARCHAR(20),
    degree VARCHAR(100),
    major VARCHAR(100),
    current_company VARCHAR(255),
    current_position VARCHAR(255),
    linkedin_url VARCHAR(255),
    bio TEXT,
    phone VARCHAR(20),
    certificate_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    reviewed_by BIGINT,
    reviewed_at TIMESTAMP,
    professional_type VARCHAR(20),
    business_name VARCHAR(255),
    business_type VARCHAR(100),
    freelancer_skills TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    link_url VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS email_otps (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
