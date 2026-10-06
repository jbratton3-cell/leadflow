# LeadFlow CRM — Project Status
*THE SHARED LEDGER — committed to repo root for ALL agents. Conventions: (1) read end-to-end before starting work, (2) update after any significant change, in the same commit. Workspace copy + repo copy must stay in sync.*
*Last updated: Oct 5, 2026*

## CURRENT OPERATING STATE — OCT 5, 2026

### Standing execution protocol
- A code/site change is **not done** until it is tested, committed as `jbratton3-cell <jbratton3@gmail.com>`, pushed, both Vercel deployments succeed, and the live URL is checked. Never leave completed work only in the local workspace.
- Carry all accepted requirements forward during revisions. A new instruction is a delta, not permission to drop earlier constraints. Inspect surrounding layout/functionality and clean up obvious ripple effects without waiting to be told.
- User gives instructions one step at a time. New branch tasks do not cancel the active task. Live rep/customer blockers take immediate priority; checkpoint the original task, resolve the blocker fully, then resume automatically.
- **Ledger discipline is mandatory:** read the relevant ledger decisions before resuming a task, update both ledger copies after every material decision or completed action, and never substitute a newly invented workflow for an already agreed one.
- Marketing rules remain: no named competitors, no AI angle, no “built in a week”; use months of planning/building/testing. Approved lines include “LeadFlow does everything but the installation” and “their floor doesn’t reach our ceiling.” Founding offer wording is **“Setup fee waived—a value up to $4,000.”**

### Rank Authority integration and public product tour — LIVE Oct 5
- Commit `8c1e193` passed typecheck, targeted lint, production build, both Vercel deployments, local visual/interactive QA, and live authenticated-free desktop/mobile QA.
- Rank Authority offers **Headless delivery**, the preferred integration: approved SEO/AEO fixes arrive as clean JSON from a private signed URL; LeadFlow keeps all code and deployment control. Never grant Rank Authority GitHub, Vercel, DNS, database, customer/admin, or password access. Treat each signed URL as a secret and store it only as a revocable deployment environment variable. Planned blog base is `https://www.leadflowcrm.info/blog` once the renderer is implemented.
- Rank Authority's first finding: `/tour` was a signup gate, which hid the product from prospects and search engines. It has been rebuilt as a public, crawlable, no-login product tour using synthetic data only. The authenticated trial guide remains available after `/signup`; signup now clearly creates a trial workspace instead of claiming to start the public tour.
- Public overview `/tour` links five indexable feature pages: `/tour/lead-management`, `/tour/estimates-and-signatures`, `/tour/payments-and-invoices`, `/tour/materials-and-production`, and `/tour/job-costing-and-reports`.
- Every page has unique title/description/canonical metadata, visible answer-first AEO copy, outcomes, workflow steps, FAQs, internal next/previous links, `WebPage`/`HowTo`/`FAQPage` structured data, interactive sample controls, and Book Demo / Start Trial conversion paths. No production or customer data is exposed.
- Added public `sitemap.xml` containing all tour pages and `robots.txt` that advertises the sitemap while blocking private CRM/auth/customer-token routes. Homepage and marketing navigation now describe the route as an interactive public tour.
- Local and live production QA passed all six tour URLs on desktop and 390px mobile: no login redirects, no horizontal overflow, interactive controls, canonical tags, JSON-LD, sitemap coverage, robots protection, and no signup inputs on the public overview. Visual QA passed for overview and feature pages.
- Google Search Console setup completed Oct 6 for both canonical `www` sites. LeadFlow verification metadata is live (commit `0a6d595`), sitemap submitted successfully, homepage confirmed indexed, and `/tour`, founder case study, and `/blog` submitted to the crawl queue. JMB verification metadata, root sitemap, and robots file are live in JMB commit `0df132b`; JMB homepage was already indexed and its current Website Rescue version was submitted for recrawling.

