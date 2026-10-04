import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD
  }
});

export const sendConfirmationEmail = async (email, name, serviceName, date, time) => {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.log("SMTP_EMAIL or SMTP_PASSWORD not configured. Skipping confirmation email.");
    return;
  }

  const mailOptions = {
    from: `"Kaya Holistic Spa" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: 'Your Appointment is Confirmed - Kaya Holistic Spa',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto;">
        <h2 style="color: #4a5568;">Booking Confirmed!</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Thank you for choosing Kaya Holistic Spa. Your appointment has been securely reserved.</p>
        <div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Treatment:</strong> ${serviceName}</p>
          <p><strong>Date:</strong> ${new Date(date).toDateString()}</p>
          <p><strong>Time:</strong> ${time}</p>
        </div>
        <p>A $25 deposit has been successfully processed. The remaining balance will be collected at the spa.</p>
        <p>We look forward to seeing you!</p>
        <p>Warm regards,<br><strong>Kaya Holistic Spa Team</strong></p>
      </div>
    `
  };
  
  return transporter.sendMail(mailOptions);
};
