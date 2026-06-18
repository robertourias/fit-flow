'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma, Prisma } from '@fitflow/db'
import { auth, signOut } from '@/lib/auth'
import { createOtp, validateOtp } from '@/lib/otp'
import { sendOtpEmail } from '@/lib/email'
import { meetsPolicy, hash, verify } from '@/lib/password'

// ── Goal options ──────────────────────────────────────────────────────────────

export const GOAL_OPTIONS = [
  'HYPERTROPHY',
  'FAT_LOSS',
  'STRENGTH',
  'CONDITIONING',
  'GENERAL_HEALTH',
  'FLEXIBILITY',
] as const

export type GoalOption = (typeof GOAL_OPTIONS)[number]

// ── Validation schemas ────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  bio: z.string().max(300).nullable().optional(),
  age: z.number().int().min(10).max(100).nullable().optional(),
  goals: z.array(z.enum([...GOAL_OPTIONS] as [GoalOption, ...GoalOption[]])).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  isTrainer: z.boolean().optional(),
})

export type ProfileUpdateInput = z.infer<typeof profileSchema>

// ── Helpers ───────────────────────────────────────────────────────────────────

type ActionResult = { success: boolean; error?: string }

async function getAuthenticatedUser() {
  const session = await auth()
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) return null

  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    select: { id: true, email: true, name: true, passwordHash: true },
  })
  return user
}

function otpErrorMessage(reason?: string): string {
  const messages: Record<string, string> = {
    expired: 'Código expirado. Solicite um novo.',
    max_attempts: 'Muitas tentativas. Solicite um novo código.',
    invalid: 'Código inválido. Verifique e tente novamente.',
  }
  return messages[reason ?? 'invalid']
}

// ── updateProfile ─────────────────────────────────────────────────────────────

export async function updateProfile(data: ProfileUpdateInput): Promise<ActionResult> {
  const user = await getAuthenticatedUser()
  if (!user) return { success: false, error: 'Não autenticado.' }

  const parsed = profileSchema.safeParse(data)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { success: false, error: first?.message ?? 'Dados inválidos.' }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: parsed.data as Prisma.UserUpdateInput,
  })

  revalidatePath('/settings/profile')
  return { success: true }
}

// ── requestPasswordChangeOtp ──────────────────────────────────────────────────

export async function requestPasswordChangeOtp(): Promise<ActionResult> {
  const user = await getAuthenticatedUser()
  if (!user) return { success: false, error: 'Não autenticado.' }
  if (!user.passwordHash) return { success: false, error: 'Conta Google OAuth não possui senha local.' }

  const otp = await createOtp(user.email, 'CHANGE_PASSWORD')

  try {
    await sendOtpEmail(user.email, user.name, otp)
  } catch {
    return { success: false, error: 'Erro ao enviar código. Tente novamente.' }
  }

  return { success: true }
}

// ── changePassword ────────────────────────────────────────────────────────────

export async function changePassword(input: {
  currentPassword: string
  newPassword: string
  otp: string
}): Promise<ActionResult> {
  const user = await getAuthenticatedUser()
  if (!user) return { success: false, error: 'Não autenticado.' }
  if (!user.passwordHash) return { success: false, error: 'Conta Google OAuth não possui senha local.' }

  const passwordOk = await verify(input.currentPassword, user.passwordHash)
  if (!passwordOk) return { success: false, error: 'Senha atual incorreta.' }

  if (!meetsPolicy(input.newPassword)) {
    return { success: false, error: 'A nova senha não atende à política de segurança mínima (mínimo 12 caracteres, nível Forte).' }
  }

  const otpResult = await validateOtp(user.email, input.otp, 'CHANGE_PASSWORD')
  if (!otpResult.valid) return { success: false, error: otpErrorMessage(otpResult.reason) }

  const newHash = await hash(input.newPassword)
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } })

  return { success: true }
}

// ── requestDeleteAccountOtp ───────────────────────────────────────────────────

export async function requestDeleteAccountOtp(): Promise<ActionResult> {
  const user = await getAuthenticatedUser()
  if (!user) return { success: false, error: 'Não autenticado.' }

  const otp = await createOtp(user.email, 'DELETE_ACCOUNT')

  try {
    await sendOtpEmail(user.email, user.name, otp)
  } catch {
    return { success: false, error: 'Erro ao enviar código. Tente novamente.' }
  }

  return { success: true }
}

// ── deleteAccount ─────────────────────────────────────────────────────────────

export async function deleteAccount(input: {
  confirmationText: string
  password: string
  otp: string
}): Promise<ActionResult> {
  const user = await getAuthenticatedUser()
  if (!user) return { success: false, error: 'Não autenticado.' }

  if (input.confirmationText !== 'DELETAR') {
    return { success: false, error: 'Digite exatamente "DELETAR" para confirmar.' }
  }

  if (!user.passwordHash) {
    // OAuth-only account — no password to verify; OTP alone is sufficient
    const otpResult = await validateOtp(user.email, input.otp, 'DELETE_ACCOUNT')
    if (!otpResult.valid) return { success: false, error: otpErrorMessage(otpResult.reason) }
  } else {
    const passwordOk = await verify(input.password, user.passwordHash)
    if (!passwordOk) return { success: false, error: 'Senha incorreta.' }

    const otpResult = await validateOtp(user.email, input.otp, 'DELETE_ACCOUNT')
    if (!otpResult.valid) return { success: false, error: otpErrorMessage(otpResult.reason) }
  }

  await prisma.user.update({ where: { id: user.id }, data: { deletedAt: new Date() } })

  await signOut({ redirectTo: '/login' })

  // signOut throws a redirect internally; this line is unreachable
  return { success: true }
}