### Front-end content, founder case study, blog, and legal pages — LIVE Oct 5
- Commit `3265322` passed typecheck, targeted lint, production build, both Vercel deployments, local visual/functional QA, and live production desktop/mobile QA.
- Added public `/about`, `/case-studies`, founder case study `/case-studies/from-operational-friction-to-leadflow`, `/blog`, three starter article URLs, `/terms`, `/privacy`, and `/cookies`. Existing `/contact` now has unique metadata and remains the primary demo-conversion page.
- The founder story is integrated into an anonymized first-implementation case study: months of planning/building/testing, real home-improvement handoff problems, connected workflow decisions, verified operational outcomes, and no invented customer quote or public BuildPros attribution.
- Starter blog articles cover connected workflow CRM, site-specific receipt/job costing, and property-management parent accounts versus service locations. Every article has unique metadata, canonical URL, Article/FAQ structured data, internal links, and author attribution to Jon Bratton. `/blog` now exists for the planned Rank Authority headless blog base.
- Marketing navigation is now responsive with desktop links and a mobile menu. The footer groups Product, Resources, Company, and Legal links. Homepage now links directly to the case study, blog, and About page. Sitemap includes all new public pages and articles.
- No separate surviving Terms/Privacy draft was found in the workspace or Git history. Tailored LeadFlow policies were reconstructed from the prior legal/IP decisions: Customer owns Customer Data; JMB retains LeadFlow/platform/reusable implementation IP; month-to-month terms, acceptable use, third-party integrations, confidentiality, export/termination, warranty and liability provisions, New York law, privacy roles, and current essential-cookie practices. These published business documents should still receive attorney review when budget permits.
- New signup and invitation users must explicitly agree to Terms and acknowledge Privacy. Production users schema now records `terms_accepted_at`, `privacy_accepted_at`, and legal version `2026-10-05` via `scripts/legal-acceptance-schema.sql`; existing users are not interrupted.
- Local and live production QA passed every new URL, canonical tags, sitemap inclusion, desktop/mobile layouts, responsive navigation, footer/legal links, signup acceptance UI, and the real invitation acceptance flow. Temporary invites/users proved legal acceptance timestamps/version are stored; every QA user, rep, session, and invitation was removed.

### JMB no-cost organic social pilot — ACTIVE Oct 6
- Jon connected with a new AI-marketing practitioner offering no-cost organic lead generation to build experience. He will operate separate Instagram, TikTok, and YouTube promotional accounts without ad spend, JMB/LeadFlow credentials, customer data, or system access. Jon has messaging and the relationship handled.
- Pilot offer is **JMB Website Rescue only**. LeadFlow is not authorized for promotion unless Website Rescue produces credible results and a separate arrangement is agreed later.
- Complete factual package: `/home/user/JMB_Website_Rescue_Promotion_Package_2026-10-06.zip`; preview brief and individual assets are in `/home/user/JMB_Website_Rescue_Promotion_Package_2026-10-06/`. It contains offer/scope boundaries, qualification rules, claims guardrails, handoff rules, official logos, square/vertical/landscape graphics, platform tracking links, and weekly reporting CSV.
- Platform-specific UTM links point to JMB. JMB homepage now captures `utm_source`, `utm_medium`, `utm_campaign`, and `utm_content` in Website Rescue inquiry details so emails identify campaign attribution; JMB commit `4fe33b3` passed Vercel deployment and live-source QA.
- Upwork profile setup was started but parked at the mandatory $9/$15 Connect purchase gate because current spend budget is **$0**. Do not resume or purchase Connects until new income creates a deliberate budget.

