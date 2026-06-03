import { logger } from "./logger";

const FROM_ADDRESS = "KlipFlow <notifications@video-editor-pro--ob1billion.replit.app>";
const APP_URL = "https://video-editor-pro--ob1billion.replit.app";

function getResendApiKey(): string | undefined {
  return process.env.RESEND_API_KEY;
}

async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    logger.warn("RESEND_API_KEY not set — skipping email notification");
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    logger.error({ status: res.status, body }, "Resend email failed");
    throw new Error(`Resend error ${res.status}: ${body}`);
  }

  logger.info({ to: opts.to, subject: opts.subject }, "Email sent");
}

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; padding: 0; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; color: #f1f1f1; }
    .container { max-width: 560px; margin: 40px auto; background: #141414; border: 1px solid #2a2a2a; border-radius: 16px; overflow: hidden; }
    .header { background: #0a0a0a; padding: 28px 36px; border-bottom: 1px solid #2a2a2a; display: flex; align-items: center; gap: 12px; }
    .logo { background: rgba(229,53,53,0.12); border: 1px solid rgba(229,53,53,0.2); border-radius: 8px; width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; font-weight: 900; font-size: 13px; color: #E53535; letter-spacing: -0.5px; }
    .brand { font-size: 18px; font-weight: 700; color: #f1f1f1; }
    .body { padding: 36px; }
    .title { font-size: 22px; font-weight: 700; margin: 0 0 12px; color: #f1f1f1; }
    .text { font-size: 15px; line-height: 1.6; color: #a1a1a1; margin: 0 0 20px; }
    .btn { display: inline-block; background: #E53535; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 15px; }
    .divider { border: none; border-top: 1px solid #2a2a2a; margin: 28px 0; }
    .footer { font-size: 13px; color: #555; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">KF</div>
      <span class="brand">KlipFlow</span>
    </div>
    <div class="body">
      ${content}
      <hr class="divider" />
      <p class="footer">You're receiving this because you have a KlipFlow account. Questions? Reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export async function sendPaymentFailedEmail(opts: {
  to: string;
  name?: string;
}): Promise<void> {
  const greeting = opts.name ? `Hi ${opts.name},` : "Hi there,";
  const html = baseTemplate(`
    <p class="title">Payment failed</p>
    <p class="text">${greeting}</p>
    <p class="text">
      We weren't able to process your latest KlipFlow payment. This can happen when a card expires or has insufficient funds.
      Your subscription is still active for now, but please update your payment method to avoid any interruption.
    </p>
    <a class="btn" href="${APP_URL}/billing">Update payment method</a>
    <p class="text" style="margin-top:20px;">
      If you've already resolved this, you can ignore this message — we'll retry automatically.
    </p>
  `);

  await sendEmail({
    to: opts.to,
    subject: "Action needed: KlipFlow payment failed",
    html,
  });
}

export async function sendSubscriptionCancelledEmail(opts: {
  to: string;
  name?: string;
}): Promise<void> {
  const greeting = opts.name ? `Hi ${opts.name},` : "Hi there,";
  const html = baseTemplate(`
    <p class="title">Your subscription has ended</p>
    <p class="text">${greeting}</p>
    <p class="text">
      Your KlipFlow subscription has been cancelled and your account has been moved to the free plan.
      Your projects and videos are safe — you can still access them any time.
    </p>
    <a class="btn" href="${APP_URL}/pricing">Resubscribe</a>
    <p class="text" style="margin-top:20px;">
      We'd love to have you back. If there's anything we can improve, just reply to this email.
    </p>
  `);

  await sendEmail({
    to: opts.to,
    subject: "Your KlipFlow subscription has ended",
    html,
  });
}
