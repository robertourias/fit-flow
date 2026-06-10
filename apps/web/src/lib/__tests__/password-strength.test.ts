// calculateStrength lives in packages/ui but is tested here since jest is configured in web app.
// The function is pure — no React dependencies.
import { calculateStrength } from '@fitflow/ui'

describe('calculateStrength', () => {
  it('returns empty label and score 0 for empty string', () => {
    const r = calculateStrength('')
    expect(r.score).toBe(0)
    expect(r.label).toBe('')
  })

  it('returns WEAK for single-criterion password (lowercase only, short)', () => {
    expect(calculateStrength('abc').level).toBe('WEAK')
  })

  it('returns WEAK for 1 segment: length only', () => {
    const r = calculateStrength('abcdefghijklmno')
    expect(r.level).toBe('WEAK')
    expect(r.score).toBe(1)
  })

  it('returns MEDIUM for 2 segments: length + number', () => {
    const r = calculateStrength('abcdefghijkl1')
    expect(r.level).toBe('MEDIUM')
    expect(r.score).toBe(2)
    expect(r.label).toBe('Média')
  })

  it('returns STRONG for 3 segments: length + upper/lower + number', () => {
    const r = calculateStrength('Abcdefghijkl1')
    expect(r.level).toBe('STRONG')
    expect(r.score).toBe(3)
    expect(r.label).toBe('Forte')
  })

  it('returns VERY_STRONG for all 4 criteria', () => {
    const r = calculateStrength('MyStr0ng!Pass#2024')
    expect(r.level).toBe('VERY_STRONG')
    expect(r.score).toBe(4)
    expect(r.label).toBe('Muito Forte')
  })

  it('VERY_STRONG password scores 4 segments (all green)', () => {
    expect(calculateStrength('MyStr0ng!Pass#2024').score).toBe(4)
  })

  it('WEAK password scores 1 segment (1 red)', () => {
    expect(calculateStrength('abcdefghijkl').score).toBe(1)
  })

  it('does not count length criterion when password is short', () => {
    const r = calculateStrength('Ab1!')
    expect(r.score).toBe(3)
    expect(r.level).toBe('STRONG')
  })

  it('special chars alone add 1 point', () => {
    const base = calculateStrength('abcdefghijkl').score
    const withSpecial = calculateStrength('abcdefghijkl!').score
    expect(withSpecial).toBe(base + 1)
  })
})
