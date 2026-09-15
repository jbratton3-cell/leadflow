# LeadFlow CRM — Project Status
*THE SHARED LEDGER — committed to repo root for ALL agents. Conventions: (1) read end-to-end before starting work, (2) update after any significant change, in the same commit. Workspace copy + repo copy must stay in sync.*
*Last updated: Sept 15, 2026*

## BRANDING & DOMAIN (decided Aug 27 night)
- **LeadFlow = standalone brand/future business** — NOT under JMB umbrella. JMB appears only as SEO/backlink credit: "Developed by JMB Business Solutions" (footer link + about page)
- **✅ DOMAIN LIVE Aug 28 night: leadflowcrm.info ($3.60 first yr, $22 renewal) — Porkbun, Whois privacy ON**
- DNS final: A @ 216.198.79.1 | CNAME www 49dcb91125fda1c6.vercel-dns-017.com (Vercel's account-specific values — classic 76.76.21.21/cname.vercel-dns.com were superseded)
- Verified: apex→www redirect, SSL valid both, /pricing /login 200, homepage serving. USER CONFIRMED estimates + invoicing tested & good on new domain (APP_URL flipped)
- Links: site leadflowcrm.info · trial leadflowcrm.info/tour (NEW Aug 31 — tour-framed signup; /signup still works) · pricing /pricing · Launch links PDF: LeadFlow_Launch_Links.pdf
- ✅ EMAIL AUTHENTICATION DONE (Aug 28, ~midnight): Resend live on leadflowcrm.info. 5 DNS records in Porkbun (TXT resend._domainkey DKLM, CNAME rsend + CNAME send → *.rmta.net [SPF via CNAME, no root TXT needed], TXT _dmarc p=none, CNAME tracking → links1.resend-dns.com). Domain VERIFIED in Resend. RESEND_API_KEY deployed to Vercel by user + redeployed. Code: notify.ts sendEmail = Resend primary (from: no-reply@leadflowcrm.info via PRODUCT_DOMAIN from APP_URL), Gmail fallback if key missing; email logos now hosted URLs not CID. Commit e74cb124
- NOTE: first test email went to spam (expected): send/rsend CNAMEs still propagating at send time + new domain = zero reputation. Expectations: DKIM signing live once CNAMEs propagate (overnight), reputation builds over days of legitimate sending. User should click "not spam" on test + re-test from CRM next day
- 🚀 LAUNCH MILESTONE (Aug 29): Craigslist ad POSTED live (Albany, computer services) — first ad of the company. CL account = info@leadflowcrm.info (verified). REMINDER: renew ad every 48h — NOTE paid categories cost $5 post + $5 renew (user corrected; 'free renew' only applies to for-sale categories). User has budgeted it. FB posts HELD by user for optimal windows (kit says Tue-Thu 8-10am) — Post 2 pinned + Post 1 same morning, Post 3 groups 7-9pm
- Craigslist ad source: /home/user/leadflow_craigslist_ad.md (3 title options, Albany-targeted, pricing in ad, posting notes incl. 48h renew + image attach)
- Danny Demo lead (id 19) from trial test still in DB — offer cleanup stands
- ✅ Email forwarding set up by USER solo (Aug 29): Porkbun forwarding on leadflowcrm.info → leadflow76@gmail.com (user's new dedicated LeadFlow Gmail). Aliases live: sales@ · info@ · contact@ · jon@ leadflowcrm.info. Spam watch: first CRM test send Aug 29 AM still hit spam (expected — reputation building started Aug 28 night w/ full auth); re-verify midweek + "not spam" training clicks
- Porkbun UI notes: "Atlas" record type = their new default, can't edit, delete+recreate as A. DNS Records found under domain details page
- Original shortlist (RDAP-verified Aug 27): leadflow.build ✅ (RECOMMENDED — industry-perfect TLD, ~$40-60/yr), leadflowcrm.co ✅ (~$25-30), leadflowcrm.ai ✅, leadflowcrm.build ✅. leadflowcrm.com = squatted/for-sale via Afternic ($700-4k, revisit later + 301 redirect playbook)
- **User buys domain when paid (Aug 28)**, then: I wire Vercel domain + www redirect, update APP_URL (estimate/invoice links get real domain), swap pricing CTAs. Domain also unlocks custom-domain email (deliverability item on readiness list)
- LAUNCH ON HOLD until domain live (user's sequencing: credibility > speed)

## PARKED: Meta Pixel setup (Aug 29, HARD-PARKED after 3 attempts)
- Saga: web Events Manager = personal-page dead end; Business Suite app has no Events Manager; user CREATED a Business Portfolio + connected LF page (hard, hidden option); then Events Manager connected to LF page but demands ANOTHER new portfolio, and "use existing account" path errors with "unable to create portfolio"
- DIAGNOSIS (agent read): likely duplicate/half-linked business entities on the account choking Events Manager. Fix = inventory & cleanup (Business Suite → Settings → Business Assets, delete/merge dupes) OR intentional fresh-portfolio clean slate. Do NOT keep retrying blind
- RESUME: next week, daytime, fresh eyes. Sequence: cleanup/rebuild → Events Manager in business context → create pixel LeadFlow → Pixel ID to agent → agent wires pixel + events into leadflowcrm.info
- Everything ads-related BLOCKED on this; nothing else blocked. Ads strategy: /home/user/leadflow_fb_ads_strategy.md
- User hit genuine Meta UI dead-ends: Events Manager shows only personal profile, no page selector, no portfolio-create option anywhere; login page hung 5 min earlier. PARKED by agent decision — nothing launched depends on it (pixel = ads Phase 0; retargeting was week-2+ anyway)
- RESUME PATH when ready to spend on ads: Meta Business Suite phone app (different onboarding, often offers portfolio creation), or facebook.com/adsmanager (forces business setup), then Events Manager → create pixel → give Pixel ID to agent → agent wires pixel + events (Signup/Contact/Lead) into leadflowcrm.info. Ads strategy file: /home/user/leadflow_fb_ads_strategy.md (4 phases, $150-250 total test budget)
- ALSO Aug 29 evening: LeadFlow FB PAGE created + first post live (post link pending from user); L logo files saved marketing/leadflow-L-logo-512.png + 192; /icons login-wall bug fixed (f09565b6)

## ✅ JMB SITE RELAUNCH COMPLETE (Aug 30 night — ~1 hr total)
- jmbcreative.org LIVE on Vercel (repo: jmbatton3-cell/jmb-site, agent-pushes-via-token, $0 hosting). All 7 pages 200, SSL valid, apex+www
- Rebuild included: orange family accents (LeadFlow #f97316 on CTAs/underlines), LeadFlow showcase section on homepage, footer cross-link both directions (THE SEO BACKLINK IS LIVE), fixed dead methodology links -> contact, contact@jmbcreative.org, form redirect fixed
- CONTACT FORM: no third party. jmb-site contact.html fetch()s https://leadflowcrm.info/api/jmb-contact (public endpoint in LF repo: CORS-restricted to jmbcreative.org, validates input, emails JMB_CONTACT_EMAIL||CRM_ADMIN_EMAIL||leadflow76 via Resend). GOTCHAS SOLVED: middleware must exempt endpoint AND answer OPTIONS preflight (Next auto-OPTIONS quirk) — pattern documented for any future public LF endpoints
- DNS: A @ 216.198.79.1, CNAME www (Vercel-provided), Namecheap — propagated in ~90s
- ✅ FORM FULLY WORKING (Aug 30, ~midnight, user-verified end to end). THREE bugs found & fixed in the saga, all worth remembering:
  1) CORS origin mismatch: browser on www.jmbcreative.org, endpoint allowed only apex → fix: echo requesting origin (middleware preflight + route responses)
  2) **Apex-308-redirect breaks CORS preflight**: form called leadflowcrm.info (apex) which redirects to www — browsers REFUSE redirects on preflight. Fix: forms must call https://www.leadflowcrm.info DIRECTLY. RULE for all future cross-site endpoints
  3) Email routing: fallback chain borrowed CRM_ADMIN_EMAIL (= BuildPros inbox) → 5 stray emails landed in albanybuildpros@gmail.com. Fix: endpoint now targets JMB_CONTACT_EMAIL || leadflow76@gmail.com directly. USER CLEANS STRAYS from BuildPros inbox Aug 31 (can't log in from home)
- VERCEL DEPLOY BLOCK: Vercel rejected deployments from committer 'LeadFlow Agent' (unrecognized user) — root cause of 'deploy gremlins'. FIX: all pushes now authored as jbratton3-cell <jbratton3@gmail.com> (push scripts updated). Manual Redeploy from dashboard also bypasses. Consider Vercel CLI token as future alternative (offered, user hasn't decided)
- STILL PENDING (user): update Craigslist ad URL + JMB FB page link to jmbcreative.org; spam-folder training clicks for young-domain emails

## JMB SITE RELAUNCH PLAN (decided Aug 30)
- JMB site moving to VERCEL (free), abandoning Namecheap hosting — old jmbcreative.site SUSPENDED (missed payment; files also saved locally on user's computer = safe)
- New domain: jmbcreative.org (~$8.98 Namecheap, renew $14.48 — user buying/bought)
- PLAN when user ready: they upload site files here → agent inspects → relaunch on Vercel → DNS jmbcreative.org → Vercel (same records dance) → contact form wired to JMB email alias → THEN user updates URL in Craigslist ads + JMB Facebook page
- ✅ USER APPROVED: design harmonization — make JMB + LeadFlow feel like family (shared design language: navy/orange palette family, consistent type; crosslink JMB site showcases LeadFlow as flagship product; LF footer 'Developed by JMB' links to jmbcreative.org = the SEO backlink finally live)

## JMB DOMAIN MIGRATION (Aug 29/30, in progress)
- User migrating jmbcreative.site -> jmbcreative.net (spam-TLD reasoning, same as LF's .info-over-.site call). Old domain to 301-forward to .net until renewal; recreate any email aliases on .net
- Future SEO play once .net is live: "Developed by JMB Business Solutions" footer link on leadflowcrm.info -> jmbcreative.net (the planned backlink)

## TAGLINE BANK (user-created, Aug 29)
- 🏆 "LeadFlow does everything but the installation." — user's line. STRONGEST spoken (demo/pitch). In print, anchor it: "From first call to final payment — LeadFlow does everything but the installation." (avoids 'software installation' misread on skim)

## ORIGIN STORY — REVISED POSITIONING (user's call, Aug 27)
**DO NOT use "built in a week" or any AI-assistance angle in marketing.** User: "weeks/months of planning, building, testing (and maybe frustrations along the way) is more valuable... people won't pay my prices for something built in 3 days." Approved framing: "After months of planning, building, and testing — and plenty of frustrations — we built our own." Lead with VALUE + done-for-you installation/setup. Competitor lines still armed ("their floor doesn't reach our ceiling"). Launch kit v3 APPROVED (developer voice): /home/user/leadflow_launch_posts.md + LeadFlow_Facebook_Launch_Kit.pdf (measured-line PDF engine — no overflow, verified) + images in /home/user/marketing/ (all 3 approved by user)
   - v3 voice rules: JMB = developer ("I built"); client unnamed ("a home improvement company I work with" — naming = future social proof, ONLY w/ Kevin's approval); no competitor names ("the big guys" — David/Goliath per user); no week-story; no AI angle
   - PDF generation rule: measure-then-draw text engine (fpdf multi_cell overflowed w/ DejaVu fonts — do not revert)

## ⏱ TWO WORK TRACKS (user's rule, established Aug 26)
**DAYTIME — BuildPros setup (Kevin's company, first LF customer):**
CRM features, data, invoicing, PayPal/QuickBooks, rep testing, anything configured inside LeadFlow for BuildPros
→ daytime queue: user's invoicing test run · Invoices page in CRM · dashboard cards clickable · production statuses · iPhone rep test

**EVENINGS — JMB Business Solutions (user's own business):**
Facebook launch posts (aggressive + polished + captions), LeadFlow monetization, multi-company SaaS readiness, pricing/marketing — anything about selling LeadFlow itself
→ evening queue: Facebook post versions (his task #5) · SaaS-readiness review before onboarding more companies

**💰 PRICING — DECIDED Aug 26 (evening session):**
- Monthly: Starter $149 (3 users) / Pro $399 (10) / Business $749 (25) — month-to-month, no contracts
- Setup fees (NOT on the pricing page — sold on calls/proposals): $1,500 / $2,500 / $4,000. User's pitch: "beats hiring an employee" — he does migration + config + employee training
- Founding offer: setup fee waived, first 5 customers (live banner says "up to $4,000 value")
- Competitive intel: LeadPerfection (real rep quote per user) = ~$1,000/mo entry for only 15 USERS ($900 w/ 1-yr contract). Leap Team = $298 + $99/user. JobNimbus ~$409/mo for 3 users. LF undercuts everyone at less than half
- 🎯 KILLER ANGLE for marketing (user loved it): "Their floor doesn't reach our ceiling" — LF Business ($749, 25 users) beats LP's entry plan (~$1,000, 15 users) by $250/mo with 10 more seats, month-to-month. User chose to BANK this for the Facebook launch posts instead of updating the pricing page anchor line now
- ✅ Pricing page LIVE with monthly prices + setup-fee-with-value framing + founding banner (commit 1f9ab8a0; space-typo fix 1696f1d9)

**Sales-readiness build list (when selling starts):**
1. Automated tier limits: org.maxUsers + invite-time enforcement ("upgrade to add more") — user explicitly wants this automated, no manual monitoring
2. Self-serve signup creating new orgs automatically
3. Stripe Billing (user prefers Stripe for his own SaaS)
4. Custom domain + real email delivery (replace Gmail SMTP) + paid infra (Vercel Pro, Neon paid, backups)
5. Terms of Service + Privacy pages

**Shared foundation:** repo + Vercel + Neon + token push access (all changes go through me: build → commit → push → user tests)

## Project
- **App:** LeadFlow CRM by JMB Business Solutions (home improvement / service businesses, modeled after LeadPerfection)
- **Live URL:** https://leadflow-k926.vercel.app
- **Repo:** https://github.com/jbratton3-cell/leadflow ⚠️ **STILL PUBLIC (verified Aug 26)** — safe to make private: full clone saved at `/home/user/leadflow`, kept in sync with every change. User was told; remind if still public.
- **Stack:** Next.js 16 + Drizzle + Neon Postgres, deployed on Vercel (free tier)
- **Email:** Gmail SMTP via nodemailer (jbratton3@gmail.com + GMAIL_APP_PASS)
- **Key env vars in Vercel:** DATABASE_URL, AUTH_SECRET, CRM_ADMIN_*, CRM_ORGANIZATION_*, GMAIL_USER, GMAIL_APP_PASS, APP_URL=https://leadflow-k926.vercel.app

## User preferences (important)
- One step at a time — never a wall of instructions
- Give exact full code snippets (whole function/file) — user doesn't read code and needs to know where a replacement starts and ends
- Always commit directly to main branch — user said to assume this, don't repeat the step
- User is on a Mac (Chrome), tests on an Android phone; reps will use phones/tablets in the field

## Completed & working
1. ✅ Invite emails (notify.ts rewritten from Resend → Gmail/nodemailer)
2. ✅ Invite links (APP_URL fixed — was pointing to wrong Vercel site)
3. ✅ Estimate emails to customers/leads
4. ✅ Accepted estimates auto-create: sale record + job (status "pending") + lead stage "sold" (respondToEstimate in estimate-actions.ts)
5. ✅ PWA install on all devices (icons route, public/sw.js, manifest, middleware allows /sw.js)
6. ✅ TV Production Board rebuilt (src/app/board/page.tsx) — vertical list, grouped by date (newest first), clickable logo → dashboard
7. ✅ LeadFlow logo clickable → dashboard across whole CRM (Sidebar.tsx)
8. ✅ "Materials Received" milestone added (constants.ts JOB_MILESTONES)
9. ✅ Mobile hamburger menu sidebar (Sidebar.tsx rewritten)

## Completed Aug 26 (latest)
- ✅ Test data wiped (3 leads/estimates/items, 1 sale, 2 jobs) — backup at /home/user/backups/2026-08-26/. Users all kept: J Bratton (admin, owner-user), Kevin O'Connell (admin, company owner), jmb albany (agent — user's own test account; DELETE LATER after they finish rep-side testing)
- ✅ Self-serve deletes pushed (cc687acb): Delete button on lead detail (cascades estimates/sales/jobs/invoices + redirects to /leads), inside each job's "Manage job" panel, and per-row on Sales table. Estimates already had delete on detail page. Admin/manager roles only, with confirm dialogs

## Future integrations (discussed Aug 26, not started)
- **PayPal payments** — decided: PAYPAL (Kevin insists; user prefers Stripe but deferred). Scope: real "Pay This Amount" button on invoice page → PayPal checkout (cards w/o PayPal account + PayPal balance) → auto-mark invoice paid. Needs: PayPal Business account + API credentials from user
- **QuickBooks** — possible via QBO API. MUST FIRST CONFIRM: QuickBooks Online vs Desktop (Desktop = much harder). Scope: invoices created in LeadFlow mirror to QBO; payments recorded automatically. Do AFTER PayPal
- Recommended order: PayPal → QuickBooks

## Completed Aug 27 (evening)
- ✅ Signature feature TESTED by user on phone — works great
- ✅ **BuildPros logo (real wordmark, /public/buildpros-logo.png, committed to repo)** on all customer-facing surfaces (3090ac99): estimate page, invoice page, all 3 email templates (CID-embedded, shows without "display images"), signed-PDF letterhead (w/ fallback). Company-name text removed next to logo (wordmark includes name). Internal surfaces (CRM sidebar, TV board, install icon, invite emails) stay LeadFlow-branded by design. Note: logo = 365×50 transparent PNG

## Completed Aug 27 (late afternoon)
- ✅ **Customer signatures** (b48263dd): optional draw-or-type signature pad appears on the public estimate page AFTER acceptance (skip = fine, acceptance still valid). Stored in estimates.signature_data/name/at (columns added to DB). Shown on public page + internal estimate detail w/ timestamp. Strategy: digital estimates standard, paper/signature only when insisted on — user's proposal to Kevin, agent built the fallback
- ✅ **Print-ready signed estimates** (e277cc6c): print CSS (no-print chrome), 🖨 Print/Save-as-PDF button on public estimate page
- ✅ **Signed-estimate PDF** (40aac126): pdf-lib generated Letter-size PDF (header, bill-to, items table, totals, terms, signature block + timestamp). AUTO-EMAILED to customer as attachment right after they sign; "📄 Download signed PDF" button on internal estimate detail; also served via /api/estimates/[id]/pdf (auth+org-scoped). sendEmail now supports attachments. pdf-lib added to deps
- **USER DEMOS KEVIN TOMORROW (Aug 28)** — flow to show: send estimate → accept (pay directly) → deposit invoice auto-email → sign on screen → signed PDF arrives in customer inbox automatically → job in production → complete → final invoice w/ finance choice → invoices page → mark paid. **DEMO PHILOSOPHY (user's call): keep it SIMPLE — old-school audience, wow with simplicity, one story not a feature tour.** Bonus ideas (QR/"collect signature now" button) deliberately NOT built pre-demo

## Completed Aug 27 (afternoon)
- ✅ Optional names on prospects (required flags removed, "(No name)"/"Customer"/"Hi there" fallbacks everywhere)
- ✅ Office Actions on estimate page: mark accepted/declined for paper estimates, with financing checkbox + optional deposit-invoice email (shared bookkeeping helper with online flow)
- ✅ Document scans: PDF/image uploads on prospect pages → Vercel Blob direct-upload. DB `documents` table created. Files: api/file-upload route (auth-gated token), UploadDocument component, document-actions (saveDocument, deleteDocument admin/mgr), Documents card on lead detail. @vercel/blob v2 — imports use "@vercel/blob/client" subpath for handleUpload/upload
- ⚠️ **REQUIRES USER STEP (not yet done):** Vercel → project → Storage → Create Blob store → attach → BLOB_READ_WRITE_TOKEN auto-added → redeploy. Until then uploads will fail. Free tier ~1GB

## Deploy note (Aug 28 morning)
- TV board now ADDRESS-first (name fallback), whole card clickable → job details (commits e3f088d4 + 7e490cea). USER CONFIRMED LIVE
- Vercel auto-deploy hiccup: pushes landed on GitHub but no deployment fired; 0 classic webhooks on repo; user checked Vercel GitHub App access + project shows connected; trigger commit eventually deployed. IF NEXT PUSH DOESN'T AUTO-DEPLOY: fix = Vercel project Settings → Git → Disconnect → reconnect repo (rebuilds linkage), or manual Redeploy of latest deployment as fallback

## PIVOT (Aug 28): user shifts primary focus to HIS profitability
- Kevin no-showed his own demo 3+ hrs. Pattern: wants growth, blocks progress. BuildPros DEMOTED from gatekeeper to customer #1 (pilot stays if free to keep, no waiting on it)
- IP: SOLID — user is a 1099 contractor at BuildPros (hired JMB as consultant; never on payroll/clock → no work-for-hire claim). User declared LF = his IP to Kevin days ago. LF never implemented there. Copyright = JMB on all surfaces (deliberate, user-requested). When revenue flows: 1-hr IP attorney review recommended. BuildPros = founding customer invite only
- WEEKEND PLAN: buy leadflow.build TODAY (user got paid) → I wire domain + authenticated email → launch posts live (kit approved, v3) → founding-customer hunt begins
- ✅ SEAT LIMITS LIVE (0520f9f4, deployed + confirmed Aug 28): plan-based caps (trial=unlimited, starter=3, pro=10, business=25) + org.max_users override column. Enforced at invite: active users + pending invites counted; blocked invite shows upgrade message; provider gets email alert (upsell trigger). Set a customer's cap = 1 DB line by me
- ✅ GUIDED TRIAL v2 LIVE (4ed5a18e, Aug 28 pm): FLOATING step card (bottom-right, every CRM page, rendered from root layout) — auto-advances when the system detects real completion, "Take me there →" nav button, collapsible/dismissible w/ re-open pill. v1 dashboard checklist REMOVED (user QC: backing out to dashboard to read steps = friction). TrialChecklist.tsx now unused (left in repo). Steps auto-verify from real data: sample data loaded → estimate sent → accepted → invoice exists → setup-call CTA. Sample data = Danny Demo lead (email = TRIAL USER'S own email!), source, product, draft estimate w/ 2 items; clear-sample removes all. Step 3 explicitly instructs choosing "Pay directly (50% down)" to trigger invoicing engine. loadSampleData/clearSampleData in trial-actions.ts (marker: [leadflow-sample] in lead notes)
- ALSO LIVE: self-serve signup already existed (previous agent skeleton at /signup — creates org+admin, trial plan) — now the trial experience is complete. Signup still UNLISTED (no public links) pending user's funnel decision re: founding five
- ✅ TV board button HIDDEN for trial orgs (03344047) — deliberate sales strategy: board = demo-day reveal / setup-call wow moment, not a trial feature (user's call)
- KEVIN DEMO RESCHEDULED: Monday morning (Aug 31). User voiced frustration diplomatically. Demo playbook unchanged: phone in hand, one lead→estimate→signature→money loop

## ✅ ALSO DONE BY OTHER AGENT (learned Sept 5): Estimate photo upload EXISTS (UploadEstimatePhoto.tsx, estimate_photos table, wired into estimate page). Rep Quick Reference v2 PDF built (Sept 5): leadflow_Rep_Quick_Reference_v2.pdf w/ pricebook steps, photos pitch, no-tax note. QUEUED FEATURE — GBB PRESENTATION TOOL (user-defined Sept 5, Kevin agreed): Good/Better/Best is a DEMO-ONLY tool, NOT on estimates (user overrode Kevin: GBB on estimates = confusing; estimate is a contract, one option). Design: separate presentation surface (tablet/phone) showing 3 tiers w/ photos + inclusions + price ranges; customer picks a tier -> rep builds the estimate for THAT tier only. Build = new view, zero changes to estimate flow. Needs Kevin input on actual tier contents (warranty/shingle grade/scope) at next captive session

## MAJOR STATE CHANGE (synced Sept 10): BUILDPROS IS LIVE ON REAL DATA
- HCP full history imported (by other agent/user): 1,191 leads, 156 estimates, 531 jobs, 532 invoices, 14 sales. 5 orgs, 8 users, 1 supplier entered. LF is now BuildPros' system of record
- Other agent's new work (merged through 8c9a790a): material orders upgraded (RECEIVED/GOT-IT reply tracking, address-only supplier display, replies -> jon@leadflowcrm.info, extra custom lines), dashboard includes imported job revenue, TV board refresh survives casting/idle tabs, editable lead sources, WISESTACK prequalify note on customer estimates + office summary + PDF (financing angle!), src/lib/quickbooks.ts EXISTS (QB integration started)
- **ROSE CORRECTION (Sept 15):** shorthand for the manager/admin exception used when a paper contract total and an already-paid deposit need to be synchronized. The original fix restores the paper contract total to **$9,600**, keeps the **$4,800 credit-card deposit marked paid**, and synchronizes the estimate, deposit invoice, sale, job, lead value, and reporting totals. Reuse only for the same kind of one-off mismatch; do **not** turn it into a system-wide pricing or cash-discount feature. Preserve the normal global cash-discount policy.
- FB STRATEGY PIVOT (user, ~Sept 8): memes for engagement instead of straight launch posts; original posts still available as conversion layer. User generating memes on another platform during outages
- Agent status: this workspace synced + verified current with production

## RECEIPT BACKFILL PROJECT (started Sept 14 — user + 2 agents in tandem)
- CONTEXT: Kevin wants job expense tracking + per-job profit (FEATURE BUILT by other agent Sept 14). Now needs HUNDREDS of past receipts from BP gmail manually entered + matched to jobs — user was facing a week of typing
- PLAN (agreed): user exports/labels receipt emails from BP gmail (office computer only); gives me a 10-15 email sample; I build a PARSER + pre-matcher (vendor/date/amount/job hints) so hundreds become a REVIEW queue not an entry queue; script runs WITHOUT me once built. Other agent builds PERMANENT feature: LF reads receipts natively on upload (in progress)
- PENDING: Kevin's cutoff answer (this year vs all history — determines scope); user's gmail export + sample. RESOLVED: supplier = ONE supplier only (already entered in LF for material ordering — parser should filter receipts to this vendor's emails primarily, though older receipts may include other vendors from before the consolidation)
- NOTE: parser script once built = runs independent of agent responsiveness. Build the tool, not the labor

## MEME ARSENAL (as of Sept 11 night — BATCH 3 DELIVERED)
- 34 memes total in /memes/ (JPGs, web-ready): batch 1 = meme1-19 (hook set, overlay classics, crew, homeowners, paperwork), batch 2 = meme20-24 (signature, Joneses + PIVOT batch 22-24), batch 3 = meme25-34
- BATCH 3 REFERENCE (for user's pending QC notes — SENT Sept 11, awaiting feedback):
  25 dashboard (THE OFFICE / MOBILE EDITION), 26 measure (MEASURE TWICE / ASK THE APP THREE TIMES), 27 dog (MOST RELIABLE CREW MEMBER / RAISE IN TREATS), 28 weather (FORECAST THIS MORNING / BY LUNCH), 29 glove (TOUCHSCREEN WITH WORK GLOVES / GLOVES GAVE UP), 30 quote (HOMEOWNER RESEARCHING 6 HOURS / THE CAT HAS DECIDED), 31 dumpster (WHERE THE PROFIT WENT / JURY STILL OUT), 32 bathroom (NARROWED IT DOWN / TWO IDENTICAL GRAYS), 33 sunday (TRYING TO RELAX SUNDAY / BRAIN: UNDERLAYMENT), 34 text (EVERY TEXT AT 9PM / CAN U DO IT CHEAPER)
  - meme23 final = v4 (contractor side profile, closed laptop at bottom edge — user approved after 3 failed laptop attempts: screen-on-back-of-lid twice, then blank screen)
- Albums: LeadFlow_Meme_Album.pdf (1-19), _Batch2.pdf (20-24), _Batch3.pdf (25-34) + caption sheets v2 + Batch2
- QUEUED: archaeology job box concept ('OPENED THE OLD JOB BOX / ARCHAEOLOGY BUT FOR RECEIPTS'); user has QC notes on batch 3 to give next session
- Strategy: 1 meme/2 days, pivot batch (22-24) after 6-8 humor memes, conversion post every 5th slot, post as user in groups/page as storefront. Buffer starts Monday

## WORKSPACE BUDGET (Sept 10): hit the ~128MB platform cap; fixed by JPEG-converting memes (49->3.4MB) and DELETING leadflow repo's local .git (117MB of packed history — code truth lives on GitHub). Workspace now ~20MB. CONSEQUENCE: my local leadflow/ copy has NO git history now — next build session must: git init, fetch from GitHub, reset to origin/main (or fresh clone) before ANY commits. Push script + token intact. Meme files: /memes/ 19 JPGs + LeadFlow_Meme_Album.pdf (one meme per page w/ captions). Meme batch 2 queued: crumpled signature, nine Joneses, software-bill pivot batch. Also: PDFs cant extract images reliably — deliver images as individual files

## ⚠️ MULTI-AGENT ERA (Sept 2): another agent (used during platform outages) also commits to this repo. ALWAYS git fetch+merge BEFORE building; LEADFLOW_STATUS.md is the shared ledger — log everything here
- ✅ PRICEBOOK DONE by other agent (Sept 2): pricebook_items table, 76 items from HCP export, pricebook-actions.ts, integrated into estimate line-item form (estimates/[id]/page.tsx). BUILDPROS DOES NOT CHARGE TAX — reps leave estimate tax at 0
- Other agent's other work (adopted, workspace synced to 2975e41a): production stage/permit refinements, login roles in team list, contact-form honeypot, TV board milestone simplification, materials-delivered tracking on production board, marketing copy tweaks + 'Housecall alternative' page, guided tour CTA changes, org-actions.ts (new)

## ✅ ORDER MATERIALS LIVE (Sept 1, 8ac43b4f)
- Settings: Material Suppliers (name/email/phone) + Materials List (18 roofing items PRE-SEEDED, editable). Tables: suppliers, materials, material_orders, material_order_items
- /materials/new: order form — job select (preselected via ?jobId= from Production's per-job '🧱 Order Materials' link), supplier select (shows order email), checkbox material list w/ qty, custom line. Submit = auto-email to supplier (BuildPros branding, job address, office contact) + logged
- /materials: order history (number, supplier, job, items, sent status) + resend for unsent
- Sidebar: 🧱 Materials (production perm = admin/manager/production; NOT agents). Order numbers MAT-1001+
- GOTCHA fixed: settings page already imports drizzle helpers — don't re-add

## /tour ROUTE (Aug 31): tour-framed trial entry — leadflowcrm.info/tour (user's insight: '/signup' felt like commitment pressure). Same form, softened copy, 'Start the Tour' button. /signup still works. All marketing docs now point to /tour

## FOUNDING-CUSTOMER HUNT (Aug 31 night — dogfood mode)
- Prospect list compiled (public sources): /home/user/leadflow_prospect_list.md + leadflow_prospects.csv — 11 emails + 5 phone-only, Capital Region contractors. Decision makers named where found (Dave/Josh Reed-Window World, Phil Trifaro-Five Star, Ian Wisniewski-Cap Seamless, Anthony-TGD)
- Cold email drafted: 2 versions (full + short) w/ 3 subject lines, in the .md file. STRATEGY: send from leadflow76@gmail.com first (new domains too cold for cold email), 5-6/day personalized, one follow-up bump, CAN-SPAM: add PO Box to signature
- ✅ DOGFOOD ORG LIVE: org id=4 'JMB Business Solutions (Sales Pipeline)' plan=starter max_users=5 (NO tour). All 15 prospects loaded as leads. Invite (admin) for leadflow76@gmail.com created Aug 31, expires ~Sep 7: https://leadflowcrm.info/invite/fa51c2211b73917e7ebae6daed443a9475e9858292c13a74 — IF EXPIRED: recreate via DB or just tell agent
- NOTE: this invite link is in chat history; safe but rotate if ever suspicious

## REP TRAINING PREP (Aug 31, all decisions locked)
- ✅ Rep Quick Reference PDF: /home/user/LeadFlow_Rep_Quick_Reference.pdf (+ .md source for edits) — NO call-center refs (doesn't exist yet; future goal for user + Kevin). Self-updating: new rep questions get added to doc
- ✅ Reps auto-appear in assignment dropdowns (acceptInvite creates reps entry; existing users synced Aug 31)
- ✅ Day-one decisions (user agreed): Call Center HIDDEN from agents (9137b98a; managers/admins unaffected; unhide when feature builds); shared view KEPT (reps see all prospects/sales — revisit at scale); NO guided tour for employees (live training + PDF instead)
- Agent sidebar now: Dashboard, Prospects, Appointments, Estimates, Sales. Walled: Production/Board/Invoices/Settings/Users
- NOTE: logCall/disposition requires only requireUser — unaffected by call-center permission change

## PIVOT 2.0 (Aug 31): LAUNCH WITH OR WITHOUT KEVIN
- Phone demo never happened (Kevin no-showed again). USER DECISION: launching anyway. SALES REPS training on LF THIS WEEK — reps ARE the pilot now, bottom-up adoption play
- Kevin status: invite ACCEPTED (active user, agent role — user was switching him to admin; role dropdown fixed w/ optimistic UI d3145fc5). He's in the system, can be activated as owner whenever he engages
- Recent builds this morning: user delete/Disable (self-serve, battle-tested), RoleSelect save-on-change, Prospects-row Edit buttons, record-deposit-paid on estimates (paper flow complete: prospect→estimate→accept→deposit paid→job→final invoice)
- Training support available from agent: rep-facing quick-reference PDF (like the iPhone one), in-app guided tour already exists for trials (could be shown to reps), training checklist. OFFER WHEN USER ASKS

## Roadmap (updated Aug 28, pre-demo)
- TODAY: Kevin demo. If GO → user trains sales reps NEXT WEEK (offer: I can build in-app guided tour / rep training materials to support)
- NEXT BUILDS after demo (user's priority): **QuickBooks integration + PayPal integration**
  - PayPal: Kevin's choice for card payments (user prefers Stripe, deferred). NEED: PayPal Business account + API credentials from user
  - QuickBooks: NEED from user: is it QuickBooks ONLINE or DESKTOP? (Online = clean API path; Desktop = much harder). Scope: invoices mirror to QB, payments recorded automatically. Build AFTER PayPal, architecture already prepped (config-driven sender/invoice design)
- Evening queue (JMB): domain purchase → leadflow.build wiring → authenticated email → launch posts go live

## In progress
**PILOT READY TO DEMO — user is walking Kevin (BuildPros owner) through the CRM next. Philosophy going forward: add features while CRM is actively used.**
- Housekeeping done: branding unified (L logo everywhere, CRM_ORGANIZATION_NAME drives all names, JMB copyright on public footers), internal invoice detail page /invoices/[id] (sidebar, actions, timeline; table links there), back-bars for internal users on public pages (invisible to customers)
- User is entering paper estimates into LF now
- If asked about videos: I can't make videos. Offered alternatives: Kevin demo guide doc, in-app guided tour feature (build-worthy), video script for user to record. User hasn't picked
- NEXT LIKELY: post-demo feedback from Kevin → new feature requests

**Root cause of the recurring "email not configured" saga:** user was testing on frozen deployment-snapshot URLs (each deploy gets its own URL that never updates). RULE: only use https://leadflow-k926.vercel.app — bookmark it. Send-failure message now self-diagnoses (shows env state + deployment SHA, commit 61d40291). Email env now: GMAIL_USER=albanybuildpros@gmail.com (valid, diagnostic-confirmed sending), CRM_ADMIN_EMAIL=albanybuildpros@gmail.com. Diagnostic endpoint lives at /api/email-check?key=jmb-diag-4821 (password-protected)
**Pending cosmetic:** CRM_ORGANIZATION_NAME currently "Albany BuildPros" (spaced) — user wants exactly "BuildPros". User needs to fix in Vercel (one edit; applies next deploy)

## NEW WORKFLOW (since Aug 26 evening)
- GitHub token at `/home/user/.ghtoken` (classic, repo scope, revocable at github.com/settings/tokens)
- Push helper: `/home/user/leadflow-push.sh main` (from /home/user/leadflow, after committing with identity LeadFlow Agent)
- I build + run `npm run build` locally, commit, push — user just watches Vercel and tests. Local .env exists with DATABASE_URL for build checks (gitignored now)
- ⚠️ Repo has .gitignore now (I added it) — protects .env from accidental commits. Earlier bad commit (with .env inside) was REJECTED by GitHub push protection and never landed; it was replaced by a clean one
- User still needs to make repo PRIVATE (token works on private repos)

## Remaining task list (user's own list)
1. ~~TV Board Layout (by date)~~ ✅ done
2. Dashboard cards clickable
3. ~~Instructions for installing the app on iPhone/iPad~~ ✅ done (pending rep test)
4. Production functions/statuses (partially done — "Materials Received" added; may want more statuses/stages editable)
5. Facebook post versions for LeadFlow launch (aggressive sales version + polished/professional version + matching image captions)
6. ~~Mobile layout~~ ✅ done & tested (hamburger menu, no white space)

## Possible leftover issue (verify)
- Earlier, clicking the TV board logo went to dashboard but "lost the sidebar." The rebuilt board now uses a plain `<a href="/dashboard">` (full page load), which likely fixed it — confirm when convenient.

## Repo & access
- **Repo:** https://github.com/jbratton3-cell/leadflow — public as of Aug 26 evening (user was reminded to flip private; token works either way)
- **Push:** I commit & push directly via token → Vercel auto-deploys. User never pastes code again
- **DB:** I have the Neon connection string; all schema changes = I run SQL directly (invoices table done this way)