### Home Depot receipt automation — LIVE Oct 5
- **Non-negotiable user workflow:** Jon does not download and re-upload individual receipts. One Gmail mailbox export enters the pipeline; it extracts every original PDF, reads the order/date/amount/items/PO label, matches safe receipts to LeadFlow jobs, creates `materials_purchase` expenses, and attaches those same PDFs automatically.
- Commit `0182729` deployed successfully to both Vercel projects. Production schema `receipt_imports` is live. The one-command pipeline is `scripts/process_home_depot_receipts.py`; parser and importer are separate scripts for testing. Original PDFs are stored privately in PostgreSQL and served only through an authenticated, organization-scoped route.
- Automation is intentionally conservative: only a unique exact production-job match imports automatically. Multiple exact jobs, no job, no PO label, or fuzzy-only matches stay in the exception queue. Approved order/hash/file overrides resolve reviewed exceptions. SHA-256 plus order/message/file checks prevent duplicates.
- Initial ten-email production test produced the first three imported expenses. Full initial run completed Oct 6 from `/home/user/uploads/Home Depot Initial Run.txt`: 91 mailbox messages, 78 actual Home Depot receipt/rental records totaling **$11,150.63**, and one attached accounting management report excluded as a non-receipt.
- Oct 6 result: **13 new expenses / $2,920.00 imported**, one already-imported $603.78 receipt skipped as a duplicate, 64 source receipts retained for review, and zero errors. All 13 new original PDFs were retrieved live and verified byte-for-byte. An idempotency rerun produced 14 duplicates / 64 unchanged review / zero new expenses.
- Logical mappings approved under Jon's rule: 836/Harris labels and the transposed `863 Harris` label went to current Rhonda Nicholson Job #13 rather than legacy duplicates; `Fair Lawn` went to current 95 Fairlawn Job #24 rather than its imported duplicate. Unique exact imports also covered Blue Spruce/3093 US-9 Job #593, 19 Westchester Job #18, and 8th Ave Watervliet Job #550.
- Current production: **16 imported / 65 review / 16 real expenses totaling $3,952.17**. Current receipt costs include Rhonda Job #13 $2,941.76; Blue Spruce Job #593 $402.54; 63 Westchester Job #592 $212.93; Fairlawn Job #24 $305.82; 19 Westchester Job #18 $24.38; and 8th Ave Job #550 $64.74.
- Uncertain source receipts created no expenses: 23 Dutch Village receipts / $2,282.36 await unit/job identification; 15 receipts/rentals / $1,213.64 have no PO label; 9 named labels / $1,641.24 have no LeadFlow match; 7 / $1,536.33 have multiple exact jobs; 6 / $594.69 have fuzzy/unsafe candidates; and 4 / $358.59 match a prospect/site but no production job.
- Kevin already acknowledged that future Dutch Village receipt labels need a unit number. Do not guess on existing Dutch Village, generic city/name labels, missing-label receipts, or lead-only matches.
- Audit summary: `/home/user/Home_Depot_Initial_Run_Import_Summary_2026-10-06.md`; detailed parser/import reports: `/home/user/receipts_initial_run_20261006/`; approved Oct 6 overrides remain outside the public repository at `/home/user/approved_receipt_job_overrides_20261006.json`.
- Generic Vercel Blob uploads still lack `BLOB_READ_WRITE_TOKEN`, but the automated receipt pipeline does not depend on Blob and requires no per-receipt user upload.

### Production Receipt Inbox — LIVE Oct 5
- Commit `d971860` passed typecheck, targeted lint, production build, both Vercel deployments, authenticated live desktop QA, and 390px mobile QA.
- New admin-only `/receipts` page makes the complete parser workflow visible in LeadFlow: Needs Review, Imported, and All views; live counts; order/PO/date/vendor/amount/match reason/items; and authenticated access to every original PDF.
- Review exceptions can be searched against production jobs by customer, property, unit, or address. **Assign Receipt & Create Expense** atomically links the stored PDF, creates the `materials_purchase` expense, and immediately updates job profitability—no receipt download or re-upload.
- Imported receipts display the assigned job and link to Job Costs. Receipt Inbox is linked in the main navigation and from Job Costs. Both imported and pending PDF routes require job-financial access and organization ownership.
- End-to-end QA covered review assignment, expense creation, exact PDF delivery, duplicate prevention, job search, mobile navigation, and 390px overflow. All temporary QA records were removed. After the Oct 6 full initial run, current production state is **65 review / 16 imported / 16 real receipt expenses**.

