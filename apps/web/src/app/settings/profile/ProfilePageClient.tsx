'use client'

import { useState, useRef, useTransition, useCallback } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  Camera, Lock, Trash2, ChevronDown, ChevronUp,
  Eye, EyeOff, Loader2, Mail, Globe,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { PasswordStrengthBar, calculateStrength } from '@fitflow/ui'
import {
  updateProfile,
  changePassword,
  requestPasswordChangeOtp,
  deleteAccount,
  requestDeleteAccountOtp,
  GOAL_OPTIONS,
  type GoalOption,
} from './actions'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProfileUser {
  id: string
  email: string
  name: string | null
  bio: string | null
  age: number | null
  goals: string[]
  avatarUrl: string | null
  image: string | null
  hasPassword: boolean
}

interface ProfilePageClientProps {
  user: ProfileUser
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const GOAL_LABELS: Record<GoalOption, string> = {
  HYPERTROPHY: 'Hipertrofia',
  FAT_LOSS: 'Emagrecimento',
  STRENGTH: 'Força',
  CONDITIONING: 'Condicionamento',
  GENERAL_HEALTH: 'Saúde Geral',
  FLEXIBILITY: 'Flexibilidade',
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

// ── Inline feedback ───────────────────────────────────────────────────────────

function Feedback({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <p
      role="alert"
      className={cn(
        'text-sm font-medium',
        type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive',
      )}
    >
      {message}
    </p>
  )
}

// ── Section card ──────────────────────────────────────────────────────────────

function SectionCard({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-l bg-card border border-border p-6', className)}>
      <div className="mb-5">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  )
}

// ── Password input with toggle ────────────────────────────────────────────────

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-m border border-input bg-background px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

// ── OTP input ─────────────────────────────────────────────────────────────────

function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      maxLength={6}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      disabled={disabled}
      placeholder="000000"
      className="w-32 rounded-m border border-input bg-background px-3 py-2 text-center text-xl font-bold tracking-widest text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      aria-label="Código OTP de 6 dígitos"
    />
  )
}

// ── FormField ─────────────────────────────────────────────────────────────────

function FormField({
  id,
  label,
  required,
  children,
}: {
  id: string
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-destructive" aria-hidden="true">*</span>}
      </label>
      {children}
    </div>
  )
}

// ── 1. Personal Info Section ──────────────────────────────────────────────────

