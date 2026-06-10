import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'FitFlow <noreply@fitflow.app>'

export interface NewDeviceAlertParams {
  to: string
  userName: string
  device: string
  location: string
  date: string
  ip: string
}

export async function sendNewDeviceAlertEmail(params: NewDeviceAlertParams): Promise<void> {
  if (process.env.E2E_SKIP_EMAIL === 'true') return
  const { to, userName, device, location, date, ip } = params

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Novo acesso à sua conta FitFlow',
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <body style="font-family: Inter, sans-serif; color: #0F172A; background: #fff; padding: 32px; max-width: 560px; margin: 0 auto;">
        <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">
          Novo acesso detectado
        </h2>
        <p style="font-size: 14px; color: #4F6278; margin-bottom: 24px;">
          Olá, <strong>${escapeHtml(userName)}</strong>! Identificamos um acesso à sua conta FitFlow
          a partir de um dispositivo não reconhecido.
        </p>

        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 8px 0; color: #4F6278; width: 120px;">Data e hora</td>
            <td style="padding: 8px 0; font-weight: 500;">${escapeHtml(date)}</td>
          </tr>
          <tr style="border-top: 1px solid #E2E8F0;">
            <td style="padding: 8px 0; color: #4F6278;">Localização</td>
            <td style="padding: 8px 0; font-weight: 500;">${escapeHtml(location)}</td>
          </tr>
          <tr style="border-top: 1px solid #E2E8F0;">
            <td style="padding: 8px 0; color: #4F6278;">Dispositivo</td>
            <td style="padding: 8px 0; font-weight: 500;">${escapeHtml(device)}</td>
          </tr>
          <tr style="border-top: 1px solid #E2E8F0;">
            <td style="padding: 8px 0; color: #4F6278;">Endereço IP</td>
            <td style="padding: 8px 0; font-weight: 500;">${escapeHtml(ip)}</td>
          </tr>
        </table>

        <p style="font-size: 13px; color: #4F6278; margin-bottom: 20px;">
          Se foi você, pode ignorar este email. Se não reconhece este acesso,
          altere sua senha imediatamente.
        </p>

        <a href="${escapeHtml(process.env.NEXT_PUBLIC_APP_URL ?? 'https://fitflow.app')}/settings/profile"
           style="display: inline-block; background: #EF4444; color: #fff; text-decoration: none;
                  padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600;">
          Não fui eu — proteja minha conta
        </a>

        <p style="font-size: 11px; color: #7BA4C0; margin-top: 32px;">
          Este é um email automático. Não responda a esta mensagem.
        </p>
      </body>
      </html>
    `,
  })
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
