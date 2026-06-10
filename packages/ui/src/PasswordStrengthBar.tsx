'use client'

import { useMemo } from 'react'

export type StrengthLevel = 'WEAK' | 'MEDIUM' | 'STRONG' | 'VERY_STRONG'

interface PasswordStrength {
  level: StrengthLevel
  score: number
  label: string
}

export function calculateStrength(password: string): PasswordStrength {
  if (!password) return { level: 'WEAK', score: 0, label: '' }

  let score = 0
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { level: 'WEAK', score, label: 'Fraca' }
  if (score === 2) return { level: 'MEDIUM', score, label: 'Média' }
  if (score === 3) return { level: 'STRONG', score, label: 'Forte' }
  return { level: 'VERY_STRONG', score, label: 'Muito Forte' }
}

const SEGMENT_COLORS: Record<StrengthLevel, string> = {
  WEAK: 'bg-red-500',
  MEDIUM: 'bg-amber-400',
  STRONG: 'bg-emerald-500',
  VERY_STRONG: 'bg-emerald-600',
}

const LABEL_COLORS: Record<StrengthLevel, string> = {
  WEAK: 'text-red-500',
  MEDIUM: 'text-amber-500',
  STRONG: 'text-emerald-500',
  VERY_STRONG: 'text-emerald-600',
}

interface PasswordStrengthBarProps {
  password: string
}

export function PasswordStrengthBar({ password }: PasswordStrengthBarProps) {
  const strength = useMemo(() => calculateStrength(password), [password])
  const isEmpty = !password

  const activeColor = SEGMENT_COLORS[strength.level]
  const labelColor = LABEL_COLORS[strength.level]

  return (
    <div className="space-y-1" aria-live="polite" aria-label={`Força da senha: ${strength.label}`}>
      <div className="flex gap-1">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
              !isEmpty && i < strength.score ? activeColor : 'bg-muted'
            }`}
          />
        ))}
      </div>
      {!isEmpty && strength.label && (
        <p className={`text-xs font-medium ${labelColor}`}>{strength.label}</p>
      )}
    </div>
  )
}
