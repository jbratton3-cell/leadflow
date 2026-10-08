import { createPublicMetadata } from "@/lib/public-metadata";
import { LegalPage, LegalSection } from "@/components/LegalPage";
import { LEGAL_CONTACT_EMAIL, PRODUCT_NAME, PROVIDER_NAME } from "@/lib/legal";

export const metadata = createPublicMetadata({
  title: "Privacy Policy | LeadFlow",
  description: "How LeadFlow and JMB Business Solutions collect, use, protect, and share personal information and customer CRM data.",
  path: "/privacy",
  type: "website",
});

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      description={`This Policy explains how ${PROVIDER_NAME} handles information through the ${PRODUCT_NAME} website, CRM, communications, and related services.`}
    >
      <LegalSection number="1" title="Scope and roles">
        <p>
          This Privacy Policy applies to the public website, trial and paid {PRODUCT_NAME} workspaces, product support, sales communications, and related services operated by {PROVIDER_NAME} (“JMB,” “we,” “us,” or “our”).
        </p>
        <p>
          For account, website, sales, billing, and direct support information, JMB generally determines why and how the information is processed. For personal information a business customer places in its CRM workspace about its own prospects, customers, employees, contractors, or vendors, that business customer generally controls the information and JMB processes it to provide the service.
        </p>
        <p>
          If your information appears in a Customer’s LeadFlow workspace, direct requests about that business record to the Customer first. We will reasonably support the Customer in responding where required.
        </p>
      </LegalSection>

      <LegalSection number="2" title="Information we collect">
        <h3 className="font-bold text-white">Information you provide directly</h3>
        <ul className="list-disc space-y-2 pl-5">
          <li>Account details such as name, company, email, phone, role, and authentication information;</li>
          <li>Contact, demo, onboarding, support, and other communications;</li>
          <li>Subscription, transaction, and billing records;</li>
          <li>Configuration instructions, files, feedback, and implementation materials; and</li>
          <li>Customer Data entered, imported, uploaded, generated, or connected through the CRM.</li>
        </ul>
        <h3 className="pt-2 font-bold text-white">Information collected automatically</h3>
        <ul className="list-disc space-y-2 pl-5">
          <li>Device, browser, IP address, timestamps, requested pages, referral information, and diagnostic logs;</li>
          <li>Account activity, feature usage, security events, and error information; and</li>
          <li>Cookies and similar technologies described in our Cookie Policy.</li>
        </ul>
        <h3 className="pt-2 font-bold text-white">Information from connected services</h3>
        <p>
          If you connect an email, payment, accounting, messaging, hosting, analytics, or other third-party service, we may receive identifiers, status information, transaction records, and other data necessary to perform the requested integration.
        </p>
      </LegalSection>

      <LegalSection number="3" title="How we use information">
        <p>We use information to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Create, authenticate, administer, and secure accounts and workspaces;</li>
          <li>Provide, configure, support, maintain, troubleshoot, and improve {PRODUCT_NAME};</li>
          <li>Process estimates, documents, invoices, payment status, messages, integrations, and other Customer-directed workflows;</li>
          <li>Deliver service, security, legal, billing, onboarding, and support communications;</li>
          <li>Prevent fraud, abuse, unauthorized access, and technical harm;</li>
          <li>Analyze service reliability and product usage in aggregated or de-identified form;</li>
          <li>Comply with law, enforce agreements, and protect rights and safety; and</li>
          <li>Market our services where permitted, subject to available opt-out rights.</li>
        </ul>
        <p>
          We do not use one Customer’s confidential CRM records to market another company’s products or to build contact lists for unrelated third parties.
        </p>
      </LegalSection>

      <LegalSection number="4" title="How we share information">
        <p>We may share information in the following limited circumstances:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong className="text-white">Service providers:</strong> hosting, database, email, messaging, payment, security, analytics, support, and professional service providers that process information for us under appropriate obligations;</li>
          <li><strong className="text-white">Customer-authorized integrations:</strong> services the Customer chooses to connect, such as accounting or payment providers;</li>
          <li><strong className="text-white">Customer administrators:</strong> workspace owners and authorized administrators who manage users and records;</li>
          <li><strong className="text-white">Legal and safety:</strong> when reasonably necessary to comply with law, lawful process, enforce agreements, investigate fraud, or protect rights and safety;</li>
          <li><strong className="text-white">Business transactions:</strong> in connection with a merger, financing, acquisition, reorganization, or sale of relevant assets, subject to customary safeguards; and</li>
          <li><strong className="text-white">With direction or consent:</strong> when the Customer or individual asks us to share information.</li>
        </ul>
        <p>
          We do not sell personal information for money. We do not share personal information for cross-context behavioral advertising as those terms are commonly defined, unless this Policy is updated and legally required choices are provided.
        </p>
      </LegalSection>

      <LegalSection number="5" title="Payment information">
        <p>
          Payment card, bank, PayPal, and similar payment details may be collected and processed directly by a payment provider. We generally receive transaction identifiers, amount, status, payer details, and fee information rather than complete card or bank credentials. The provider’s own privacy policy governs its processing.
        </p>
      </LegalSection>

      <LegalSection number="6" title="Data retention">
        <p>
          We retain information for as long as reasonably necessary to provide the service, maintain business and security records, comply with legal and accounting obligations, resolve disputes, and enforce agreements. Retention depends on the type of information, Customer instructions, account status, legal requirements, and backup cycles.
        </p>
        <p>
          After account termination, Customer Data may remain for a limited period to support export, recovery, fraud prevention, legal compliance, and secure backup rotation. We may retain aggregated or de-identified information that no longer reasonably identifies an individual or Customer.
        </p>
      </LegalSection>

      <LegalSection number="7" title="Security">
        <p>
          We use reasonable administrative, technical, and organizational safeguards designed to protect information, including access controls, scoped user roles, secure hosting, session controls, encrypted transport, and security monitoring where appropriate.
        </p>
        <p>
          No service can guarantee absolute security. Customers are responsible for protecting credentials, managing authorized users, securing connected services, and notifying us promptly of suspected unauthorized access.
        </p>
      </LegalSection>

      <LegalSection number="8" title="Your choices and rights">
        <p>Depending on where you live and applicable law, you may have rights to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Request access to, correction of, or deletion of personal information;</li>
          <li>Receive a portable copy of certain information;</li>
          <li>Object to or restrict certain processing;</li>
          <li>Withdraw consent where processing relies on consent; and</li>
          <li>Appeal or complain to an applicable privacy authority.</li>
        </ul>
        <p>
          To exercise rights concerning information controlled directly by JMB, email {LEGAL_CONTACT_EMAIL}. We may verify your identity and authority before responding. If the information belongs to a Customer workspace, we may direct the request to that Customer.
        </p>
        <p>
          You may unsubscribe from nonessential marketing email using the message link or by contacting us. You will continue to receive necessary account, security, billing, and service communications.
        </p>
      </LegalSection>

      <LegalSection number="9" title="Cookies and browser choices">
        <p>
          We use cookies and similar technologies as described in our Cookie Policy. Essential cookies support authentication, security, and service operation. You can control cookies through browser settings, but blocking essential cookies may prevent login or other functions.
        </p>
      </LegalSection>

      <LegalSection number="10" title="Children">
        <p>
          {PRODUCT_NAME} is a business service and is not directed to children under 13. We do not knowingly collect personal information directly from children under 13 through the public website. If you believe a child has provided information improperly, contact us so we can investigate.
        </p>
      </LegalSection>

      <LegalSection number="11" title="United States processing">
        <p>
          JMB operates from the United States, and service providers may process information in the United States or other locations. Where required, appropriate contractual or legal mechanisms may be used for international transfers.
        </p>
      </LegalSection>

      <LegalSection number="12" title="Third-party links and services">
        <p>
          Our website and service may link to or integrate with third-party services. Their privacy policies and security practices apply to their processing. Review those policies before enabling or using an integration.
        </p>
      </LegalSection>

      <LegalSection number="13" title="Changes to this Policy">
        <p>
          We may update this Privacy Policy as the service, technology, or law changes. We will post the revised version and update the effective date. If a change materially affects how we use personal information, we will provide additional notice where required.
        </p>
      </LegalSection>

      <LegalSection number="14" title="Contact">
        <p>
          Questions, requests, or concerns about this Privacy Policy may be sent to <a className="font-semibold text-orange-400 hover:underline" href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
