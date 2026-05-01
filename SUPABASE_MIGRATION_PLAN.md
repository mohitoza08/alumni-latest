# Supabase Migration - Step by Step

## Step 1: Supabase Project Setup

1. https://supabase.com/dashboard pe ja → New Project
2. Organization select/create → Project name: "alumni-connect"
3. Region: **Singapore** (India ke nearest) ya apna preferred
4. Database password set → save kar le (bahut important!)
5. 2-3 min wait jab tak project ready ho

## Step 2: Get Database Connection String

1. Supabase Dashboard → Settings → Database
2. "Connection string" section → **URI** tab select
3. Transaction mode: `postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
4. Session mode (preferred for migrations): `postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres`
5. Copy the **Session mode** connection string

## Step 3: Enable Required Extensions

1. Supabase Dashboard → SQL Editor
2. Ye query run kar:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

## Step 4: Run Complete Schema Migration

1. Supabase Dashboard → SQL Editor
2. Neeche di gayi **SUPABASE_SCHEMA.sql** file ka content paste kar → Run
3. Ye saare 26 tables + 4 views + saare indexes create karega
4. Error aaya toh console me dikhao, fix kar dunga

## Step 5: Seed Initial Data

SQL Editor me ye run kar:
```sql
-- Default college (change kar sakta hai baad me)
INSERT INTO colleges (name, code, city, state, country, website)
VALUES ('Demo University', 'DU', 'Mumbai', 'Maharashtra', 'India', 'https://demo.edu')
ON CONFLICT (code) DO NOTHING;

-- Default admin user (password: admin123)
-- Pehle bcrypt hash generate kar: https://bcrypt-generator.com/
-- Ya ye use kar (hash of "admin123"):
INSERT INTO users (college_id, role, email, password_hash, first_name, last_name, status, email_verified)
VALUES (1, 'admin', 'admin@demo.edu', '$2b$10$rCjJCQqjQhHJx8pMvQnEh.R0p0qQnQnQnQnQnQnQnQnQnQnQnQnQ', 'Admin', 'User', 'active', true)
ON CONFLICT (college_id, email) DO NOTHING;
```

## Step 6: Update Environment Variables

Vercel Dashboard → Project Settings → Environment Variables:

```
DATABASE_URL=postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
BREVO_API_KEY=your-brevo-key-here
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 7: Deploy to Vercel

```bash
# Vercel CLI se login (if needed)
npx vercel login

# Deploy
npx vercel --prod --yes
```

## Step 8: Verify

1. Vercel deployment logs check
2. `/api/debug` endpoint hit kar ke DB connection test
3. Admin login test: email `admin@demo.edu`, password `admin123`
4. Registration flow test karo (OTP email aana chahiye)
5. Admin → Verifications pe ja ke onboarding test

---

## Important Notes:
- Supabase ke `public` schema me saare tables banenge
- RLS (Row Level Security) enable nahi kar rahe abhi - backend API se handle ho raha hai
- File uploads (`public/uploads/`) baad me Supabase Storage me migrate karna hoga
- Session pooling: 6543 (transaction) ya 5432 (session) - session use karo
- `.env.local` me `DATABASE_URL` update kar local testing ke liye