function PersonalInfoSection({ user }: { user: ProfileUser }) {
  const [name, setName] = useState(user.name ?? '')
  const [bio, setBio] = useState(user.bio ?? '')
  const [age, setAge] = useState(user.age !== null ? String(user.age) : '')
  const [goals, setGoals] = useState<string[]>(user.goals)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const avatarSrc = avatarPreview ?? user.avatarUrl ?? user.image ?? undefined

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ msg: 'A imagem deve ter no máximo 5MB.', type: 'error' })
      return
    }
    const url = URL.createObjectURL(file)
    setAvatarPreview(url)
    setFeedback(null)
  }

  function toggleGoal(goal: string) {
    setGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal],
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)

    const ageNum = age.trim() === '' ? null : Number(age)
    if (ageNum !== null && (isNaN(ageNum) || ageNum < 10 || ageNum > 100)) {
      setFeedback({ msg: 'Idade deve estar entre 10 e 100 anos.', type: 'error' })
      return
    }

    startTransition(async () => {
      const result = await updateProfile({
        name: name.trim() || undefined,
        bio: bio.trim() || null,
        age: ageNum,
        goals: goals as GoalOption[],
      })
      if (result.success) {
        setFeedback({ msg: 'Perfil atualizado com sucesso.', type: 'success' })
      } else {
        setFeedback({ msg: result.error ?? 'Erro ao salvar. Tente novamente.', type: 'error' })
      }
    })
  }

  return (
    <SectionCard title="Informações Pessoais">
      {/* Avatar */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-20 w-20">
            {avatarSrc ? (
              <AvatarImage src={avatarSrc} alt={name || 'Avatar'} />
            ) : null}
            <AvatarFallback className="text-xl">
              {getInitials(name, user.email)}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Alterar foto de perfil"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleFileChange}
            aria-hidden="true"
          />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{name || user.email}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          {avatarPreview && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Foto selecionada — salve para confirmar
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField id="name" label="Nome completo" required>
          <input
            id="name"
            type="text"
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-m border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Seu nome completo"
            required
          />
        </FormField>

        <FormField id="bio" label="Bio">
          <textarea
            id="bio"
            maxLength={300}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="resize-none rounded-m border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Conte um pouco sobre você..."
          />
          <p className={cn('text-right text-xs', bio.length >= 300 ? 'text-destructive' : 'text-muted-foreground')}>
            {bio.length}/300
          </p>
        </FormField>

        <FormField id="age" label="Idade">
          <input
            id="age"
            type="number"
            min={10}
            max={100}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-24 rounded-m border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="25"
          />
        </FormField>

        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-foreground">Objetivos</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Selecione seus objetivos">
            {GOAL_OPTIONS.map((goal) => {
              const checked = goals.includes(goal)
              return (
                <button
                  key={goal}
                  type="button"
                  onClick={() => toggleGoal(goal)}
                  aria-pressed={checked}
                  className={cn(
                    'rounded-pill border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                    checked
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground hover:bg-muted',
                  )}
                >
                  {GOAL_LABELS[goal]}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar alterações
          </Button>
          {feedback && <Feedback message={feedback.msg} type={feedback.type} />}
        </div>
      </form>
    </SectionCard>
  )
}

// ── 2. Change Password Section ────────────────────────────────────────────────

function ChangePasswordSection({ userEmail }: { userEmail: string }) {
  const [open, setOpen] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [isPending, startTransition] = useTransition()

  const strength = calculateStrength(newPw)
  const canSubmitOtp = currentPw.length > 0 && newPw.length >= 12 && confirmPw === newPw
    && (strength.level === 'STRONG' || strength.level === 'VERY_STRONG')
  const canConfirm = canSubmitOtp && otp.length === 6

  function reset() {
    setCurrentPw(''); setNewPw(''); setConfirmPw('')
    setOtp(''); setOtpSent(false); setFeedback(null)
  }

  function handleToggle() {
    if (open) reset()
    setOpen((o) => !o)
  }

  function handleSendOtp() {
    setFeedback(null)
    startTransition(async () => {
      const result = await requestPasswordChangeOtp()
      if (result.success) {
        setOtpSent(true)
        setFeedback({ msg: `Código enviado para ${userEmail}.`, type: 'success' })
      } else {
        setFeedback({ msg: result.error ?? 'Erro ao enviar código.', type: 'error' })
      }
    })
  }

  function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    if (newPw !== confirmPw) {
      setFeedback({ msg: 'As senhas não coincidem.', type: 'error' })
      return
    }
    setFeedback(null)
    startTransition(async () => {
      const result = await changePassword({ currentPassword: currentPw, newPassword: newPw, otp })
      if (result.success) {
        setFeedback({ msg: 'Senha alterada com sucesso.', type: 'success' })
        setTimeout(() => { reset(); setOpen(false) }, 2000)
      } else {
        setFeedback({ msg: result.error ?? 'Erro ao alterar senha.', type: 'error' })
      }
    })
  }

  return (
    <div className="rounded-l bg-card border border-border overflow-hidden">
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center justify-between px-6 py-5 text-left hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <Lock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="text-base font-semibold text-foreground">Alterar senha</p>
            <p className="text-sm text-muted-foreground">Atualize sua senha de acesso</p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        )}
      </button>

      {open && (
        <form onSubmit={handleConfirm} className="border-t border-border px-6 pb-6 pt-5 space-y-4">
          <FormField id="current-password" label="Senha atual" required>
            <PasswordInput
              id="current-password"
              value={currentPw}
              onChange={setCurrentPw}
              placeholder="Digite sua senha atual"
              disabled={isPending}
            />
          </FormField>

          <FormField id="new-password" label="Nova senha" required>
            <PasswordInput
              id="new-password"
              value={newPw}
              onChange={setNewPw}
              placeholder="Mínimo 12 caracteres"
              disabled={isPending}
            />
            {newPw && <PasswordStrengthBar password={newPw} />}
          </FormField>

          <FormField id="confirm-password" label="Confirmar nova senha" required>
            <PasswordInput
              id="confirm-password"
              value={confirmPw}
              onChange={setConfirmPw}
              placeholder="Repita a nova senha"
              disabled={isPending}
            />
            {confirmPw && newPw !== confirmPw && (
              <p className="text-xs text-destructive">As senhas não coincidem.</p>
            )}
          </FormField>

          {!otpSent ? (
            <Button
              type="button"
              variant="secondary"
              onClick={handleSendOtp}
              disabled={!canSubmitOtp || isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar código de confirmação
            </Button>
          ) : (
            <div className="space-y-3">
              <FormField id="cp-otp" label="Código enviado por e-mail">
                <OtpInput value={otp} onChange={setOtp} disabled={isPending} />
              </FormField>
              <div className="flex items-center gap-4">
                <Button type="submit" disabled={!canConfirm || isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar alteração
                </Button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isPending}
                  className="text-sm text-primary underline-offset-4 hover:underline disabled:opacity-50"
                >
                  Reenviar código
                </button>
              </div>
            </div>
          )}

          {feedback && <Feedback message={feedback.msg} type={feedback.type} />}
        </form>
      )}
    </div>
  )
}

// ── 3. Delete Account Section ─────────────────────────────────────────────────

function DeleteAccountSection({ hasPassword }: { hasPassword: boolean }) {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [isPending, startTransition] = useTransition()

  const confirmTextOk = confirmText === 'DELETAR'
  const canSendOtp = confirmTextOk && (!hasPassword || password.length > 0)
  const canDelete = canSendOtp && otp.length === 6

  function resetModal() {
    setConfirmText(''); setPassword(''); setOtp('')
    setOtpSent(false); setFeedback(null)
  }

  function handleOpenChange(v: boolean) {
    if (!v) resetModal()
    setOpen(v)
  }

  function handleSendOtp() {
    setFeedback(null)
    startTransition(async () => {
      const result = await requestDeleteAccountOtp()
      if (result.success) {
        setOtpSent(true)
        setFeedback({ msg: 'Código enviado. Verifique seu e-mail.', type: 'success' })
      } else {
        setFeedback({ msg: result.error ?? 'Erro ao enviar código.', type: 'error' })
      }
    })
  }

  function handleDelete(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)
    startTransition(async () => {
      const result = await deleteAccount({ confirmationText: confirmText, password, otp })
      if (!result.success) {
        setFeedback({ msg: result.error ?? 'Erro ao excluir conta.', type: 'error' })
      }
      // On success, deleteAccount calls signOut + redirect — no client handling needed
    })
  }

  return (
    <div className="rounded-l border border-destructive/40 bg-card overflow-hidden">
      <div className="px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-destructive">Zona de perigo</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Excluir sua conta é uma ação permanente. Os dados ficam retidos por 30 dias e
              são removidos definitivamente após esse período.
            </p>
          </div>
          <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
            <DialogPrimitive.Trigger asChild>
              <Button variant="destructive" size="sm" className="shrink-0">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir conta
              </Button>
            </DialogPrimitive.Trigger>

            <DialogPrimitive.Portal>
              <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
              <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-l border border-border bg-card p-6 shadow-lg focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
                <DialogPrimitive.Title className="text-lg font-semibold text-foreground">
                  Excluir conta
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-2 text-sm text-muted-foreground">
                  Esta ação não pode ser desfeita imediatamente. Seus dados serão removidos
                  permanentemente após 30 dias.
                </DialogPrimitive.Description>

                <form onSubmit={handleDelete} className="mt-5 space-y-4">
                  <FormField id="delete-confirm" label='Digite "DELETAR" para confirmar' required>
                    <input
                      id="delete-confirm"
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="DELETAR"
                      disabled={isPending}
                      className="rounded-m border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                      autoComplete="off"
                    />
                  </FormField>

                  {hasPassword && (
                    <FormField id="delete-password" label="Senha atual" required>
                      <PasswordInput
                        id="delete-password"
                        value={password}
                        onChange={setPassword}
                        placeholder="Digite sua senha"
                        disabled={isPending}
                      />
                    </FormField>
                  )}

                  {!otpSent ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleSendOtp}
                      disabled={!canSendOtp || isPending}
                    >
                      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Enviar código OTP
                    </Button>
                  ) : (
                    <FormField id="delete-otp" label="Código enviado por e-mail">
                      <OtpInput value={otp} onChange={setOtp} disabled={isPending} />
                    </FormField>
                  )}

                  {feedback && <Feedback message={feedback.msg} type={feedback.type} />}

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={!canDelete || isPending}
                    >
                      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Excluir definitivamente
                    </Button>
                    <DialogPrimitive.Close asChild>
                      <Button type="button" variant="outline">
                        Cancelar
                      </Button>
                    </DialogPrimitive.Close>
                  </div>
                </form>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          </DialogPrimitive.Root>
        </div>
      </div>
    </div>
  )
}

