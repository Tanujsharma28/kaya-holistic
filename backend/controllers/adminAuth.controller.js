import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../config/db.js';
import { sendMail } from '../utils/mailer.js';
import { audit } from '../utils/audit.js';

const bad = (res, message, code = 400) => res.status(code).json({ success: false, message });

// ── Password galat hone par brute-force se bachav ──
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 8;
const recent = (ip) => {
  const now = Date.now();
  const list = (attempts.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  attempts.set(ip, list);
  return list;
};

// ── Email code (2FA) ──
const CODE_TTL = 10 * 60 * 1000; // 10 minute
const MAX_TRIES = 5;
const challenges = new Map(); // challengeId -> { hash, exp, tries, email }

const twoFactorOn = () => String(process.env.ADMIN_2FA || '').toLowerCase() === 'true';
const hashCode = (id, code) =>
  crypto.createHmac('sha256', process.env.JWT_SECRET).update(`${id}:${code}`).digest('hex');

const maskEmail = (e) => {
  const [u, d] = String(e).split('@');
  return `${u.slice(0, 1)}${'*'.repeat(Math.max(2, u.length - 1))}@${d}`;
};

const cleanup = () => {
  const now = Date.now();
  for (const [id, c] of challenges) if (c.exp < now) challenges.delete(id);
  if (challenges.size > 50) challenges.clear();
};

const codeEmail = (code) => ({
  subject: 'Your Kaya admin sign-in code',
  html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:auto;padding:28px;border:1px solid #e6ddd0;border-radius:14px;background:#fff">
    <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#a67c52">Kaya admin</div>
    <h2 style="margin:6px 0 14px;font-family:Georgia,serif;color:#2b2016">Your sign-in code</h2>
    <div style="font-size:34px;letter-spacing:10px;font-weight:700;color:#7c5c38;background:#fbf3e7;border-radius:10px;padding:16px;text-align:center">${code}</div>
    <p style="color:#5c4f41;font-size:14px;line-height:1.6;margin-top:16px">This code works for 10 minutes. If you did not try to sign in, ignore this email and change your admin password.</p>
  </div>`,
});

const finishLogin = async (email) => {
  audit({ admin: { email } }, 'login', 'Admin signed in');
  await db.write();
  return jwt.sign({ email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '12h' });
};

// Step 1: email + password
export const login = async (req, res) => {
  const ip = req.ip;
  if (recent(ip).length >= MAX_FAILS) return bad(res, 'Too many attempts. Try again in 15 minutes.', 429);

  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!email || !password) return bad(res, 'Email and password required');

  const { ADMIN_EMAIL, ADMIN_PASSWORD_HASH, JWT_SECRET } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH || !JWT_SECRET) {
    return bad(res, 'Admin login is not configured on the server', 500);
  }

  const ok = email === ADMIN_EMAIL.trim().toLowerCase() && (await bcrypt.compare(password, ADMIN_PASSWORD_HASH));
  if (!ok) {
    recent(ip).push(Date.now());
    return bad(res, 'Invalid credentials', 401);
  }
  attempts.delete(ip);

  // 2FA band hai: pehle jaisa seedha login
  if (!twoFactorOn()) {
    const token = await finishLogin(ADMIN_EMAIL);
    return res.json({ success: true, token, data: { token, email: ADMIN_EMAIL } });
  }

  // 2FA chalu hai: code email karo
  cleanup();
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const challengeId = crypto.randomBytes(16).toString('hex');
  const to = (process.env.ADMIN_2FA_EMAIL || ADMIN_EMAIL).trim();

  const sent = await sendMail({ to, ...codeEmail(code) });
  if (!sent) {
    console.error('❌ 2FA code email could not be sent. Check GMAIL_USER / GMAIL_APP_PASSWORD, or set ADMIN_2FA=false temporarily.');
    return bad(res, 'Could not send the verification code. Please try again in a moment.', 502);
  }

  challenges.set(challengeId, { hash: hashCode(challengeId, code), exp: Date.now() + CODE_TTL, tries: 0, email: ADMIN_EMAIL });
  res.json({ success: true, twoFactor: true, challengeId, sentTo: maskEmail(to) });
};

// Step 2: email wala code
export const verifyLogin = async (req, res) => {
  const challengeId = String(req.body?.challengeId || '');
  const code = String(req.body?.code || '').replace(/\s+/g, '');
  const c = challenges.get(challengeId);

  if (!c || c.exp < Date.now()) {
    challenges.delete(challengeId);
    return bad(res, 'This code has expired. Please sign in again.', 401);
  }
  if (!/^\d{6}$/.test(code)) return bad(res, 'Enter the 6-digit code from your email.');

  c.tries += 1;
  if (c.tries > MAX_TRIES) {
    challenges.delete(challengeId);
    return bad(res, 'Too many wrong codes. Please sign in again.', 429);
  }

  const a = Buffer.from(hashCode(challengeId, code));
  const b = Buffer.from(c.hash);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return bad(res, `That code is not correct. ${MAX_TRIES - c.tries} tries left.`, 401);
  }

  challenges.delete(challengeId);
  const token = await finishLogin(c.email);
  res.json({ success: true, token, data: { token, email: c.email } });
};