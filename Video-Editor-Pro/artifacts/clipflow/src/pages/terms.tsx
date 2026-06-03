import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";

const EFFECTIVE_DATE = "May 3, 2025";
const CONTACT_EMAIL = "legal@clipflow.app";
const APP_NAME = "KlipFlow";

export default function Terms() {
  return (
    <Layout>
      <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Effective: {EFFECTIVE_DATE}</p>

        <Card className="mb-8">
          <CardContent className="pt-6 prose prose-invert prose-sm max-w-none text-foreground">
            <p className="text-muted-foreground leading-relaxed mb-6">
              Please read these Terms of Service ("Terms") carefully before using {APP_NAME} (the
              "Service"), operated by {APP_NAME} ("we", "us", or "our"). By accessing or using the
              Service, you agree to be bound by these Terms. If you do not agree, do not use the
              Service.
            </p>

            <Section title="1. Eligibility">
              <p className="text-muted-foreground">
                You must be at least 13 years old (or 16 years old in the European Economic Area)
                to use the Service. By using the Service, you represent and warrant that you meet
                this age requirement. If you are under 18, you represent that a parent or legal
                guardian has reviewed and agreed to these Terms on your behalf.
              </p>
            </Section>

            <Section title="2. Your Account">
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>
                  You are responsible for maintaining the confidentiality of your account
                  credentials and for all activity that occurs under your account.
                </li>
                <li>
                  You must provide accurate, current, and complete information during registration
                  and keep it updated.
                </li>
                <li>
                  You must notify us immediately at{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">
                    {CONTACT_EMAIL}
                  </a>{" "}
                  if you suspect unauthorized access to your account.
                </li>
                <li>
                  We reserve the right to suspend or terminate accounts that violate these Terms.
                </li>
              </ul>
            </Section>

            <Section title="3. Subscriptions & Payments">
              <SubSection title="Plans">
                <p className="text-muted-foreground">
                  {APP_NAME} offers free and paid subscription plans (Creator at $2.99/month and
                  Pro at $7.99/month). Paid features are described on the Pricing page and are
                  subject to change with 30 days' notice.
                </p>
              </SubSection>
              <SubSection title="Billing">
                <p className="text-muted-foreground">
                  Subscriptions are billed monthly in advance. Payments are processed securely by
                  Stripe, Inc. By subscribing, you authorize us to charge your payment method on a
                  recurring basis until cancelled. All fees are in US dollars and are
                  non-refundable except as required by applicable law.
                </p>
              </SubSection>
              <SubSection title="Cancellation">
                <p className="text-muted-foreground">
                  You may cancel your subscription at any time from the Billing page. Cancellation
                  takes effect at the end of the current billing period; you will retain access to
                  paid features until then. We do not provide prorated refunds for partial billing
                  periods.
                </p>
              </SubSection>
              <SubSection title="Free Tier">
                <p className="text-muted-foreground">
                  The free tier is provided as-is with no guarantee of uptime or feature
                  availability. We reserve the right to modify or discontinue free tier features
                  at any time with reasonable notice.
                </p>
              </SubSection>
            </Section>

            <Section title="4. Acceptable Use">
              <p className="text-muted-foreground mb-3">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>
                  Upload, create, or distribute content that is illegal, infringing, defamatory,
                  obscene, harassing, threatening, or violates any third-party rights.
                </li>
                <li>
                  Upload content that contains malware, viruses, or any harmful code.
                </li>
                <li>
                  Attempt to gain unauthorized access to any part of the Service or its
                  infrastructure.
                </li>
                <li>
                  Use automated means (bots, scrapers, crawlers) to access the Service without
                  express written permission.
                </li>
                <li>
                  Reverse engineer, decompile, or disassemble any part of the Service.
                </li>
                <li>
                  Resell, sublicense, or commercially exploit the Service without authorization.
                </li>
                <li>
                  Violate any applicable local, national, or international law or regulation.
                </li>
              </ul>
              <p className="text-muted-foreground mt-3">
                We reserve the right to remove content and suspend or terminate accounts that
                violate these rules, without prior notice.
              </p>
            </Section>

            <Section title="5. Your Content">
              <p className="text-muted-foreground mb-3">
                You retain full ownership of all video files, audio, images, and other content
                you upload or create using the Service ("Your Content").
              </p>
              <p className="text-muted-foreground mb-3">
                By uploading Your Content, you grant {APP_NAME} a limited, non-exclusive,
                royalty-free license to store, process, and transmit Your Content solely for the
                purpose of providing the Service to you. We do not claim any ownership rights in
                Your Content.
              </p>
              <p className="text-muted-foreground">
                You represent and warrant that you own or have all necessary rights to Your
                Content, including the right to grant the license above, and that Your Content
                does not violate any third-party rights or applicable law.
              </p>
            </Section>

            <Section title="6. Intellectual Property">
              <p className="text-muted-foreground mb-3">
                The Service, including its design, code, features, and branding, is owned by{" "}
                {APP_NAME} and protected by intellectual property laws. These Terms do not grant
                you any right to use our trademarks, logos, or brand elements without prior
                written consent.
              </p>
              <p className="text-muted-foreground">
                If you provide feedback, suggestions, or ideas about the Service, you grant us an
                irrevocable, perpetual, royalty-free license to use such feedback without
                restriction or compensation.
              </p>
            </Section>

            <Section title="7. AI Features">
              <p className="text-muted-foreground">
                The AI auto-caption feature uses third-party AI services (OpenAI) to transcribe
                audio from your videos. Results may not be perfectly accurate. You are responsible
                for reviewing, correcting, and taking responsibility for all AI-generated content
                before publishing. {APP_NAME} makes no warranty regarding the accuracy of
                AI-generated outputs and is not liable for any errors, omissions, or
                consequences arising from their use.
              </p>
            </Section>

            <Section title="8. Third-Party Services">
              <p className="text-muted-foreground">
                The Service integrates with third-party services including Clerk (authentication),
                Stripe (payments), and OpenAI (AI features). Your use of those services is
                governed by their respective terms and privacy policies. We are not responsible
                for the content, practices, or availability of any third-party service.
              </p>
            </Section>

            <Section title="9. Disclaimer of Warranties">
              <p className="text-muted-foreground">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY
                KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF
                MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR
                UNINTERRUPTED, ERROR-FREE OPERATION. WE DO NOT WARRANT THAT THE SERVICE WILL
                MEET YOUR REQUIREMENTS OR THAT ANY CONTENT WILL BE SECURE, UNALTERED, OR
                AVAILABLE AT ANY PARTICULAR TIME.
              </p>
            </Section>

            <Section title="10. Limitation of Liability">
              <p className="text-muted-foreground">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, {APP_NAME.toUpperCase()} AND
                ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY
                INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING
                LOSS OF DATA, PROFITS, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH THESE
                TERMS OR THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR
                TOTAL LIABILITY TO YOU FOR ANY CLAIM SHALL NOT EXCEED THE GREATER OF (A) THE
                AMOUNT YOU PAID US IN THE 12 MONTHS PRIOR TO THE CLAIM OR (B) $10.
              </p>
            </Section>

            <Section title="11. Indemnification">
              <p className="text-muted-foreground">
                You agree to indemnify, defend, and hold harmless {APP_NAME} and its affiliates,
                officers, directors, employees, and agents from and against any claims,
                liabilities, damages, losses, and expenses (including reasonable attorneys'
                fees) arising out of or in any way connected with: (a) your access to or use of
                the Service; (b) Your Content; (c) your violation of these Terms; or (d) your
                violation of any third-party rights.
              </p>
            </Section>

            <Section title="12. Termination">
              <p className="text-muted-foreground mb-3">
                We may suspend or terminate your access to the Service at any time, with or
                without cause or notice, if we believe you have violated these Terms.
              </p>
              <p className="text-muted-foreground">
                You may terminate your account at any time by deleting it in Settings. Upon
                termination, your right to use the Service ceases immediately. Sections 5, 6, 9,
                10, 11, and 13 survive termination.
              </p>
            </Section>

            <Section title="13. Governing Law & Disputes">
              <p className="text-muted-foreground mb-3">
                These Terms are governed by the laws of the United States, without regard to
                conflict-of-law principles. You agree to resolve any dispute arising from these
                Terms or the Service through binding individual arbitration under the rules of
                the American Arbitration Association, except that either party may seek
                injunctive relief in a court of competent jurisdiction.
              </p>
              <p className="text-muted-foreground">
                You waive any right to participate in a class action lawsuit or class-wide
                arbitration.
              </p>
            </Section>

            <Section title="14. Changes to These Terms">
              <p className="text-muted-foreground">
                We may update these Terms at any time. When we make material changes, we will
                notify you by email and/or by posting a notice in the app at least 7 days before
                the changes take effect. Continued use of the Service after the effective date
                constitutes your acceptance of the revised Terms.
              </p>
            </Section>

            <Section title="15. Contact">
              <p className="text-muted-foreground">
                If you have questions about these Terms, please contact us:
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
