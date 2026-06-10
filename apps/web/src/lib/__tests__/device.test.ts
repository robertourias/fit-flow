import { getDeviceFingerprint, extractClientInfo, getApproxLocation, registerDevice } from '../device'

// ── Prisma mock ──────────────────────────────────────────────────────────────
jest.mock('@fitflow/db', () => ({
  prisma: {
    userDevice: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
  },
}))

import { prisma } from '@fitflow/db'

const mockPrisma = prisma as jest.Mocked<typeof prisma> & {
  userDevice: {
    findUnique: jest.Mock
    update: jest.Mock
    create: jest.Mock
    count: jest.Mock
  }
}

// ── fetch mock ───────────────────────────────────────────────────────────────
const mockFetch = jest.fn()
global.fetch = mockFetch

function buildHeaders(ua: string, forwarded?: string): Headers {
  const h = new Headers()
  h.set('user-agent', ua)
  if (forwarded) h.set('x-forwarded-for', forwarded)
  return h
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ── getDeviceFingerprint ─────────────────────────────────────────────────────
describe('getDeviceFingerprint', () => {
  it('returns 16-char hex string', () => {
    const fp = getDeviceFingerprint('Mozilla/5.0')
    expect(fp).toHaveLength(16)
    expect(fp).toMatch(/^[0-9a-f]+$/)
  })

  it('returns identical hash for same user-agent', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    expect(getDeviceFingerprint(ua)).toBe(getDeviceFingerprint(ua))
  })

  it('returns different hashes for different user-agents', () => {
    expect(getDeviceFingerprint('Chrome/100')).not.toBe(getDeviceFingerprint('Firefox/100'))
  })
})

// ── extractClientInfo ────────────────────────────────────────────────────────
describe('extractClientInfo', () => {
  it('extracts first IP from x-forwarded-for', () => {
    const { ip } = extractClientInfo(buildHeaders('ua', '1.2.3.4, 5.6.7.8'))
    expect(ip).toBe('1.2.3.4')
  })

  it('falls back to 0.0.0.0 when no forwarded header', () => {
    const { ip } = extractClientInfo(buildHeaders('ua'))
    expect(ip).toBe('0.0.0.0')
  })

  it('extracts user-agent', () => {
    const { userAgent } = extractClientInfo(buildHeaders('TestAgent/1.0'))
    expect(userAgent).toBe('TestAgent/1.0')
  })

  it('returns "unknown" when user-agent absent', () => {
    const { userAgent } = extractClientInfo(new Headers())
    expect(userAgent).toBe('unknown')
  })
})

// ── getApproxLocation ────────────────────────────────────────────────────────
describe('getApproxLocation', () => {
  it('returns fallback for localhost IP', async () => {
    expect(await getApproxLocation('127.0.0.1')).toBe('Localização desconhecida')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns fallback for private 192.168.x.x', async () => {
    expect(await getApproxLocation('192.168.1.1')).toBe('Localização desconhecida')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns formatted location on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success', city: 'São Paulo', countryCode: 'BR' }),
    })
    expect(await getApproxLocation('200.1.2.3')).toBe('São Paulo, BR')
  })

  it('returns fallback when ip-api status is not success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'fail' }),
    })
    expect(await getApproxLocation('200.1.2.3')).toBe('Localização desconhecida')
  })

  it('returns fallback on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network error'))
    expect(await getApproxLocation('200.1.2.3')).toBe('Localização desconhecida')
  })

  it('returns fallback on timeout (AbortError)', async () => {
    mockFetch.mockRejectedValueOnce(Object.assign(new Error('aborted'), { name: 'AbortError' }))
    expect(await getApproxLocation('200.1.2.3')).toBe('Localização desconhecida')
  })

  it('returns fallback when fetch returns non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })
    expect(await getApproxLocation('200.1.2.3')).toBe('Localização desconhecida')
  })
})

// ── registerDevice ───────────────────────────────────────────────────────────
describe('registerDevice', () => {
  const userId = 'user_123'
  const userAgent = 'Mozilla/5.0 TestBrowser'
  const ip = '200.1.2.3'

  it('returns isNew=false and updates lastSeenAt for known device', async () => {
    mockPrisma.userDevice.findUnique.mockResolvedValueOnce({ id: 'dev_1' })
    mockPrisma.userDevice.update.mockResolvedValueOnce({})

    const result = await registerDevice(userId, userAgent, ip)

    expect(result.isNew).toBe(false)
    expect(mockPrisma.userDevice.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ ipAddress: ip }) })
    )
    expect(mockPrisma.userDevice.create).not.toHaveBeenCalled()
  })

  it('returns isNew=true and creates record for new device', async () => {
    mockPrisma.userDevice.findUnique.mockResolvedValueOnce(null)
    mockPrisma.userDevice.count.mockResolvedValueOnce(1)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success', city: 'Rio de Janeiro', countryCode: 'BR' }),
    })
    mockPrisma.userDevice.create.mockResolvedValueOnce({})

    const result = await registerDevice(userId, userAgent, ip)

    expect(result.isNew).toBe(true)
    expect(mockPrisma.userDevice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId,
          isFirstDevice: false,
          location: 'Rio de Janeiro, BR',
        }),
      })
    )
  })

  it('marks isFirstDevice=true when no devices exist yet', async () => {
    mockPrisma.userDevice.findUnique.mockResolvedValueOnce(null)
    mockPrisma.userDevice.count.mockResolvedValueOnce(0)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success', city: 'Curitiba', countryCode: 'BR' }),
    })
    mockPrisma.userDevice.create.mockResolvedValueOnce({})

    await registerDevice(userId, userAgent, ip)

    expect(mockPrisma.userDevice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isFirstDevice: true }),
      })
    )
  })

  it('stores "Localização desconhecida" when geo lookup fails', async () => {
    mockPrisma.userDevice.findUnique.mockResolvedValueOnce(null)
    mockPrisma.userDevice.count.mockResolvedValueOnce(0)
    mockFetch.mockRejectedValueOnce(new Error('network error'))
    mockPrisma.userDevice.create.mockResolvedValueOnce({})

    await registerDevice(userId, userAgent, ip)

    expect(mockPrisma.userDevice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ location: 'Localização desconhecida' }),
      })
    )
  })
})
