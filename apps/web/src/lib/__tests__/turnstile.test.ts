import { verifyTurnstile } from '../turnstile'

const mockFetch = jest.fn()
global.fetch = mockFetch

const ORIGINAL_ENV = process.env

beforeEach(() => {
  jest.clearAllMocks()
  process.env = { ...ORIGINAL_ENV, TURNSTILE_SECRET_KEY: 'test-secret' }
})

afterAll(() => {
  process.env = ORIGINAL_ENV
})

describe('verifyTurnstile', () => {
  it('returns true for valid token (success: true from Cloudflare)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })
    expect(await verifyTurnstile('valid-token')).toBe(true)
  })

  it('returns false for invalid token (success: false from Cloudflare)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] }),
    })
    expect(await verifyTurnstile('bad-token')).toBe(false)
  })

  it('returns false when Cloudflare returns non-ok HTTP response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })
    expect(await verifyTurnstile('token')).toBe(false)
  })

  it('returns true (fail open) on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network error'))
    expect(await verifyTurnstile('token')).toBe(true)
  })

  it('returns true (fail open) on timeout', async () => {
    mockFetch.mockRejectedValueOnce(Object.assign(new Error('aborted'), { name: 'AbortError' }))
    expect(await verifyTurnstile('token')).toBe(true)
  })

  it('returns true (pass) when TURNSTILE_SECRET_KEY is not configured', async () => {
    delete process.env.TURNSTILE_SECRET_KEY
    expect(await verifyTurnstile('any-token')).toBe(true)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('sends POST with secret and token to Cloudflare URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })
    await verifyTurnstile('my-token')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ secret: 'test-secret', response: 'my-token' }),
      })
    )
  })
})
