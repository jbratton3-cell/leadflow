export type PublicTourStep = {
  slug: string;
  shortTitle: string;
  icon: string;
  title: string;
  seoTitle: string;
  description: string;
  answer: string;
  outcomes: string[];
  workflow: string[];
  faq: { question: string; answer: string }[];
};

export const PUBLIC_TOUR_STEPS: PublicTourStep[] = [
  {
    slug: "lead-management",
    shortTitle: "Leads & appointments",
    icon: "📞",
    title: "Move every new inquiry toward the next real action",
    seoTitle: "Lead Management and Appointment Scheduling Tour | LeadFlow",
    description:
      "See how LeadFlow keeps prospect details, call notes, assignments, appointments, and follow-up status connected in one home-improvement sales workflow.",
    answer:
      "LeadFlow gives the office and sales team one shared prospect record. Calls, notes, appointments, service addresses, assignments, and pipeline status stay connected so the next person knows exactly what should happen.",
    outcomes: [
      "Capture phone, web, referral, and imported prospects in one place",
      "Keep call outcomes, notes, callbacks, and appointments together",
      "Search by customer, company, property, unit, or service address",
      "Adapt stages and responsibilities to the way your company actually sells",
    ],
    workflow: [
      "A new inquiry enters LeadFlow with its source and contact details.",
      "The office records the call outcome and schedules the appointment.",
      "The assigned rep opens the same record instead of rebuilding the customer file.",
      "Managers can see where the opportunity stands and what needs attention next.",
    ],
    faq: [
      {
        question: "Can LeadFlow follow our existing sales process?",
        answer:
          "Yes. LeadFlow is implemented around each company’s stages, approvals, responsibilities, and handoffs rather than forcing every business into one generic pipeline.",
      },
      {
        question: "Can one customer have multiple job addresses?",
        answer:
          "Yes. A customer or property-management account can keep a primary billing record while estimates, jobs, invoices, and expenses remain attached to the correct service location.",
      },
    ],
  },
  {
    slug: "estimates-and-signatures",
    shortTitle: "Estimates & signatures",
    icon: "📝",
    title: "Build a clear estimate and let the customer respond online",
    seoTitle: "Digital Estimates, Photos, and Signatures Tour | LeadFlow",
    description:
      "Preview LeadFlow digital estimates with line items, job-site photos, payment choices, customer acceptance, signatures, and signed PDF records.",
    answer:
      "LeadFlow turns the estimate into a connected customer decision page. The customer can review scope, pricing, photos, and payment choices, then accept and sign without the office re-entering the contract.",
    outcomes: [
      "Create itemized estimates with company-specific pricing and terms",
      "Keep estimate photos attached to the proposal and job",
      "Offer the payment paths your workflow supports",
      "Preserve acceptance, signature, timestamp, and signed PDF records",
    ],
    workflow: [
      "The rep builds the estimate from the customer and service-location record.",
      "LeadFlow sends a branded review link to the customer.",
      "The customer reviews the scope, photos, pricing, and payment route.",
      "Acceptance and signature update the same estimate and preserve the signed record.",
    ],
    faq: [
      {
        question: "Can the customer sign from a phone?",
        answer:
          "Yes. The customer can accept and draw or type a signature from a phone, tablet, or computer, and LeadFlow preserves the signed estimate as a PDF.",
      },
      {
        question: "Does LeadFlow require one fixed pricing model?",
        answer:
          "No. Pricing, discounts, deposits, financing choices, and approval steps can be configured around the company’s actual selling process.",
      },
    ],
  },
  {
    slug: "payments-and-invoices",
    shortTitle: "Payments & invoices",
    icon: "💳",
    title: "Carry an accepted estimate into invoicing without duplicate entry",
    seoTitle: "Deposit, Payment, and Invoice Workflow Tour | LeadFlow",
    description:
      "See how LeadFlow connects accepted estimates to deposit invoices, payment tracking, receipts, final balances, and accounting handoffs.",
    answer:
      "When an estimate is accepted, LeadFlow can create the sale, production job, and required invoice from the same contract. Payments remain tied to the correct customer, job, service location, and balance.",
    outcomes: [
      "Create deposit and final invoices from the agreed contract",
      "Track cash, check, card, PayPal, or financing workflows as configured",
      "Keep paid status, payment method, fees, and receipts with the invoice",
      "Send completed payment records to accounting without sending duplicate invoices",
    ],
    workflow: [
      "The customer accepts the estimate and chooses an available payment route.",
      "LeadFlow creates the connected sale, job, and deposit record.",
      "The office tracks payment status and preserves the customer receipt.",
      "At completion, the remaining balance can become the final invoice automatically.",
    ],
    faq: [
      {
        question: "Does LeadFlow send the invoices?",
        answer:
          "Yes. LeadFlow can own the customer-facing invoice workflow while completed payment records are passed to the accounting system.",
      },
      {
        question: "Can deposits and final payments follow different milestones?",
        answer:
          "Yes. Implementation can follow the company’s real deposit, approval, financing, progress-payment, and completion rules.",
      },
    ],
  },
  {
    slug: "materials-and-production",
    shortTitle: "Materials & production",
    icon: "🏗️",
    title: "Hand the sold job to production with the contract intact",
    seoTitle: "Materials Ordering and Production Workflow Tour | LeadFlow",
    description:
      "Explore LeadFlow production jobs, milestones, service locations, material orders, scheduling, crews, and shared job-board visibility.",
    answer:
      "LeadFlow carries the sold customer, address, scope, contract, and payment context into production. The team can track the job, order materials, update milestones, and keep the office aligned without rebuilding the file.",
    outcomes: [
      "Create the production job automatically from an accepted estimate",
      "Track permits, measurements, materials, scheduling, install, and completion",
      "Send supplier orders while keeping them connected to the job",
      "Display current jobs and milestones on a shared production board",
    ],
    workflow: [
      "The accepted contract creates the production job at the correct service location.",
      "Office and production staff update the stages and milestones they own.",
      "Material orders are sent and tracked from the job record.",
      "The shared board shows what is pending, scheduled, active, or complete.",
    ],
    faq: [
      {
        question: "Can production stages be customized?",
        answer:
          "Yes. LeadFlow can be implemented around the company’s real stages, approvals, responsibilities, and installation milestones.",
      },
      {
        question: "Do material orders stay connected to the customer job?",
        answer:
          "Yes. Supplier, materials, confirmation status, and job context stay together so the order is not separated from the work it supports.",
      },
    ],
  },
  {
    slug: "job-costing-and-reports",
    shortTitle: "Job costing & reports",
    icon: "📊",
    title: "See revenue, job expenses, profit, and operating performance together",
    seoTitle: "Job Costing, Profitability, and Reporting Tour | LeadFlow",
    description:
      "See how LeadFlow connects receipt expenses to individual jobs and reports contract revenue, costs, profit, margin, sales, collections, and team activity.",
    answer:
      "LeadFlow calculates job profitability from the contract and the expenses attached to that exact production job. Owners can review cost, profit, margin, sales, payments, estimates, lead sources, and team activity without rebuilding spreadsheets.",
    outcomes: [
      "Attach receipts and material expenses to the correct site-specific job",
      "Calculate contract revenue, costs, profit, and margin by job",
      "Review calendar-month sales, estimates, and collected payments",
      "Compare lead sources and team activity with operational results",
    ],
    workflow: [
      "A receipt or expense is connected to the production job it belongs to.",
      "LeadFlow updates that job’s total cost, profit, and margin.",
      "Payment and sales reporting uses the correct transaction and contract dates.",
      "Owners can move from company-level metrics back to the underlying job records.",
    ],
    faq: [
      {
        question: "Can expenses be separated by property or job site?",
        answer:
          "Yes. Expenses attach to the site-specific production job, even when several locations belong to one parent customer or property-management company.",
      },
      {
        question: "Does LeadFlow replace every accounting function?",
        answer:
          "No. LeadFlow owns the operational workflow and customer-facing invoicing, then passes completed financial records to the accounting system as configured.",
      },
    ],
  },
];

export function getPublicTourStep(slug: string): PublicTourStep | undefined {
  return PUBLIC_TOUR_STEPS.find((step) => step.slug === slug);
}
