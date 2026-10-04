import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initReminderCron } from './utils/reminderScheduler.js';
import servicesRoutes from './routes/services.routes.js';
import quizRoutes from './routes/quiz.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import consultationRoutes from './routes/consultation.routes.js';
import adminRoutes from './routes/admin.routes.js';
import paymentRoutes from './routes/payment.routes.js'; // 🟢 Stripe Router Import Kiya

import { notFound, errorHandler } from './middleware/errorHandler.js';

import mongoose from 'mongoose';

dotenv.config();
const app = express();

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kaya_spa';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://kaya-holistic.vercel.app',
  'https://kaya-holistic-39hwj5wl3-cognistock.vercel.app', // Vercel preview URL
  process.env.CLIENT_URL, // Render env variable se dynamic URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (
      ALLOWED_ORIGINS.indexOf(origin) !== -1 ||
      /^http:\/\/localhost:\d+$/.test(origin)
    ) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/services', servicesRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/consultation', consultationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes); // 🟢 Stripe ka route yahan mount kiya

app.get('/', (req, res) => res.send('Kaya Holistic Spa API running ✅'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  initReminderCron(); // Cron Service Start
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