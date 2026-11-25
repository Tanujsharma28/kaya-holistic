import nodemailer from 'nodemailer';

// Render free plan par SMTP (Gmail) block hota hai -> "Connection timeout".
// Isliye HTTP API wali service use karte hain (port 443, block nahi hota).
// Priority: Brevo -> Resend -> Gmail SMTP (purana tarika, fallback).

const FROM_NAME = 'Kaya Holistic Spa';
const fromEmail = () =>
  process.env.MAIL_FROM_EMAIL || process.env.GMAIL_USER || process.env.SMTP_EMAIL || 'kayaholisticspa@gmail.com';
const replyTo = () => process.env.CLINIC_REPLY_TO || 'kayaholisticspa@gmail.com';

// ── Brevo (https://www.brevo.com) ──
async function viaBrevo({ to, subject, html, fromName }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail() },
      to: [{ email: to }],
      replyTo: { email: replyTo() },
      subject,
      htmlContent: html,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Brevo ${res.status}: ${json.message || res.statusText}`);
  return { messageId: json.messageId };
}

// ── Resend (https://resend.com) ──
async function viaResend({ to, subject, html, fromName }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail()}>`,
      to: [to],
      reply_to: replyTo(),
      subject,
      html,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Resend ${res.status}: ${json.message || res.statusText}`);
  return { messageId: json.id };
}

// ── Gmail SMTP (fallback) ──
async function viaSmtp({ to, subject, html, fromName }) {
  const user = process.env.GMAIL_USER || process.env.SMTP_EMAIL;
  const pass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD;
  if (!user || !pass) throw new Error('Missing email credentials (BREVO_API_KEY / RESEND_API_KEY / GMAIL_USER+GMAIL_APP_PASSWORD)');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });
  return transporter.sendMail({
    from: `"${fromName}" <${user}>`,
    to,
    replyTo: replyTo(),
    subject,
    html,
  });
}

async function deliver(msg) {
  if (process.env.BREVO_API_KEY) return viaBrevo(msg);
  if (process.env.RESEND_API_KEY) return viaResend(msg);
  return viaSmtp(msg);
}

// 1. Client (User) ko email
export const sendMail = async ({ to, subject, html }) => {
  console.log(`📤 Attempting to send CLIENT email to: ${to}`);
  try {
    const info = await deliver({ to, subject, html, fromName: FROM_NAME });
    console.log(`✅ CLIENT email sent to: ${to} | MessageID: ${info?.messageId}`);
    return info || {};
  } catch (error) {
    console.error(`❌ CLIENT email FAILED to ${to}:`, error.message);
    return null;
  }
};

// 2. Owner (Admin) ko alert email
export const notifyOwner = async ({ subject, html }) => {
  const ownerEmail = process.env.CLINIC_OWNER_EMAIL || process.env.GMAIL_USER || process.env.SMTP_EMAIL;
  console.log(`📤 Attempting to send OWNER email to: ${ownerEmail}`);
  if (!ownerEmail) {
    console.error('❌ OWNER email FAILED: CLINIC_OWNER_EMAIL set nahi hai');
    return null;
  }
  try {
    const info = await deliver({ to: ownerEmail, subject, html, fromName: 'Kaya System Alert' });
    console.log(`✅ OWNER email sent to: ${ownerEmail} | MessageID: ${info?.messageId}`);
    return info || {};
  } catch (error) {
    console.error('❌ OWNER email FAILED:', error.message);
    return null;
  }
};