### Password recovery and Kevin access — LIVE Oct 5
- Root cause of Kevin's failed login: there was **no Kevin user row**. His original invitation for `albanybuildpros@gmail.com` expired Sep 16 without being accepted, so he never created a password; a reset request alone could not repair that missing account.
- Commit `353ba1c` passed typecheck, targeted lint, production build, both Vercel deployments, local end-to-end QA, and live production end-to-end QA.
- Login now includes **Forgot your password?** Existing active users can request a generic, non-enumerating reset email. Reset tokens are random, stored only as SHA-256 hashes, expire after 60 minutes, are single-use, have a five-minute request cooldown, and invalidate every existing session after a successful password change.
- Public `/forgot-password` and `/reset-password/[token]` pages include validation, expired/used-link handling, success feedback, and mobile-safe layouts. Production schema `password_reset_tokens` is live via `scripts/password-reset-schema.sql`.
- Live QA passed: successful reset, new-password login, old-session invalidation, used-token blocking, no raw token storage, and 390px no-overflow. Separate validation QA confirmed generic unknown-email responses and mismatch protection without consuming the token. All QA users, tokens, and sessions were removed.
- A fresh **administrator** invitation was issued to Kevin M O'Connell at `albanybuildpros@gmail.com` and successfully delivered by email. It is valid for seven days. Kevin still has no user row until he opens that email and chooses his own password; never ask for or set it on his behalf. Once activated, future forgot-password requests will work normally.

### 63 Westchester paper estimate and job — LIVE Oct 5
- Source PDF: `/home/user/uploads/Build Pros Roof estimate for 63 Westchester.pdf` (3 pages; SHA-256 `9fcccafc0d051aea879e71c0fb8bd4f427dd110725ad0f6e30a21448acd5cbc5`). It contains no customer name/contact and has a blank acceptance line. Address-only Lead #1278 remains unnamed; do not invent a name.
- Estimate #243 / `EST-1197`, dated Aug 26, 2026, preserves the complete Owens Corning roof scope and terms. Source price is **$8,250 cash/check**; structured estimate stores cash price $8,250 and standard/list total $9,166.67 under BuildPros' existing 10% cash-discount rule.
- Jon concluded the job must be sold/in progress because BuildPros was already buying its materials. Estimate is accepted with cash choice; Sale #314 and in-progress Job #592 were created at the **$8,250 cash contract**. Because the exact acceptance/start date is unknown, Oct 3 at 9:20 AM—the first linked Home Depot material receipt—is stored as the latest confirmed sold/start date, with explicit correction notes.
- Jon authorized assuming the 50% deposit was paid unless Kevin says otherwise. Deposit invoice #630 / `INV-1599` is marked paid for **$4,125**, with Payment #157. Paid date is provisionally Oct 3 at 9:20 AM and method is `cash/check (assumed)`; both must be corrected if Kevin provides the real date or method. Notes clearly identify the assumption.
- Home Depot order `H1269-247797` is now Expense #7 on Job #592 for **$212.93**. The original PDF is attached privately and verified byte-for-byte. Current job profitability is contract $8,250, costs $212.93, profit $8,037.07, margin 97.42%.
- Live QA passed across the lead, estimate, production, invoice, Job Costs, Receipt Inbox, and authenticated receipt PDF. No QA records or temporary sessions remain.
- Import is idempotently tracked in `migration_records` under `paper_estimate_pdf` and `paper_estimate_followup`; do not duplicate any of these records if the same PDF or decision is supplied again.

### Green Springs Capital / Blue Spruce — LIVE Oct 5
- Jon clarified that the existing 58 Lincoln and 3093 US-9 Green Springs records were separate legacy job/site entries created before parent-account support; neither is the true parent account. New parent Lead #1279 is **Green Springs Capital**, account type property management, with no invented billing address or contact. Blue Spruce Motel is service location/property #16 at 3093 US-9, Valatie, NY 12184. Greg Green was not assumed to be the parent billing or site contact.
- The old 58 Lincoln historical jobs remain untouched; legacy Lead #1187 was corrected from property-management parent status back to an unclassified site record. The parent/location restructure is idempotently tracked under `property_management_restructure`.
- `EST-1002` / Estimate #7 moved from legacy Lead #5 to parent Lead #1279 and Blue Spruce property #16. Jon confirmed it was accepted and the deposit was paid by check. The job sold **before** BuildPros implemented the 10% cash discount, so Estimate #7 now snapshots 0% discount and the original full **$84,800 contract**; never reduce it to $76,320.
- Sale #315 and in-progress site Job #593 were created for $84,800 at property #16. Deposit invoice #631 / `INV-1600` is paid by **check** for **$42,400**, with Payment #158. Exact acceptance/check date was not provided; Oct 3 at 7:39 AM—the first linked material receipt—is stored as the latest confirmed date and clearly marked for correction if Kevin supplies the real date.
- Home Depot order `H1263-304078` is Expense #8 on Job #593 for **$215.46**. The original PDF is attached privately and verified byte-for-byte. Current profitability is contract $84,800, costs $215.46, profit $84,584.54, margin 99.75%. The receipt belongs to the Blue Spruce site job, not the Green Springs parent account.
- Live QA passed across parent, location, estimate, production, invoice, Job Costs, Receipt Inbox, and authenticated PDF. Follow-up records are idempotently tracked under `blue_spruce_followup`.

