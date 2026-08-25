import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  numeric,
  index,
} from "drizzle-orm/pg-core";

// Inbound "contact us / request pricing" leads from the public marketing site.
export const demoRequests = pgTable("demo_requests", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  company: varchar("company", { length: 160 }),
  email: varchar("email", { length: 190 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  trade: varchar("trade", { length: 80 }),
  message: text("message"),
  handled: boolean("handled").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Organizations = tenants. Each customer company gets one isolated workspace.
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  // plan: trial | starter | pro | business
  plan: varchar("plan", { length: 30 }).notNull().default("trial"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Login users (authentication) — scoped to an organization.
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id").notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 190 }).notNull().unique(),
    phone: varchar("phone", { length: 40 }),
    // passwordHash is empty until the user accepts their invite
    passwordHash: text("password_hash").notNull().default(""),
    // role: admin | manager | agent | production
    role: varchar("role", { length: 30 }).notNull().default("agent"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("users_org_idx").on(t.orgId)]
);

// Pending invitations — admin invites a user, they set their own password
export const invitations = pgTable("invitations", {
  token: text("token").primaryKey(),
  orgId: integer("org_id").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 190 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  role: varchar("role", { length: 30 }).notNull().default("agent"),
  invitedById: integer("invited_by_id"),
  // delivery: how the invite was sent (email | sms | link)
  deliveredVia: varchar("delivered_via", { length: 20 }),
  acceptedAt: timestamp("accepted_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Server-side sessions backing the auth cookie
export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: integer("user_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Employees / reps: call center reps, sales reps, production managers
export const reps = pgTable(
  "reps",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id").notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 160 }),
    phone: varchar("phone", { length: 40 }),
    // role: call_center | sales | production | admin
    role: varchar("role", { length: 30 }).notNull().default("sales"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("reps_org_idx").on(t.orgId)]
);

// Marketing lead sources / campaigns with cost tracking for ROI
export const leadSources = pgTable(
  "lead_sources",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id").notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    // category: internet | direct_mail | tv | radio | referral | home_show | canvassing | repeat
    category: varchar("category", { length: 40 }).notNull().default("internet"),
    // total marketing spend allocated to this source
    monthlyCost: numeric("monthly_cost", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("sources_org_idx").on(t.orgId)]
);

// Product lines offered (windows, roofing, bath, etc.)
export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id").notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    avgTicket: numeric("avg_ticket", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    active: boolean("active").notNull().default(true),
  },
  (t) => [index("products_org_idx").on(t.orgId)]
);

// Prospects / leads — the core entity
export const leads = pgTable(
  "leads",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id").notNull(),
    firstName: varchar("first_name", { length: 80 }).notNull(),
    lastName: varchar("last_name", { length: 80 }).notNull(),
    email: varchar("email", { length: 160 }),
    phone: varchar("phone", { length: 40 }),
    altPhone: varchar("alt_phone", { length: 40 }),
    address: varchar("address", { length: 200 }),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 20 }),
    zip: varchar("zip", { length: 20 }),
    sourceId: integer("source_id"),
    productId: integer("product_id"),
    // pipeline stage: new | contacting | appt_set | confirmed | sat | sold | production | completed | dead
    stage: varchar("stage", { length: 30 }).notNull().default("new"),
    // last call disposition
    disposition: varchar("disposition", { length: 40 }),
    // reason a lead is dead (not_interested, bad_lead, no_show, cancelled, dnc)
    deadReason: varchar("dead_reason", { length: 40 }),
    assignedRepId: integer("assigned_rep_id"),
    doNotCall: boolean("do_not_call").notNull().default(false),
    estimatedValue: numeric("estimated_value", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    notes: text("notes"),
    callbackAt: timestamp("callback_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("leads_org_idx").on(t.orgId),
    index("leads_stage_idx").on(t.stage),
    index("leads_source_idx").on(t.sourceId),
  ]
);

// Call center dial log with dispositions
export const callLogs = pgTable(
  "call_logs",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id").notNull(),
    leadId: integer("lead_id").notNull(),
    repId: integer("rep_id"),
    disposition: varchar("disposition", { length: 40 }).notNull(),
    notes: text("notes"),
    callbackAt: timestamp("callback_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("calllogs_org_idx").on(t.orgId)]
);

// Appointments booked for a sales rep to run a demo
export const appointments = pgTable(
  "appointments",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id").notNull(),
    leadId: integer("lead_id").notNull(),
    salesRepId: integer("sales_rep_id"),
    setById: integer("set_by_id"),
    scheduledAt: timestamp("scheduled_at").notNull(),
    durationMin: integer("duration_min").notNull().default(90),
    // status: set | confirmed | sat | no_show | cancelled | rescheduled
    status: varchar("status", { length: 30 }).notNull().default("set"),
    // result once run: sold | not_sold | one_leg | callback | no_demo
    result: varchar("result", { length: 30 }),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("appt_org_idx").on(t.orgId),
    index("appt_sched_idx").on(t.scheduledAt),
  ]
);

// Sales / signed contracts
export const sales = pgTable(
  "sales",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id").notNull(),
    leadId: integer("lead_id").notNull(),
    appointmentId: integer("appointment_id"),
    salesRepId: integer("sales_rep_id"),
    productId: integer("product_id"),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0"),
    // finance: cash | financed | check
    financeType: varchar("finance_type", { length: 30 }).default("cash"),
    soldAt: timestamp("sold_at").notNull().defaultNow(),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("sales_org_idx").on(t.orgId)]
);

// Production jobs — track project from sale to completion
export const jobs = pgTable(
  "jobs",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id").notNull(),
    // saleId/leadId are set when a job originates from a sale; null for manual jobs
    saleId: integer("sale_id"),
    leadId: integer("lead_id"),
    // For manually-entered jobs (no linked lead), store customer info directly
    customerName: varchar("customer_name", { length: 160 }),
    customerAddress: varchar("customer_address", { length: 200 }),
    customerCity: varchar("customer_city", { length: 100 }),
    customerPhone: varchar("customer_phone", { length: 40 }),
    contractAmount: numeric("contract_amount", { precision: 12, scale: 2 }),
    productName: varchar("product_name", { length: 120 }),
    // status: pending | measure | permits | materials_ordered | scheduled | in_progress | completed | on_hold
    status: varchar("status", { length: 40 }).notNull().default("pending"),
    crew: varchar("crew", { length: 120 }),
    startDate: timestamp("start_date"),
    completionDate: timestamp("completion_date"),
    // JSON string of milestone booleans
    milestones: text("milestones"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("jobs_org_idx").on(t.orgId)]
);

// Estimates / quotes sent to customers
export const estimates = pgTable(
  "estimates",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id").notNull(),
    leadId: integer("lead_id").notNull(),
    number: varchar("number", { length: 30 }).notNull(),
    title: varchar("title", { length: 160 }).notNull().default("Project Estimate"),
    // status: draft | sent | viewed | accepted | declined
    status: varchar("status", { length: 20 }).notNull().default("draft"),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
    taxRate: numeric("tax_rate", { precision: 6, scale: 3 }).notNull().default("0"),
    taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    discount: numeric("discount", { precision: 12, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
    notes: text("notes"),
    terms: text("terms"),
    validUntil: timestamp("valid_until"),
    // secure token for the public customer-facing view
    publicToken: text("public_token").notNull().unique(),
    createdById: integer("created_by_id"),
    sentAt: timestamp("sent_at"),
    viewedAt: timestamp("viewed_at"),
    respondedAt: timestamp("responded_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("estimates_org_idx").on(t.orgId)]
);

// Line items belonging to an estimate
export const estimateItems = pgTable("estimate_items", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  estimateId: integer("estimate_id").notNull(),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull().default("1"),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull().default("0"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type DemoRequest = typeof demoRequests.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Invitation = typeof invitations.$inferSelect;
export type Estimate = typeof estimates.$inferSelect;
export type EstimateItem = typeof estimateItems.$inferSelect;
export type Rep = typeof reps.$inferSelect;
export type LeadSource = typeof leadSources.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type CallLog = typeof callLogs.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type Sale = typeof sales.$inferSelect;
export type Job = typeof jobs.$inferSelect;
