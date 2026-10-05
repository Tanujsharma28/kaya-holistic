import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  
  serviceName: { type: String, required: true },
  staffMember: { type: String, enum: ['Puja', 'Sia'], default: 'Puja', required: true },
  bookingDate: { type: Date, required: true },
  bookingTime: { type: String, required: true },
  
  depositPaid: { type: Number, required: true, default: 25 }, 
  totalAmount: { type: Number, required: true },
  
  paymentIntentId: { type: String, required: true, unique: true },
  status: { type: String, enum: ['Confirmed', 'Completed', 'Cancelled'], default: 'Confirmed' }
}, { timestamps: true });

export default mongoose.model('Booking', bookingSchema);