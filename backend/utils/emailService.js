import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // kayaholisticspa@gmail.com
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
});

export const sendBookingNotification = async ({ to, subject, htmlContent }) => {
  try {
    await transporter.sendMail({
      from: `"Kaya Holistic Spa" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    });
    console.log('✅ Notification email sent to:', to);
    return true;
  } catch (error) {
    console.error('❌ Email send error:', error);
    return false;
  }
};