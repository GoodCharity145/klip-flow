import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";

const EFFECTIVE_DATE = "May 3, 2025";
const CONTACT_EMAIL = "privacy@clipflow.app";
const APP_NAME = "KlipFlow";

export default function Privacy() {
  return (
    <Layout>
      <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Effective: {EFFECTIVE_DATE}</p>

        <Card className="mb-8">
          <CardContent className="pt-6 prose prose-invert prose-sm max-w-none text-foreground">
            <p className="text-muted-foreground leading-relaxed mb-6">
              {APP_NAME} ("we", "our", or "us") is committed to protecting your privacy. This
              Privacy Policy explains how we collect, use, disclose, and safeguard your information
              when you use our mobile application and website (collectively, the "Service"). Please
              read this policy carefully. If you disagree with its terms, please discontinue use of
              the Service.
            </p>

            <Section title="1. Information We Collect">
              <SubSection title="Information you provide directly">
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Account information</strong> — name, email
                    address, and password when you register an account.
                  </li>
                  <li>
                    <strong className="text-foreground">Payment information</strong> — billing
                    address and payment card details. Payment data is processed directly by our
                    payment processor (Stripe, Inc.) and is not stored on our servers.
                  </li>
                  <li>
                    <strong className="text-foreground">User content</strong> — video files, audio
                    files, images, and project data you upload or create within the Service.
                  </li>
                  <li>
                    <strong className="text-foreground">Communications</strong> — messages you send
                    us via email or in-app support.
                  </li>
                </ul>
              </SubSection>

              <SubSection title="Information collected automatically">
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Usage data</strong> — pages visited,
                    features used, time spent in the app, and actions taken within the Service.
                  </li>
                  <li>
                    <strong className="text-foreground">Device information</strong> — device type,
                    operating system, browser type and version, unique device identifiers, and IP
                    address.
                  </li>
                  <li>
                    <strong className="text-foreground">Log data</strong> — server logs including
                    access timestamps, errors, and referring URLs.
                  </li>
                  <li>
                    <strong className="text-foreground">Cookies and similar technologies</strong> —
                    session tokens and preference cookies required to operate the Service. We do not
                    use advertising or tracking cookies.
                  </li>
                </ul>
              </SubSection>

              <SubSection title="Information from third parties">
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>
                    If you choose to sign in using a third-party account (e.g., Google, Apple,
                    GitHub), we receive basic profile information (name, email, profile picture)
                    from that provider in accordance with its privacy policy and your permissions.
                  </li>
                  <li>
                    Subscription status information from Stripe when you purchase or change a plan.
                  </li>
                </ul>
              </SubSection>
            </Section>

            <Section title="2. How We Use Your Information">
              <p className="text-muted-foreground mb-2">We use collected information to:</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Create and manage your account and authenticate you.</li>
                <li>Provide, operate, and improve the Service, including AI-powered features.</li>
                <li>Process payments and manage subscriptions.</li>
                <li>Send transactional emails (receipts, password resets, billing alerts).</li>
                <li>Respond to your inquiries and provide customer support.</li>
                <li>
                  Detect, investigate, and prevent fraud, abuse, and security incidents.
                </li>
                <li>
                  Comply with legal obligations and enforce our Terms of Service.
                </li>
                <li>
                  Analyze aggregate usage patterns (in anonymized form) to improve the Service.
                </li>
              </ul>
              <p className="text-muted-foreground mt-3">
                We do <strong className="text-foreground">not</strong> sell your personal
                information. We do not use your content to train AI models without your explicit
                consent.
              </p>
            </Section>

            <Section title="3. AI Features & Your Content">
              <p className="text-muted-foreground">
                The AI auto-caption feature sends audio data from your video to OpenAI's API for
                transcription. Audio data is transmitted securely and subject to{" "}
                <a
                  href="https://openai.com/policies/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  OpenAI's Privacy Policy
                </a>
                . We do not retain audio data after the transcription is complete. You may disable
                AI features at any time in Settings.
              </p>
            </Section>

            <Section title="4. Sharing Your Information">
              <p className="text-muted-foreground mb-2">
                We share information only in the following circumstances:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Service providers</strong> — trusted
                  third-party companies that help us operate the Service (see Section 5). They may
                  only process your data on our behalf per our instructions.
                </li>
                <li>
                  <strong className="text-foreground">Legal requirements</strong> — if required by
                  law, court order, or governmental authority.
                </li>
                <li>
                  <strong className="text-foreground">Business transfers</strong> — in connection
                  with a merger, acquisition, or sale of assets, with appropriate confidentiality
                  protections.
                </li>
                <li>
                  <strong className="text-foreground">With your consent</strong> — for any other
                  purpose with your explicit consent.
                </li>
              </ul>
            </Section>

            <Section title="5. Third-Party Service Providers">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-muted-foreground border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 text-foreground font-semibold">Provider</th>
                      <th className="text-left py-2 pr-4 text-foreground font-semibold">Purpose</th>
                      <th className="text-left py-2 text-foreground font-semibold">Privacy Policy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        name: "Clerk",
                        purpose: "Authentication & identity management",
                        url: "https://clerk.com/legal/privacy",
                      },
                      {
                        name: "Stripe",
                        purpose: "Payment processing & subscription management",
                        url: "https://stripe.com/privacy",
                      },
                      {
                        name: "OpenAI",
                        purpose: "AI transcription (auto-captions)",
                        url: "https://openai.com/policies/privacy-policy",
                      },
                      {
                        name: "Replit",
                        purpose: "Cloud infrastructure & hosting",
                        url: "https://replit.com/site/privacy",
                      },
                    ].map((p) => (
                      <tr key={p.name} className="border-b border-border/50">
                        <td className="py-2 pr-4 font-medium text-foreground">{p.name}</td>
                        <td className="py-2 pr-4">{p.purpose}</td>
                        <td className="py-2">
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline"
                          >
                            View
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="6. Data Retention">
              <p className="text-muted-foreground">
                We retain your personal information for as long as your account is active or as
                needed to provide you the Service. You may delete your account at any time from
                Settings &gt; Delete Account. Upon deletion, we will delete or anonymize your
                personal data within 30 days, except where we are required to retain it for legal
                or legitimate business purposes (e.g., financial records required by law). Uploaded
                media files are deleted immediately upon account deletion or when you manually
                remove them.
              </p>
            </Section>

            <Section title="7. Data Security">
              <p className="text-muted-foreground">
                We implement industry-standard security measures including TLS encryption in
                transit, AES-256 encryption at rest for sensitive data, access controls, and
                regular security reviews. However, no method of transmission over the internet is
                100% secure. We cannot guarantee absolute security and encourage you to use a
                strong, unique password and enable two-factor authentication.
              </p>
            </Section>

            <Section title="8. Your Rights & Choices">
              <p className="text-muted-foreground mb-2">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Access</strong> — request a copy of the
                  personal data we hold about you.
                </li>
                <li>
                  <strong className="text-foreground">Correction</strong> — request correction of
                  inaccurate personal data.
                </li>
                <li>
                  <strong className="text-foreground">Deletion</strong> — request deletion of your
                  personal data (subject to legal retention requirements).
                </li>
                <li>
                  <strong className="text-foreground">Portability</strong> — request your data in a
                  machine-readable format.
                </li>
                <li>
                  <strong className="text-foreground">Opt-out of marketing</strong> — unsubscribe
                  from marketing emails via the unsubscribe link in any email.
                </li>
                <li>
                  <strong className="text-foreground">California residents (CCPA)</strong> — you
                  have the right to know, delete, and opt out of the sale of personal information.
                  We do not sell personal information.
                </li>
              </ul>
              <p className="text-muted-foreground mt-3">
                To exercise any of these rights, contact us at{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">
                  {CONTACT_EMAIL}
                </a>
                . We will respond within 30 days.
              </p>
            </Section>

            <Section title="9. Children's Privacy">
              <p className="text-muted-foreground">
                The Service is not directed to children under the age of 13 (or under 16 in the
                European Economic Area). We do not knowingly collect personal information from
                children. If you believe a child has provided us with personal information, please
                contact us at{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">
                  {CONTACT_EMAIL}
                </a>{" "}
                and we will promptly delete such information.
              </p>
            </Section>

            <Section title="10. International Data Transfers">
              <p className="text-muted-foreground">
                We are based in the United States. If you access the Service from outside the
                United States, your data may be transferred to and processed in the United States,
                which may have different data protection laws than your country. By using the
                Service, you consent to such transfers. Where required, we rely on Standard
                Contractual Clauses (SCCs) or other approved mechanisms for cross-border transfers.
              </p>
            </Section>

            <Section title="11. Changes to This Policy">
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. When we make material
                changes, we will notify you by email (to the address on file) and/or by posting a
                prominent notice in the app at least 7 days before the changes take effect. Your
                continued use of the Service after the effective date constitutes acceptance of the
                updated policy. We encourage you to review this page periodically.
              </p>
            </Section>

            <Section title="12. Contact Us">
              <p className="text-muted-foreground">
                If you have questions, concerns, or requests regarding this Privacy Policy or our
                data practices, please contact our Privacy team:
              </p>
              <div className="mt-3 p-4 bg-muted/30 rounded-lg border border-border space-y-1">
                <p className="font-semibold text-foreground">{APP_NAME}</p>
                <p className="text-muted-foreground">
                  Email:{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">
                    {CONTACT_EMAIL}
                  </a>
                </p>
              </div>
            </Section>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border">
        {title}
      </h2>
      {children}
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
      {children}
    </div>
  );
}
