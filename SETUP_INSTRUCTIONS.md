# AlumniConnect - Setup Instructions

## Requirements (install these first)

1. **Node.js** v20 or higher — https://nodejs.org/
2. **PostgreSQL** v14 or higher — https://www.postgresql.org/download/
3. **Git** — https://git-scm.com/

---

## Step 1: Install Dependencies

```bash
npm install
```

---

## Step 2: Setup PostgreSQL Database

### 2.1 Create the database

```bash
psql -U postgres -c "CREATE DATABASE alumni_connect;"
```

If your PostgreSQL user is not `postgres`, replace it with your username.

### 2.2 Run the schema

```bash
# Option A: Using the setup script (recommended)
npm run setup

# Option B: Manual SQL execution
psql -U postgres -d alumni_connect -f database-schema.sql
```

This creates all **31 tables**, **indexes**, **views**, and **constraints**.

### 2.3 What the setup script does

- Creates all 31 database tables
- Adds a default college (Northbridge University)
- Creates a default admin user
- Skips if tables already exist (safe to re-run)

---

## Step 3: Environment Variables

Create a `.env.local` file in the project root:

```env
# Database URL
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/alumni_connect"

# Groq API (for AI features like resume enhancement)
GROQ_API_KEY=your_groq_api_key_here

# Brevo API Key (for OTP emails - free 300/day)
# Get one at: https://brevo.com/
BREVO_API_KEY=your_brevo_api_key_here
```

