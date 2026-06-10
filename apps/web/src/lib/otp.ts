import crypto from 'crypto'
import { prisma } from '@fitflow/db'

const OTP_EXPIRY_MINUTES = 10
const MAX_ATTEMPTS = 5

function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex')
}

export function generateOtp(): string {
  return String(crypto.randomInt(100000, 999999))
}

export async function createOtp(email: string, purpose = 'LOGIN_OTP'): Promise<string> {
  // E2E_FIXED_OTP lets Playwright tests use a predictable code without real email delivery
  const otp = process.env.E2E_FIXED_OTP ?? generateOtp()
  const expires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

  await prisma.verificationToken.deleteMany({ where: { identifier: email, purpose } })
  await prisma.verificationToken.create({
    data: { identifier: email, token: hashOtp(otp), expires, attempts: 0, purpose },
  })

  return otp
}

export async function validateOtp(
  email: string,
  otp: string,
  purpose = 'LOGIN_OTP'
): Promise<{ valid: boolean; reason?: 'invalid' | 'expired' | 'max_attempts' }> {
  const record = await prisma.verificationToken.findFirst({
    where: { identifier: email, purpose },
  })

  if (!record) return { valid: false, reason: 'invalid' }

  if (record.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { identifier: email, purpose } })
    return { valid: false, reason: 'expired' }
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await prisma.verificationToken.deleteMany({ where: { identifier: email, purpose } })
    return { valid: false, reason: 'max_attempts' }
  }

  const isMatch = record.token === hashOtp(otp)

  if (!isMatch) {
    const newAttempts = record.attempts + 1
    if (newAttempts >= MAX_ATTEMPTS) {
      await prisma.verificationToken.deleteMany({ where: { identifier: email, purpose } })
    } else {
      await prisma.verificationToken.updateMany({
        where: { identifier: email, purpose },
        data: { attempts: newAttempts },
      })
    }
    return { valid: false, reason: 'invalid' }
  }

  await prisma.verificationToken.deleteMany({ where: { identifier: email, purpose } })
  return { valid: true }
}
