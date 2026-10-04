import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Nodemailer transport setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.CLINIC_EMAIL,
    pass: process.env.CLINIC_EMAIL_PASS,
  },
});

// 1. Client (User) ko confirmation email bhejna
export const sendMail = async ({ to, subject, html }) => {
  console.log(`📤 Attempting to send CLIENT email to: ${to}`);
  try {
    const info = await transporter.sendMail({
      from: `"Kaya Holistic Spa" <${process.env.CLINIC_EMAIL}>`,
      to: to,
      subject: subject,
      html: html,
    });
    console.log(`✅ CLIENT email sent successfully to: ${to} | MessageID: ${info.messageId}`);
    return info;
  } catch (error) {
    // NEVER throw — booking should succeed even if email fails
    console.error(`❌ CLIENT email FAILED to ${to}:`, error.message);
    return null;
  }
};

// 2. Owner (Admin) ko alert email bhejna
export const notifyOwner = async ({ subject, html }) => {
  const ownerEmail = process.env.CLINIC_OWNER_EMAIL || process.env.CLINIC_EMAIL;
  console.log(`📤 Attempting to send OWNER email to: ${ownerEmail}`);
  try {
    const info = await transporter.sendMail({
      from: `"Kaya System Alert" <${process.env.CLINIC_EMAIL}>`,
      to: ownerEmail,
      subject: subject,
      html: html,
    });
    console.log(`✅ OWNER email sent successfully to: ${ownerEmail} | MessageID: ${info.messageId}`);
    return info;
  } catch (error) {
    // NEVER throw — booking should succeed even if email fails
    console.error(`❌ OWNER email FAILED:`, error.message);
    return null;
  }
};