### Job profitability visibility — LIVE Oct 5
- Commit `59b78e3` passed typecheck, production build, both Vercel deployments, and authenticated live QA.
- Rhonda Nicholson Expense #5 was already correctly linked to Job #13 and live profitability is $10,800 contract / $603.78 costs / $10,196.22 profit / 94.4% margin. She appeared buried because Job Costs sorted hundreds of jobs by job-creation date.
- Job Profitability now sorts jobs with recorded costs first, then by latest expense date. Current live order is 63 Westchester, Blue Spruce, then Rhonda Nicholson, all with exact cost/profit figures; jobs without costs follow afterward.

### Calendar-month MTD reporting — CORRECTED Sep 30
- Dashboard, Sales, Estimates, Metrics, sold/collected TV board, and rep board now use explicit current-calendar-month boundaries in `America/New_York`, including the exclusive next-month boundary. They reset at midnight Eastern instead of following the deployment server's UTC month.
- Root cause of the misleading lead count: 1,144 historical Housecall Pro customers were bulk-migrated on Sep 10 and carried the migration timestamp, so they appeared as September new leads. Historical HCP customer rows are now excluded from new-lead KPIs; local QA changed BuildPros New Leads MTD from 1,185 to 41 without altering customer records.
- Payments Received/Collected MTD now belongs to the month money actually arrived, even when the contract was sold earlier. Lifetime per-contract caps remain enforced chronologically. Demos Sat uses the scheduled demo date; future CSV migrations can map a Lead/Created Date so history keeps its original period.
- Verified locally against production data: Dashboard New Leads 41, Sold $583,890 across 41 contracts/jobs, Payments Received $382,095 across 54 transactions, Estimates Created $713,124 across 55 estimates. Eastern rollover and cross-month-payment tests passed; typecheck and production build passed.

### Founding-customer conversion offer — IMPLEMENTED Oct 2
- The public marketing path now treats the founding offer as a sales conversion incentive rather than a passing caption: a sitewide offer strip appears across marketing pages, and full offer cards appear on the homepage, Pricing, Contact, and guided-tour entry.
- Source-of-truth wording is centralized in `src/lib/founding-offer.ts`: **“Setup fee waived—a value up to $4,000.”** Only five companies receive the waiver; the monthly subscription still applies. The offer includes agreed data migration, complete workflow setup, and live team training.
- A founding spot is secured only after the agreement is signed and the first monthly subscription payment is received. Demo requests and trial signups do not hold spots. Current display is **5 of 5 spots available**; manually reduce `FOUNDING_SPOTS_REMAINING` only after a customer meets the booking rule.
- The same language now appears inside both trial guides so high-intent trial users see accurate terms. Desktop and 390px mobile browser QA passed on Homepage, Pricing, Contact, and Tour.

