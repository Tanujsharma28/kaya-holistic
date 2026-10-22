import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { initReminderCron } from './utils/reminderScheduler.js';
import servicesRoutes from './routes/services.routes.js';
import quizRoutes from './routes/quiz.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import { stripeWebhook } from './controllers/payment.controller.js';
import consultationRoutes from './routes/consultation.routes.js';
import consentRoutes from './routes/consent.routes.js';
import userRoutes from './routes/user.routes.js';
import adminRoutes from './routes/admin.routes.js';
import giftCardRoutes from './routes/giftcard.routes.js';
import { notFound, errorHandler, asyncHandler } from './middleware/errorHandler.js';

const isProd = process.env.NODE_ENV === 'production';

// Production me zaroori env vars ke bina start hi mat karo
const REQUIRED = ['JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD_HASH', 'CLIENT_URL', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'];
const missing = REQUIRED.filter((k) => !process.env[k]);
if (isProd && missing.length) {
  console.error(`❌ Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}
if (isProd && String(process.env.JWT_SECRET).length < 32) {
  console.error('❌ JWT_SECRET must be at least 32 characters in production');
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet());

// Sirf apni site allow hogi. CLIENT_URL me comma se multiple domains de sakte ho.
const ALLOWED_ORIGINS = (process.env.CLIENT_URL || '')
  .split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);
if (!isProd) ALLOWED_ORIGINS.push('http://localhost:5173', 'http://localhost:3000');

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    const err = new Error('Not allowed by CORS');
    err.status = 403;
    cb(err);
  },
}));

// Stripe webhook ko raw (unparsed) body chahiye signature verify karne ke liye —
// isliye yeh express.json() se PEHLE aana zaroori hai, warna signature check
// hamesha fail hoga.
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), asyncHandler(stripeWebhook));

app.use(express.json({ limit: '50kb' }));
app.use(morgan(isProd ? 'combined' : 'dev'));

// Spam rokne ke liye rate limits
app.post('/api/bookings', rateLimit({
  windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many booking attempts. Please try again later.' },
}));
app.post('/api/bookings/checkout', rateLimit({
  windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many payment attempts. Please try again later.' },
}));
app.post('/api/gift-cards/checkout', rateLimit({
  windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many payment attempts. Please try again later.' },
}));
app.post('/api/consultation', rateLimit({
  windowMs: 60 * 60 * 1000, limit: 15, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many submissions. Please try again later.' },
}));
app.post('/api/consent', rateLimit({
  windowMs: 60 * 60 * 1000, limit: 15, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many submissions. Please try again later.' },
}));
app.post('/api/user/google', rateLimit({
  windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many sign-in attempts. Please try again later.' },
}));
app.use('/api/admin/login', rateLimit({
  windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Try again in 15 minutes.' },
}));

app.use('/api/services', servicesRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/bookings', paymentRoutes);
app.use('/api/gift-cards', giftCardRoutes);
app.use('/api/consultation', consultationRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => res.send('Kaya Holistic Spa API running ✅'));
app.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use(notFound);
app.use(errorHandler);

process.on('unhandledRejection', (r) => console.error('❌ Unhandled rejection:', r));
process.on('uncaughtException', (e) => console.error('❌ Uncaught exception:', e));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (${isProd ? 'production' : 'development'})`);
  initReminderCron();
});