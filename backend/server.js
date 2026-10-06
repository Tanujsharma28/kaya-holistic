import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { initReminderCron } from './utils/reminderScheduler.js';
import servicesRoutes from './routes/services.routes.js';
import quizRoutes from './routes/quiz.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import consultationRoutes from './routes/consultation.routes.js';
import adminRoutes from './routes/admin.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

dotenv.config();
const app = express();
app.set('trust proxy', 1);

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kaya_spa';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://kaya-holistic.vercel.app',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      ALLOWED_ORIGINS.indexOf(origin) !== -1 ||
      /^http:\/\/localhost:\d+$/.test(origin) ||
      /\.vercel\.app$/.test(origin)
    ) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: true,
}));

app.use(express.json());
app.use(morgan('dev'));

// Public forms par spam rokne ke liye
const publicLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true });
app.post('/api/bookings', publicLimiter);
app.post('/api/consultation', publicLimiter);

app.use('/api/services', servicesRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/consultation', consultationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/', (req, res) => res.send('Kaya Holistic Spa API running ✅'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  initReminderCron();
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Retrying in 2 seconds...`);
    setTimeout(() => {
      server.close();
      server.listen(PORT);
    }, 2000);
  } else {
    throw err;
  }
});