### Additional job addresses for every customer — IMPLEMENTED Oct 1
- Service Locations are no longer limited to property-management accounts. Any homeowner, commercial customer, or other account can retain its primary/billing address while estimates, sales, production jobs, invoices, PDFs, and QuickBooks records carry a different job address.
- The customer page now exposes Service Locations for every account. From an added address, office staff can create an estimate or immediate work order; existing jobs can be assigned to it from Production. Regular customers may still use their primary address, while property-management accounts continue to require an explicit location.
- Multi-job final invoicing switches to job-specific balances whenever an account has service locations or multiple jobs, preserving isolation between addresses.
- Admins and managers can correct the service location on an accepted estimate. LeadFlow cascades that factual correction to the linked sale, production job, and LeadFlow invoices while leaving contract totals, paid status, and all other financial data unchanged.
- Service locations are searchable from Prospects by location name, street address, city, state, ZIP, unit, site contact, phone, or email. A matched service address is shown beneath the customer’s primary location in the results. Estimates, Sales, and Production searches also retain their service-location matching.
- Local QA used a normal homeowner account with `10 Primary Lane` as the bill-to address and `55 Job Site Road` as the service location. The UI-created location, estimate, and immediate work order all retained the correct separate addresses. A separate accepted-estimate QA proved the linked sale/job/paid-invoice cascade and public customer pages. Prospects searches for Pineview, its street, city, and ZIP all returned the correct customer. No schema change was required.

### Property-management hierarchy — BUILT and end-to-end verified Sep 29
- One management company remains the parent customer/billing account while holding any number of reusable service locations. A location supports optional property/community name, resident/site contact, unit, phone/email, required street address, city/state/ZIP, and access instructions. If no property name exists, the display label falls back to resident/site contact and then street address.
- Both requested paths are supported from the account page: **create an estimate** for a location or **create an immediate work order** under a standing contract. Neither path creates a duplicate prospect.
- Estimates, accepted sales, production jobs, deposit/final invoices, public customer pages, emails, estimate PDFs, payment-receipt PDFs, sales/invoice lists, TV board, and QuickBooks payloads retain the exact service location while all billing/email remains with the management company.
- Accepted estimates are now one contract per estimate, not one sale/job per lead. Invoice balances are scoped to the exact sale/job, so one address cannot reduce another address's balance. A parent account remains In Production until all of its jobs are complete.
- Production schema migration applied to Neon. Tracked migration: `scripts/property-management-schema.sql`. Temporary QA org/data was deleted after tests.
- End-to-end QA covered: resident-name fallback; estimate-first path; immediate-work-order path; acceptance idempotency; two simultaneous locations under one account; isolated deposit/final balances; production stage behavior; public estimate/invoice rendering; and estimate/receipt PDF generation.

### Live billing fixes — Sep 29
- `3e8fafe`: invoice resend now shows Sending state and explicit sent/failed/missing-email/unavailable feedback; sender domain cannot become `no-reply@www...`.
- `e3a948a`: currency displays exact cents (for example `$7,467.50`) instead of rounding to whole dollars.
- `344c758`: estimate acceptance requires an explicit Cash/Check, Card/PayPal, or Financing choice; the public form no longer silently defaults to cash.
- Customer `INV-1582` successfully paid the deposit after the live record was corrected. Temporary QA records for all three fixes were removed.

### Payment notifications — CHECKPOINTED, NOT BUILT
- Required: instant office email plus true browser/desktop push that can appear even when the LeadFlow tab is closed. Recipient selection must eventually support Jon, Kevin, bookkeeper, or other office users. Include customer, invoice, amount, method, fee, and link; later include ACH lifecycle events.

### QuickBooks / ACH architecture — DECIDED, LIVE CONNECTION PENDING
- LeadFlow owns and sends every customer invoice. QuickBooks sends no invoice emails. LeadFlow Card/PayPal receipts push to QuickBooks.
- ACH plan: LeadFlow opens Intuit's hosted secure ACH/payment page; QuickBooks Payments processes it; LeadFlow reads pending/settled/failed/returned status back and must not create a duplicate ACH payment.
- Current connection is sandbox/development only. Live implementation waits for Kevin/bookkeeper coordination and verification against the production QuickBooks Payments company.

### BuildPros website — ACCESS RESPONSE PENDING
- Kevin contacted Steve/Ocean Blue and was told access instructions will be sent. Inspect the exact message before changing anything. Verify a dedicated WordPress Administrator for `jmbalbany@gmail.com`, correct environment, backup/staging instructions, and restrictions. Do not reset passwords, change DNS, transfer hosting/domain, or bypass Steve.

