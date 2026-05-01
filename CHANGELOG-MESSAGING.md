# AlumniConnect - Messaging System Changes

## Overview
This document outlines all the changes made to implement the unified messaging system for AlumniConnect.

---

## Database Changes

### 1. New Table: `conversations`
```sql
CREATE TABLE conversations (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255),
    created_by BIGINT NOT NULL,
    college_id BIGINT NOT NULL,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. New Column: `messages.conversation_id`
```sql
ALTER TABLE messages ADD COLUMN conversation_id BIGINT;
```

### 3. Fixed Foreign Key Constraint
Fixed mentorship foreign key to reference correct table:
```sql
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_mentorship_id_fkey;
ALTER TABLE messages ADD CONSTRAINT fk_messages_mentorship 
  FOREIGN KEY (mentorship_id) REFERENCES mentorship_requests(id) ON DELETE SET NULL;
```

### 4. Mentorship Status Constraint
Added 'completed' status:
```sql
ALTER TABLE mentorship_requests 
  DROP CONSTRAINT IF EXISTS mentorship_requests_status_check;
ALTER TABLE mentorship_requests ADD CONSTRAINT mentorship_requests_status_check 
  CHECK (status IN ('pending', 'accepted', 'rejected', 'completed'));
```

---

## Backend Changes

### 1. lib/db-helpers.ts

#### Added Types
- `Conversation` interface with new fields:
  - `is_mentorship_completed`
  - `completed_at`
  - `mentorship_id`

#### New Functions
- `getConversations(userId, collegeId)` - Get all conversations (for alumni)
- `getActiveMentorshipConversations(userId, collegeId)` - Get only active mentorship conversations (for students)
- `getCompletedMentorshipConversations(userId, collegeId, daysWindow)` - Get completed mentorship chats within 30-day window
- `createConversation(data)` - Create new conversation
- `getConversationById(id)` - Get single conversation
- `updateConversationTitle(id, title)` - Update title
- `getConversationMessages(id, limit, offset)` - Paginated messages

#### Updated Functions
- `createMessage()` - Added `conversation_id` parameter and updates conversation timestamp

### 2. API Routes

#### `/api/conversations/route.ts` (NEW)
- `GET` - List conversations (supports `?type=active` for students)
- `POST` - Create new conversation

#### `/api/conversations/[id]/route.ts` (NEW)
- `GET` - Get single conversation with messages
- `PUT` - Update conversation title

#### `/api/conversations/completed/route.ts` (NEW)
- `GET` - Get completed mentorship chats (30-day window)

#### `/api/messages/route.ts` (UPDATED)
- Now auto-creates conversation if none provided
- Added `conversation_id` and `title` parameters

---

## Frontend Changes

### 1. Sidebar (components/layout/sidebar.tsx)
- Added "Messages" navigation item for both student and alumni

### 2. Student Messages Page (app/student/messages/page.tsx)
- Two tabs: **Active** and **Past**
- **Active**: Only shows active mentorship conversations
- **Past**: Shows completed mentorship chats (view-only for 30 days)
- "View in Messages" button redirects to messages page
- No remessage functionality for students

### 3. Alumni Messages Page (app/alumni/messages/page.tsx)
- Two tabs: **Active** and **Past**
- **Active**: All conversations (mentorship + direct)
- **Past**: Completed mentorship chats with ability to re-message
- New chat dialog to start conversations

### 4. Student Mentorship Page (app/student/mentorship/page.tsx)
- Past Chats section now links to Messages page
- "View in Messages" button instead of "Message Again"

### 5. Alumni Mentorship Page (app/alumni/mentorship/page.tsx)
- Added `handleChat` function
- Completed mentorships now show "Message Student" button

---

## Fixes Applied

### 1. Database Connection (lib/db.ts)
- Added SSL auto-detection for local vs remote connections
- Disabled SSL for localhost connections

### 2. Posts Query (app/api/activity/alumni/route.ts)
- Fixed: `user_id` → `author_id` in community_posts query

### 3. DISTINCT ON Error (lib/db-helpers.ts)
- Rewrote queries to avoid PostgreSQL DISTINCT ON issues
- Using subqueries instead for last message

### 4. Duplicate Key Warning (lib/degree-major-data.ts)
- Removed duplicate "Physical Education" entry

---

## How to Run

### For Local Database
```bash
# Run setup
npm run setup