**Important:** If your PostgreSQL password contains special characters, URL-encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`

**Get Brevo API Key (for OTP emails):**
1. Go to https://brevo.com/ and create a free account
2. Go to SMTP & API → API Keys
3. Create a new API key
4. Paste it in `BREVO_API_KEY`

**Get Groq API Key (optional, for AI features):**
1. Go to https://console.groq.com/
2. Create an API key
3. Paste it in `GROQ_API_KEY`

---

## Step 4: Run the Development Server

```bash
npm run dev
```

The app will be available at: **http://localhost:3000**

---

## Step 5: Login & Test

### Admin Login
- **Email:** `admin@northbridge.edu`
- **Password:** `admin123`

### Student Registration Flow
1. Go to http://localhost:3000 → Register tab
2. Select **Student** role
3. Fill the form (must use `@saffrony.ac.in` email for Saffrony college)
4. Click **Send OTP**
5. Enter OTP from email
6. Direct access to `/student/dashboard`

### Alumni Registration Flow
1. Go to http://localhost:3000 → Register tab
2. Select **Alumni** role
3. Fill the form + upload certificate (PDF/JPG/PNG, max 2MB)
4. Select **Professional Type**:
   - **Corporate** → Company Name + Position required
   - **Business** → Business Name + Business Type required
   - **Freelancer** → Skills/Services required
   - **Other** → No extra fields
5. Click **Send OTP** → Verify OTP
6. Redirected to `/pending` page (cannot access dashboard)
7. Admin approves → alumni gets dashboard access

### Approve Alumni (Admin)
1. Login as admin
2. Go to **Admin → Profile Verifications**
3. Click **Review** on pending request
4. Click **Approve** or **Reject**

### Already Logged In
If you are already logged in and visit the homepage, you will see your email/role with "Go to Dashboard" and "Sign Out" buttons instead of the login form.

---

## Project Structure

```
├── app/
│   ├── api/                      # API routes
│   │   └── auth/                 # Login, register, OTP, verify-otp
│   ├── admin/                    # Admin dashboard pages
│   ├── alumni/                   # Alumni dashboard pages
│   ├── student/                  # Student dashboard pages
│   └── pending/                  # Alumni pending approval page
├── components/
│   ├── auth/                     # Login/Register forms (auth-form.tsx)
│   ├── landing/                  # Landing page sections
│   ├── layout/                   # Sidebar, auth-checker
│   └── ui/                       # shadcn UI components
├── lib/
│   ├── db.ts                     # PostgreSQL connection (pool)
│   ├── auth-db.ts                # Auth functions (login, session, etc.)
│   ├── session-helper.ts         # Server-side session helper
│   ├── email.ts                  # Brevo REST API email sender
│   └── validation.ts             # Input validators
├── scripts/                      # One-time setup/migration scripts
├── public/uploads/               # Uploaded certificates
├── sql/                          # SQL migration files
├── database-schema.sql           # Complete database schema (31 tables)
└── .env.local                    # Environment variables (DO NOT COMMIT)
```

---

## Database Tables (31 total)

| Table | Purpose |
|---|---|
| `colleges` | College/university info |
| `users` | All user accounts (admin, alumni, student) |
| `user_sessions` | Auth sessions (token-based) |
| `email_otps` | OTP codes for email verification |
| `onboarding_requests` | Alumni/student verification requests with admin approval |
| `applications` | Student-to-alumni applications |
| `community_posts` | Community discussion posts |
| `post_likes` | Post likes |
| `post_comments` | Post comments |
| `mentorships` | Mentor-mentee relationships |
| `mentorship_requests` | Pending mentorship requests |
| `mentorship_sessions` | Individual session records |
| `events` | College events |
| `event_registrations` | Event registrations |
| `fundraising_campaigns` | Fundraising campaigns |
| `donations` | Completed donations |
| `donation_requests` | Unverified donation requests (payment proof) |
| `achievements` | User achievements |
| `skills` | User skills/certifications |
| `projects` | User project portfolio |
| `notifications` | System notifications |
| `messages` | User-to-user messages |
| `conversations` | Grouped conversation threads |
| `workshops` | Premium paid workshops |
| `workshop_registrations` | Workshop registrations with payment verification |
| `resume_enhancements` | AI resume enhancement history |
| `subscriptions` | Premium subscriptions |
| `user_badges` | Gamification badges |
| `user_streaks` | Daily activity streaks & points |
| `analytics_metrics` | Aggregated analytics data |
| `system_settings` | App configuration |

---

## Key Features

- **2-Step OTP Registration** — Real email delivery via Brevo
- **Alumni Admin Approval** — Certificate verification before access
- **Professional Type** — Corporate / Business / Freelancer / Other with conditional fields
- **AI Resume Enhancement** — Powered by Groq
- **Mentorship System** — Requests, sessions, messaging
- **Fundraising** — Campaigns with payment proof verification
- **Premium Workshops** — Paid events with admin verification
- **Gamification** — Daily streaks, badges, leaderboard
- **Community Forum** — Posts, comments, likes, moderation
- **Multi-College Support** — College-based access control

---

## Troubleshooting

### "DATABASE_URL is not defined"
Make sure `.env.local` exists and has the correct `DATABASE_URL`.

### "Connection refused"
Make sure PostgreSQL is running:
- **Windows:** Services → Start "PostgreSQL" service
- **Mac:** `brew services start postgresql`
- **Linux:** `sudo systemctl start postgresql`

### Port 3000 already in use
```bash
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9

# Or use a different port:
PORT=3001 npm run dev
```

### Stale build cache / MODULE_NOT_FOUND errors
```bash
rm -rf .next
npm run dev
```

### Email OTP not sending
- Check `BREVO_API_KEY` in `.env.local`
- Check server console for `[REGISTER] Email sent result: SUCCESS/FAILED`
- OTP is always printed in console for dev: `[DEV MODE] OTP for ...`

### Admin approval failing (500 error)
- Check that `users.status` constraint includes `'rejected'`
- Run: `npx tsx scripts/fix-rejected-status.ts`

### Already logged in but seeing login form
- Clear browser cookies and refresh
- The auth form now detects active sessions and shows a "Go to Dashboard" message

---

## Default Admin Account

After running `npm run setup`:

| Role | Email | Password |
|---|---|---|
| Admin | admin@northbridge.edu | admin123 |

**Change the default admin password after first login!**

---

## Build for Production

```bash
npm run build
npm start
```

---

## Useful npm Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run setup` | Full database setup (schema + default data) |
| `npm run db:test` | Test database connection |
| `npm run db:update-schema` | Add missing columns/tables |

---

## Security Notes

- **Never commit `.env.local`** to version control
- **Change default admin password** after first login
- Use strong passwords for new accounts
- Keep PostgreSQL password secure
- Brevo API key should be kept private
