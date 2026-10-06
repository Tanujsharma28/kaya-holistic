import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const getTransporter = () => {
  const user = process.env.GMAIL_USER || process.env.SMTP_EMAIL;
  const pass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD;
  if (!user || !pass) {
    console.error('❌ Email Transporter Error: Missing email credentials in environment variables');
    return null;
  }
    return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });
};

// 1. Client (User) ko confirmation email bhejna
export const sendMail = async ({ to, subject, html }) => {
  console.log(`📤 Attempting to send CLIENT email to: ${to}`);
  const transporter = getTransporter();
  if (!transporter) {
    console.error(`❌ Transporter creation failed. Cannot send email to: ${to}`);
    return null;
  }
  try {
    const fromUser = process.env.GMAIL_USER || process.env.SMTP_EMAIL;
    const info = await transporter.sendMail({
      from: `"Kaya Holistic Spa" <${fromUser}>`,
      to: to,
      replyTo: process.env.CLINIC_REPLY_TO || 'kayaholisticspa@gmail.com',
      subject: subject,
      html: html,
    });
    console.log(`✅ CLIENT email sent successfully to: ${to} | MessageID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ CLIENT email FAILED to ${to}:`, error.message);
    return null;
  }
};

// 2. Owner (Admin) ko alert email bhejna
export const notifyOwner = async ({ subject, html }) => {
  const ownerEmail = process.env.CLINIC_OWNER_EMAIL || process.env.GMAIL_USER || process.env.SMTP_EMAIL;
  console.log(`📤 Attempting to send OWNER email to: ${ownerEmail}`);
  const transporter = getTransporter();
  if (!transporter) {
    console.error(`❌ Transporter creation failed. Cannot send email to owner`);
    return null;
  }
  try {
    const fromUser = process.env.GMAIL_USER || process.env.SMTP_EMAIL;
    const info = await transporter.sendMail({
      from: `"Kaya System Alert" <${fromUser}>`,
      to: ownerEmail,
      subject: subject,
      html: html,
    });
    console.log(`✅ OWNER email sent successfully to: ${ownerEmail} | MessageID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ OWNER email FAILED:`, error.message);
    return null;
  }
};