import bcrypt from 'bcryptjs'

export type StrengthLevel = 'WEAK' | 'MEDIUM' | 'STRONG' | 'VERY_STRONG'

export interface PasswordStrength {
  level: StrengthLevel
  score: number
  feedback: string
}

const BCRYPT_ROUNDS = 12

const COMMON_PASSWORDS = new Set([
  '123456', 'password', '123456789', '12345678', '12345', '1234567',
  'password1', 'abc123', 'qwerty', 'letmein', 'monkey', 'master',
  'dragon', '111111', 'baseball', 'iloveyou', 'trustno1', 'sunshine',
  'princess', 'welcome', 'shadow', 'superman', 'michael', 'ninja',
  'mustang', 'jessica', 'charlie', 'donald', 'passw0rd', 'password123',
  'qwerty123', 'iloveyou1', '1234567890', '000000', '654321', '666666',
  '112233', '121212', '123123', '1q2w3e', '1qaz2wsx', 'qazwsx',
  'admin', 'login', 'pass', 'test', 'guest', 'root', 'toor',
  'access', 'hello', 'flower', 'hockey', 'soccer', 'biteme',
  'thunder', 'cowboy', 'matrix', 'yankees', 'falcon', 'austin',
  'tigger', 'buster', 'thomas', 'ginger', 'fire', 'superman1',
  'batman', 'harley', 'zxcvbn', 'zxcvbnm', 'asdfgh', 'asdfghjkl',
  'qwertyuiop', 'qwertyuiopasdfghjklzxcvbnm', 'password!', 'password12',
  'P@ssw0rd', 'P@ssword', 'Pa$$word', 'admin123', 'admin1234',
  '123321', '1234qwer', 'abc1234', 'test123', 'user123', 'welcome1',
  'changeme', 'letmein1', 'summer', 'winter', 'spring', 'autumn',
  'january', 'february', 'march', 'april', 'may123', 'june123',
  'monkey1', 'pass123', 'pass1234', 'master1', 'dragon1', 'sex',
  'fuck', 'shit', 'ass', 'love', 'love123', 'hello123', 'hello1',
  'google', 'facebook', 'twitter', 'instagram', 'linkedin',
  'computer', 'internet', 'windows', 'iphone', 'android',
  'senha', 'senha123', 'senha1234', 'minhasenha', 'brasil', 'brazil',
  '123mudar', 'mudar123', 'teste123', 'abc@123', '123@abc',
  'q1w2e3', 'q1w2e3r4', 'a1b2c3', 'a1b2c3d4', '1a2b3c',
  '11111111', '22222222', '33333333', '44444444', '55555555',
  '99999999', '00000000', '12341234', '11223344', '55667788',
])

const STRENGTH_LABELS: Record<StrengthLevel, string> = {
  WEAK: 'Fraca',
  MEDIUM: 'Média',
  STRONG: 'Forte',
  VERY_STRONG: 'Muito Forte',
}

export function score(password: string): PasswordStrength {
  let points = 0

  if (password.length >= 12) points++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) points++
  if (/[0-9]/.test(password)) points++
  if (/[^A-Za-z0-9]/.test(password)) points++

  const level: StrengthLevel =
    points <= 1 ? 'WEAK'
    : points === 2 ? 'MEDIUM'
    : points === 3 ? 'STRONG'
    : 'VERY_STRONG'

  return { level, score: points, feedback: STRENGTH_LABELS[level] }
}

export function isCommon(password: string): boolean {
  return COMMON_PASSWORDS.has(password.toLowerCase())
}

export function meetsPolicy(password: string): boolean {
  if (password.length < 12) return false
  if (isCommon(password)) return false
  const { level } = score(password)
  return level === 'STRONG' || level === 'VERY_STRONG'
}

export async function hash(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS)
}

export async function verify(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed)
}
