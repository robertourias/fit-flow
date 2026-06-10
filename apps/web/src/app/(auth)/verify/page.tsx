'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { resendOtp, checkDeviceOnLogin } from '@/app/(auth)/actions'

const RESEND_COOLDOWN = 60

function VerifyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''

  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN)

  useEffect(() => {
    if (countdown <= 0) return
    const id = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(id)
  }, [countdown])

  const handleOtpChange = useCallback(
    async (value: string) => {
      const digits = value.replace(/\D/g, '').slice(0, 6)
      setOtp(digits)
      setError(null)

      if (digits.length === 6) {
        setLoading(true)
        await handleVerify(digits)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [email]
  )

  async function handleVerify(code: string) {
    const result = await signIn('credentials', {
      email,
      otp: code,
      redirect: false,
    })

    if (!result?.ok) {
      setError('Código inválido ou expirado. Tente novamente.')
      setOtp('')
      setLoading(false)
      return
    }

    // Device check — best-effort, non-blocking
    const sessionRes = await fetch('/api/auth/session')
    const session = await sessionRes.json()
    const userId: string | undefined = session?.user?.id

    if (userId) {
      checkDeviceOnLogin(userId).catch(() => {})
    }

    const hasOnboarded = session?.user?.hasOnboarded ?? false
    router.push(hasOnboarded ? '/dashboard' : '/onboarding')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length !== 6) return
    setLoading(true)
    await handleVerify(otp)
  }

  async function handleResend() {
    setResending(true)
    setError(null)

    const result = await resendOtp(email)
    setResending(false)

    if (result.success) {
      setOtp('')
      setCountdown(RESEND_COOLDOWN)
    } else {
      setError(result.error ?? 'Erro ao reenviar código.')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold">Verificar email</h1>
        <p className="text-sm text-muted-foreground">
          Enviamos um código de 6 dígitos para{' '}
          <span className="font-medium text-foreground">{email}</span>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="otp" className="text-sm font-medium">
            Código de verificação{' '}
            <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={(e) => handleOtpChange(e.target.value)}
            disabled={loading}
            placeholder="000000"
            className="h-12 w-full rounded-m border border-input bg-background px-3 text-center text-xl tracking-[0.5em] ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
          />
          {error && (
            <p role="alert" className="text-sm text-[var(--color-error-text)]">{error}</p>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="animate-spin h-4 w-4" />
            Verificando...
          </div>
        )}

        {!loading && (
          <Button type="submit" className="w-full" disabled={otp.length !== 6}>
            Verificar
          </Button>
        )}
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Não recebeu o código?{' '}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || countdown > 0}
          className="text-primary underline underline-offset-4 hover:opacity-80 disabled:opacity-50 disabled:no-underline"
        >
          {resending ? 'Enviando...' : countdown > 0 ? `Reenviar (${countdown}s)` : 'Reenviar'}
        </button>
      </p>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  )
}
