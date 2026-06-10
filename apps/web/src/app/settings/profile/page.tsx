import { redirect } from 'next/navigation'
import { prisma } from '@fitflow/db'
import { auth } from '@/lib/auth'
import { ProfilePageClient } from './ProfilePageClient'

export const metadata = { title: 'Perfil — FitFlow' }

export default async function ProfilePage() {
  const session = await auth()
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      email: true,
      name: true,
      bio: true,
      age: true,
      goals: true,
      avatarUrl: true,
      image: true,
      passwordHash: true,
    },
  })

  if (!user) redirect('/login')

  return (
    <ProfilePageClient
      user={{
        id: user.id,
        email: user.email,
        name: user.name,
        bio: user.bio,
        age: user.age,
        goals: user.goals,
        avatarUrl: user.avatarUrl,
        image: user.image,
        hasPassword: user.passwordHash !== null,
      }}
    />
  )
}
