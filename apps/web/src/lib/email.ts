import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'FitFlow <noreply@fitflow.app>'

export async function sendOtpEmail(to: string, name: string, otp: string): Promise<void> {
  if (process.env.E2E_SKIP_EMAIL === 'true') return
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Seu código de acesso — FitFlow',
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <body style="font-family: Inter, sans-serif; color: #0F172A; background: #fff; padding: 32px;">
        <p style="font-size: 16px;">Olá, <strong>${escapeHtml(name)}</strong>!</p>
        <p style="font-size: 14px; color: #4F6278;">Seu código de acesso ao FitFlow é:</p>
        <div style="margin: 24px 0; text-align: center;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 12px; color: #10B981;">
            ${escapeHtml(otp)}
          </span>
        </div>
        <p style="font-size: 13px; color: #4F6278;">
          Válido por <strong>10 minutos</strong>. Não compartilhe este código.
        </p>
      </body>
      </html>
    `,
  })
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
