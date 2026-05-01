# AlumniConnect — Registration System Implementation Plan

## Current State
- Onboarding popup system exists (being replaced)
- Alumni certificate upload + admin review still needed
- Students with college email = auto-active, no review needed
- Future: Google/LinkedIn SSO (later session)
- Email service NOT configured yet — mock OTP (console log) for dev, real email later

---

## Phase 1: Remove Old Onboarding System

### Files to DELETE
1. `components/onboarding/onboarding-dialog.tsx`
2. `components/onboarding/under-review-banner.tsx`
3. `components/onboarding/rejected-banner.tsx`

### Files to MODIFY

**`app/student/dashboard/page.tsx`**
- Remove: `OnboardingDialog`, `UnderReviewBanner`, `RejectedBanner` imports
- Remove: `onboardingStatus` logic from `useAuth`
- Remove: searchParams `?onboarding=true` checks
- Remove: `Suspense` wrapper (if only needed for onboarding)

**`app/alumni/dashboard/page.tsx`**
- Same as student dashboard — remove all onboarding components

**`components/layout/auth-checker.tsx`**
- Remove: `OnboardingStatus` interface
- Remove: `onboardingStatus` state and SWR fetch for `/api/onboarding`
- Remove: all onboarding-related useEffect logic
- Keep: basic auth check (user + role only)

**`app/admin/verifications/page.tsx`** — KEEP (still needed for alumni review)
**`app/api/onboarding/[id]/route.ts`** — KEEP (approve/reject alumni)
**`app/api/onboarding/requests/route.ts`** — KEEP (list alumni requests)
**`database-onboarding-migration.sql`** — KEEP (table still needed for alumni)

---

## Phase 2: Database Migration

### New Table: `email_otps`
```sql
CREATE TABLE IF NOT EXISTS email_otps (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_otps_email ON email_otps(email);
CREATE INDEX idx_email_otps_expires ON email_otps(expires_at);
```

### Ensure `onboarding_requests` has columns (already done)
- `current_year VARCHAR(20)`
- `semester VARCHAR(20)`

---

## Phase 3: Registration Page (`/portal/register`)

### Layout
- Tab-based: Student / Alumni
- Step 1: Registration form → generates OTP
- Step 2: OTP verification → creates account

### Student Registration Form Fields

**Required:**
| Field | Type | Notes |
|-------|------|-------|
| First Name | text | |
| Last Name | text | |
| College Email | email | Must end in college domain (.edu, .ac.in, etc.) |
| Password | password | Min 8 chars |
| Confirm Password | password | Must match |
| Current Year | dropdown | 1st Year – 5th Year |
| Semester | dropdown | Semester 1 – 8 |
| Degree | dropdown | BSc, BA, BEng, MSc, MA, MBA, PhD, Other |
| Major | text | e.g., Computer Science |

**Optional:**
| Field | Type | Notes |
|-------|------|-------|
| Phone | text | +1 234 567 8900 |

### Alumni Registration Form Fields

**Required:**
| Field | Type | Notes |
|-------|------|-------|
| First Name | text | |
| Last Name | text | |
| Email | email | Personal email (any domain) |
| Password | password | Min 8 chars |
| Confirm Password | password | Must match |
| Graduation Year | dropdown | Past years (current year – 20 back) |
| Degree | dropdown | BSc, BA, BEng, MSc, MA, MBA, PhD, Other |
| Major | text | e.g., Computer Science |
| Certificate | file upload | PDF/JPG/PNG, max 2MB — MANDATORY |

**Optional:**
| Field | Type | Notes |
|-------|------|-------|
| Phone | text | |
| Current Company | text | |
| Current Position | text | |
| LinkedIn URL | text | https://linkedin.com/in/... |
| Bio | textarea | Tell us about yourself |

### Flow
1. User fills form → clicks "Send OTP"
2. OTP generated (mock: logged to console), stored in `email_otps`
3. User enters 6-digit OTP → clicks "Verify & Create Account"
4. **Student** → status = `active` → redirect `/student/dashboard`
5. **Alumni** → status = `pending` + `onboarding_requests` entry → redirect `/alumni/dashboard?review=true`

### Email Validation for Students
- Block if email does NOT end with college domain (`.edu`, `.ac.in`, `.ac.uk`, `.edu.in`)
- Error: "Please use your college email (e.g., enrolmentno@saffrony.ac.in)"

---

## Phase 4: Registration APIs

### POST `/api/auth/register`
**Input:** JSON body with form fields
**Logic:**
1. Validate all required fields
2. For students: validate college email domain
3. Check if email already exists → error if taken
4. Generate 6-digit random OTP
5. Store in `email_otps` (expires in 10 minutes)
6. Mock: log OTP to console (`console.log("[OTP] ...")`)
7. Return: `{ message: "OTP sent", email: "...", expires_in: 600 }`

### POST `/api/auth/verify-otp`
**Input:** JSON body with email, otp, role, form fields
**Logic:**
1. Validate OTP exists, not expired, not used
2. Hash password with bcrypt
3. Create user:
   - Student: `status = 'active'`
   - Alumni: `status = 'pending'`
4. If alumni: insert into `onboarding_requests` with certificate upload
5. Mark OTP as used
6. Create session, set cookie
7. Return: `{ token, user }`
8. Client redirects to dashboard

### Certificate Upload for Alumni
- Upload to `public/uploads/onboarding/`
- Filename: `{userId}_{timestamp}.{ext}`
- Store URL in `onboarding_requests.certificate_url`

---

## Phase 5: Login Page Updates

### `app/portal/login/page.tsx`
- Add "Don't have an account? Register here" link at bottom
- Link: `/portal/register`
- Keep existing login logic (already supports pending/rejected)

---

## Phase 6: Future SSO Page (`/register`)

### Placeholder
- Simple page with "Register with Google" and "Register with LinkedIn" buttons (UI only)
- Buttons are non-functional for now — "Coming Soon" badge
- Link back to `/portal/register` for manual registration
- Future session: implement Google OAuth + LinkedIn OAuth

---

## Phase 7: Cleanup & Verify

1. Remove unused imports from all modified files
2. Run `npm run build` — verify 0 errors
3. Update `CHANGELOG-MESSAGING.md` with new section

---

## Summary of Changes

| Phase | Type | Files | Count |
|-------|------|-------|-------|
| Delete | Remove files | 3 onboarding components | 3 |
| Modify | Remove onboarding logic | dashboards, auth-checker | 3 |
| Create | Database migration | `email_otps` table | 1 |
| Create | Registration page | `/portal/register` | 1 |
| Create | Registration APIs | register, verify-otp | 2 |
| Modify | Login page | add register link | 1 |
| Create | SSO placeholder | `/register` | 1 |
| Modify | Changelog | new section | 1 |

**Total: 13 file changes (3 delete, 5 create, 5 modify)**
