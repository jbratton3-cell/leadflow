# LeadFlow CRM

A multi-tenant CRM for home-improvement and in-home-sales businesses, by
**JMB Business Solutions**. Covers the full lifecycle: lead capture → call
center → appointments → estimates → sales → production, plus marketing ROI,
metrics dashboards, role-based user access, and CSV data import.

Built with Next.js (App Router), PostgreSQL, and Drizzle ORM.

## Local development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment template and fill in your values:
   ```bash
   cp .env.example .env
   ```
3. Push the database schema:
   ```bash
   npx drizzle-kit push
   ```
4. (Optional) create your first admin account:
   ```bash
   node scripts/create-admin.mjs "Your Name" "you@email.com"
   ```
5. Run the app:
   ```bash
   npm run dev
   ```

## Deployment

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for full step-by-step instructions
(GitHub → Neon database → Vercel/Render hosting).

## Environment variables

See [`.env.example`](./.env.example) for the full list. Required:
- `DATABASE_URL` — PostgreSQL connection string
- `APP_URL` — public base URL of the deployed app

Optional (for email/SMS invites and estimates):
- `RESEND_API_KEY`, `RESEND_FROM`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
- `COMPANY_NAME`

---

© JMB Business Solutions. All rights reserved.
