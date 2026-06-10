const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const TIMEOUT_MS = 5000

interface TurnstileResponse {
  success: boolean
  'error-codes'?: string[]
}

export async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    // no key configured — treat as pass (dev/test environments)
    return true
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
      signal: controller.signal,
    })

    if (!res.ok) return false

    const data = (await res.json()) as TurnstileResponse
    return data.success === true
  } catch {
    // timeout or network error → fail open (per spec fallback rule)
    return true
  } finally {
    clearTimeout(timeout)
  }
}
