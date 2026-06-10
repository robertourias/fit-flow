import { prisma } from '@fitflow/db'
import bcrypt from 'bcryptjs'

export const TEST_USER = {
  email: 'e2e-login@fitflow.test',
  password: 'E2eTestLogin123!',
  name: 'E2E Login User',
}

export const TEST_PROFILE_USER = {
  email: 'e2e-profile@fitflow.test',
  password: 'E2eTestProfile123!',
  name: 'E2E Profile User',
}

export default async function globalSetup() {
  const hash = (pw: string) => bcrypt.hash(pw, 12)

  await prisma.user.upsert({
    where: { email: TEST_USER.email },
    update: {
      passwordHash: await hash(TEST_USER.password),
      deletedAt: null,
      emailVerified: new Date(),
      hasOnboarded: true,
    },
    create: {
      email: TEST_USER.email,
      name: TEST_USER.name,
      emailVerified: new Date(),
      passwordHash: await hash(TEST_USER.password),
      hasOnboarded: true,
    },
  })

  await prisma.user.upsert({
    where: { email: TEST_PROFILE_USER.email },
    update: {
      passwordHash: await hash(TEST_PROFILE_USER.password),
      deletedAt: null,
      emailVerified: new Date(),
      hasOnboarded: true,
    },
    create: {
      email: TEST_PROFILE_USER.email,
      name: TEST_PROFILE_USER.name,
      emailVerified: new Date(),
      passwordHash: await hash(TEST_PROFILE_USER.password),
      hasOnboarded: true,
    },
  })

  await prisma.$disconnect()
}
