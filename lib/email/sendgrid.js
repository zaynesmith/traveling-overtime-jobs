import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;

if (!apiKey) {
  console.warn("SENDGRID_API_KEY is not set; email sending is disabled.");
} else {
  sgMail.setApiKey(apiKey);
}

const fromEmail = process.env.SENDGRID_FROM_EMAIL;
const fromName = process.env.SENDGRID_FROM_NAME;

export async function sendEmail({ to, subject, html, text }) {
  if (!apiKey) {
    console.warn("Skipping email send because SENDGRID_API_KEY is not configured.");
    return;
  }

  if (!fromEmail) {
    throw new Error("SENDGRID_FROM_EMAIL is not configured");
  }

  const from = fromName ? { email: fromEmail, name: fromName } : { email: fromEmail };

  return sgMail.send({
    to,
    from,
    subject,
    text,
    html,
  });
}

export default sendEmail;
