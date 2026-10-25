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
// Password badalne par hash database me save hota hai; wo env ke ADMIN_PASSWORD_HASH se upar chalta hai.
const adminHash = () => db.data.adminAuth?.hash || process.env.ADMIN_PASSWORD_HASH;

const passwordProblem = (pw) => {
  if (pw.length < 8) return 'Password must be at least 8 characters.';
  if (pw.length > 72) return 'Password must be 72 characters or fewer.';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Password must include at least one letter and one number.';
  return null;
};

const savePassword = async (pw) => {
  const hash = await bcrypt.hash(pw, 10);
  db.data.adminAuth = { hash, changedAt: Date.now() };
  audit({ admin: { email: process.env.ADMIN_EMAIL } }, 'password', 'Admin password changed');
  await db.write();
};

const changedEmail = () => ({
  subject: 'Your Kaya admin password was changed',
  html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:auto;padding:28px;border:1px solid #e6ddd0;border-radius:14px;background:#fff">
    <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#a67c52">Kaya admin</div>
    <h2 style="margin:6px 0 14px;font-family:Georgia,serif;color:#2b2016">Password changed</h2>
    <p style="color:#5c4f41;font-size:14px;line-height:1.6">The admin password for the Kaya website was just changed. If this was you, no action is needed. If it was not you, use "Forgot password" on the admin login page right away.</p>
  </div>`,
});

const resetEmail = (code) => ({
  subject: 'Reset your Kaya admin password',
  html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:auto;padding:28px;border:1px solid #e6ddd0;border-radius:14px;background:#fff">
    <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#a67c52">Kaya admin</div>
    <h2 style="margin:6px 0 14px;font-family:Georgia,serif;color:#2b2016">Password reset code</h2>
    <div style="font-size:34px;letter-spacing:10px;font-weight:700;color:#7c5c38;background:#fbf3e7;border-radius:10px;padding:16px;text-align:center">${code}</div>
    <p style="color:#5c4f41;font-size:14px;line-height:1.6;margin-top:16px">Enter this code on the reset page to choose a new password. It works for 10 minutes. If you did not ask for this, ignore this email; your password has not changed.</p>
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

      const { ADMIN_EMAIL, JWT_SECRET } = process.env;
  const ADMIN_PASSWORD_HASH = adminHash();
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
// ── Forgot password: email code -> nayi password ──
const RESET_TTL = 10 * 60 * 1000;
const resets = new Map(); // resetId -> { hash, exp, tries, valid }
const forgotLog = new Map(); // ip -> [timestamps]
const FORGOT_MAX = 5;

const cleanupResets = () => {
  const now = Date.now();
  for (const [id, r] of resets) if (r.exp < now) resets.delete(id);
  if (resets.size > 50) resets.clear();
};

// Step 1: email do -> code admin email par jaata hai.
// Email galat ho tab bhi same jawab aata hai, taaki koi pata na laga sake ki admin email kaunsa hai.
export const forgotPassword = async (req, res) => {
  const now = Date.now();
  const list = (forgotLog.get(req.ip) || []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= FORGOT_MAX) return bad(res, 'Too many requests. Try again in 15 minutes.', 429);
  list.push(now);
  forgotLog.set(req.ip, list);

  const { ADMIN_EMAIL, JWT_SECRET } = process.env;
  if (!ADMIN_EMAIL || !JWT_SECRET) return bad(res, 'Admin login is not configured on the server', 500);

  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email) return bad(res, 'Enter your admin email.');

  const known = email === ADMIN_EMAIL.trim().toLowerCase();
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const resetId = crypto.randomBytes(16).toString('hex');

  cleanupResets();
  resets.set(resetId, { hash: hashCode(`reset:${resetId}`, code), exp: now + RESET_TTL, tries: 0, valid: known });

  if (known) {
    const sent = await sendMail({ to: ADMIN_EMAIL.trim(), ...resetEmail(code) });
    if (!sent) {
      resets.delete(resetId);
      console.error('❌ Password reset email could not be sent. Check GMAIL_USER / GMAIL_APP_PASSWORD.');
      return bad(res, 'Could not send the reset code. Please try again in a moment.', 502);
    }
  }
  res.json({ success: true, resetId, sentTo: maskEmail(email) });
};

// Step 2: code + nayi password
export const resetPassword = async (req, res) => {
  const id = String(req.body?.resetId || '');
  const code = String(req.body?.code || '').replace(/\s+/g, '');
  const next = String(req.body?.newPassword || '');

  const r = resets.get(id);
  if (!r || r.exp < Date.now()) {
    resets.delete(id);
    return bad(res, 'This code has expired. Please request a new one.');
  }
  if (!/^\d{6}$/.test(code)) return bad(res, 'Enter the 6-digit code from your email.');
  const problem = passwordProblem(next);
  if (problem) return bad(res, problem);

  r.tries += 1;
  if (r.tries > MAX_TRIES) {
    resets.delete(id);
    return bad(res, 'Too many wrong codes. Please request a new one.', 429);
  }
  const a = Buffer.from(hashCode(`reset:${id}`, code));
  const b = Buffer.from(r.hash);
  if (!r.valid || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return bad(res, `That code is not correct. ${MAX_TRIES - r.tries} tries left.`);
  }

  resets.delete(id);
  await savePassword(next);
  sendMail({ to: process.env.ADMIN_EMAIL.trim(), ...changedEmail() }).catch(() => {});
  res.json({ success: true, message: 'Password updated. You can sign in now.' });
};

// Logged-in admin Settings se password badalta hai. Galat purani password par 400 (401 nahi),
// warna frontend ka interceptor use logout kar deta.
export const changePassword = async (req, res) => {
  const ip = req.ip;
  if (recent(ip).length >= MAX_FAILS) return bad(res, 'Too many attempts. Try again in 15 minutes.', 429);

  const current = String(req.body?.currentPassword || '');
  const next = String(req.body?.newPassword || '');
  if (!current || !next) return bad(res, 'Enter your current and new password.');

  const hash = adminHash();
  if (!hash || !(await bcrypt.compare(current, hash))) {
    recent(ip).push(Date.now());
    return bad(res, 'Your current password is not correct.');
  }
  const problem = passwordProblem(next);
  if (problem) return bad(res, problem);
  if (next === current) return bad(res, 'Choose a password different from the current one.');

  await savePassword(next);
  sendMail({ to: process.env.ADMIN_EMAIL.trim(), ...changedEmail() }).catch(() => {});
  // Baaki saare purane login (token) band ho jaate hain, isliye isi device ko naya token do
  const token = jwt.sign({ email: process.env.ADMIN_EMAIL, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '12h' });
  res.json({ success: true, token, data: { token, email: process.env.ADMIN_EMAIL } });
};