import nodemailer from 'nodemailer';

interface MailOptions {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export const sendMail = async (options: MailOptions): Promise<void> => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const smtpPort = Number(process.env.SMTP_PORT ?? '587');

  if (!smtpHost || !smtpEmail || !smtpPassword) {
    throw new Error('SMTP settings are not configured');
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number.isFinite(smtpPort) ? smtpPort : 587,
    auth: {
      user: smtpEmail,
      pass: smtpPassword,
    },
  });

  const message = {
    from: options.from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  const info = await transporter.sendMail(message);

  console.log('Message sent: %s', info.messageId);
};
