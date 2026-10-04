import { v4 as uuid } from 'uuid';
import { db } from '../config/db.js';
import { sendMail } from '../utils/mailer.js';

export const submitConsultation = async (req, res) => {
  const { name, email, answers } = req.body;
  if (!name || !email || !answers) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const record = { id: uuid(), name, email, answers, createdAt: new Date().toISOString() };
  db.data.consultations.push(record);
  await db.write();

  sendMail({
    to: process.env.GMAIL_USER,
    subject: `New Consultation Intake — ${name}`,
    html: `<h3>New skin intake from ${name} (${email})</h3>
           <pre>${JSON.stringify(answers, null, 2)}</pre>`
  });

  sendMail({
    to: email,
    subject: `Kaya Holistic Spa — Your intake is received`,
    html: `<p>Hi ${name}, thanks! Puja will review your answers before your $45 virtual consultation.</p>
           <p>Please email 3 clear face photos (front, left, right — no makeup) and your current product photos to kayaholisticspa@gmail.com with your name and appointment date in the subject line.</p>`
  });

  res.status(201).json({ success: true, data: record });
};