export type BlogSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type BlogPost = {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  excerpt: string;
  publishedAt: string;
  displayDate: string;
  readTime: string;
  category: string;
  icon: string;
  sections: BlogSection[];
  faq: { question: string; answer: string }[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "connected-workflow-crm-home-improvement",
    title: "What Is a Connected Workflow CRM for a Home Improvement Company?",
    seoTitle: "Connected Workflow CRM for Home Improvement Companies | LeadFlow",
    description:
      "Learn how a connected workflow CRM carries one home improvement job through leads, estimates, signatures, payments, materials, production, and reporting.",
    excerpt:
      "A connected CRM does more than store contacts. It keeps the same customer, contract, payment, address, and production job linked through every handoff.",
    publishedAt: "2026-10-05",
    displayDate: "October 5, 2026",
    readTime: "7 min read",
    category: "Workflow CRM",
    icon: "🔄",
    sections: [
      {
        heading: "The difference between a contact database and a workflow CRM",
        paragraphs: [
          "A contact database answers a useful but limited question: who is this customer? A connected workflow CRM must answer the next questions too. What did the customer request? Who owns the next action? Which estimate did they accept? What address is receiving the work? What has been paid? What materials were ordered? What remains before completion?",
          "Home improvement companies feel the gap quickly because the customer record moves across the office, call center, sales rep, production manager, supplier, installer, bookkeeper, and owner. When each team creates its own version of the job, the software may be organized while the operation is still fragmented.",
        ],
      },
      {
        heading: "One job should not restart at every department",
        paragraphs: [
          "The core idea is continuity. A prospect becomes an appointment without creating a new customer file. The appointment produces an estimate tied to the same customer and service address. Acceptance creates the sale and production record from the agreed scope rather than from someone’s memory of it.",
          "That same continuity should reach invoicing, payment status, materials, milestones, documents, expenses, and reporting. The system becomes more trustworthy because each downstream record has a visible source.",
        ],
        bullets: [
          "Lead details and source stay with the opportunity",
          "Estimate scope and photos stay with the contract",
          "The accepted contract becomes the production job",
          "Invoices and payments stay tied to the correct balance",
          "Materials and receipt costs stay tied to the site-specific job",
        ],
      },
      {
        heading: "Workflow customization is more important than a giant feature list",
        paragraphs: [
          "Two contractors can sell similar projects and still operate differently. One collects half at acceptance. Another waits for permit approval. One uses an internal measure stage. Another sends a supplier order immediately. Property-management work may require a billing parent plus dozens of service locations.",
          "A useful implementation maps the company’s stages, responsibilities, approvals, and payment milestones before automating them. The goal is not to force every company into one switchboard of generic statuses. The goal is to connect the process people are accountable for following.",
        ],
      },
      {
        heading: "What owners should be able to see",
        paragraphs: [
          "A connected system should let an owner move from a company-level question to the supporting records. If sold revenue increased, which contracts created it? If collections changed, which payments arrived? If a margin looks wrong, which job expenses produced the number?",
          "That traceability is the practical value of connection. Dashboards become more than decoration because the underlying estimate, invoice, payment, job, and receipt can still be followed.",
        ],
      },
      {
        heading: "A simple test for your current system",
        paragraphs: [
          "Choose one active job and try to follow it from the original inquiry to its current production stage. Count how many times the customer, address, scope, price, or payment information had to be retyped. Then ask whether a new employee could identify the next action without opening a separate inbox, spreadsheet, or group text.",
          "Every manual handoff is not automatically bad. But every handoff should be deliberate. A connected workflow CRM removes the handoffs that exist only because the systems do not share the same job.",
        ],
      },
    ],
    faq: [
      {
        question: "What does a workflow CRM do for contractors?",
        answer:
          "It connects customer acquisition, sales, documents, payments, materials, production, and reporting so the same job can move forward without repeated entry or disconnected records.",
      },
      {
        question: "Does every contractor need the same workflow?",
        answer:
          "No. The connected foundation can remain consistent while stages, approvals, responsibilities, payment milestones, and production steps are configured for the individual company.",
      },
    ],
  },
  {
    slug: "track-job-costs-receipts-by-job-site",
    title: "How to Track Job Costs and Receipts by the Actual Job Site",
    seoTitle: "Track Construction Receipts and Job Costs by Job Site | LeadFlow",
    description:
      "A practical guide to connecting supplier receipts and material expenses to the correct construction job, service location, profit, and margin.",
    excerpt:
      "A receipt is useful for profitability only when it reaches the production job and site that actually consumed the material.",
    publishedAt: "2026-10-05",
    displayDate: "October 5, 2026",
    readTime: "6 min read",
    category: "Job Costing",
    icon: "🧾",
    sections: [
      {
        heading: "The receipt is not the expense record by itself",
        paragraphs: [
          "A supplier receipt proves that money was spent. It does not automatically prove which job should absorb the cost. The same company card may purchase materials for several projects in one week, and a property-management customer may have several active addresses at once.",
          "For job profitability, the important connection is receipt to production job—not merely receipt to customer account or vendor. The production job carries the contract value, service location, and operational context needed to calculate a meaningful margin.",
        ],
      },
      {
        heading: "Use a job identifier at the time of purchase",
        paragraphs: [
          "The cleanest workflow begins before parsing. The purchaser enters a recognizable job address, project name, or unit number in the supplier’s PO or job-name field. That identifier travels with the electronic receipt and gives the system something reliable to match.",
          "A broad property name may still be ambiguous. If a complex contains several units, include the unit. If one management company controls several properties, use the actual service location—not just the parent company name.",
        ],
        bullets: [
          "Prefer a unique service address or internal job number",
          "Include a unit number when several jobs share one property name",
          "Avoid old saved PO labels that no longer represent active work",
          "Require review when more than one production job matches",
        ],
      },
      {
        heading: "Automate the certain matches and review the exceptions",
        paragraphs: [
          "Automation should be conservative. If one exact production job matches the receipt label, the system can create a material expense and attach the original PDF. If the label is missing, fuzzy, or points to several jobs, the receipt should stop in a review inbox.",
          "That is not a failure of automation. It is the control that keeps one job’s costs from silently changing another job’s profit. The office resolves the small exception set instead of manually entering every receipt.",
        ],
      },
      {
        heading: "Prevent duplicates before they reach profitability",
        paragraphs: [
          "Email exports, forwarding rules, and supplier systems can produce duplicate copies. A safe importer checks several signals: message identifier, supplier order number, original filename, file hash, purchase date, amount, and existing job expense.",
          "A receipt should be idempotent: processing the same source twice produces one expense, not two. The original attachment should remain available so an owner can verify the figure later.",
        ],
      },
      {
        heading: "Profitability becomes traceable",
        paragraphs: [
          "Once the expense is attached to the correct production job, the math is simple: contract revenue minus recorded costs equals current job profit. Profit divided by contract revenue produces current margin.",
          "The value is not the formula. The value is being able to click from the margin back to the receipt, date, vendor, items, and job address that created the cost.",
        ],
      },
    ],
    faq: [
      {
        question: "Should a receipt be attached to a property-management parent account?",
        answer:
          "No. The parent account may receive billing, but a material receipt should attach to the site-specific production job so the correct property’s costs and margin are calculated.",
      },
      {
        question: "What happens when a receipt has no job identifier?",
        answer:
          "It should remain in a review queue until someone identifies the job. Guessing can corrupt job profitability and is worse than delaying the expense entry.",
      },
    ],
  },
  {
    slug: "property-management-billing-service-locations-crm",
    title: "How a CRM Should Handle Property-Management Billing and Service Locations",
    seoTitle: "Property Management CRM: Parent Accounts and Service Locations | LeadFlow",
    description:
      "Learn how to separate a property-management billing account from individual properties, residents, units, jobs, invoices, and expenses.",
    excerpt:
      "The company paying the invoice and the property receiving the work are often different records. A CRM should preserve both without duplicating the customer.",
    publishedAt: "2026-10-05",
    displayDate: "October 5, 2026",
    readTime: "7 min read",
    category: "Service Locations",
    icon: "🏢",
    sections: [
      {
        heading: "One account can represent many physical job sites",
        paragraphs: [
          "A property-management company may approve work, receive invoices, and maintain the business relationship while the actual work occurs at an apartment, community, motel, commercial building, or resident address.",
          "Treating every site as an unrelated customer creates duplicates. Treating every site as the parent’s office address destroys job-level accuracy. The CRM needs a parent billing account and reusable service locations beneath it.",
        ],
      },
      {
        heading: "What belongs on the parent account",
        paragraphs: [
          "The parent should hold the management company’s name, billing contact, billing address, email, phone, account-level notes, and standing commercial terms. It is the relationship and billing identity—not a substitute for the work location.",
        ],
        bullets: [
          "Management-company identity and billing contact",
          "Primary billing address and communication preferences",
          "Account-level agreement or standing contract context",
          "Authorized users and overall relationship notes",
        ],
      },
      {
        heading: "What belongs on the service location",
        paragraphs: [
          "Each service location should preserve the property or community name, street address, city, state, ZIP, unit, resident or site contact, access instructions, and location-specific notes. The location can be reused for future estimates and jobs without becoming another parent customer.",
          "When a unit matters, it must follow the estimate into the sale, production job, invoice, document, and expense record. Otherwise two jobs at one complex can reduce the wrong balance or absorb the wrong receipt.",
        ],
      },
      {
        heading: "Billing remains centralized while profitability stays local",
        paragraphs: [
          "The parent company can remain the invoice recipient while every contract and expense stays scoped to the individual site job. That separation supports consolidated relationships without mixing money between properties.",
          "A receipt for materials used at Blue Spruce Motel, for example, belongs to the Blue Spruce production job. It does not belong to the Green Springs Capital parent record merely because Green Springs controls billing.",
        ],
      },
      {
        heading: "Historical data needs careful restructuring",
        paragraphs: [
          "Older systems often contain each address as a separate customer because parent-account support did not exist. Migration should not blindly merge records. Create the true parent, create verified service locations, move current estimates and jobs deliberately, and preserve historical links until ownership is confirmed.",
          "The key rule is factual correction without changing unrelated money. Reassign the service location while preserving contract amount, invoice status, and payment history unless there is separate evidence those values are wrong.",
        ],
      },
    ],
    faq: [
      {
        question: "Should a property-management company be duplicated for every address?",
        answer:
          "No. Use one parent billing account with multiple service locations so the relationship remains centralized and each job retains the correct physical address.",
      },
      {
        question: "Can each property have separate estimates, invoices, and profit?",
        answer:
          "Yes. Each estimate, sale, production job, invoice, payment balance, and expense should remain scoped to the exact service location and job.",
      },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
