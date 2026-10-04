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

app.use(cors({
  origin: (origin, cb) => {
    const ok = !origin || /^http:\/\/localhost:\d+$/.test(origin) || origin === process.env.CLIENT_URL;
    cb(null, ok);
  },
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