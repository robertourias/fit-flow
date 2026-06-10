'use server'

import crypto from 'crypto'
import { headers } from 'next/headers'
import { prisma } from '@fitflow/db'
import { createOtp, validateOtp } from '@/lib/otp'
import { sendOtpEmail } from '@/lib/email'
import { sendNewDeviceAlertEmail } from '@/lib/email-templates/new-device-alert'
import { verifyTurnstile } from '@/lib/turnstile'
import { meetsPolicy, hash } from '@/lib/password'
import { extractClientInfo, registerDevice } from '@/lib/device'

type ActionResult = { success: boolean; error?: string }

// ── Signup Step 1: send OTP ───────────────────────────────────────────────────

export async function requestSignupOtp(
  name: string,
  email: string,
  turnstileToken: string
): Promise<ActionResult> {
  const validTurnstile = await verifyTurnstile(turnstileToken)
  if (!validTurnstile) {
    return { success: false, error: 'Verificação de segurança falhou. Tente novamente.' }
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { emailVerified: true, deletedAt: true },
  })

  if (existing?.emailVerified && !existing.deletedAt) {
    return { success: false, error: 'Email já cadastrado. Faça login.' }
  }

  const otp = await createOtp(email, 'SIGNUP_OTP')

  try {
    await sendOtpEmail(email, name.trim(), otp)
  } catch {
    return { success: false, error: 'Erro ao enviar email. Tente novamente.' }
  }

  return { success: true }
}

// ── Signup Step 2: verify OTP ─────────────────────────────────────────────────

export async function verifySignupOtp(
  email: string,
  otp: string
): Promise<ActionResult & { tempToken?: string }> {
  const result = await validateOtp(email, otp, 'SIGNUP_OTP')

  if (!result.valid) {
    const messages: Record<string, string> = {
      expired: 'Código expirado. Solicite um novo.',
      max_attempts: 'Muitas tentativas. Solicite um novo código.',
      invalid: 'Código inválido. Verifique e tente novamente.',
    }
    return { success: false, error: messages[result.reason ?? 'invalid'] }
  }

  const tempToken = crypto.randomUUID()
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: tempToken,
      expires: new Date(Date.now() + 15 * 60 * 1000),
      purpose: 'SIGNUP_VERIFIED',
    },
  })

  return { success: true, tempToken }
}

// ── Signup Step 3: create account ─────────────────────────────────────────────

export async function completeSignup(
  name: string,
  email: string,
  tempToken: string,
  password: string
): Promise<ActionResult & { signupSigninToken?: string }> {
  const tokenRecord = await prisma.verificationToken.findUnique({
    where: { token: tempToken },
  })

  if (
    !tokenRecord ||
    tokenRecord.identifier !== email ||
    tokenRecord.purpose !== 'SIGNUP_VERIFIED' ||
    tokenRecord.expires < new Date()
  ) {
    return { success: false, error: 'Sessão de cadastro inválida ou expirada. Recomece o processo.' }
  }

  if (!meetsPolicy(password)) {
    return { success: false, error: 'A senha não atende à política de segurança mínima.' }
  }

  await prisma.verificationToken.deleteMany({ where: { token: tempToken } })

  const passwordHash = await hash(password)
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email,
      emailVerified: new Date(),
      passwordHash,
      hasOnboarded: false,
    },
  })

  try {
    const headersList = await headers()
    const { userAgent, ip } = extractClientInfo(headersList)
    await registerDevice(user.id, userAgent, ip)
  } catch {
    // device registration is best-effort
  }

  const signupSigninToken = crypto.randomUUID()
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: signupSigninToken,
      expires: new Date(Date.now() + 5 * 60 * 1000),
      purpose: 'POST_SIGNUP_SIGNIN',
    },
  })

  return { success: true, signupSigninToken }
}

// ── Signup OTP resend ─────────────────────────────────────────────────────────

export async function resendSignupOtp(
  name: string,
  email: string
): Promise<ActionResult> {
  const otp = await createOtp(email, 'SIGNUP_OTP')

  try {
    await sendOtpEmail(email, name.trim(), otp)
  } catch {
    return { success: false, error: 'Erro ao enviar email. Tente novamente.' }
  }

  return { success: true }
}

// ── Login Step 1: validate credentials + send OTP ────────────────────────────

export async function requestLoginOtp(
  email: string,
  password: string,
  turnstileToken: string
): Promise<ActionResult> {
  const validTurnstile = await verifyTurnstile(turnstileToken)
  if (!validTurnstile) {
    return { success: false, error: 'Verificação de segurança falhou. Tente novamente.' }
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, passwordHash: true, deletedAt: true, emailVerified: true },
  })

  // Generic error — never reveal whether email exists
  const INVALID_CREDS = 'Email ou senha incorretos.'

  if (!user || user.deletedAt || !user.emailVerified) {
    return { success: false, error: INVALID_CREDS }
  }

  if (!user.passwordHash) {
    // OAuth-only account — guide user without confirming email existence
    return { success: false, error: INVALID_CREDS }
  }

  const { verify: verifyPassword } = await import('@/lib/password')
  const passwordOk = await verifyPassword(password, user.passwordHash)
  if (!passwordOk) {
    return { success: false, error: INVALID_CREDS }
  }

  const otp = await createOtp(email, 'LOGIN_OTP')

  try {
    await sendOtpEmail(email, user.name, otp)
  } catch {
    return { success: false, error: 'Erro ao enviar email. Tente novamente.' }
  }

  return { success: true }
}

// ── Login: resend OTP (no password re-check — user already in verify step) ───

export async function resendOtp(email: string): Promise<ActionResult> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { name: true, deletedAt: true },
  })
  if (!user || user.deletedAt) {
    return { success: false, error: 'Não foi possível reenviar o código.' }
  }

  const otp = await createOtp(email, 'LOGIN_OTP')

  try {
    await sendOtpEmail(email, user.name, otp)
  } catch {
    return { success: false, error: 'Erro ao enviar email. Tente novamente.' }
  }

  return { success: true }
}

// ── Login: device check after OTP success ────────────────────────────────────

export async function checkDeviceOnLogin(
  userId: string
): Promise<{ isNewDevice: boolean }> {
  try {
    const headersList = await headers()
    const { userAgent, ip } = extractClientInfo(headersList)
    const { isNew, location } = await registerDevice(userId, userAgent, ip)

    if (isNew) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      })

      if (user) {
        const now = new Date()
        const date = now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
          + ' às '
          + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })

        sendNewDeviceAlertEmail({
          to: user.email,
          userName: user.name,
          device: userAgent.slice(0, 100),
          location: location || 'Localização desconhecida',
          date,
          ip,
        }).catch(() => {})
      }
    }

    return { isNewDevice: isNew }
  } catch {
    return { isNewDevice: false }
  }
}
