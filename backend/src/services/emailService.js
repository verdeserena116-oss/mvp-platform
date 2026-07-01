const nodemailer = require('nodemailer');

// Creates a transporter using SMTP credentials from env vars.
// Works with SendGrid SMTP relay, Amazon SES SMTP, etc.
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports (uses STARTTLS)
    auth: {
      user: process.env.SMTP_USER || 'apikey',
      pass: process.env.SMTP_PASS || '',
    },
  });
}

/**
 * Sends a single email.
 * @param {Object} params
 * @param {string} params.to - recipient email
 * @param {string} params.subject - email subject
 * @param {string} params.html - email body (HTML)
 * @param {string} params.fromName - display name of sender
 * @param {string} params.fromAddress - sender email address
 */
async function sendEmail({ to, subject, html, fromName, fromAddress }) {
  const transporter = createTransporter();

  const from = fromAddress
    ? `"${fromName || fromAddress}" <${fromAddress}>`
    : process.env.SMTP_FROM || 'no-reply@example.com';

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
  });

  return info;
}

module.exports = { sendEmail };
