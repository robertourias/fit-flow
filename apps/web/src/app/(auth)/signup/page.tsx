'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TurnstileWidget } from '@/components/auth/TurnstileWidget'
import { PasswordStrengthBar } from '@fitflow/ui'
import { requestSignupOtp, verifySignupOtp, completeSignup, resendSignupOtp } from '@/app/(auth)/actions'

const INPUT_CLASS =
  'h-10 w-full rounded-m border border-input bg-background px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50'

const RESEND_COOLDOWN = 60

// ── Step 1: Name + Email ──────────────────────────────────────────────────────

interface Step1Props {
  onNext: (name: string, email: string) => void
}

function Step1({ onNext }: Step1Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await requestSignupOtp(name.trim(), email.trim(), turnstileToken)

    if (!result.success) {
      setError(result.error ?? 'Erro ao enviar código.')
      setLoading(false)
      return
    }

    onNext(name.trim(), email.trim())
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold">Criar conta</h1>
        <p className="text-sm text-muted-foreground">
          Preencha seus dados para começar a usar o FitFlow.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Nome <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <input
            id="name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome completo"
            className={INPUT_CLASS}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null) }}
            placeholder="seu@email.com"
            className={INPUT_CLASS}
          />
          {error && (
            <p role="alert" className="text-sm text-[var(--color-error-text)]">{error}</p>
          )}
        </div>

        <TurnstileWidget onVerify={setTurnstileToken} onError={() => setTurnstileToken('')} />

        <Button type="submit" className="w-full" disabled={loading || !turnstileToken}>
          {loading && <Loader2 className="animate-spin" />}
          Continuar
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{' '}
        <Link href="/login" className="text-primary underline underline-offset-4 hover:opacity-80">
          Entrar
        </Link>
      </p>
    </div>
  )
}

// ── Step 2: OTP verification ──────────────────────────────────────────────────

interface Step2Props {
  name: string
  email: string
  onNext: (tempToken: string) => void
}

function Step2({ name, email, onNext }: Step2Props) {
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
        const result = await verifySignupOtp(email, digits)
        if (!result.success) {
          setError(result.error ?? 'Código inválido.')
          setOtp('')
          setLoading(false)
          return
        }
        onNext(result.tempToken!)
      }
    },
    [email, onNext]
  )

  async function handleResend() {
    setResending(true)
    setError(null)
    const result = await resendSignupOtp(name, email)
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

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="otp" className="text-sm font-medium">
            Código de verificação <span aria-hidden="true" className="text-destructive">*</span>
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
      </div>

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

// ── Step 3: Password creation ─────────────────────────────────────────────────

interface Step3Props {
  name: string
  email: string
  tempToken: string
}

function Step3({ name, email, tempToken }: Step3Props) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const passwordsMatch = password === confirm && confirm.length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!passwordsMatch) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    const result = await completeSignup(name, email, tempToken, password)

    if (!result.success) {
      setError(result.error ?? 'Erro ao criar conta.')
      setLoading(false)
      return
    }

    const signInResult = await signIn('credentials', {
      email,
      signupSigninToken: result.signupSigninToken,
      redirect: false,
    })

    if (!signInResult?.ok) {
      router.push('/login?registered=1')
      return
    }

    router.push('/onboarding')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold">Criar senha</h1>
        <p className="text-sm text-muted-foreground">
          Escolha uma senha forte para proteger sua conta.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Senha <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null) }}
              placeholder="Mínimo 12 caracteres"
              className={`${INPUT_CLASS} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {password && <PasswordStrengthBar password={password} />}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm" className="text-sm font-medium">
            Confirmar senha <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              id="confirm"
              type={showConfirm ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(null) }}
              placeholder="Repita a senha"
              className={`${INPUT_CLASS} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? 'Ocultar confirmação' : 'Mostrar confirmação'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirm && !passwordsMatch && (
            <p className="text-xs text-[var(--color-error-text)]">As senhas não coincidem.</p>
          )}
          {error && (
            <p role="alert" className="text-sm text-[var(--color-error-text)]">{error}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading || !passwordsMatch}>
          {loading && <Loader2 className="animate-spin" />}
          Criar conta
        </Button>
      </form>
    </div>
  )
}

// ── Wizard orchestrator ───────────────────────────────────────────────────────

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [tempToken, setTempToken] = useState('')

  function handleStep1Next(n: string, e: string) {
    setName(n)
    setEmail(e)
    setStep(2)
  }

  function handleStep2Next(token: string) {
    setTempToken(token)
    setStep(3)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-1.5 mb-2">
        {([1, 2, 3] as const).map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              s <= step ? 'bg-primary' : 'bg-muted'
            }`}
            aria-hidden="true"
          />
        ))}
      </div>

      {step === 1 && <Step1 onNext={handleStep1Next} />}
      {step === 2 && <Step2 name={name} email={email} onNext={handleStep2Next} />}
      {step === 3 && <Step3 name={name} email={email} tempToken={tempToken} />}

      {step === 1 && (
        <>
          <div className="relative flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => signIn('google', { callbackUrl: '/onboarding' })}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continuar com Google
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Já tem conta?{' '}
            <Link href="/login" className="text-primary underline underline-offset-4 hover:opacity-80">
              Entrar
            </Link>
          </p>
        </>
      )}
    </div>
  )
}
