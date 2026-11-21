import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE !== "false" && port === 465,
    auth: { user, pass },
  });
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[Email skipped — SMTP credentials not configured in .env]", params.subject);
    return { skipped: true };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "info@shatrunjayghee.com";
  await transporter.sendMail({
    from,
    to: params.to,
    replyTo: params.replyTo,
    subject: params.subject,
    html: params.html,
  });

  return { sent: true };
}

export function getAdminInquiryEmail(): string {
  return process.env.ADMIN_INQUIRY_EMAIL || "info@shatrunjayghee.com";
}