# Or run migrations
npm run db:conversations
```

### For Supabase
Run in SQL Editor:
```sql
-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255),
    created_by BIGINT NOT NULL,
    college_id BIGINT NOT NULL,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add conversation_id to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id BIGINT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_college ON conversations(college_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
```

---

## User Flow

### Student
1. Request mentorship → Active in Mentorship page
2. Alumni accepts → Chat in Mentorship page
3. Alumni marks complete → Chat moves to Past (Messages page)
4. Past chats: View-only for 30 days, no remessage

### Alumni
1. Receive request → Accept/Decline in Mentorship
2. Active mentorship → Chat in Mentorship
3. Mark complete → Chat in Past (Messages page)
4. Can re-message students anytime (creates new thread)

---

## Notes
- Conversations are automatically created when sending messages
- Student-to-student direct messaging not implemented (only alumni-student via mentorship)
- Pagination: 50 messages per conversation load
- Polling: 1-3 second refresh intervals for real-time feel

---

# Recent Updates (April 2026)

## 1. Conversation Grouping in Messages

### Problem
Multiple mentorship conversations with the same person appeared as separate rows in the messages list.

### Solution
Implemented accordion-based grouping by person:
- **One entry per person** sorted by most recent activity
- **Chevron icon** indicates expandable accordion
- **Click person** → expands inline to show all conversation sessions
- **Click session** → right panel shows message thread

### Files Modified
- `app/alumni/messages/page.tsx`
- `app/student/messages/page.tsx`
- `app/api/conversations/route.ts`

---

## 2. Student Search in New Chat (Alumni)

### Problem
Alumni needed to know exact student ID to start a new chat.

### Solution
Implemented searchable student picker with autocomplete:
- Type 2+ characters to search by name or email
- Shows avatar, name, email, and major for each match
- Click to select student → type message → send
- Debounced search (300ms) to reduce API calls

### New Files
- `app/api/students/search/route.ts`

### Database Changes (`lib/db-helpers.ts`)
- Added `searchStudents(college_id, query)` function

### UI Changes
- Replaced "Student User ID" input with searchable dropdown
- Two-step flow: search → select student → type message

---

## 3. Direct Message Visibility Fix

### Problem
New direct chats (without `mentorship_id`) were not appearing in the Active tab because SQL queries filtered only mentorship conversations.

### Solution
Updated `getConversations()` and `getActiveMentorshipConversations()` in `lib/db-helpers.ts`:
- Now includes both **mentorship conversations** AND **direct messages**
- Direct messages resolved by checking `sender_id` or `recipient_id` against current user
- Uses `DISTINCT ON` to deduplicate results

### SQL Change
```sql
WHERE c.id IN (
  -- Part 1: Mentorship conversations
  SELECT DISTINCT c2.id FROM conversations c2
  JOIN messages m2 ON m2.conversation_id = c2.id
  WHERE m2.mentorship_id IS NOT NULL AND ...
  
  UNION
  
  -- Part 2: Direct message conversations
  SELECT DISTINCT c3.id FROM conversations c3
  JOIN messages m3 ON m3.conversation_id = c3.id
  WHERE m3.mentorship_id IS NULL
  AND (m3.sender_id = $1 OR m3.recipient_id = $1)
)
```

---

## 4. Fundraising Visibility for All Users

### Problem
Students had no access to view or donate to fundraising campaigns. Admins could only see active campaigns.

### Solution
- Added "Fundraising" link to student sidebar navigation
- Created `/student/fundraising` page with full donation capability
- Updated `getFundraisingCampaigns()` to accept role parameter

### Access Matrix After Changes

| Feature | Student | Alumni | Admin |
|---------|---------|--------|-------|
| View campaigns | ✅ active + completed | ✅ active + completed | ✅ active only |
| Donate | ✅ | ✅ | ❌ (manage only) |
| Create campaigns | ❌ | ❌ | ✅ |
| Verify donations | ❌ | ❌ | ✅ |

### Files Modified
- `components/layout/sidebar.tsx` - Added Fundraising link for students
- `lib/db-helpers.ts` - Updated `getFundraisingCampaigns(role)` and completed `FundraisingCampaign` interface
- `app/api/campaigns/route.ts` - Passes user role to DB function
- `app/api/fundraising/campaigns/route.ts` - Passes user role to DB function

### New Files
- `app/student/fundraising/page.tsx` - Student fundraising page reusing `CampaignList` + `AlumniCampaignDonate` components

### Database Interface Update
Completed `FundraisingCampaign` TypeScript interface with missing fields:
- `currency`, `campaign_type`, `banner_image`, `is_featured`, `donor_count`, `updated_at`

---

# Recent Updates (April 2026 — Onboarding & Verification Integration)

## 1. Onboarding & Verification System

### New Components
- `components/onboarding/onboarding-dialog.tsx` — 3-step multi-step onboarding form (academic info, certificate upload, success screen)
- `components/onboarding/under-review-banner.tsx` — Full-screen "Account Under Review" block for pending users
- `components/onboarding/rejected-banner.tsx` — Rejection screen with admin feedback and resubmit option

### New API Routes
- `app/api/onboarding/route.ts` — GET (check status) + POST (submit form with file upload, 2MB max)
- `app/api/onboarding/[id]/route.ts` — GET + PUT (admin approve/reject with notes)
- `app/api/onboarding/requests/route.ts` — List all requests for admin

### New Admin Page
- `app/admin/verifications/page.tsx` — Full review table with approve/reject, certificate viewer, admin notes

### Database Migration
- `database-onboarding-migration.sql` — Adds `onboarding_completed` column to users, creates `onboarding_requests` table

### Dashboard Integration
- Both student and alumni dashboards now show:
  - Onboarding dialog automatically for new users (no request)
  - Under-review full-screen banner for pending users
  - Rejection screen with feedback + resubmit for rejected users

### Login Page
- Redesigned `app/portal/login/page.tsx` with tab-based Student/Alumni login
- Auto-detects role from email domain (.edu = student, personal = alumni)

### Sidebar Updates
- Added "Messages" link for admin role
- Added "Verifications" link for admin role

---

## 2. Author Profile Popup & Quick Messaging

### New Components
- `components/forum/author-popup.tsx` — Popover on author name with View Profile + Message
- `components/forum/profile-preview.tsx` — Profile preview dialog (max-w-4xl, gradient banner, scrollable)
- `components/forum/quick-message-dialog.tsx` — Chat-style message dialog (max-w-2xl)

### Modified Files
- `components/forum/post-card.tsx` — Integrated AuthorPopup
- `app/admin/community/page.tsx` — Integrated AuthorPopup
- `lib/db-helpers.ts` — Added `findOrCreateDirectConversation()` to prevent duplicate conversations

---

## 3. WhatsApp-Style Messaging System

### Features Added
- Read receipt ticks (single = sent, double blue = read)
- Timestamps on each message bubble
- Unread badges in conversation list
- Messages scroll from bottom (newest at bottom)
- Unread-first conversation sorting

### Bug Fixes
- Fixed `getConversationMessages()` ordering from DESC to ASC
- Fixed `unread_count` queries (was hardcoded to 0)
- Added `markConversationAsRead()` auto-call in conversation GET
- Created `app/admin/messages/page.tsx` — full messaging page with user search

### Files Modified
- `app/student/messages/page.tsx` — Full WhatsApp-style rewrite
- `app/alumni/messages/page.tsx` — Full WhatsApp-style rewrite
- `lib/db-helpers.ts` — Added `findOrCreateDirectConversation()`, `markConversationAsRead()`, `getUnreadCount()`

---

## 4. Bug Fixes & Security Patches

### Critical: Login Now Allows Pending/Rejected Users
- **Problem**: Login API only allowed `status = 'active'` users, blocking rejected users from seeing feedback or resubmitting onboarding
- **Fix**: Login API (`app/api/auth/login/route.ts`) now allows `pending` and `rejected` users to login, returns `account_status` for client-side routing
- **Impact**: Rejected users can now see admin feedback and resubmit

### Critical: Session Now Returns Non-Active Users
- **Problem**: `getUserBySession()` filtered by `status = 'active'` only, so pending/rejected users got no session at all
- **Fix**: Removed status filter from session query (`lib/auth-db.ts:128`)

### Critical: Onboarding Status Reset Logic
- **Problem**: `onboardingStatus` in `useAuth()` never reset when switching between users or data changed
- **Fix**: Admin path now explicitly sets status to `"none"`; all branches properly clear previous state

### Security: SQL Injection in `getMentorshipRequests()`
- **Problem**: `status` parameter concatenated directly into SQL: `` AND mr.status = '${status}' ``
- **Fix**: Now uses parameterized query with `$N` placeholder

### Security: Raw Interval in `getCompletedMentorshipConversations()`
- **Problem**: `daysWindow` interpolated directly: ``INTERVAL '${daysWindow} days'``
- **Fix**: Now uses `($3 || ' days')::interval` parameterized cast

### Null Safety: Verifications Page
- **Problem**: `r.first_name + " " + r.last_name` could produce `"undefined undefined"`
- **Fix**: Added null coalescing: `${r.first_name || ""} ${r.last_name || ""}`

### Cleanup: Dead State Removed
- Removed unreachable `showRejected` state from both dashboards (logic now flows through `onboardingStatus` directly)
- Removed unused `error` from `AuthChecker`, unused `UserPlus` from alumni dashboard
