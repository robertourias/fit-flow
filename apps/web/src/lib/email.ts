import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false, // STARTTLS on port 587
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendOtpEmail(to: string, name: string, otp: string) {
  await transporter.sendMail({
    from: `"FitFlow" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Seu código de acesso — FitFlow",
    html: `
      <p>Olá, ${name}!</p>
      <p>Seu código de acesso é:</p>
      <h2 style="letter-spacing: 8px; font-size: 32px;">${otp}</h2>
      <p>Válido por <strong>10 minutos</strong>. Não compartilhe este código.</p>
    `,
  });
}
