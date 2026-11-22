import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { getEnv } from "./env";
import { prisma } from "./prisma";
import { formatRupees } from "./pricing";

let cachedSes: SESClient | null = null;

function getSesClient(): SESClient {
  if (cachedSes) return cachedSes;
  const env = getEnv();
  cachedSes = new SESClient({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });
  return cachedSes;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapLayout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#fbf5e6;font-family:Arial,Helvetica,sans-serif;color:#2a1a14;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e1d9;">
        <tr><td style="background:#24150f;padding:20px 28px;color:#e0a526;font-size:20px;font-weight:bold;">Shatrunjay Ghee</td></tr>
        <tr><td style="padding:28px;font-size:15px;line-height:1.6;">${bodyHtml}</td></tr>
        <tr><td style="background:#f5f4f1;padding:16px 28px;font-size:12px;color:#6f625a;">
          Shatrunjay Foodstuffs Private Limited &bull; Mumbai, India<br/>
          Pure Ghee &amp; Timely Delivery
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendWithRetry(params: {
  toEmail: string;
  subject: string;
  html: string;
  templateName: string;
  replyTo?: string;
}): Promise<void> {
  const log = await prisma.emailLog.create({
    data: {
      toEmail: params.toEmail,
      subject: params.subject,
      templateName: params.templateName,
      status: "QUEUED",
      attempts: 0,
    },
  });

  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const env = getEnv();
      await getSesClient().send(
        new SendEmailCommand({
          Source: env.SES_FROM_EMAIL,
          Destination: { ToAddresses: [params.toEmail] },
          ReplyToAddresses: params.replyTo ? [params.replyTo] : undefined,
          Message: {
            Subject: { Data: params.subject, Charset: "UTF-8" },
            Body: { Html: { Data: params.html, Charset: "UTF-8" } },
          },
        })
      );
      await prisma.emailLog.update({
        where: { id: log.id },
        data: { status: "SENT", attempts: attempt },
      });
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown SES error";
      await prisma.emailLog.update({
        where: { id: log.id },
        data: {
          status: attempt === maxAttempts ? "FAILED" : "QUEUED",
          attempts: attempt,
          lastError: message.slice(0, 500),
        },
      });
      if (attempt === maxAttempts) {
        console.error(`[emailService] Failed sending ${params.templateName} to ${params.toEmail}:`, message);
      }
    }
  }
}

