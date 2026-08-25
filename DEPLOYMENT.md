# HomePro CRM — Deployment Guide (Option B: Permanent, Live Site)

This turns the CRM into a real, always-on application with a fixed web
address and a database that safely saves your data.

You'll set up two things:

1. A **hosting service** for the app (recommended: Vercel or Render)
2. A **managed PostgreSQL database** (recommended: Neon or Supabase)

Both have free tiers to start. Estimated cost for real business use: ~$25–45/mo.

---

## Step 1 — Put the code in a Git repository

Create a repo on GitHub (or GitLab/Bitbucket), then from the project root:

```bash
git init
git add .
git commit -m "HomePro CRM"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

> `.env` is git-ignored, so your local secrets won't be uploaded.

---

## Step 2 — Create a production database

1. Sign up at **https://neon.tech** (or https://supabase.com).
2. Create a new PostgreSQL database/project.
3. Copy the **connection string**. It looks like:
   `postgresql://user:password@host/dbname?sslmode=require`

Keep it handy for the next steps.

---

## Step 3 — Create the database tables

From your machine, point Drizzle at the production DB and push the schema once:

```bash
DATABASE_URL="<your production connection string>" npx drizzle-kit push
```

This creates all the tables (leads, users, invitations, sales, jobs, etc.).

### Create your first admin login

Run this once (replace the email) to create an admin account you can log in with.
It will print an invitation link — open it in your browser to set your password:

```bash
DATABASE_URL="<production url>" APP_URL="https://your-domain.com" node scripts/create-admin.mjs "You" "you@email.com"
```

(Optional) To load demo data instead, run `node scripts/seed.mjs` with the
production `DATABASE_URL`. ⚠️ The seed script WIPES CRM tables first — only run
it on an empty database, never after real data exists.

---

## Step 4 — Deploy the app

### Option 4a: Vercel (simplest)

1. Go to https://vercel.com → **Add New Project** → import your Git repo.
2. Vercel auto-detects Next.js — no build settings needed.
3. Under **Settings → Environment Variables**, add:
   - `DATABASE_URL` = your production connection string
   - `APP_URL` = your final site URL (e.g. `https://homepro-crm.vercel.app`)
   - (optional) `RESEND_API_KEY`, `RESEND_FROM` for email invites
   - (optional) `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` for text invites
4. Click **Deploy**. You'll get a permanent URL.

### Option 4b: Render

1. https://render.com → **New → Web Service** → connect your repo.
2. Build command: `npm install && npm run build`
3. Start command: `npm run start`
4. Add the same environment variables as above.
5. Deploy.

---

## Step 5 — Go live

- Visit your new permanent URL and sign in with the admin account from Step 3.
- Go to **Settings** to invite your team. With `APP_URL` set (and Resend/Twilio
  configured), invite links will be correct and delivered automatically.
- Every `git push` now auto-redeploys your changes.

---

## Enabling automatic email / text invites

Invites always produce a copyable link. To also send them automatically:

- **Email:** create an account at https://resend.com, verify a sending domain,
  and set `RESEND_API_KEY` (and `RESEND_FROM` to a verified address).
- **Text/SMS:** create a Twilio account, get a phone number, and set
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER`.

Restart/redeploy after adding them.

---

## Notes

- The app reads all secrets from environment variables — nothing is hardcoded.
- Login session cookies are automatically marked `Secure` in production, so
  always serve the site over HTTPS (Vercel/Render do this by default).
- Managed DB providers handle backups; check your provider's dashboard.
