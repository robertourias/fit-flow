import { score, isCommon, meetsPolicy, hash, verify } from '../password'

describe('score', () => {
  it('returns WEAK for short simple password', () => {
    expect(score('abc').level).toBe('WEAK')
  })

  it('returns WEAK for single criterion met', () => {
    expect(score('abcdefghijkl').level).toBe('WEAK') // length only
  })

  it('returns MEDIUM for 2 criteria', () => {
    expect(score('abcdefghijkl1').level).toBe('MEDIUM') // length + number
  })

  it('returns STRONG for 3 criteria', () => {
    expect(score('Abcdefghijkl1').level).toBe('STRONG') // length + upper/lower + number
  })

  it('returns VERY_STRONG for all 4 criteria', () => {
    expect(score('Abcdefghijk1!').level).toBe('VERY_STRONG')
  })

  it('score field matches level', () => {
    const result = score('Abcdefghijk1!')
    expect(result.score).toBe(4)
  })

  it('feedback is a non-empty string', () => {
    const result = score('abc')
    expect(result.feedback).toBeTruthy()
  })

  it('does not count length criterion for short password', () => {
    const result = score('Ab1!')
    expect(result.score).toBe(3)
  })
})

describe('isCommon', () => {
  it('returns true for "password"', () => {
    expect(isCommon('password')).toBe(true)
  })

  it('returns true for "123456"', () => {
    expect(isCommon('123456')).toBe(true)
  })

  it('returns true case-insensitively', () => {
    expect(isCommon('PASSWORD')).toBe(true)
    expect(isCommon('Password')).toBe(true)
  })

  it('returns false for uncommon password', () => {
    expect(isCommon('Xk9#mP2$qL7@nR4')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isCommon('')).toBe(false)
  })
})

describe('meetsPolicy', () => {
  it('rejects passwords shorter than 12 chars', () => {
    expect(meetsPolicy('Abc123!@#')).toBe(false)
  })

  it('rejects common passwords even if long', () => {
    expect(meetsPolicy('senha123')).toBe(false)
  })

  it('rejects passwords with WEAK score', () => {
    expect(meetsPolicy('abcdefghijklmnop')).toBe(false) // long but lowercase only
  })

  it('rejects passwords with MEDIUM score', () => {
    expect(meetsPolicy('abcdefghijkl1')).toBe(false) // length + number only
  })

  it('accepts STRONG password', () => {
    expect(meetsPolicy('Abcdefghijkl1')).toBe(true)
  })

  it('accepts VERY_STRONG password', () => {
    expect(meetsPolicy('Abcdefghijk1!')).toBe(true)
  })

  it('rejects exactly 11 chars even if strong', () => {
    expect(meetsPolicy('Abcdefghi1!')).toBe(false)
  })
})

describe('hash and verify', () => {
  it('hash produces a bcrypt string', async () => {
    const hashed = await hash('Abcdefghijk1!')
    expect(hashed).toMatch(/^\$2[aby]?\$/)
  }, 30000)

  it('verify returns true for correct password', async () => {
    const hashed = await hash('Abcdefghijk1!')
    expect(await verify('Abcdefghijk1!', hashed)).toBe(true)
  }, 30000)

  it('verify returns false for wrong password', async () => {
    const hashed = await hash('Abcdefghijk1!')
    expect(await verify('WrongPassword1!', hashed)).toBe(false)
  }, 30000)

  it('two hashes of same password are different (salt)', async () => {
    const h1 = await hash('Abcdefghijk1!')
    const h2 = await hash('Abcdefghijk1!')
    expect(h1).not.toBe(h2)
  }, 30000)
})
