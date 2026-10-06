import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/LegalPage";
import { LEGAL_CONTACT_EMAIL, PRODUCT_NAME, PROVIDER_NAME } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service | LeadFlow",
  description: "Terms governing access to and use of the LeadFlow workflow CRM provided by JMB Business Solutions.",
  alternates: { canonical: "https://www.leadflowcrm.info/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      description={`These Terms govern access to and use of ${PRODUCT_NAME}, a workflow CRM product provided by ${PROVIDER_NAME}.`}
    >
      <LegalSection number="1" title="Agreement to these Terms">
        <p>
          These Terms of Service (the “Terms”) form a binding agreement between {PROVIDER_NAME} (“JMB,” “we,” “us,” or “our”) and the business or individual that creates, purchases, accesses, or uses a {PRODUCT_NAME} account (“Customer,” “you,” or “your”).
        </p>
        <p>
          By creating an account, accepting an invitation, signing an order or proposal that references {PRODUCT_NAME}, or using the service, you confirm that you have authority to bind the Customer and agree to these Terms and our Privacy Policy. If you do not agree, do not access or use the service.
        </p>
      </LegalSection>

      <LegalSection number="2" title="The LeadFlow service">
        <p>
          {PRODUCT_NAME} is a configurable, web-based workflow CRM for home improvement and service businesses. Depending on the Customer’s implementation, the service may support prospects, calls, appointments, estimates, signatures, invoices, payments, materials, production, expenses, documents, reporting, and integrations.
        </p>
        <p>
          Features, workflows, integrations, and implementation services vary by plan, proposal, configuration, and technical availability. A demonstration, trial, roadmap discussion, or custom request is not a guarantee that every function will be delivered in a particular form or by a particular date unless stated in a signed written agreement.
        </p>
      </LegalSection>

      <LegalSection number="3" title="Accounts and authorized users">
        <ul className="list-disc space-y-2 pl-5">
          <li>You must provide accurate account information and keep it current.</li>
          <li>You are responsible for selecting authorized users, assigning appropriate roles, and promptly deactivating access that is no longer needed.</li>
          <li>Each user must keep credentials confidential and may not share an account with an unauthorized person.</li>
          <li>You must notify us promptly at {LEGAL_CONTACT_EMAIL} if you suspect unauthorized access or misuse.</li>
          <li>You are responsible for activity performed through your account unless caused by our breach of these Terms.</li>
        </ul>
      </LegalSection>

      <LegalSection number="4" title="Customer Data and confidentiality">
        <p>
          “Customer Data” means information, content, files, records, and materials submitted to or generated for the Customer through {PRODUCT_NAME}, including customer, prospect, employee, job, estimate, invoice, payment, production, and expense information.
        </p>
        <p>
          As between the parties, the Customer retains ownership of Customer Data. The Customer grants us a limited right to host, copy, process, transmit, display, and otherwise use Customer Data only as reasonably necessary to provide, secure, maintain, support, improve, or comply with law regarding the service.
        </p>
        <p>
          Each party will use reasonable care to protect the other party’s nonpublic confidential information and will use it only for the relationship described by these Terms. This obligation does not apply to information that is public through no breach, independently developed, lawfully received from another source, or required to be disclosed by law.
        </p>
      </LegalSection>

      <LegalSection number="5" title="Customer responsibilities">
        <p>You are responsible for:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Having a lawful basis to collect, use, upload, and communicate Customer Data;</li>
          <li>Providing required notices and obtaining required permissions from customers, employees, and other individuals;</li>
          <li>Reviewing estimates, contracts, invoices, messages, payment records, tax treatment, and accounting entries before relying on them;</li>
          <li>Maintaining appropriate independent business, tax, legal, safety, employment, and accounting procedures;</li>
          <li>Verifying imported or migrated information and correcting inaccurate historical records; and</li>
          <li>Using the service in compliance with applicable law and your agreements with third parties.</li>
        </ul>
        <p>
          {PRODUCT_NAME} is an operational software tool. It does not provide legal, tax, accounting, employment, financing, construction, safety, or insurance advice.
        </p>
      </LegalSection>

      <LegalSection number="6" title="Acceptable use">
        <p>You may not, and may not permit another person to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Use the service unlawfully, deceptively, abusively, or to violate another person’s rights;</li>
          <li>Upload malware or attempt to disrupt, probe, overload, or bypass service security;</li>
          <li>Access another customer’s workspace or data without authorization;</li>
          <li>Reverse engineer, copy, resell, sublicense, or create a competing product from protected portions of the service except where law expressly permits;</li>
          <li>Use automated extraction or scraping in a manner that burdens the service or circumvents provided export methods; or</li>
          <li>Send spam or communications that violate consent, telemarketing, email, or messaging laws.</li>
        </ul>
      </LegalSection>

      <LegalSection number="7" title="Intellectual property and implementation work">
        <p>
          {PROVIDER_NAME} and its licensors retain all rights in {PRODUCT_NAME}, including its software, source code, architecture, design, interfaces, documentation, branding, generalized workflows, templates, improvements, and know-how. No ownership interest in the product is transferred to the Customer.
        </p>
        <p>
          Customer-specific data, logos, documents, and original content remain the Customer’s property. Configuration, migration, training, and implementation services do not transfer ownership of the underlying platform, reusable components, generalized methods, or future improvements unless a signed writing expressly states otherwise.
        </p>
        <p>
          Feedback and feature suggestions may be used to improve the service without payment or restriction, provided we do not disclose Customer confidential information or represent Customer Data as our own.
        </p>
      </LegalSection>

      <LegalSection number="8" title="Fees, subscriptions, and taxes">
        <p>
          Subscription fees, setup or implementation fees, included users, usage limits, and payment terms are stated on the applicable pricing page, order, proposal, or signed agreement. Unless otherwise stated, subscriptions are billed in advance and continue month to month until canceled.
        </p>
        <p>
          Fees are nonrefundable except where required by law or expressly stated in a signed agreement. The Customer is responsible for applicable sales, use, or similar taxes, excluding taxes based on our net income. We may suspend service for overdue undisputed amounts after reasonable notice.
        </p>
      </LegalSection>

      <LegalSection number="9" title="Third-party services and integrations">
        <p>
          The service may connect to payment processors, accounting platforms, email or messaging providers, hosting services, analytics tools, or other third parties. Those services are governed by their own terms and privacy practices. We are not responsible for a third party’s acts, availability, security, pricing, policy changes, or decision to restrict an integration.
        </p>
        <p>
          You authorize us to exchange Customer Data with a connected third-party service as necessary to perform the integration you enable. You are responsible for maintaining valid third-party accounts and permissions.
        </p>
      </LegalSection>

      <LegalSection number="10" title="Service availability, changes, and support">
        <p>
          We use commercially reasonable efforts to provide and secure the service, but continuous or error-free operation is not guaranteed. Maintenance, updates, internet failures, third-party outages, emergencies, and events outside reasonable control may interrupt access.
        </p>
        <p>
          We may modify the service to improve security, usability, compliance, or functionality. We will not intentionally remove a material paid capability during a current billing period without reasonable notice or a substantially similar alternative, except where required for security, law, or third-party platform changes.
        </p>
      </LegalSection>

      <LegalSection number="11" title="Cancellation, suspension, and termination">
        <p>
          Either party may end a month-to-month subscription effective at the end of the current paid period by providing notice through the available account or contact channel. A signed order may include different timing.
        </p>
        <p>
          We may suspend or terminate access for material breach, unlawful use, security risk, nonpayment, or conduct that threatens the service or other users. When reasonably possible, we will provide notice and an opportunity to cure.
        </p>
        <p>
          Upon request made before termination or within a reasonable period afterward, we will provide a commercially reasonable export of available Customer Data in a commonly usable format. We may delete Customer Data after the applicable retention period, subject to legal, backup, fraud-prevention, and accounting obligations.
        </p>
      </LegalSection>

      <LegalSection number="12" title="Disclaimers">
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICE AND ALL RELATED IMPLEMENTATION, SUPPORT, AND CONTENT ARE PROVIDED “AS IS” AND “AS AVAILABLE.” WE DISCLAIM IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, AND ANY WARRANTY ARISING FROM COURSE OF DEALING OR USAGE OF TRADE.
        </p>
        <p>
          We do not guarantee any particular revenue, profit, lead volume, close rate, ranking, payment result, operational result, or business outcome. The Customer remains responsible for business decisions and review of records generated through the service.
        </p>
      </LegalSection>

      <LegalSection number="13" title="Limitation of liability">
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEITHER PARTY WILL BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, PUNITIVE, OR CONSEQUENTIAL DAMAGES, OR FOR LOST PROFITS, LOST REVENUE, LOST BUSINESS, LOSS OF GOODWILL, OR LOSS OR CORRUPTION OF DATA, EVEN IF ADVISED THAT SUCH DAMAGES ARE POSSIBLE.
        </p>
        <p>
          EXCEPT FOR PAYMENT OBLIGATIONS, FRAUD, WILLFUL MISCONDUCT, INFRINGEMENT OR MISAPPROPRIATION OF THE OTHER PARTY’S INTELLECTUAL PROPERTY, OR LIABILITY THAT CANNOT LEGALLY BE LIMITED, EACH PARTY’S TOTAL LIABILITY ARISING FROM THE SERVICE WILL NOT EXCEED THE FEES PAID OR PAYABLE FOR {PRODUCT_NAME} DURING THE SIX MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM.
        </p>
      </LegalSection>

      <LegalSection number="14" title="Indemnification">
        <p>
          The Customer will defend and indemnify {PROVIDER_NAME} from third-party claims, damages, penalties, and reasonable costs arising from Customer Data, the Customer’s unlawful use of the service, or the Customer’s breach of Sections 4 through 6. We will promptly notify the Customer and reasonably cooperate, and the Customer may control the defense so long as no settlement admits our fault or imposes obligations on us without consent.
        </p>
      </LegalSection>

      <LegalSection number="15" title="Governing law and disputes">
        <p>
          These Terms are governed by the laws of the State of New York, without regard to conflict-of-law principles. Before filing a claim, each party agrees to provide written notice and attempt in good faith for at least 30 days to resolve the dispute informally. Courts with lawful jurisdiction in New York will have jurisdiction over unresolved disputes, except that either party may seek immediate injunctive relief for misuse of intellectual property, confidential information, or unauthorized access.
        </p>
      </LegalSection>

      <LegalSection number="16" title="Changes and general terms">
        <p>
          We may update these Terms as the service or law changes. We will post the revised version and update the effective date. If a change materially reduces Customer rights, we will provide reasonable additional notice. Continued use after the effective date constitutes acceptance where permitted by law.
        </p>
        <p>
          These Terms, together with an applicable order, proposal, privacy policy, and signed agreement, are the entire agreement regarding the service. A signed agreement controls if it expressly conflicts with these Terms. Neither party may assign the agreement without the other’s consent, except in connection with a merger, acquisition, reorganization, or sale of substantially all relevant assets. If one provision is unenforceable, the remaining provisions remain effective. Failure to enforce a provision is not a waiver.
        </p>
      </LegalSection>

      <LegalSection number="17" title="Contact">
        <p>
          Questions or legal notices concerning these Terms may be sent to <a className="font-semibold text-orange-400 hover:underline" href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