### PayPal/card payments — LIVE and end-to-end verified Sep 24
- Live customer flow: accepted estimate with **Card / PayPal** at standard/list price -> automatic 50% deposit invoice -> PayPal or card checkout -> invoice auto-marks paid -> payment/fee ledger -> QuickBooks payment -> customer PDF receipt. Final invoice repeats automatically on job completion.
- Pricing decision: **card, PayPal, and financing use the existing standard/list price; cash/check keeps the existing 10% discount.** No separate 3% surcharge or third price tier.
- Sandbox passed: PayPal-wallet path, card-entry form, deposit invoice, final invoice, fee capture, automatic QuickBooks sandbox records, and receipt PDFs. Temporary LF test records were deleted after verification.
- Live credentials + live webhook are installed in Vercel project `leadflow-k926`; real-mode order creation verified without a capture. Live payments are enabled.
- Relevant commits: `3966fb0` (checkout/API/schema/estimate pricing), `ce47854` (public webhook health validation). PayPal columns/indexes are live in Neon; schema script: `scripts/paypal-schema.sql`.
- Never put live PayPal credentials in the ledger or chat. User entered live Client ID/Secret/Webhook ID directly in Vercel.

### Public contact flow — LIVE
- LeadFlow Facebook Contact Us button opens `https://www.leadflowcrm.info/contact`.
- Public contact submissions email `contact@leadflowcrm.info` (forwarded to the LeadFlow Gmail). Owner alerts also exist for trial signup.
- Invisible contact-form spam protection is live and verified: timing trap, two honeypots, and targeted solicitation/link filtering. Legitimate submission + email tested end to end.
- Relevant commits: `e43c7ad`, `e7569e5`, `1d363f6`, `3b41dd3`.

### Facebook pages
- LeadFlow: categories corrected; Contact Us button -> `/contact`; website link already present. No address/hours (online software). Page setup complete.
- JMB: primary category **Website Designer** only; **Call Now** button tested; website corrected from old `.site` to `https://jmbcreative.org`; bio now: “Albany web design for small businesses. Professional websites built to turn visitors into calls.” No home address/hours.
- JMB/LeadFlow schedule rule: five posts per page per Thu-Wed block; intended mix is three memes + two text/conversion posts per page, with humor + pivot content. Never schedule a meme for both pages on the same date; preserve approved meme order. Every item needs Page caption, personal-share text, and relevant-group text.
- **NO-REPEAT rule:** cross-check every meme against Buffer Sent/Published history before approving a schedule. Known published LeadFlow memes include **Estimate Clipboard** (published before Sep 24) and **11 PM Paperwork** (published Sep 23; current early engagement leader). This is not a complete published inventory—Buffer is the source of truth and must be audited before the next rotation is approved.
- Known completed JMB memes before the current rotation: Under Construction, Facebook Page and a Prayer, One Good Google Review, and The DIY Spiral. JMB Competitor’s Website published Sep 24 morning.
- Uploaded rotation PDF `UPDATED JMB LeadFlow Facebook Rotation Sep 24-Oct 7 2026.pdf` is **NOT APPROVED YET**: it repeats Estimate Clipboard, only two of five LF text posts carry the founding offer, references obsolete asset filenames, contains audience-facing group-rule instructions, and uses “I’m building LeadFlow” instead of launched-product language. Sep 24 afternoon post was missed; user is considering skipping it and restarting Sep 25.
- Founding offer source of truth: first five companies get setup waived (up to $4,000 value on current pricing page). Keep terms consistent; do not invent new tiers.

### Prospecting / Craigslist
- First five personalized LeadFlow emails were scheduled for Thu Sep 24 in recipient-local morning windows. Contact records were independently checked; Mac Wright corrected to `mwright@vbrinc.com`, Justin Gier corrected to `justin@cabinetiq.com`. Emails name/link LeadFlow, assume no CRM status, and rely on Gmail’s saved LeadFlow signature (no JMB in body/signature copy).
- 11 AM Sep 24 CL scan: clean—no verified, reply-worthy lead. Nationwide actual-post pages were pulled; local-only, low-quality, duplicated harvesting templates, and suspicious video/resume requests were rejected. Next scan remains ~5:30 PM under CL protocol v2.