// ── 4. Login Method Section ───────────────────────────────────────────────────

function LoginMethodSection({ hasPassword }: { hasPassword: boolean }) {
  return (
    <SectionCard
      title="Método de acesso"
      description="Como você acessa sua conta FitFlow."
    >
      <div className="flex items-center gap-3">
        {hasPassword ? (
          <>
            <Mail className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-foreground">E-mail e senha</p>
              <p className="text-xs text-muted-foreground">Login com e-mail + senha + verificação OTP</p>
            </div>
            <Badge variant="secondary" className="ml-auto">Ativo</Badge>
          </>
        ) : (
          <>
            <Globe className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-foreground">Google OAuth</p>
              <p className="text-xs text-muted-foreground">Login via conta Google</p>
            </div>
            <Badge variant="secondary" className="ml-auto">Ativo</Badge>
          </>
        )}
      </div>
    </SectionCard>
  )
}

// ── Main page client ──────────────────────────────────────────────────────────

export function ProfilePageClient({ user }: ProfilePageClientProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div>
        <h1 className="font-secondary text-2xl font-semibold text-foreground">Perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie suas informações pessoais e configurações de conta.
        </p>
      </div>

      <PersonalInfoSection user={user} />

      {user.hasPassword && <ChangePasswordSection userEmail={user.email} />}

      <LoginMethodSection hasPassword={user.hasPassword} />

      <DeleteAccountSection hasPassword={user.hasPassword} />
    </div>
  )
}