export const emailService = {
  async sendVerificationEmail(toEmail: string, name: string, verifyUrl: string) {
    const html = wrapLayout(
      "Verify your email - Shatrunjay Ghee",
      `<h2 style="margin-top:0;color:#24150f;">Welcome to Shatrunjay Ghee, ${escapeHtml(name)}</h2>
       <p>Please verify your email address to activate your account and place orders.</p>
       <p style="margin:24px 0;"><a href="${escapeHtml(verifyUrl)}" style="background:#8b0000;color:#ffffff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:bold;">Verify Email Address</a></p>
       <p style="font-size:13px;color:#6f625a;">This link expires in 24 hours. If you did not create this account, you can safely ignore this email.</p>`
    );
    await sendWithRetry({
      toEmail,
      subject: "Verify your email - Shatrunjay Ghee",
      html,
      templateName: "email_verification",
    });
  },

  async sendPasswordResetEmail(toEmail: string, name: string, resetUrl: string) {
    const html = wrapLayout(
      "Reset your password - Shatrunjay Ghee",
      `<h2 style="margin-top:0;color:#24150f;">Password Reset Request</h2>
       <p>Hi ${escapeHtml(name)}, we received a request to reset your password.</p>
       <p style="margin:24px 0;"><a href="${escapeHtml(resetUrl)}" style="background:#8b0000;color:#ffffff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:bold;">Reset Password</a></p>
       <p style="font-size:13px;color:#6f625a;">This link expires in 1 hour and can be used once.</p>`
    );
    await sendWithRetry({
      toEmail,
      subject: "Reset your password - Shatrunjay Ghee",
      html,
      templateName: "password_reset",
    });
  },

  async sendOrderPlacedEmail(params: {
    toEmail: string;
    name: string;
    orderNumber: string;
    totalPaise: number;
    paymentMethod: string;
    deliveryEtaText: string;
    isMumbai: boolean;
    accountUrl: string;
  }) {
    const deliveryNote = params.isMumbai
      ? "Deliveries in Mumbai will be done by Shatrunjay Team or Porter. All communication will be done by Shatrunjay Team."
      : "Deliveries outside Mumbai will be done by courier. Courier details will be shared by email and in your account.";
    const html = wrapLayout(
      `Order Confirmed: ${params.orderNumber}`,
      `<h2 style="margin-top:0;color:#24150f;">Thank you for your order, ${escapeHtml(params.name)}!</h2>
       <p>Your order <strong>${escapeHtml(params.orderNumber)}</strong> has been placed.</p>
       <p><strong>Total:</strong> ${escapeHtml(formatRupees(params.totalPaise))} (${escapeHtml(params.paymentMethod)})<br/>
          <strong>Estimated Delivery:</strong> ${escapeHtml(params.deliveryEtaText)}</p>
       <p style="background:#fbf5e6;padding:12px 16px;border-radius:8px;font-size:14px;">${escapeHtml(deliveryNote)}</p>
       <p style="margin:24px 0;"><a href="${escapeHtml(params.accountUrl)}" style="background:#8b0000;color:#ffffff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:bold;">View Order in Your Account</a></p>`
    );
    await sendWithRetry({
      toEmail: params.toEmail,
      subject: `Order Confirmed (${params.orderNumber}) - Shatrunjay Ghee`,
      html,
      templateName: "order_placed",
    });
  },

  async sendOrderStatusEmail(params: {
    toEmail: string;
    name: string;
    orderNumber: string;
    status: string;
    courierName?: string | null;
    trackingNumber?: string | null;
    note?: string | null;
    accountUrl: string;
  }) {
    const html = wrapLayout(
      `Order Update: ${params.orderNumber}`,
      `<h2 style="margin-top:0;color:#24150f;">Order Status Updated</h2>
       <p>Hi ${escapeHtml(params.name)}, your order <strong>${escapeHtml(params.orderNumber)}</strong> is now <strong>${escapeHtml(params.status.replace(/_/g, " "))}</strong>.</p>
       ${params.courierName ? `<p><strong>Courier:</strong> ${escapeHtml(params.courierName)}</p>` : ""}
       ${params.trackingNumber ? `<p><strong>Tracking Number:</strong> ${escapeHtml(params.trackingNumber)}</p>` : ""}
       ${params.note ? `<p><strong>Note:</strong> ${escapeHtml(params.note)}</p>` : ""}
       <p style="margin:24px 0;"><a href="${escapeHtml(params.accountUrl)}" style="background:#8b0000;color:#ffffff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:bold;">Track Order in Account</a></p>`
    );
    await sendWithRetry({
      toEmail: params.toEmail,
      subject: `Order ${params.orderNumber} is ${params.status.replace(/_/g, " ")}`,
      html,
      templateName: "order_status_update",
    });
  },

  async sendBusinessInboxEmail(params: {
    kind: "CONTACT" | "BULK_ENQUIRY" | "ORDER_QUERY";
    subject: string;
    fromName: string;
    phone?: string;
    replyToEmail?: string | null;
    message: string;
    orderNumber?: string;
  }) {
    const env = getEnv();
    const html = wrapLayout(
      params.subject,
      `<h2 style="margin-top:0;color:#24150f;">New ${escapeHtml(params.kind.replace(/_/g, " "))}</h2>
       ${params.orderNumber ? `<p><strong>Order Number:</strong> ${escapeHtml(params.orderNumber)}</p>` : ""}
       <p><strong>Name:</strong> ${escapeHtml(params.fromName)}</p>
       ${params.phone ? `<p><strong>Phone:</strong> ${escapeHtml(params.phone)}</p>` : ""}
       ${params.replyToEmail ? `<p><strong>Email:</strong> ${escapeHtml(params.replyToEmail)}</p>` : ""}
       <p><strong>Message:</strong></p>
       <blockquote style="background:#f5f4f1;padding:12px 16px;border-left:4px solid #8b0000;margin:0;">${escapeHtml(params.message)}</blockquote>`
    );
    await sendWithRetry({
      toEmail: env.SES_BUSINESS_INBOX_EMAIL,
      subject: params.subject,
      html,
      templateName: params.kind.toLowerCase(),
      replyTo: params.replyToEmail ?? undefined,
    });
  },
};
