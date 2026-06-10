import { User } from '../user.entity'
import { Plan } from '../plan.enum'

const base = {
  id: 'u1',
  email: 'alice@example.com',
  name: 'Alice',
  goals: [],
  isTrainer: false,
  plan: Plan.FREE,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
}

describe('User entity', () => {
  it('exposes all props via getters', () => {
    const user = new User({ ...base, avatarUrl: null, bio: 'hi', age: 30, goals: ['lose_weight'] })
    expect(user.id).toBe('u1')
    expect(user.email).toBe('alice@example.com')
    expect(user.name).toBe('Alice')
    expect(user.bio).toBe('hi')
    expect(user.age).toBe(30)
    expect(user.goals).toEqual(['lose_weight'])
    expect(user.isTrainer).toBe(false)
    expect(user.plan).toBe(Plan.FREE)
    expect(user.deletedAt).toBeUndefined()
  })

  describe('isDeleted()', () => {
    it('returns false when deletedAt is null', () => {
      const user = new User({ ...base, deletedAt: null })
      expect(user.isDeleted()).toBe(false)
    })

    it('returns false when deletedAt is undefined', () => {
      const user = new User({ ...base })
      expect(user.isDeleted()).toBe(false)
    })

    it('returns true when deletedAt is set', () => {
      const user = new User({ ...base, deletedAt: new Date() })
      expect(user.isDeleted()).toBe(true)
    })
  })

  describe('isFreePlan()', () => {
    it('returns true for FREE plan', () => {
      const user = new User({ ...base, plan: Plan.FREE })
      expect(user.isFreePlan()).toBe(true)
    })

    it('returns false for PRO plan', () => {
      const user = new User({ ...base, plan: Plan.PRO })
      expect(user.isFreePlan()).toBe(false)
    })
  })

  it('goals defaults to empty array', () => {
    const user = new User({ ...base, goals: [] })
    expect(user.goals).toEqual([])
  })
})
