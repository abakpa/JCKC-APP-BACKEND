const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create transporter - using Gmail service directly for better compatibility
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Define email options
  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  // Send email
  const info = await transporter.sendMail(mailOptions);

  console.log('Email sent: %s', info.messageId);
  return info;
};

module.exports = sendEmail;
