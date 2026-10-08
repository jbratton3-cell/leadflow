import { createPublicMetadata } from "@/lib/public-metadata";
import { LegalPage, LegalSection } from "@/components/LegalPage";
import { LEGAL_CONTACT_EMAIL, PRODUCT_NAME, PROVIDER_NAME } from "@/lib/legal";

export const metadata = createPublicMetadata({
  title: "Cookie Policy | LeadFlow",
  description: "How LeadFlow uses essential cookies and similar technologies for authentication, security, and website operation.",
  path: "/cookies",
  type: "website",
});

export default function CookiePolicyPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      description={`This Policy explains how ${PROVIDER_NAME} uses cookies and similar technologies on the ${PRODUCT_NAME} website and CRM.`}
    >
      <LegalSection number="1" title="What cookies are">
        <p>
          Cookies are small text files stored by a browser when you visit a website. Similar technologies include local storage, service workers, pixels, and other tools that remember information or help a site function, remain secure, or understand performance.
        </p>
      </LegalSection>

      <LegalSection number="2" title="Cookies LeadFlow currently uses">
        <p>
          {PRODUCT_NAME} currently uses essential technologies needed to provide and secure the service. These may include:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="px-3 py-2">Technology</th>
                <th className="px-3 py-2">Purpose</th>
                <th className="px-3 py-2">Typical duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr>
                <td className="px-3 py-3 font-semibold text-white">Session cookie</td>
                <td className="px-3 py-3">Keeps an authenticated user signed in and connects requests to the correct secure session.</td>
                <td className="px-3 py-3">Up to 7 days, or until logout, password reset, or invalidation</td>
              </tr>
              <tr>
                <td className="px-3 py-3 font-semibold text-white">Security and request state</td>
                <td className="px-3 py-3">Supports fraud prevention, form security, application routing, and reliable service operation.</td>
                <td className="px-3 py-3">Session or short-lived</td>
              </tr>
              <tr>
                <td className="px-3 py-3 font-semibold text-white">Local application storage</td>
                <td className="px-3 py-3">May remember interface state or support the installable web-app and service-worker experience.</td>
                <td className="px-3 py-3">Until cleared by the browser or replaced by the application</td>
              </tr>
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection number="3" title="Analytics and advertising">
        <p>
          We do not currently use third-party advertising cookies or cross-site behavioral advertising cookies on the public LeadFlow website. If analytics or advertising technologies are added later, this Policy will be updated and any consent or opt-out controls required by law will be provided before those nonessential technologies are used.
        </p>
      </LegalSection>

      <LegalSection number="4" title="Third-party services">
        <p>
          Links or integrations with payment processors, accounting providers, embedded media, or other third parties may cause that third party to set or read its own cookies on its own pages or services. For example, a payment provider may use cookies for login, fraud prevention, or checkout. Those cookies are controlled by the third party and governed by its policy.
        </p>
      </LegalSection>

      <LegalSection number="5" title="How to control cookies">
        <p>
          Most browsers let you inspect, block, or delete cookies and site storage. Browser help settings explain the available controls. Blocking essential cookies may prevent you from signing in, remaining signed in, completing secure forms, or using parts of the CRM.
        </p>
        <p>
          Because the current LeadFlow cookies are used for requested service and security functions rather than advertising, disabling them may make the service unavailable rather than simply changing personalization.
        </p>
      </LegalSection>

      <LegalSection number="6" title="Do Not Track and browser signals">
        <p>
          Browsers may transmit “Do Not Track,” Global Privacy Control, or similar signals. Because LeadFlow does not currently sell personal information or use cross-site advertising cookies, these signals do not change advertising behavior on the site. We will honor legally required signals if relevant practices change.
        </p>
      </LegalSection>

      <LegalSection number="7" title="Changes and contact">
        <p>
          We may update this Cookie Policy as technologies or legal requirements change. The effective date above identifies the current version. Questions may be sent to <a className="font-semibold text-orange-400 hover:underline" href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
