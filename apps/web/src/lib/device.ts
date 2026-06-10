import crypto from 'crypto'
import { prisma } from '@fitflow/db'

const GEO_TIMEOUT_MS = 2000

export function getDeviceFingerprint(userAgent: string): string {
  return crypto.createHash('sha256').update(userAgent).digest('hex').slice(0, 16)
}

export function extractClientInfo(headers: Headers): { userAgent: string; ip: string } {
  const forwarded = headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : '0.0.0.0'
  const userAgent = headers.get('user-agent') ?? 'unknown'
  return { userAgent, ip }
}

export async function getApproxLocation(ip: string): Promise<string> {
  if (ip === '0.0.0.0' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return 'Localização desconhecida'
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), GEO_TIMEOUT_MS)

  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,city,countryCode`,
      { signal: controller.signal }
    )
    if (!res.ok) return 'Localização desconhecida'

    const data = await res.json() as { status: string; city?: string; countryCode?: string }
    if (data.status !== 'success') return 'Localização desconhecida'

    const parts = [data.city, data.countryCode].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : 'Localização desconhecida'
  } catch {
    return 'Localização desconhecida'
  } finally {
    clearTimeout(timeout)
  }
}

export async function registerDevice(
  userId: string,
  userAgent: string,
  ip: string
): Promise<{ isNew: boolean; location: string }> {
  const userAgentHash = getDeviceFingerprint(userAgent)

  const existing = await prisma.userDevice.findUnique({
    where: { userId_userAgentHash: { userId, userAgentHash } },
    select: { id: true },
  })

  if (existing) {
    await prisma.userDevice.update({
      where: { userId_userAgentHash: { userId, userAgentHash } },
      data: { lastSeenAt: new Date(), ipAddress: ip },
    })
    return { isNew: false, location: '' }
  }

  const isFirstDevice = (await prisma.userDevice.count({ where: { userId } })) === 0
  const location = await getApproxLocation(ip)

  await prisma.userDevice.create({
    data: { userId, userAgentHash, ipAddress: ip, location, isFirstDevice },
  })

  return { isNew: true, location }
}
