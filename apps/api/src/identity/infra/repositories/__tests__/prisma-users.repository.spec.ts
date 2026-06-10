import { PrismaUsersRepository } from '../prisma-users.repository'
import { Plan } from '../../../domain/plan.enum'

const mockUser = {
  id: 'u1',
  email: 'alice@example.com',
  name: 'Alice',
  avatarUrl: null,
  bio: 'swimmer',
  age: 28,
  goals: ['lose_weight'],
  isTrainer: false,
  plan: 'FREE',
  deletedAt: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  emailVerified: null,
  image: null,
  hasOnboarded: false,
  passwordHash: null,
}

jest.mock('@fitflow/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    workout: {
      count: jest.fn(),
    },
  },
  Prisma: {},
}))

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { prisma } = require('@fitflow/db')

describe('PrismaUsersRepository', () => {
  let repo: PrismaUsersRepository

  beforeEach(() => {
    repo = new PrismaUsersRepository()
    jest.clearAllMocks()
  })

  describe('findById()', () => {
    it('returns mapped User when found', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser)
      const user = await repo.findById('u1')
      expect(user?.id).toBe('u1')
      expect(user?.bio).toBe('swimmer')
      expect(user?.goals).toEqual(['lose_weight'])
      expect(user?.plan).toBe(Plan.FREE)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'u1', deletedAt: null } })
    })

    it('returns null when not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      expect(await repo.findById('missing')).toBeNull()
    })

    it('filters out soft-deleted users via query', async () => {
      // Confirm deletedAt: null is part of the where clause
      prisma.user.findUnique.mockResolvedValue(null)
      await repo.findById('u1')
      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ deletedAt: null }) })
      )
    })
  })

  describe('findByEmail()', () => {
    it('queries by email with deletedAt: null', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser)
      await repo.findByEmail('alice@example.com')
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'alice@example.com', deletedAt: null },
      })
    })
  })

  describe('softDelete()', () => {
    it('sets deletedAt to now', async () => {
      prisma.user.update.mockResolvedValue({ ...mockUser, deletedAt: new Date() })
      await repo.softDelete('u1')
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { deletedAt: expect.any(Date) },
      })
    })
  })

  describe('findManyDeletedBefore()', () => {
    it('queries users deleted before given date', async () => {
      const cutoff = new Date('2026-01-01')
      prisma.user.findMany.mockResolvedValue([{ ...mockUser, deletedAt: new Date('2025-12-01') }])
      const users = await repo.findManyDeletedBefore(cutoff)
      expect(users).toHaveLength(1)
      expect(users[0].isDeleted()).toBe(true)
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { deletedAt: { lt: cutoff } },
      })
    })

    it('returns empty array when no deleted users', async () => {
      prisma.user.findMany.mockResolvedValue([])
      expect(await repo.findManyDeletedBefore(new Date())).toEqual([])
    })
  })

  describe('update()', () => {
    it('passes bio/age/goals to prisma', async () => {
      const updated = { ...mockUser, bio: 'runner', age: 30, goals: ['muscle_gain'] }
      prisma.user.update.mockResolvedValue(updated)
      const user = await repo.update('u1', { bio: 'runner', age: 30, goals: ['muscle_gain'] })
      expect(user.bio).toBe('runner')
      expect(user.age).toBe(30)
      expect(user.goals).toEqual(['muscle_gain'])
    })
  })

  describe('toDomain() edge cases', () => {
    it('defaults goals to [] when undefined in row', async () => {
      const row = { ...mockUser, goals: undefined }
      prisma.user.findUnique.mockResolvedValue(row)
      const user = await repo.findById('u1')
      expect(user?.goals).toEqual([])
    })

    it('maps deletedAt correctly', async () => {
      const deletedAt = new Date('2026-05-01')
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, deletedAt })
      const user = await repo.findById('u1')
      expect(user?.deletedAt).toEqual(deletedAt)
      expect(user?.isDeleted()).toBe(true)
    })
  })
})
