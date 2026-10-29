const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../config/logger');

const transport = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    })
  : null;

async function sendMail({ to, subject, text }) {
  if (!transport) {
    logger.info({ to, subject, text }, 'Email (console transport)');
    return;
  }
  try {
    await transport.sendMail({ from: env.MAIL_FROM, to, subject, text });
  } catch (err) {
    logger.error({ err, to, subject }, 'Failed to send email');
  }
}

module.exports = { sendMail };
