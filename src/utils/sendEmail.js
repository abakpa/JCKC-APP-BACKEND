const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (options) => {
  const { data, error } = await resend.emails.send({
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  });

  if (error) {
    console.error('Email sending failed:', error);
    throw new Error(error.message);
  }

  console.log('Email sent:', data.id);
  return data;
};

module.exports = sendEmail;
