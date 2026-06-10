import { prisma } from '@fitflow/db'

export default async function globalTeardown() {
  await prisma.user.deleteMany({
    where: { email: { in: ['e2e-login@fitflow.test', 'e2e-profile@fitflow.test'] } },
  })
  // Remove any registration test users
  await prisma.user.deleteMany({
    where: { email: { endsWith: '@e2e.fitflow.test' } },
  })
  await prisma.$disconnect()
}