### BuildPros website
- Kevin approved all audit fixes that do not need his input. Work is blocked only on access.
- Site is WordPress on Hostinger infrastructure (LiteSpeed; Hostinger-specific plugins); domain/DNS is controlled at GoDaddy. Original developer appears to be Steve Hendershaw / Ocean Blue Digital (`steve@oceanbluedigital.com`, 917-382-5957), likely providing managed/reseller hosting.
- Wait until Kevin is present. Kevin should directly authorize Steve to create a separate WordPress Administrator for `jmbalbany@gmail.com` and clarify the current hosting/maintenance arrangement. Do not guess passwords, reset access, change DNS, or request a transfer before reviewing the agreement.

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
5. ✅ Terms of Service + Privacy + Cookie pages live in code Oct 5; explicit acceptance/version tracking added for new signup and invited users

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
- FB STRATEGY PIVOT (user, ~Sept 8): memes for engagement instead of straight launch posts; original posts still available as conversion layer. User generating memes on another platform during outages
- Agent status: this workspace synced + verified current with production

## CL GIG-HUNT PROTOCOL v2 (upgraded Sept 23): VERIFIED LEADS ONLY — a lead is only reported when the actual post page has been pulled (full text + post ID + date, like oceanside/nonprofit). Feed-snapshot search results = RUMORS, not leads — do not report them (burned user 3x: Miami, Presidio, Seattle x2, all ghosts from cached feed listings). Scan windows: ~11am (money scan) + ~5:30pm (early evening) — posting happens 10am-2pm business hours; evening scans catch the day's posts while fresh. Empty scans are CLEAN reports, not failures. If indexes hint at activity, report as 'pond pointer' for optional manual skim, never as a lead. Quality over quantity — user's explicit instruction. agent runs nationwide CL searches 2x/day (morning + evening) for web design gigs; drafts replies per established rules; user responds immediately to live links (speed wins - the Miami channel-partner lead died overnight). Search signatures: 'web designer/website build' + CHANNEL-PARTNER keywords ('white label', 'ongoing', 'reseller', 'subcontract', 'I handle sales'). Reply rules: follow their stated format exactly, honest credentials (no WordPress specialist claims), quality-forward positioning, portfolio = jmbcreative.org + leadflowcrm.info (no phantom portfolio), phone number ONLY if they ask. Reply templates calibrated + on file (oceanside, nonprofit, channel-partner/Miami format). Dead links = document + move on. Known dead: Miami channel-partner post (7906015655, found+deleted same day Sept 22). Also: BP site audit done (BuildPros_Site_Audit_Report.pdf) - phases 1-3 need only Kevin's yes; 'update and fix' mandate, Option A for Pay My Bill (points to LF invoices)

## RECEIPT PROJECT — RESOLVED Sept 15 (scope changed by Kevin, retroactively)
- ORIGINAL ASK (per user, from Kevin directly): pull past receipts + match to jobs for historical profit. Parser BUILT + PROVEN on 15-receipt test batch: mbox parsing, PDF extraction (dates/totals/items/PO names), date-window job matching (receipts_matched.json, Receipt_Match_Review_v2.pdf). Tooling works, is shelved-ready if bulk processing ever needed
- FINDING: the backfill is IMPOSSIBLE as asked — most BuildPros jobs never entered HCP (only rep Damon used it); the 534 LF jobs are partial history. Also: installers reuse ghost PO names from Home Depot's saved dropdown (receipt POs reference jobs not in any system); receipts contain NO job addresses (verified all 15); only 65/534 jobs have start dates
- KEVIN'S REVISED SCOPE (as he now remembers it): expense tracking FROM THIS POINT FORWARD. The other agent's expense feature + per-job profit = the live solution. Workflow going forward: every new job entered in LF + receipts assigned to jobs (PO field should carry job address/name for self-matching)
- Kevin pattern noted: misremembers assignments when the original ask proves infeasible. Practice adopted: one-line confirmation text after Kevin task assignments (paper trail, same doctrine as IP/payment)
- Artifacts kept: receipts_parsed.json, receipts_matched.json, verification sheets (v1+v2), receipts_extracted/ (15 PDFs)

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
